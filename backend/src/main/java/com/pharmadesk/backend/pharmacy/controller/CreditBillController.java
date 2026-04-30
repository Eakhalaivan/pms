package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.model.CreditBill;
import com.pharmadesk.backend.model.PaymentTransaction;
import com.pharmadesk.backend.pharmacy.enums.PaymentMode;
import com.pharmadesk.backend.pharmacy.enums.PaymentStatus;
import com.pharmadesk.backend.pharmacy.exception.ResourceNotFoundException;
import com.pharmadesk.backend.pharmacy.repository.CreditBillRepository;
import com.pharmadesk.backend.pharmacy.repository.PaymentTransactionRepository;
import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/credit-bills")
public class CreditBillController {

    private final CreditBillRepository creditBillRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PharmacyBillRepository billRepository;

    public CreditBillController(CreditBillRepository creditBillRepository, 
                                PaymentTransactionRepository transactionRepository, 
                                PharmacyBillRepository billRepository) {
        this.creditBillRepository = creditBillRepository;
        this.transactionRepository = transactionRepository;
        this.billRepository = billRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CreditBill>>> getAllCreditBills() {
        return ResponseEntity.ok(ApiResponse.success(creditBillRepository.findAll(), "Credit bills fetched"));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','BILLING_STAFF','SUPERVISOR')")
    @PostMapping("/{id}/payment")
    @Transactional
    public ResponseEntity<ApiResponse<PaymentTransaction>> addPayment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam PaymentMode mode,
            @RequestParam(required = false) String reference) {
        
        CreditBill creditBill = creditBillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credit bill not found"));

        PaymentTransaction tx = new PaymentTransaction();
        tx.setCreditBill(creditBill);
        tx.setAmount(amount);
        tx.setPaymentMode(mode);
        tx.setPaymentDate(LocalDateTime.now());
        tx.setTransactionReference(reference);
        
        transactionRepository.save(tx);

        creditBill.setPaidAmount(creditBill.getPaidAmount().add(amount));
        creditBill.setBalanceAmount(creditBill.getBalanceAmount().subtract(amount));
        
        if (creditBill.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            creditBill.setStatus(PaymentStatus.PAID);
            creditBill.getBill().setPaymentStatus(PaymentStatus.PAID);
        } else {
            creditBill.setStatus(PaymentStatus.PARTIAL);
            creditBill.getBill().setPaymentStatus(PaymentStatus.PARTIAL);
        }
        
        billRepository.save(creditBill.getBill());
        creditBillRepository.save(creditBill);

        return ResponseEntity.ok(ApiResponse.success(tx, "Payment recorded successfully"));
    }
}
