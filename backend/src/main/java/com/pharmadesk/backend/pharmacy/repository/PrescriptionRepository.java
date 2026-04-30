package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    long countByStatus(String status);
}
