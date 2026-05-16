package com.nayaneyecare.service;

import com.nayaneyecare.entity.LoginHistory;
import com.nayaneyecare.repository.LoginHistoryRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * PHASE 6: Login Tracking & "Wow" UI Features.
 */
@Service
public class LoginHistoryService {

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    /**
     * Extracts IP and User-Agent from the request and saves the login history.
     */
    public void recordLogin(String email, HttpServletRequest request) {
        if (request == null) return;

        String ipAddress = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        String deviceInfo = parseDeviceInfo(userAgent);
        
        // In a real app, you'd use a GeoIP library (like MaxMind) to resolve IP to location.
        // For Phase 6 "Wow" effect, we use a placeholder that can be hooked up later.
        String location = resolveLocation(ipAddress);

        LoginHistory history = new LoginHistory(email, ipAddress, userAgent, deviceInfo, location);
        loginHistoryRepository.save(history);
    }

    /**
     * Returns a formatted string for the UI widget, e.g.,
     * "Last login: Gujarat, India (Chrome) - 2 hours ago"
     */
    public String getLastLoginDetails(String email) {
        // We fetch the top 2. The first one (index 0) is the *current* login that just happened.
        // The second one (index 1) is the *previous* login we want to show.
        List<LoginHistory> historyList = loginHistoryRepository.findByUserEmailOrderByLoginTimeDesc(email, PageRequest.of(0, 2));

        if (historyList.size() < 2) {
            return "This is your first time logging in!";
        }

        LoginHistory lastLogin = historyList.get(1);
        String timeAgo = formatTimeAgo(lastLogin.getLoginTime());
        
        return String.format("Last login: %s (%s) - %s", 
                lastLogin.getLocation(), 
                lastLogin.getDeviceInfo(), 
                timeAgo);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    /**
     * Extremely basic User-Agent parser for the "Wow" UI feature.
     */
    private String parseDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isEmpty()) return "Unknown Device";
        
        String browser = "Unknown Browser";
        String os = "Unknown OS";

        if (userAgent.contains("Edg/")) browser = "Edge";
        else if (userAgent.contains("Chrome/")) browser = "Chrome";
        else if (userAgent.contains("Firefox/")) browser = "Firefox";
        else if (userAgent.contains("Safari/") && !userAgent.contains("Chrome")) browser = "Safari";

        if (userAgent.contains("Windows")) os = "Windows";
        else if (userAgent.contains("Mac OS X")) os = "MacOS";
        else if (userAgent.contains("Linux")) os = "Linux";
        else if (userAgent.contains("Android")) os = "Android";
        else if (userAgent.contains("iPhone") || userAgent.contains("iPad")) os = "iOS";

        return browser + " on " + os;
    }

    /**
     * Placeholder for GeoIP lookup.
     */
    private String resolveLocation(String ip) {
        if (ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return "Local Network";
        }
        // Hook up MaxMind GeoIP here later
        return "Unknown Location";
    }

    private String formatTimeAgo(LocalDateTime pastTime) {
        Duration duration = Duration.between(pastTime, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60) return "just now";
        if (seconds < 3600) return (seconds / 60) + " minutes ago";
        if (seconds < 86400) return (seconds / 3600) + " hours ago";
        return (seconds / 86400) + " days ago";
    }
}
