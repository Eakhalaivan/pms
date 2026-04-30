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
    List<PharmacyBill> findByBillingDateBetween(LocalDateTime start, LocalDateTime end);
    
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

    @Query("SELECT SUM(b.netAmount) FROM PharmacyBill b WHERE b.billingDate BETWEEN :start AND :end AND b.deleted = false")
    java.math.BigDecimal sumNetAmountByBillingDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM PharmacyBill b WHERE b.billingDate BETWEEN :start AND :end AND b.deleted = false")
    long countByBillingDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM PharmacyBill b WHERE b.billType = 'OTC' AND b.billingDate BETWEEN :start AND :end AND b.deleted = false")
    long countDirectSalesToday(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT DISTINCT b FROM PharmacyBill b LEFT JOIN FETCH b.items WHERE b.deleted = false ORDER BY b.billingDate DESC",
           countQuery = "SELECT COUNT(b) FROM PharmacyBill b WHERE b.deleted = false")
    Page<PharmacyBill> findAllWithItemsPaged(Pageable pageable);
}
