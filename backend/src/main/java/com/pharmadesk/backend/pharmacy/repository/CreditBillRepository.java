package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.CreditBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreditBillRepository extends JpaRepository<CreditBill, Long> {
    Optional<CreditBill> findByBillId(Long billId);
    long countByStatus(com.pharmadesk.backend.pharmacy.enums.PaymentStatus status);
}
