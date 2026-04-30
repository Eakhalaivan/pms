package com.pharmadesk.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "prescriptions")
@SQLDelete(sql = "UPDATE prescriptions SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class Prescription extends BaseEntity {

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    @Column(name = "doctor_name")
    private String doctorName;

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    @Column(name = "prescription_date", nullable = false)
    private LocalDateTime prescriptionDate;

    public LocalDateTime getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDateTime prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    @Column(nullable = false)
    private String status; // PENDING, DISPENSED, CANCELLED

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
