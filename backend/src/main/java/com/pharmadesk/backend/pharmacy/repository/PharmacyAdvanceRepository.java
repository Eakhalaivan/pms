package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.PharmacyAdvance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacyAdvanceRepository extends JpaRepository<PharmacyAdvance, Long> {
    Optional<PharmacyAdvance> findByPatientName(String patientName);
    Optional<PharmacyAdvance> findByPatientId(Long patientId);
}
