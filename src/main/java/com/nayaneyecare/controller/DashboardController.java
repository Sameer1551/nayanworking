package com.nayaneyecare.controller;

import com.nayaneyecare.dto.DashboardData;
import com.nayaneyecare.dto.ErrorResponse;
import com.nayaneyecare.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public CompletableFuture<ResponseEntity<?>> getDashboardData(
            @RequestParam(required = false, defaultValue = "monthly") String timeFilter,
            @RequestParam(required = false) Integer year) {
        String uniqueKey = com.nayaneyecare.util.SecurityUtils.getSupplierKeyForQuery();
        int selectedYear = year != null ? year : java.time.LocalDate.now().getYear();
        return dashboardService.getDashboardData(timeFilter, selectedYear, uniqueKey)
                .<ResponseEntity<?>>thenApply(ResponseEntity::ok)
                .exceptionally(e -> ResponseEntity.internalServerError()
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to load dashboard data")));
    }

    @GetMapping("/summary")
    public CompletableFuture<ResponseEntity<?>> getSummaryStats(
            @RequestParam(required = false, defaultValue = "monthly") String timeFilter,
            @RequestParam(required = false) Integer year) {
        String uniqueKey = com.nayaneyecare.util.SecurityUtils.getSupplierKeyForQuery();
        int selectedYear = year != null ? year : java.time.LocalDate.now().getYear();
        return dashboardService.getSummaryStats(timeFilter, selectedYear, uniqueKey)
                .<ResponseEntity<?>>thenApply(ResponseEntity::ok)
                .exceptionally(e -> ResponseEntity.internalServerError()
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to load dashboard summary")));
    }

    @GetMapping("/category-breakdown")
    public CompletableFuture<ResponseEntity<?>> getCategoryBreakdown(
            @RequestParam(required = false, defaultValue = "monthly") String timeFilter,
            @RequestParam(required = false) Integer year) {
        String uniqueKey = com.nayaneyecare.util.SecurityUtils.getSupplierKeyForQuery();
        int selectedYear = year != null ? year : java.time.LocalDate.now().getYear();
        return dashboardService.getCategoryBreakdown(timeFilter, selectedYear, uniqueKey)
                .<ResponseEntity<?>>thenApply(ResponseEntity::ok)
                .exceptionally(e -> ResponseEntity.internalServerError()
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to load category breakdown")));
    }

    @GetMapping("/branch-performance")
    public CompletableFuture<ResponseEntity<?>> getBranchPerformance(
            @RequestParam(required = false, defaultValue = "monthly") String timeFilter,
            @RequestParam(required = false) Integer year) {
        String uniqueKey = com.nayaneyecare.util.SecurityUtils.getSupplierKeyForQuery();
        int selectedYear = year != null ? year : java.time.LocalDate.now().getYear();
        return dashboardService.getBranchPerformance(timeFilter, selectedYear, uniqueKey)
                .<ResponseEntity<?>>thenApply(ResponseEntity::ok)
                .exceptionally(e -> ResponseEntity.internalServerError()
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to load branch performance")));
    }

    @GetMapping("/recent-activity")
    public CompletableFuture<ResponseEntity<?>> getRecentActivity(
            @RequestParam(required = false, defaultValue = "monthly") String timeFilter,
            @RequestParam(required = false) Integer year) {
        String uniqueKey = com.nayaneyecare.util.SecurityUtils.getSupplierKeyForQuery();
        int selectedYear = year != null ? year : java.time.LocalDate.now().getYear();
        return dashboardService.getRecentActivity(timeFilter, selectedYear, uniqueKey)
                .<ResponseEntity<?>>thenApply(ResponseEntity::ok)
                .exceptionally(e -> ResponseEntity.internalServerError()
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to load recent activity")));
    }
}
