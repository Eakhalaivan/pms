package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.model.PurchaseOrder;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.repository.PurchaseOrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderRepository poRepository;

    public PurchaseOrderController(PurchaseOrderRepository poRepository) {
        this.poRepository = poRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getAllPOs() {
        return ResponseEntity.ok(ApiResponse.success(poRepository.findAll(), "Purchase orders fetched"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','STOREKEEPER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> createPO(@RequestBody PurchaseOrder po) {
        // Link items to PO
        if (po.getItems() != null) {
            po.getItems().forEach(item -> item.setPurchaseOrder(po));
        }
        PurchaseOrder saved = poRepository.save(po);
        return ResponseEntity.ok(ApiResponse.success(saved, "Purchase order created"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getPO(@PathVariable Long id) {
        return poRepository.findById(id)
                .map(po -> ResponseEntity.ok(ApiResponse.success(po, "PO found")))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','STOREKEEPER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return poRepository.findById(id).map(po -> {
            po.setStatus(status);
            return ResponseEntity.ok(ApiResponse.success(poRepository.save(po), "Status updated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
