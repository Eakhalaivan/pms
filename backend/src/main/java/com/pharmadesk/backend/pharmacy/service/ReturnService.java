package com.pharmadesk.backend.pharmacy.service;

import com.pharmadesk.backend.model.*;
import com.pharmadesk.backend.pharmacy.enums.ReturnStatus;
import com.pharmadesk.backend.pharmacy.exception.InvalidReturnException;
import com.pharmadesk.backend.pharmacy.exception.ResourceNotFoundException;
import com.pharmadesk.backend.pharmacy.repository.MedicineRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineReturnRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReturnService {

    private final MedicineReturnRepository returnRepository;
    private final PharmacyBillRepository billRepository;
    private final MedicineStockRepository stockRepository;
    private final MedicineRepository medicineRepository;

    public ReturnService(MedicineReturnRepository returnRepository, 
                         PharmacyBillRepository billRepository, 
                         MedicineStockRepository stockRepository,
                         MedicineRepository medicineRepository) {
        this.returnRepository = returnRepository;
        this.billRepository = billRepository;
        this.stockRepository = stockRepository;
        this.medicineRepository = medicineRepository;
    }

    @Transactional
    public MedicineReturn initiateReturn(Long billId, List<ReturnItemRequest> items, String reason) {
        PharmacyBill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));

        MedicineReturn medicineReturn = new MedicineReturn();
        medicineReturn.setOriginalBill(bill);
        medicineReturn.setReturnDate(LocalDateTime.now());
        medicineReturn.setStatus(ReturnStatus.PENDING);
        medicineReturn.setReason(reason);

        List<MedicineReturn> existingReturns = returnRepository.findByOriginalBillId(billId);
        BigDecimal totalReturnAmount = BigDecimal.ZERO;
        java.util.Map<Long, Integer> currentRequestQuantities = new java.util.HashMap<>();

        for (ReturnItemRequest itemReq : items) {
            PharmacyBillItem billItem = bill.getItems().stream()
                    .filter(bi -> bi.getId().equals(itemReq.getBillItemId()))
                    .findFirst()
                    .orElseThrow(() -> new InvalidReturnException("Item not found in original bill"));

            if (itemReq.getQuantity() > billItem.getQuantity()) {
                throw new InvalidReturnException("Return quantity cannot exceed sold quantity");
            }

            // Bug fix: Check total quantity returned across all previous return requests + current request
            Long targetStockId = billItem.getStock().getId();
            int alreadyReturnedQty = existingReturns.stream()
                .filter(r -> r.getStatus() != ReturnStatus.REJECTED)
                .flatMap(r -> r.getItems().stream())
                .filter(ri -> {
                    if (ri.getBillItemId() != null) {
                        return itemReq.getBillItemId().equals(ri.getBillItemId());
                    }
                    // Fallback for legacy records without bill_item_id
                    return ri.getStock() != null && targetStockId.equals(ri.getStock().getId());
                })
                .mapToInt(MedicineReturnItem::getQuantity)
                .sum();
            
            int currentReqQty = currentRequestQuantities.getOrDefault(itemReq.getBillItemId(), 0) + itemReq.getQuantity();

            if (alreadyReturnedQty + currentReqQty > billItem.getQuantity()) {
                int remaining = billItem.getQuantity() - alreadyReturnedQty;
                throw new InvalidReturnException("Total return quantity exceeds sold quantity. Remaining returnable: " + remaining);
            }
            currentRequestQuantities.put(itemReq.getBillItemId(), currentReqQty);

            MedicineReturnItem returnItem = new MedicineReturnItem();
            returnItem.setMedicineReturn(medicineReturn);
            returnItem.setStock(billItem.getStock());
            returnItem.setQuantity(itemReq.getQuantity());
            returnItem.setBillItemId(billItem.getId());
            
            BigDecimal refundPerUnit = billItem.getNetAmount().divide(BigDecimal.valueOf(billItem.getQuantity()), 2, RoundingMode.HALF_UP);
            BigDecimal itemRefund = refundPerUnit.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            returnItem.setReturnAmount(itemRefund);

            totalReturnAmount = totalReturnAmount.add(itemRefund);
            medicineReturn.getItems().add(returnItem);
        }

        medicineReturn.setTotalReturnAmount(totalReturnAmount);
        return returnRepository.save(medicineReturn);
    }

    @Transactional
    public void approveReturn(Long returnId) {
        MedicineReturn medicineReturn = returnRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));

        if (medicineReturn.getStatus() != ReturnStatus.PENDING) {
            throw new InvalidReturnException("Only pending returns can be approved");
        }

        // Restore stock to the same batch
        for (MedicineReturnItem item : medicineReturn.getItems()) {
            MedicineStock stock = stockRepository.findByIdWithLock(item.getStock().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock batch not found"));
            
            stock.setQuantityAvailable(stock.getQuantityAvailable() + item.getQuantity());
            stockRepository.save(stock);
        }

        medicineReturn.setStatus(ReturnStatus.APPROVED);
        returnRepository.save(medicineReturn);
    }

    @Transactional
    public void rejectReturn(Long returnId) {
        MedicineReturn medicineReturn = returnRepository.findById(returnId)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found"));

        if (medicineReturn.getStatus() != ReturnStatus.PENDING) {
            throw new InvalidReturnException("Only pending returns can be rejected");
        }

        medicineReturn.setStatus(ReturnStatus.REJECTED);
        returnRepository.save(medicineReturn);
    }

    public List<MedicineReturn> getPendingReturns() {
        return returnRepository.findAll().stream()
                .filter(r -> r.getStatus() == ReturnStatus.PENDING)
                .toList();
    }

    public List<MedicineReturn> getAllReturns() {
        return returnRepository.findAll();
    }

    public static class ReturnItemRequest {
        private Long billItemId;
        private Integer quantity;

        public Long getBillItemId() { return billItemId; }
        public void setBillItemId(Long billItemId) { this.billItemId = billItemId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
