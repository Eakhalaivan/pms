package com.pharmadesk.backend.service;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final MedicineStockRepository stockRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.url:http://localhost:5173}")
    private String appUrl;

    public EmailService(JavaMailSender mailSender, MedicineStockRepository stockRepository) {
        this.mailSender = mailSender;
        this.stockRepository = stockRepository;
    }

    public void sendLowStockAlert(Medicine medicine, List<String> recipients) {
        try {
            // FIX: Sum current stock across ALL non-deleted batches
            List<MedicineStock> batches = stockRepository.findByMedicineIdAndIsDeletedFalse(medicine.getId());
            int totalAvailable = batches.stream().mapToInt(MedicineStock::getQuantityAvailable).sum();
            
            int reorderLevel = medicine.getReorderLevel() != null ? medicine.getReorderLevel() : 0;
            
            // Critical check: current stock <= 30% of reorder level
            boolean isCritical = totalAvailable <= (reorderLevel * 0.3);

            String subject = isCritical
                ? "🔴 CRITICAL Stock Alert: " + medicine.getName() + " (" + totalAvailable + " " + medicine.getUnit() + ")"
                : "🟡 Low Stock Alert: " + medicine.getName() + " — PharmaDesk";

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipients.toArray(new String[0]));
            helper.setSubject(subject);

            String html = buildHtml(medicine, totalAvailable, isCritical);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String buildHtml(Medicine medicine, int currentStock, boolean isCritical) {
        String statusColor = isCritical ? "#DC2626" : "#D97706";
        String bgColor = isCritical ? "#FEF2F2" : "#FFFBEB";
        String borderColor = isCritical ? "#DC2626" : "#D97706";
        String statusText = isCritical ? "CRITICAL STOCK" : "LOW STOCK";

        return String.format("""
            <div style="font-family:sans-serif;max-width:600px;margin:auto">
              <div style="background:#1E2A5E;padding:20px;border-radius:8px 8px 0 0">
                <h2 style="color:white;margin:0">PharmaDesk — Stock Alert</h2>
                <p style="color:#9BA8CC;margin:4px 0 0">Hospital General · Main Branch</p>
              </div>
              <div style="border:1px solid #E2E6F0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
                <div style="background:%s;border-left:4px solid %s;padding:16px;border-radius:4px;margin-bottom:20px">
                  <strong style="color:%s">%s</strong>
                </div>
                <table style="width:100%%;border-collapse:collapse;font-size:14px">
                  <tr style="border-bottom:1px solid #E2E6F0">
                    <td style="padding:10px 0;color:#6B7280">Medicine</td>
                    <td style="padding:10px 0;font-weight:600">%s</td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E6F0">
                    <td style="padding:10px 0;color:#6B7280">Category</td>
                    <td style="padding:10px 0">%s</td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E6F0">
                    <td style="padding:10px 0;color:#6B7280">Current Stock</td>
                    <td style="padding:10px 0;font-weight:bold;color:%s">%d %s</td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E6F0">
                    <td style="padding:10px 0;color:#6B7280">Reorder Level</td>
                    <td style="padding:10px 0">%d %s</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#6B7280">Last Updated</td>
                    <td style="padding:10px 0">%s</td>
                  </tr>
                </table>
                <a href="%s/stocks" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1E2A5E;color:white;border-radius:8px;text-decoration:none;font-weight:500">
                   Manage Stock in Dashboard
                </a>
              </div>
            </div>
            """, 
            bgColor, borderColor, statusColor, statusText, 
            medicine.getName(), medicine.getCategory(), 
            statusColor, currentStock, medicine.getUnit(),
            medicine.getReorderLevel(), medicine.getUnit(),
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")),
            appUrl);
    }
}
