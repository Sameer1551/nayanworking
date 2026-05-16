package com.nayaneyecare.repository;

import com.nayaneyecare.entity.LoginHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PHASE 6: Login Tracking.
 */
@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    /**
     * Find the most recent logins for a user.
     * Use Pageable(limit=1) to get the last login.
     */
    List<LoginHistory> findByUserEmailOrderByLoginTimeDesc(String userEmail, Pageable pageable);
}
