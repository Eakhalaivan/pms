package com.pharmadesk.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "medicines")
@SQLDelete(sql = "UPDATE medicines SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class Medicine extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "generic_name")
    private String genericName;

    private String manufacturer;
    private String category;
    private String unit;

    @Column(name = "hsn_code")
    private String hsnCode;

    @Column(name = "tax_percentage")
    private Double taxPercentage;

    @Column(name = "gst_percent")
    private BigDecimal gstPercent;

    @Column(name = "reorder_level")
    @JsonProperty("reorderLevel")
    private Integer reorderLevel = 10;

    @Column(name = "count")
    @JsonProperty("count")
    private Integer count = 0;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public BigDecimal getGstPercent() { return gstPercent; }
    public void setGstPercent(BigDecimal gstPercent) { this.gstPercent = gstPercent; }
    public Double getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(Double taxPercentage) { this.taxPercentage = taxPercentage; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
}
