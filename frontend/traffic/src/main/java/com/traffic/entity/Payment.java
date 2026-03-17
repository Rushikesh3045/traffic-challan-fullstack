package com.traffic.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challan_id")
    private Long challanId;

    @Column(name = "payment_mode")
    private String paymentMode; // CARD / UPI / CASH

    @Column(name = "payment_status")
    private String paymentStatus; // SUCCESS / FAILED

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "payment_time")
    private String paymentTime;

    public Payment() {
    }

    public Payment(Long challanId, String paymentMode, String paymentStatus, LocalDateTime paymentDate,
            String paymentTime) {
        this.challanId = challanId;
        this.paymentMode = paymentMode;
        this.paymentStatus = paymentStatus;
        this.paymentDate = paymentDate;
        this.paymentTime = paymentTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getChallanId() {
        return challanId;
    }

    public void setChallanId(Long challanId) {
        this.challanId = challanId;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentTime() {
        return paymentTime;
    }

    public void setPaymentTime(String paymentTime) {
        this.paymentTime = paymentTime;
    }
}
