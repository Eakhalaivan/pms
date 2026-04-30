package com.pharmadesk.backend.service;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.model.StockAlert;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.pharmacy.repository.MedicineRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.repository.StockAlertRepository;
import com.pharmadesk.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StockAlertService {

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;
    private final StockAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.stock-alert.cooldown-hours:24}")
    private int cooldownHours;

    public StockAlertService(MedicineRepository medicineRepository,
                             MedicineStockRepository stockRepository,
                             StockAlertRepository alertRepository,
                             UserRepository userRepository,
                             EmailService emailService) {
        this.medicineRepository = medicineRepository;
        this.stockRepository = stockRepository;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public void checkAndAlert(Long medicineId) {
        Medicine medicine = medicineRepository.findById(medicineId).orElse(null);
        if (medicine == null || medicine.getReorderLevel() == null) return;

        // Use the updated repository method that filters out deleted batches
        int totalStock = stockRepository.findByMedicineIdAndIsDeletedFalse(medicineId).stream()
                .mapToInt(MedicineStock::getQuantityAvailable)
                .sum();

        if (totalStock <= medicine.getReorderLevel()) {
            // Check if alert was sent in the cooldown period
            LocalDateTime cooldownLimit = LocalDateTime.now().minusHours(cooldownHours);
            boolean alreadySent = alertRepository.findTopByMedicineIdAndCreatedAtAfterOrderByCreatedAtDesc(medicineId, cooldownLimit).isPresent();

            if (!alreadySent) {
                // Fetch all active users who are admins or supervisors
                List<User> recipientsUsers = userRepository.findByStatus("ACTIVE").stream()
                        .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> 
                            r.getName().contains("ADMIN") || r.getName().contains("SUPERVISOR")))
                        .collect(Collectors.toList());

                List<String> recipients = recipientsUsers.stream()
                        .map(User::getEmail)
                        .filter(e -> e != null && !e.isEmpty())
                        .collect(Collectors.toList());

                if (!recipients.isEmpty()) {
                    emailService.sendLowStockAlert(medicine, recipients);
                    StockAlert alert = new StockAlert(medicine, "EMAIL", String.join(", ", recipients));
                    alertRepository.save(alert);
                }
            }
        }
    }
}
