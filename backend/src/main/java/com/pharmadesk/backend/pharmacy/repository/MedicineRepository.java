package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByNameContainingIgnoreCase(String name);
    java.util.Optional<Medicine> findByBarcode(String barcode);
}
