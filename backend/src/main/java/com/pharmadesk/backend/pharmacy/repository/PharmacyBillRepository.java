package com.pharmadesk.backend.pharmacy.repository;

import com.pharmadesk.backend.model.PharmacyBill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacyBillRepository extends JpaRepository<PharmacyBill, Long> {
    Optional<PharmacyBill> findByBillNumber(String billNumber);
    
    @Query("SELECT DISTINCT b FROM PharmacyBill b LEFT JOIN FETCH b.items")
    List<PharmacyBill> findAllWithItems();

    List<PharmacyBill> findByBillingDateAfter(LocalDateTime date);
    
    // Support for existing methods
    Page<PharmacyBill> findByBillType(String billType, Pageable pageable);
    Page<PharmacyBill> findByStatus(String status, Pageable pageable);
    List<PharmacyBill> findByStatus(String status);

    @Query("SELECT b FROM PharmacyBill b WHERE " +
           "(:type IS NULL OR b.billType = :type) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:fromDate IS NULL OR b.billingDate >= :fromDate) AND " +
           "(:toDate IS NULL OR b.billingDate <= :toDate)")
    Page<PharmacyBill> searchBills(@Param("type") String type, 
                                   @Param("status") String status, 
                                   @Param("fromDate") LocalDateTime fromDate, 
                                   @Param("toDate") LocalDateTime toDate, 
                                   Pageable pageable);
}
