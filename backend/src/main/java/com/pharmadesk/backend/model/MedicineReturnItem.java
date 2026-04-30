package com.pharmadesk.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "medicine_return_items")
@SQLDelete(sql = "UPDATE medicine_return_items SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class MedicineReturnItem extends BaseEntity {

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false)
    private MedicineReturn medicineReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private MedicineStock stock;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "return_amount", nullable = false)
    private BigDecimal returnAmount;

    @Column(name = "bill_item_id")
    private Long billItemId;

    public MedicineReturn getMedicineReturn() { return medicineReturn; }
    public void setMedicineReturn(MedicineReturn medicineReturn) { this.medicineReturn = medicineReturn; }
    public MedicineStock getStock() { return stock; }
    public void setStock(MedicineStock stock) { this.stock = stock; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getReturnAmount() { return returnAmount; }
    public void setReturnAmount(BigDecimal returnAmount) { this.returnAmount = returnAmount; }
    public Long getBillItemId() { return billItemId; }
    public void setBillItemId(Long billItemId) { this.billItemId = billItemId; }
}
