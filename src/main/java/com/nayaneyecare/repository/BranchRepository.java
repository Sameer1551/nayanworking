package com.nayaneyecare.repository;

import com.nayaneyecare.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByCode(String code);

    Optional<Branch> findByCodeAndUniqueKey(String code, String uniqueKey);

    List<Branch> findByNameContainingIgnoreCaseAndUniqueKey(String name, String uniqueKey);

    @Query("SELECT b FROM Branch b WHERE b.uniqueKey = :uniqueKey ORDER BY b.name ASC")
    List<Branch> findAllOrderByName(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT b FROM Branch b WHERE b.isActive = true AND b.uniqueKey = :uniqueKey ORDER BY b.name ASC")
    List<Branch> findActiveBranches(@Param("uniqueKey") String uniqueKey);

    boolean existsByCodeAndUniqueKey(String code, String uniqueKey);

    boolean existsByNameAndUniqueKey(String name, String uniqueKey);

    // Row-level isolation: find all by unique key
    List<Branch> findAllByUniqueKey(String uniqueKey);
}
