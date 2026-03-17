package com.traffic.repository;

import com.traffic.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppealRepository extends JpaRepository<Appeal, Long> {
    Optional<Appeal> findById(Long id);

    long countByStatus(String status);
}
