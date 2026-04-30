package com.pharmadesk.backend.pharmacy.service;

import com.pharmadesk.backend.model.PharmacyBill;
import com.pharmadesk.backend.model.PharmacyBillItem;
import com.pharmadesk.backend.pharmacy.repository.MedicineReturnRepository;
import com.pharmadesk.backend.pharmacy.repository.PharmacyBillRepository;
import com.pharmadesk.backend.pharmacy.exception.InvalidReturnException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReturnServiceTest {

    @Mock
    private PharmacyBillRepository billRepository;

    @Mock
    private MedicineReturnRepository returnRepository;

    @InjectMocks
    private ReturnService returnService;

    @Test
    void processReturn_ShouldThrowException_WhenReturnQuantityExceedsOriginal() {
        PharmacyBill bill = new PharmacyBill();
        bill.setId(1L);

        PharmacyBillItem item = new PharmacyBillItem();
        item.setId(1L);
        item.setQuantity(5);
        bill.setItems(Collections.singletonList(item));

        ReturnService.ReturnItemRequest returnItem = new ReturnService.ReturnItemRequest();
        returnItem.setBillItemId(1L);
        returnItem.setQuantity(10); // 10 > 5

        when(billRepository.findById(1L)).thenReturn(Optional.of(bill));

        assertThrows(InvalidReturnException.class, () -> 
            returnService.initiateReturn(1L, Collections.singletonList(returnItem), "Test reason")
        );
    }
}
