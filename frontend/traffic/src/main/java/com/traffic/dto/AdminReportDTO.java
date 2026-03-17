package com.traffic.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminReportDTO {
    private long totalViolations;
    private long paidChallans;
    private long unpaidChallans;
    private long pendingAppeals;
    private double totalCollection;

    private java.util.List<java.util.Map<String, Object>> monthlyStats;
    private java.util.List<java.util.Map<String, Object>> violationStats;
}
