package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.ReturnService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
@RestController
@RequestMapping("/api/pharmacy/returns")
public class SaleReturnController {

    private final ReturnService returnService;

    public SaleReturnController(ReturnService returnService) {
        this.returnService = returnService;
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<com.pharmadesk.backend.model.MedicineReturn>>> getPendingReturns() {
        return ResponseEntity.ok(ApiResponse.success(returnService.getPendingReturns(), "Pending returns fetched"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<com.pharmadesk.backend.model.MedicineReturn>>> getAllReturns() {
        return ResponseEntity.ok(ApiResponse.success(returnService.getAllReturns(), "All returns fetched"));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','BILLING_STAFF','SUPERVISOR')")
    @PostMapping("/initiate/{billId}")
    public ResponseEntity<ApiResponse<Void>> initiateReturn(
            @PathVariable Long billId,
            @RequestBody List<ReturnService.ReturnItemRequest> items,
            @RequestParam String reason) {
        returnService.initiateReturn(billId, items, reason);
        return ResponseEntity.ok(ApiResponse.success(null, "Return initiated successfully"));
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveReturn(@PathVariable Long id) {
        returnService.approveReturn(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Return approved and stock restored"));
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectReturn(@PathVariable Long id) {
        returnService.rejectReturn(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Return rejected"));
    }
}
