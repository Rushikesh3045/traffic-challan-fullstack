package com.traffic.repository;

import com.traffic.entity.Challan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChallanRepository extends JpaRepository<Challan, Long> {
    Optional<Challan> findById(Long id);

    Optional<Challan> findByViolationId(Long violationId);
}
