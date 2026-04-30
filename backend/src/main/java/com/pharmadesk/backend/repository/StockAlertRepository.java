package com.pharmadesk.backend.repository;

import com.pharmadesk.backend.model.StockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface StockAlertRepository extends JpaRepository<StockAlert, Long> {
    Optional<StockAlert> findTopByMedicineIdAndCreatedAtAfterOrderByCreatedAtDesc(Long medicineId, LocalDateTime after);
}
