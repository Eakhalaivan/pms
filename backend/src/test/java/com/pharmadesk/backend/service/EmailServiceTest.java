package com.pharmadesk.backend.service;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MedicineStockRepository stockRepository;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "admin@pharmadesk.com");
        ReflectionTestUtils.setField(emailService, "appUrl", "http://localhost:5173");
    }

    @Test
    void sendLowStockAlert_ShouldSendEmail_WhenStockIsCritical() {
        Medicine medicine = new Medicine();
        medicine.setId(1L);
        medicine.setName("Paracetamol");
        medicine.setReorderLevel(100);
        medicine.setUnit("Tablets");
        medicine.setCategory("General");

        MedicineStock lowStock = new MedicineStock();
        lowStock.setQuantityAvailable(20);

        when(stockRepository.findByMedicineIdAndDeletedFalse(1L)).thenReturn(Collections.singletonList(lowStock));
        
        // Use a real JavaMailSenderImpl to create a real MimeMessage
        JavaMailSenderImpl realSender = new JavaMailSenderImpl();
        MimeMessage mimeMessage = realSender.createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendLowStockAlert(medicine, Collections.singletonList("admin@example.com"));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }
}
