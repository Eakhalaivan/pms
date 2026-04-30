package com.pharmadesk.backend.pharmacy.service;

import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.model.PharmacyBill;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final PharmacyBillRepository billRepository;
    private final MedicineStockRepository stockRepository;

    public ReportService(PharmacyBillRepository billRepository, MedicineStockRepository stockRepository) {
        this.billRepository = billRepository;
        this.stockRepository = stockRepository;
    }

    public List<Map<String, Object>> getSalesReport(LocalDateTime from, LocalDateTime to) {
        List<PharmacyBill> bills = billRepository.findByBillingDateBetween(from, to);
        return bills.stream().map(b -> {
            Map<String, Object> map = new HashMap<>();
            map.put("billNumber", b.getBillNumber());
            map.put("date", b.getBillingDate());
            map.put("patient", b.getPatientName());
            map.put("amount", b.getNetAmount());
            map.put("tax", b.getTaxAmount());
            map.put("status", b.getStatus());
            return map;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getTaxReport(LocalDateTime from, LocalDateTime to) {
        List<PharmacyBill> bills = billRepository.findByBillingDateBetween(from, to);
        BigDecimal totalTax = bills.stream()
                .map(b -> b.getTaxAmount() != null ? b.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalAmount = bills.stream()
                .map(b -> b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new HashMap<>();
        report.put("totalTax", totalTax);
        report.put("totalAmount", totalAmount);
        report.put("billCount", bills.size());
        report.put("period", from.toLocalDate() + " to " + to.toLocalDate());
        return report;
    }

    public List<Map<String, Object>> getStockReport() {
        List<MedicineStock> stocks = stockRepository.findAll();
        return stocks.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("medicine", s.getMedicine() != null ? s.getMedicine().getName() : "Unknown");
            map.put("batch", s.getBatchNumber());
            map.put("quantity", s.getQuantityAvailable());
            map.put("unitPrice", s.getPurchaseRate());
            map.put("expiry", s.getExpiryDate());
            map.put("value", s.getPurchaseRate().multiply(BigDecimal.valueOf(s.getQuantityAvailable())));
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getExpiryReport(int days) {
        LocalDateTime threshold = LocalDateTime.now().plusDays(days);
        List<MedicineStock> stocks = stockRepository.findByExpiryDateBefore(threshold.toLocalDate());
        return stocks.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("medicine", s.getMedicine() != null ? s.getMedicine().getName() : "Unknown");
            map.put("batch", s.getBatchNumber());
            map.put("expiry", s.getExpiryDate());
            map.put("quantity", s.getQuantityAvailable());
            return map;
        }).collect(Collectors.toList());
    }
}
