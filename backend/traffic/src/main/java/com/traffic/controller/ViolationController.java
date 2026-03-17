package com.traffic.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.traffic.entity.Violation;
import com.traffic.repository.ViolationRepository;

@RestController
@RequestMapping("/api/violations")
@CrossOrigin
public class ViolationController {

    @Autowired
    ViolationRepository repo;

    @Autowired
    private com.traffic.repository.ChallanRepository challanRepo;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public org.springframework.http.ResponseEntity<?> add(@RequestBody Violation v) {
        try {
            System.out.println("Received violation request: " + v.getVehicleNumber() + ", " + v.getViolationType()
                    + ", " + v.getFineAmount());

            // Validation
            if (v.getVehicleNumber() == null || v.getVehicleNumber().trim().isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Vehicle number is required"));
            }

            if (v.getViolationType() == null || v.getViolationType().trim().isEmpty()) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Violation type is required"));
            }

            if (v.getFineAmount() == null || v.getFineAmount() <= 0) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Fine amount must be greater than 0"));
            }

            v.setStatus("UNPAID");
            Violation saved = repo.save(v);
            System.out.println("Violation saved successfully with ID: " + saved.getId());

            // AUTOMATICALLY CREATE CHALLAN
            com.traffic.entity.Challan challan = new com.traffic.entity.Challan(
                    saved.getId(),
                    saved.getVehicleNumber(),
                    saved.getFineAmount(),
                    "UNPAID");
            challanRepo.save(challan);
            System.out.println("Associated challan created successfully for violation ID: " + saved.getId());

            messagingTemplate.convertAndSend("/topic/violations", saved);
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error creating violation: " + e.getMessage());
            e.printStackTrace();
            return org.springframework.http.ResponseEntity.status(500)
                    .body(java.util.Map.of("message", "Failed to create violation: " + e.getMessage()));
        }
    }

    @GetMapping("/{vehicleNo}")
    public List<Violation> getViolationsByVehicle(@PathVariable("vehicleNo") String vehicleNo) {
        System.out.println("Searching violations for vehicle: " + vehicleNo);
        List<Violation> list = repo.findByVehicleNumber(vehicleNo);
        System.out.println("Found " + list.size() + " violations");
        return list;
    }

    @GetMapping("/recent")
    public List<Violation> getRecent() {
        return repo.findAll().stream()
                .sorted((v1, v2) -> v2.getId().compareTo(v1.getId()))
                .limit(5)
                .toList();
    }
}
