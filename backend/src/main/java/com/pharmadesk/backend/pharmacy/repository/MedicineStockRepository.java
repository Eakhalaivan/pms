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
    List<MedicineStock> findByMedicineId(Long medicineId);

    @Query("SELECT SUM(s.quantityAvailable * s.sellingRate) FROM MedicineStock s")
    java.math.BigDecimal findTotalStockValue();

    @Query("""
      SELECT m.name, m.category, SUM(ms.quantityAvailable), m.reorderLevel, m.unit
      FROM MedicineStock ms JOIN ms.medicine m
      WHERE ms.deleted = false AND ms.quantityAvailable > 0
      GROUP BY m.id, m.name, m.category, m.reorderLevel, m.unit
      HAVING SUM(ms.quantityAvailable) <= m.reorderLevel
      ORDER BY SUM(ms.quantityAvailable) ASC
    """)
    List<Object[]> findLowStockWithMedicine();

    @Query(value = """
      SELECT COUNT(*) FROM (
        SELECT m.id FROM medicine_stocks ms 
        JOIN medicines m ON ms.medicine_id = m.id
        WHERE ms.is_deleted = false
        GROUP BY m.id, m.reorder_level 
        HAVING SUM(ms.quantity_available) <= m.reorder_level
      ) AS low_stock
    """, nativeQuery = true)
    long countLowStockItems();

    List<MedicineStock> findByMedicineIdAndDeletedFalse(Long medicineId);
    
    List<MedicineStock> findByExpiryDateBefore(java.time.LocalDate date);
}
