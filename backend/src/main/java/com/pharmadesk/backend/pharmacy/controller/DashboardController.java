package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.model.PharmacyBill;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.pharmacy.enums.PrescriptionStatus;
import com.pharmadesk.backend.pharmacy.enums.ReturnStatus;
import com.pharmadesk.backend.pharmacy.repository.*;
import com.pharmadesk.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy/dashboard")
public class DashboardController {

    private final PharmacyBillRepository pharmacyBillRepository;
    private final MedicineReturnRepository medicineReturnRepository;
    private final MedicineStockRepository medicineStockRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final CreditBillRepository creditBillRepository;

    public DashboardController(PharmacyBillRepository pharmacyBillRepository, 
                               MedicineReturnRepository medicineReturnRepository, 
                               MedicineStockRepository medicineStockRepository,
                               PrescriptionRepository prescriptionRepository,
                               UserRepository userRepository,
                               CreditBillRepository creditBillRepository) {
        this.pharmacyBillRepository = pharmacyBillRepository;
        this.medicineReturnRepository = medicineReturnRepository;
        this.medicineStockRepository = medicineStockRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
        this.creditBillRepository = creditBillRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // KPI: today's sales total
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = LocalDate.now().atTime(23, 59, 59);

        BigDecimal todaySales = pharmacyBillRepository
          .sumNetAmountByBillingDateBetween(startOfDay, endOfDay);
        stats.put("todaySales", todaySales != null ? todaySales : BigDecimal.ZERO);

        // KPI: bills count today
        long billsToday = pharmacyBillRepository
          .countByBillingDateBetween(startOfDay, endOfDay);
        stats.put("billsToday", billsToday);

        // KPI: pending prescriptions
        long pendingRx = prescriptionRepository
          .countByStatus(PrescriptionStatus.PENDING.name());
        stats.put("pendingPrescriptions", pendingRx);

        // KPI: low stock count
        long lowStockCount = medicineStockRepository
          .countLowStockItems();
        stats.put("lowStockAlerts", lowStockCount);

        // KPI: active staff count
        long activeStaff = userRepository.countByStatus("ACTIVE");
        stats.put("activeStaff", activeStaff);

        // Module stats
        stats.put("pendingReturns", medicineReturnRepository.countByStatus(ReturnStatus.PENDING));
        stats.put("directSalesCount", pharmacyBillRepository.countDirectSalesToday(startOfDay, endOfDay));
        stats.put("creditBillsOpen", creditBillRepository.countByStatus(com.pharmadesk.backend.pharmacy.enums.PaymentStatus.UNPAID));

        return ResponseEntity.ok(ApiResponse.success(stats, "Dashboard stats"));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLowStockItems() {
        List<Object[]> rows = medicineStockRepository.findLowStockWithMedicine();
        List<Map<String, Object>> result = rows.stream().map(r -> {
            Map<String, Object> item = new HashMap<>();
            item.put("medicineName", r[0]);
            item.put("category",     r[1]);
            item.put("currentStock", r[2]);
            item.put("reorderLevel", r[3]);
            item.put("unit",         r[4]);
            item.put("status", ((Number)r[2]).intValue() <=
                     ((Number)r[3]).intValue() * 0.3 ? "CRITICAL" : "LOW");
            return item;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success(result, "Low stock items"));
    }

    @GetMapping("/staff-on-duty")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStaffOnDuty() {
        List<User> activeUsers = userRepository.findByStatus("ACTIVE");
        List<Map<String, Object>> staff = activeUsers.stream().map(u -> {
            Map<String, Object> s = new HashMap<>();
            String empId = u.getEmployeeId();
            s.put("id", empId != null && empId.length() >= 2 ? empId.substring(0, 2).toUpperCase() : "U");
            s.put("name", u.getName());
            s.put("username", u.getUsername());
            s.put("shift", u.getShift());
            s.put("role", u.getRoles() != null && !u.getRoles().isEmpty() 
                    ? u.getRoles().iterator().next().getName() : "USER");
            s.put("since", "8:00 AM");
            s.put("color", "#1E2A5E");
            return s;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success(staff, "Staff on duty"));
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecentActivities() {
        List<PharmacyBill> bills = pharmacyBillRepository.findAll();
        List<Map<String, Object>> activities = bills.stream()
            .sorted((a, b) -> b.getBillingDate().compareTo(a.getBillingDate()))
            .limit(10)
            .map(b -> {
                Map<String, Object> a = new HashMap<>();
                a.put("billNumber", b.getBillNumber());
                a.put("patientName", b.getPatientName());
                a.put("netAmount", b.getNetAmount() != null ? b.getNetAmount() : BigDecimal.ZERO);
                a.put("status", b.getStatus());
                a.put("billingDate", b.getBillingDate());
                return a;
            }).toList();
        return ResponseEntity.ok(ApiResponse.success(activities, "Recent activities fetched"));
    }

    @GetMapping("/chart-data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChartData() {
        Map<String, Object> data = new HashMap<>();
        
        // Mocking some data for the 7-day chart
        List<Map<String, Object>> salesReturns = List.of(
            Map.of("day", "Mon", "sales", 4000, "returns", 400),
            Map.of("day", "Tue", "sales", 3000, "returns", 200),
            Map.of("day", "Wed", "sales", 5000, "returns", 600),
            Map.of("day", "Thu", "sales", 2780, "returns", 300),
            Map.of("day", "Fri", "sales", 1890, "returns", 100),
            Map.of("day", "Sat", "sales", 2390, "returns", 150),
            Map.of("day", "Sun", "sales", 3490, "returns", 250)
        );
        data.put("salesReturns", salesReturns);

        List<Map<String, Object>> categories = List.of(
            Map.of("name", "Tablets", "value", 400),
            Map.of("name", "Syrup", "value", 300),
            Map.of("name", "Injections", "value", 200),
            Map.of("name", "Others", "value", 100)
        );
        data.put("categories", categories);

        return ResponseEntity.ok(ApiResponse.success(data, "Chart data fetched"));
    }
}
