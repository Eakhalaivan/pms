package com.pharmadesk.backend.pharmacy.service;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.pharmacy.dto.SaleRequestDTO;
import com.pharmadesk.backend.pharmacy.dto.SaleItemDTO;
import com.pharmadesk.backend.pharmacy.exception.ExpiredStockException;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SaleServiceTest {

    @Mock
    private MedicineStockRepository stockRepository;

    @Mock
    private PharmacyBillRepository billRepository;

    @InjectMocks
    private SaleService saleService;

    @Test
    void processSale_ShouldThrowException_WhenStockIsInsufficient() {
        SaleItemDTO item = new SaleItemDTO();
        item.setStockId(1L);
        item.setQuantity(100);

        SaleRequestDTO request = new SaleRequestDTO();
        request.setItems(Collections.singletonList(item));

        when(stockRepository.findByIdWithLock(1L)).thenReturn(java.util.Optional.empty());

        assertThrows(RuntimeException.class, () -> saleService.processSale(request));
    }

    @Test
    void processSale_ShouldThrowException_WhenStockIsExpired() {
        Medicine medicine = new Medicine();
        medicine.setName("Expired Med");

        MedicineStock expiredStock = new MedicineStock();
        expiredStock.setMedicine(medicine);
        expiredStock.setQuantityAvailable(10);
        expiredStock.setExpiryDate(LocalDate.now().minusDays(1));
        expiredStock.setBatchNumber("B123");

        SaleItemDTO item = new SaleItemDTO();
        item.setStockId(1L);
        item.setQuantity(5);

        SaleRequestDTO request = new SaleRequestDTO();
        request.setItems(Collections.singletonList(item));

        when(stockRepository.findByIdWithLock(1L)).thenReturn(java.util.Optional.of(expiredStock));

        assertThrows(ExpiredStockException.class, () -> saleService.processSale(request));
    }
}
