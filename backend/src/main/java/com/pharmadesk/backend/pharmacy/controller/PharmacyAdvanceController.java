package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.model.PharmacyAdvance;
import com.pharmadesk.backend.pharmacy.repository.PharmacyAdvanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/advances")
public class PharmacyAdvanceController {

    private final PharmacyAdvanceRepository advanceRepository;

    public PharmacyAdvanceController(PharmacyAdvanceRepository advanceRepository) {
        this.advanceRepository = advanceRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PharmacyAdvance>>> getAllAdvances() {
        return ResponseEntity.ok(ApiResponse.success(advanceRepository.findAll(), "Advances fetched"));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','BILLING_STAFF','SUPERVISOR')")
    @PostMapping
    public ResponseEntity<ApiResponse<PharmacyAdvance>> addAdvance(
            @RequestParam String patientName,
            @RequestParam(required = false) Long patientId,
            @RequestParam BigDecimal amount) {
        
        PharmacyAdvance advance;
        if (patientId != null) {
            advance = advanceRepository.findByPatientId(patientId)
                    .orElse(new PharmacyAdvance());
        } else {
            advance = advanceRepository.findByPatientName(patientName)
                    .orElse(new PharmacyAdvance());
        }
        
        if (advance.getId() == null) {
            advance.setPatientName(patientName);
            advance.setPatientId(patientId);
            advance.setAmount(amount);
            advance.setBalanceAmount(amount);
            advance.setAdvanceDate(LocalDateTime.now());
        } else {
            advance.setAmount(advance.getAmount().add(amount));
            advance.setBalanceAmount(advance.getBalanceAmount().add(amount));
            // Update name if it changed but ID is same
            advance.setPatientName(patientName);
        }

        return ResponseEntity.ok(ApiResponse.success(advanceRepository.save(advance), "Advance recorded"));
    }
}
