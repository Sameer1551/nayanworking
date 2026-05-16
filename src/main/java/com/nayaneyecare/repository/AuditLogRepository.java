package com.nayaneyecare.repository;

import com.nayaneyecare.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * PHASE 3: Repository for the tamper-evident audit log.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Fetch the most recent entry — needed to get the previous hash
     * before writing the next link in the chain.
     */
    @Query("SELECT a FROM AuditLog a ORDER BY a.id DESC LIMIT 1")
    Optional<AuditLog> findLatestEntry();

    /**
     * Fetch all entries in strict chronological order for chain verification.
     */
    @Query("SELECT a FROM AuditLog a ORDER BY a.id ASC")
    List<AuditLog> findAllOrdered();

    /** Paginated access for the Admin audit log UI panel. */
    Page<AuditLog> findAllByOrderByIdDesc(Pageable pageable);

    /** Filter by user for user-specific login history. */
    List<AuditLog> findByUserEmailOrderByIdDesc(String userEmail);
}
