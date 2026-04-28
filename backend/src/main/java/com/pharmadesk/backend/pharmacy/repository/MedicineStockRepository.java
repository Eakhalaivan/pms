package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.MedicineStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineStockRepository extends JpaRepository<MedicineStock, Long> {

    @Query(value = "SELECT * FROM medicine_stocks WHERE id = :id AND is_deleted = false FOR UPDATE", nativeQuery = true)
    Optional<MedicineStock> findByIdWithLock(@Param("id") Long id);

    List<MedicineStock> findByMedicineNameContainingIgnoreCase(String name);

    @Query("SELECT SUM(s.quantityAvailable * s.sellingRate) FROM MedicineStock s")
    BigDecimal findTotalStockValue();
}
