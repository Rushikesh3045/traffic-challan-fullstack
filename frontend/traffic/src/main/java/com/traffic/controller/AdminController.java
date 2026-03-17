package com.traffic.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.traffic.dto.AdminReportDTO;
import com.traffic.repository.AppealRepository;
import com.traffic.repository.ViolationRepository;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private ViolationRepository vRepo;

    @Autowired
    private AppealRepository appealRepo;

    @GetMapping("/dashboard")
    public AdminReportDTO dashboard() {
        AdminReportDTO dto = new AdminReportDTO();
        dto.setTotalViolations(vRepo.totalViolations());
        dto.setPaidChallans(vRepo.countByStatus("PAID"));
        dto.setUnpaidChallans(vRepo.countByStatus("UNPAID"));
        dto.setPendingAppeals(appealRepo.countByStatus("PENDING"));
        Double totalCollection = vRepo.sumPaidFines();
        dto.setTotalCollection(totalCollection != null ? totalCollection : 0.0);

        // Populate Charts Data
        dto.setMonthlyStats(vRepo.getMonthlyStats());
        dto.setViolationStats(vRepo.getViolationTypeStats());
        return dto;
    }

    @GetMapping("/recent-violations")
    public java.util.List<com.traffic.entity.Violation> recent() {
        return vRepo.findAll().stream()
                .sorted((v1, v2) -> v2.getId().compareTo(v1.getId()))
                .limit(5)
                .toList();
    }

    @org.springframework.web.bind.annotation.PostMapping("/add-late-fee/{id}")
    public org.springframework.http.ResponseEntity<?> addLateFee(
            @org.springframework.web.bind.annotation.PathVariable("id") Long id) {
        java.util.Optional<com.traffic.entity.Violation> opt = vRepo.findById(id);
        if (opt.isPresent()) {
            com.traffic.entity.Violation v = opt.get();
            if ("UNPAID".equals(v.getStatus())) {
                double newFine = v.getFineAmount() * 1.10; // 10% penalty
                v.setFineAmount(Math.round(newFine * 100.0) / 100.0);

                String existingDesc = v.getDescription();
                String feeMsg = "Late fee of 10% applied.";
                v.setDescription(
                        existingDesc == null || existingDesc.isEmpty() ? feeMsg : existingDesc + " | " + feeMsg);

                vRepo.save(v);
                return org.springframework.http.ResponseEntity.ok(v);
            }
            return org.springframework.http.ResponseEntity.badRequest()
                    .body("Only UNPAID challans can have a late fee added.");
        }
        return org.springframework.http.ResponseEntity.notFound().build();
    }
}
