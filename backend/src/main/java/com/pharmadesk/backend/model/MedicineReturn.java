package com.pharmadesk.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.pharmadesk.backend.pharmacy.enums.ReturnStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "medicine_returns")
@SQLDelete(sql = "UPDATE medicine_returns SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class MedicineReturn extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_bill_id", nullable = false)
    private PharmacyBill originalBill;

    @Column(name = "return_date", nullable = false)
    private LocalDateTime returnDate;

    @Enumerated(EnumType.STRING)
    private ReturnStatus status;

    private String reason;

    @Column(name = "total_return_amount", nullable = false)
    private BigDecimal totalReturnAmount;

    @JsonManagedReference
    @OneToMany(mappedBy = "medicineReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicineReturnItem> items = new ArrayList<>();

    public PharmacyBill getOriginalBill() { return originalBill; }
    public void setOriginalBill(PharmacyBill originalBill) { this.originalBill = originalBill; }
    public LocalDateTime getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDateTime returnDate) { this.returnDate = returnDate; }
    public ReturnStatus getStatus() { return status; }
    public void setStatus(ReturnStatus status) { this.status = status; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public BigDecimal getTotalReturnAmount() { return totalReturnAmount; }
    public void setTotalReturnAmount(BigDecimal totalReturnAmount) { this.totalReturnAmount = totalReturnAmount; }
    public List<MedicineReturnItem> getItems() { return items; }
    public void setItems(List<MedicineReturnItem> items) { this.items = items; }
}
