package com.pharmadesk.backend.pharmacy.service;

import com.pharmadesk.backend.pharmacy.dto.SaleItemDTO;
import com.pharmadesk.backend.pharmacy.dto.SaleRequestDTO;
import com.pharmadesk.backend.model.*;
import com.pharmadesk.backend.pharmacy.enums.PaymentMode;
import com.pharmadesk.backend.pharmacy.enums.PaymentStatus;
import com.pharmadesk.backend.pharmacy.exception.ExpiredStockException;
import com.pharmadesk.backend.pharmacy.exception.InsufficientStockException;
import com.pharmadesk.backend.pharmacy.exception.ResourceNotFoundException;
import com.pharmadesk.backend.pharmacy.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SaleService {

    private final MedicineStockRepository stockRepository;
    private final PharmacyBillRepository billRepository;
    private final CreditBillRepository creditBillRepository;
    private final PharmacyAdvanceRepository advanceRepository;
    private final MedicineRepository medicineRepository;
    private final com.pharmadesk.backend.service.StockAlertService alertService;

    public SaleService(MedicineStockRepository stockRepository, 
                       PharmacyBillRepository billRepository, 
                       CreditBillRepository creditBillRepository, 
                       PharmacyAdvanceRepository advanceRepository,
                       MedicineRepository medicineRepository,
                       com.pharmadesk.backend.service.StockAlertService alertService) {
        this.stockRepository = stockRepository;
        this.billRepository = billRepository;
        this.creditBillRepository = creditBillRepository;
        this.advanceRepository = advanceRepository;
        this.medicineRepository = medicineRepository;
        this.alertService = alertService;
    }

    @Transactional
    public PharmacyBill processSale(SaleRequestDTO request) {
        PharmacyBill bill = new PharmacyBill();
        bill.setBillNumber("BILL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        bill.setBillingDate(LocalDateTime.now());
        bill.setPatientName(request.getPatientName());
        bill.setDoctorName(request.getDoctorName());
        bill.setDiscountAmount(request.getDiscountAmount());

        BigDecimal subTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SaleItemDTO itemDto : request.getItems()) {
            // Pessimistic Lock for stock update
            MedicineStock stock = stockRepository.findByIdWithLock(itemDto.getStockId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock not found for ID: " + itemDto.getStockId()));

            if (stock.getQuantityAvailable() < itemDto.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for batch: " + stock.getBatchNumber());
            }

            if (stock.getExpiryDate().isBefore(LocalDate.now())) {
                throw new ExpiredStockException(
                    "Batch " + stock.getBatchNumber() + " of " + stock.getMedicine().getName()
                    + " expired on " + stock.getExpiryDate() + ". Cannot dispense expired medicine."
                );
            }

            // Deduct stock
            stock.setQuantityAvailable(stock.getQuantityAvailable() - itemDto.getQuantity());
            stockRepository.save(stock);

            // Create Bill Item
            PharmacyBillItem billItem = new PharmacyBillItem();
            billItem.setBill(bill);
            billItem.setStock(stock);
            billItem.setQuantity(itemDto.getQuantity());
            billItem.setUnitPrice(stock.getSellingRate());
            
            BigDecimal lineTotal = stock.getSellingRate().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            subTotal = subTotal.add(lineTotal);
            
            // Calculate tax
            BigDecimal taxPercentage = stock.getMedicine().getTaxPercentage() != null ? stock.getMedicine().getTaxPercentage() : BigDecimal.ZERO;
            BigDecimal lineTax = lineTotal.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            taxTotal = taxTotal.add(lineTax);

            billItem.setTaxAmount(lineTax);
            billItem.setNetAmount(lineTotal.add(lineTax));
            bill.getItems().add(billItem);
        }

        bill.setSubTotal(subTotal);
        bill.setTaxAmount(taxTotal);
        BigDecimal netAmount = subTotal.add(taxTotal).subtract(request.getDiscountAmount());
        bill.setNetAmount(netAmount);

        // Handle Advance adjustment
        BigDecimal paidAmount = request.getAmountPaid();
        if (request.isUseAdvance()) {
            if (request.getPatientId() == null) {
                throw new IllegalArgumentException("patientId is required when useAdvance=true");
            }
            PharmacyAdvance advance = advanceRepository.findByPatientId(request.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("No advance found for patientId: " + request.getPatientId()));
            
            BigDecimal adjustment = advance.getBalanceAmount().min(netAmount);
            advance.setBalanceAmount(advance.getBalanceAmount().subtract(adjustment));
            advanceRepository.save(advance);
            paidAmount = paidAmount.add(adjustment);
        }

        bill.setPaidAmount(paidAmount);
        BigDecimal balance = netAmount.subtract(paidAmount);
        bill.setBalanceAmount(balance.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : balance);
        bill.setPaymentMode(request.getPaymentMode().name());

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            bill.setPaymentStatus(PaymentStatus.PAID);
            bill.setStatus("PAID");
            bill.setBillType(request.getBillType() != null ? request.getBillType() : "CASH");
        } else {
            bill.setBillType(request.getBillType() != null ? request.getBillType() : "CREDIT");
            if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                bill.setPaymentStatus(PaymentStatus.PARTIAL);
                bill.setStatus("PENDING");
            } else {
                bill.setPaymentStatus(PaymentStatus.UNPAID);
                bill.setStatus("PENDING");
            }
        }

        PharmacyBill savedBill = billRepository.save(bill);

        // Create Credit Bill if balance exists
        if (bill.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
            CreditBill creditBill = new CreditBill();
            creditBill.setBill(savedBill);
            creditBill.setTotalAmount(savedBill.getNetAmount());
            creditBill.setPaidAmount(savedBill.getPaidAmount());
            creditBill.setBalanceAmount(savedBill.getBalanceAmount());
            creditBill.setStatus(savedBill.getPaymentStatus());
            creditBillRepository.save(creditBill);
        }

        // Trigger Stock Alerts
        for (SaleItemDTO itemDto : request.getItems()) {
            MedicineStock stock = stockRepository.findById(itemDto.getStockId()).orElse(null);
            if (stock != null && stock.getMedicine() != null) {
                alertService.checkAndAlert(stock.getMedicine().getId());
            }
        }

        return savedBill;
    }

    @Transactional
    public void cancelSale(Long id) {
        PharmacyBill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));

        // 1. Revert Stock
        for (PharmacyBillItem item : bill.getItems()) {
            MedicineStock stock = item.getStock();
            if (stock != null) {
                stock.setQuantityAvailable(stock.getQuantityAvailable() + item.getQuantity());
                stockRepository.save(stock);
                
            }
        }

        // 2. Clear Credit Record
        creditBillRepository.findByBillId(id).ifPresent(creditBillRepository::delete);

        // 3. Mark Bill as Deleted
        bill.setDeleted(true);
        billRepository.save(bill);
    }
}
