package com.traffic.service;

import com.traffic.entity.Challan;
import com.traffic.entity.Violation;
import com.traffic.repository.ChallanRepository;
import com.traffic.repository.ViolationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class LateFeeScheduler {

    @Autowired
    private ViolationRepository violationRepo;

    @Autowired
    private ChallanRepository challanRepo;

    // Runs every 24 hours (86400000 ms), starting 10 seconds after application
    // startup
    @Scheduled(fixedRate = 86400000, initialDelay = 10000)
    @Transactional
    public void applyAutomaticLateFees() {
        System.out.println("Running Automatic Late Fee Scheduler...");
        List<Violation> violations = violationRepo.findAll();
        LocalDateTime now = LocalDateTime.now();
        int affectedCount = 0;

        for (Violation v : violations) {
            if ("UNPAID".equals(v.getStatus())) {
                LocalDateTime issuedAt = v.getCreatedAt();
                // Ensure the violation has an issue date
                if (issuedAt != null) {
                    long daysBetween = ChronoUnit.DAYS.between(issuedAt, now);
                    // Check if 15 days have passed since issue
                    if (daysBetween > 15) {
                        String existingDesc = v.getDescription();
                        String feeMsg = "Auto Late fee of 10% applied (Past 15 days).";

                        // Apply late fee only if it hasn't been applied yet
                        if (existingDesc == null || !existingDesc.contains("Auto Late fee of 10% applied")) {
                            System.out.println("Applying 10% automatic late fee to UNPAID violation ID: "
                                    + v.getId() + ", Vehicle: " + v.getVehicleNumber());

                            double newFine = v.getFineAmount() * 1.10; // 10% penalty
                            v.setFineAmount(Math.round(newFine * 100.0) / 100.0);

                            v.setDescription(existingDesc == null || existingDesc.isEmpty() ? feeMsg
                                    : existingDesc + " | " + feeMsg);

                            violationRepo.save(v);

                            // Update corresponding Challan amount too
                            Optional<Challan> cOpt = challanRepo.findByViolationId(v.getId());
                            if (cOpt.isPresent()) {
                                Challan c = cOpt.get();
                                c.setAmount(v.getFineAmount());
                                challanRepo.save(c);
                            }

                            affectedCount++;
                        }
                    }
                }
            }
        }

        System.out.println("Late Fee Scheduler finished. Affected violations: " + affectedCount);
    }
}
