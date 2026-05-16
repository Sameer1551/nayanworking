package com.nayaneyecare.controller;

import com.nayaneyecare.entity.Branch;
import com.nayaneyecare.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@CrossOrigin(origins = "*")
public class BranchController {

    @Autowired
    private BranchService branchService;

    /**
     * Get all active branches
     */
    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        List<Branch> branches = branchService.getAllActiveBranches();
        return ResponseEntity.ok(branches);
    }

    /**
     * Get all branches including inactive (for admin management)
     */
    @GetMapping("/all")
    public ResponseEntity<List<Branch>> getAllBranchesIncludingInactive() {
        List<Branch> branches = branchService.getAllBranches();
        return ResponseEntity.ok(branches);
    }

    /**
     * Get branch by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        return branchService.getBranchById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new branch
     */
    @PostMapping
    public ResponseEntity<Branch> createBranch(@Valid @RequestBody Branch branch) {
        try {
            Branch created = branchService.createBranch(branch);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing branch
     */
    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id, @Valid @RequestBody Branch branch) {
        try {
            Branch updated = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a branch (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBranch(@PathVariable Long id) {
        try {
            branchService.deleteBranch(id);
            return ResponseEntity.ok("Branch deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Seed initial branches (can be called once to populate database)
     */
    @PostMapping("/seed")
    public ResponseEntity<String> seedBranches() {
        branchService.seedInitialBranches();
        return ResponseEntity.ok("Branches seeded successfully");
    }
}