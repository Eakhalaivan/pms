package com.pharmadesk.backend.model;

import com.pharmadesk.backend.pharmacy.enums.PaymentStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "credit_bills")
@SQLDelete(sql = "UPDATE credit_bills SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class CreditBill extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private PharmacyBill bill;

    public PharmacyBill getBill() { return bill; }
    public void setBill(PharmacyBill bill) { this.bill = bill; }

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    @Column(name = "paid_amount", nullable = false)
    private BigDecimal paidAmount;

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    @Column(name = "balance_amount", nullable = false)
    private BigDecimal balanceAmount;

    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
}
