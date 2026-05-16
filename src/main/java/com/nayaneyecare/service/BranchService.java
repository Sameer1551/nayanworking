package com.nayaneyecare.service;

import com.nayaneyecare.entity.Branch;
import com.nayaneyecare.repository.BranchRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BranchService {

    @Autowired
    private BranchRepository branchRepository;

    /**
     * Get all active branches
     */
    public List<Branch> getAllActiveBranches() {
        if (SecurityUtils.isAdmin()) {
            return branchRepository.findAll().stream().filter(Branch::isActive).toList();
        }
        return branchRepository.findActiveBranches(SecurityUtils.getCurrentSupplierKey());
    }

    /**
     * Get all branches (including inactive)
     */
    public List<Branch> getAllBranches() {
        if (SecurityUtils.isAdmin()) return branchRepository.findAll();
        return branchRepository.findAllByUniqueKey(SecurityUtils.getCurrentSupplierKey());
    }

    /**
     * Get branch by ID
     */
    public Optional<Branch> getBranchById(Long id) {
        if (SecurityUtils.isAdmin()) return branchRepository.findById(id);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return branchRepository.findById(id).filter(b -> uniqueKey.equals(b.getUniqueKey()));
    }

    /**
     * Get branch by code
     */
    public Optional<Branch> findByCode(String code) {
        if (SecurityUtils.isAdmin()) {
            return branchRepository.findAll().stream().filter(b -> code.equals(b.getCode())).findFirst();
        }
        return branchRepository.findByCodeAndUniqueKey(code, SecurityUtils.getCurrentSupplierKey());
    }

    /**
     * Create a new branch
     */
    @Transactional
    public Branch createBranch(Branch branch) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        if (!SecurityUtils.isAdmin() && branchRepository.existsByCodeAndUniqueKey(branch.getCode(), uniqueKey)) {
            throw new RuntimeException("Branch code already exists: " + branch.getCode());
        }
        if (!SecurityUtils.isAdmin() && branchRepository.existsByNameAndUniqueKey(branch.getName(), uniqueKey)) {
            throw new RuntimeException("Branch name already exists: " + branch.getName());
        }
        branch.setUniqueKey(uniqueKey);
        branch.setIsActive(true);
        return branchRepository.save(branch);
    }

    /**
     * Update an existing branch
     */
    @Transactional
    public Branch updateBranch(Long id, Branch branchDetails) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Branch branch = branchRepository.findById(id)
                .filter(b -> SecurityUtils.isAdmin() || uniqueKey.equals(b.getUniqueKey()))
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));

        // Check for duplicate code (excluding current branch)
        if (!SecurityUtils.isAdmin() && !branch.getCode().equals(branchDetails.getCode()) &&
            branchRepository.existsByCodeAndUniqueKey(branchDetails.getCode(), uniqueKey)) {
            throw new RuntimeException("Branch code already exists: " + branchDetails.getCode());
        }

        // Check for duplicate name (excluding current branch)
        if (!SecurityUtils.isAdmin() && !branch.getName().equals(branchDetails.getName()) &&
            branchRepository.existsByNameAndUniqueKey(branchDetails.getName(), uniqueKey)) {
            throw new RuntimeException("Branch name already exists: " + branchDetails.getName());
        }

        branch.setName(branchDetails.getName());
        branch.setCode(branchDetails.getCode());
        branch.setAddress(branchDetails.getAddress());
        if (branchDetails.getIsActive() != null) {
            branch.setIsActive(branchDetails.getIsActive());
        }

        return branchRepository.save(branch);
    }

    /**
     * Soft delete a branch (set isActive to false)
     */
    @Transactional
    public void deleteBranch(Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Branch branch = branchRepository.findById(id)
                .filter(b -> SecurityUtils.isAdmin() || uniqueKey.equals(b.getUniqueKey()))
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + id));
        branch.setIsActive(false);
        branchRepository.save(branch);
    }

    /**
     * Seed initial branches if none exist
     */
    @Transactional
    public void seedInitialBranches() {
        // When using supplier isolation, seeding initial universal branches doesn't make much sense anymore
        // However, if we need a default branch per supplier, that should be done at User registration.
    }
}