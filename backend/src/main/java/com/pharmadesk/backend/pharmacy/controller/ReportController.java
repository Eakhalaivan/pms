package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSalesReport(from, to), "Sales report fetched"));
    }

    @GetMapping("/tax")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTaxReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getTaxReport(from, to), "Tax report fetched"));
    }

    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','SUPERVISOR','STOREKEEPER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStockReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getStockReport(), "Stock report fetched"));
    }

    @GetMapping("/expiry")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','SUPERVISOR','STOREKEEPER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExpiryReport(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getExpiryReport(days), "Expiry report fetched"));
    }
}
