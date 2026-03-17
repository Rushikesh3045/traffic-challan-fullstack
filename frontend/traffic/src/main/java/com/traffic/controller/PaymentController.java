package com.traffic.controller;

import com.traffic.entity.Payment;
import com.traffic.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private com.traffic.repository.ChallanRepository challanRepository;

    @Autowired
    private com.traffic.repository.ViolationRepository violationRepository;

    @PostMapping("/pay/{violationId}")
    public ResponseEntity<?> makePayment(@PathVariable("violationId") Long violationId) {
        try {
            System.out.println("Processing payment for violation ID: " + violationId);

            com.traffic.entity.Violation violation = violationRepository.findById(violationId)
                    .orElseThrow(() -> new RuntimeException("Violation not found with ID: " + violationId));

            if ("PAID".equals(violation.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "This violation has already been paid"));
            }

            // Update Violation Status
            violation.setStatus("PAID");
            violation.setPaidAt(java.time.LocalDateTime.now());
            violationRepository.save(violation);
            System.out.println("Violation " + violationId + " marked as PAID");

            // Update associated Challan Status
            java.util.List<com.traffic.entity.Challan> challans = challanRepository.findAll().stream()
                    .filter(c -> violationId.equals(c.getViolationId()))
                    .toList();

            for (com.traffic.entity.Challan c : challans) {
                c.setPaymentStatus("PAID");
                challanRepository.save(c);
            }
            System.out.println("Associated challans updated to PAID");

            Payment payment = new Payment();
            payment.setChallanId(violationId);
            payment.setPaymentStatus("SUCCESS");
            payment.setPaymentMode("ONLINE");
            payment.setPaymentDate(java.time.LocalDateTime.now());

            Payment savedPayment = paymentRepository.save(payment);
            System.out.println("Payment record created with ID: " + savedPayment.getId());

            return ResponseEntity.ok(java.util.Map.of(
                    "message", "Payment successful",
                    "payment", savedPayment,
                    "violation", violation));
        } catch (RuntimeException e) {
            System.err.println("Payment error: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected payment error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(java.util.Map.of("message", "Payment failed: " + e.getMessage()));
        }
    }

    @GetMapping("/receipt/{violationId}")
    public ResponseEntity<?> getReceipt(@PathVariable("violationId") Long violationId) {
        // Simple receipt generation logic
        return ResponseEntity.ok("Receipt for Violation ID: " + violationId);
    }
}
