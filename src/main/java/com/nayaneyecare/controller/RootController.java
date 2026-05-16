package com.nayaneyecare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Nayan Eye Care Backend API is running.");
        response.put("frontendUrl", "http://localhost:5173");
        response.put("info", "Please access the frontend application using the URL above. This backend server only provides API endpoints.");
        return ResponseEntity.ok(response);
    }
}
