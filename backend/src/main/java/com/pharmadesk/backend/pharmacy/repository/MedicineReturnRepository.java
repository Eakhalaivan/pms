package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.MedicineReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicineReturnRepository extends JpaRepository<MedicineReturn, Long> {
    @Query("SELECT DISTINCT r FROM MedicineReturn r LEFT JOIN FETCH r.originalBill LEFT JOIN FETCH r.items")
    List<MedicineReturn> findAll();

    List<MedicineReturn> findByOriginalBillId(Long billId);

    List<MedicineReturn> findByReturnDateAfter(LocalDateTime date);
    List<MedicineReturn> findByReturnDateBetween(LocalDateTime start, LocalDateTime end);
    long countByStatus(com.pharmadesk.backend.pharmacy.enums.ReturnStatus status);
}
