package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.dto.SaleRequestDTO;
import com.pharmadesk.backend.model.PharmacyBill;
import com.pharmadesk.backend.pharmacy.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

import com.pharmadesk.backend.pharmacy.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/pharmacy/sales")
public class SaleController {

    private final SaleService saleService;
    private final PharmacyBillRepository pharmacyBillRepository;

    public SaleController(SaleService saleService, PharmacyBillRepository pharmacyBillRepository) {
        this.saleService = saleService;
        this.pharmacyBillRepository = pharmacyBillRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PharmacyBill>> createSale(@Valid @RequestBody SaleRequestDTO request) {
        PharmacyBill bill = saleService.createSale(request);
        return ResponseEntity.ok(ApiResponse.success(bill, "Sale completed successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PharmacyBill>>> getAllSales() {
        try {
            List<PharmacyBill> sales = pharmacyBillRepository.findAllWithItems();
            return ResponseEntity.ok(ApiResponse.success(sales, "Sales fetched"));
        } catch (Exception e) {
            System.err.println("Error fetching sales: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(ApiResponse.error("Error fetching sales: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PharmacyBill>> getSaleById(@PathVariable Long id) {
        PharmacyBill bill = pharmacyBillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        return ResponseEntity.ok(ApiResponse.success(bill, "Bill details fetched"));
    }

    @GetMapping("/number/{billNumber}")
    public ResponseEntity<ApiResponse<PharmacyBill>> getSaleByNumber(@PathVariable String billNumber) {
        PharmacyBill bill = pharmacyBillRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
        return ResponseEntity.ok(ApiResponse.success(bill, "Bill details fetched"));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSale(@PathVariable Long id) {
        saleService.cancelSale(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Bill cancelled successfully"));
    }
}
