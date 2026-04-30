package com.pharmadesk.backend.controller;

import com.pharmadesk.backend.model.ActivityLog;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.repository.ActivityLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/activity-log")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogController(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityLog>>> getLogsByUserId(
            @RequestParam Long userId,
            @RequestParam(required = false) String date) {
        
        List<ActivityLog> logs;
        if (date != null && date.equals("today")) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDateTime.now();
            logs = activityLogRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(userId, startOfDay, endOfDay);
        } else {
            logs = activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        
        return ResponseEntity.ok(ApiResponse.success(logs, "Activity logs fetched"));
    }
}
