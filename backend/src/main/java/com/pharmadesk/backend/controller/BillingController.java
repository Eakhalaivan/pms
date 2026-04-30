package com.pharmadesk.backend.controller;

import com.pharmadesk.backend.model.PharmacyBill;
import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/bills")
public class BillingController {

    private final PharmacyBillRepository billRepository;

    public BillingController(PharmacyBillRepository billRepository) {
        this.billRepository = billRepository;
    }

    @GetMapping
    public ResponseEntity<Page<PharmacyBill>> getBills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PharmacyBill> bills = billRepository.searchBills(type, status, from, to, pageable);
        return ResponseEntity.ok(bills);
    }

    @PostMapping
    public ResponseEntity<PharmacyBill> createBill(@RequestBody PharmacyBill bill) {
        // Implementation for bill creation
        return ResponseEntity.ok(billRepository.save(bill));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PharmacyBill> getBill(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<PharmacyBill> cancelBill(@PathVariable Long id) {
        return billRepository.findById(id).map(bill -> {
            bill.setStatus("CANCELLED");
            return ResponseEntity.ok(billRepository.save(bill));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/payment")
    public ResponseEntity<PharmacyBill> updatePaymentStatus(@PathVariable Long id, @RequestBody String newStatus) {
        return billRepository.findById(id).map(bill -> {
            bill.setStatus(newStatus);
            return ResponseEntity.ok(billRepository.save(bill));
        }).orElse(ResponseEntity.notFound().build());
    }
}
