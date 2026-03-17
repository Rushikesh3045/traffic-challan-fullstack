package com.traffic.repository;

import com.traffic.entity.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ViolationRepository extends JpaRepository<Violation, Long> {

    List<Violation> findByVehicleNumber(
            @org.springframework.data.repository.query.Param("vehicleNumber") String vehicleNumber);

    long countByStatus(String status);

    @Query("SELECT SUM(v.fineAmount) FROM Violation v WHERE v.status = 'PAID'")
    Double sumPaidFines();

    // 📊 Admin Dashboard Query
    @Query("SELECT COUNT(v) FROM Violation v")
    long totalViolations();

    // 📊 Admin Charts Data
    @Query(value = "SELECT violation_type as name, COUNT(*) as count FROM violation GROUP BY violation_type", nativeQuery = true)
    List<java.util.Map<String, Object>> getViolationTypeStats();

    @Query(value = "SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as violations, COALESCE(SUM(CASE WHEN status='PAID' THEN fine_amount ELSE 0 END), 0) as collection FROM violation WHERE created_at IS NOT NULL GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at) ORDER BY EXTRACT(MONTH FROM created_at)", nativeQuery = true)
    List<java.util.Map<String, Object>> getMonthlyStats();
}
