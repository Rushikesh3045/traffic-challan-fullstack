package com.traffic.controller;

import com.traffic.entity.Appeal;
import com.traffic.repository.AppealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appeals")
@CrossOrigin
public class AppealController {

    @Autowired
    private AppealRepository appealRepository;

    @Autowired
    private com.traffic.repository.ViolationRepository violationRepository;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<?> createAppeal(@RequestBody Appeal appeal) {
        try {
            System.out.println(
                    "Received appeal request: challanId=" + appeal.getChallanId() + ", reason=" + appeal.getReason());

            if (appeal.getChallanId() == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Challan ID is required"));
            }

            if (appeal.getReason() == null || appeal.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Reason is required"));
            }

            com.traffic.entity.Violation violation = violationRepository.findById(appeal.getChallanId())
                    .orElseThrow(() -> new RuntimeException("Violation not found with ID: " + appeal.getChallanId()));

            violation.setStatus("APPEALED");
            violationRepository.save(violation);

            appeal.setStatus("PENDING");
            appeal.setCreatedAt(java.time.LocalDateTime.now());

            Appeal saved = appealRepository.save(appeal);
            System.out.println("Appeal saved successfully with ID: " + saved.getId());

            messagingTemplate.convertAndSend("/topic/appeals", saved);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            System.err.println("Error creating appeal: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected error creating appeal: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(java.util.Map.of("message", "Failed to create appeal: " + e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllAppeals() {
        return ResponseEntity.ok(appealRepository.findAll().stream().map(appeal -> {
            com.traffic.dto.AppealDTO dto = new com.traffic.dto.AppealDTO();
            dto.setId(appeal.getId());
            dto.setChallanId(appeal.getChallanId());
            dto.setReason(appeal.getReason());
            dto.setStatus(appeal.getStatus());
            dto.setCreatedAt(appeal.getCreatedAt());

            System.out.println("Processing Appeal ID: " + appeal.getId() + ", Challan ID: " + appeal.getChallanId());

            violationRepository.findById(appeal.getChallanId()).ifPresentOrElse(v -> {
                System.out.println("Found Violation for Appeal " + appeal.getId() + ": " + v.getVehicleNumber());
                dto.setVehicleNumber(v.getVehicleNumber());
                dto.setViolationType(v.getViolationType());
                dto.setFineAmount(v.getFineAmount());
                dto.setChallanStatus(v.getStatus());
            }, () -> {
                System.out.println("No Violation found for Appeal " + appeal.getId() + " (Challan ID: "
                        + appeal.getChallanId() + ")");
            });
            return dto;
        }).toList());
    }

    @PostMapping("/decision/{id}/{decision}")
    public ResponseEntity<?> handleDecision(@PathVariable("id") Long id, @PathVariable("decision") String decision) {
        Appeal appeal = appealRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appeal not found"));

        appeal.setStatus(decision.toUpperCase());
        appealRepository.save(appeal);

        violationRepository.findById(appeal.getChallanId()).ifPresent(v -> {
            if ("APPROVED".equalsIgnoreCase(decision)) {
                v.setStatus("DISCARDED"); // User is forgiven
            } else if ("REJECTED".equalsIgnoreCase(decision)) {
                v.setStatus("UNPAID");
            }
            violationRepository.save(v);
        });

        messagingTemplate.convertAndSend("/topic/appeals/decision", appeal);
        return ResponseEntity.ok(appeal);
    }
}
