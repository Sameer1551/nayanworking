package com.nayaneyecare.repository;

import com.nayaneyecare.entity.BulkPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BulkPurchaseRepository extends JpaRepository<BulkPurchase, Long> {

    Optional<BulkPurchase> findByPurchaseBillNo(String purchaseBillNo);

    Optional<BulkPurchase> findByPurchaseBillNoAndUniqueKey(String purchaseBillNo, String uniqueKey);

    List<BulkPurchase> findByPurchaseDateBetweenAndUniqueKey(LocalDate startDate, LocalDate endDate, String uniqueKey);

    List<BulkPurchase> findBySupplierNameContainingIgnoreCaseAndUniqueKey(String supplierName, String uniqueKey);

    List<BulkPurchase> findByBranchAndUniqueKey(String branch, String uniqueKey);

    @Query("SELECT bp FROM BulkPurchase bp WHERE " +
           "(:dateFrom IS NULL OR bp.purchaseDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR bp.purchaseDate <= :dateTo) AND " +
           "(:supplierName IS NULL OR bp.supplierName LIKE %:supplierName%) AND " +
           "(:purchaseBillNo IS NULL OR bp.purchaseBillNo LIKE %:purchaseBillNo%) AND " +
           "(:branch IS NULL OR bp.branch LIKE %:branch%) AND " +
           "(:uniqueKey IS NULL OR bp.uniqueKey = :uniqueKey)")
    List<BulkPurchase> findWithFilters(
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("supplierName") String supplierName,
        @Param("purchaseBillNo") String purchaseBillNo,
        @Param("branch") String branch,
        @Param("uniqueKey") String uniqueKey
    );

    @Query("SELECT SUM(bp.totalBillAmount) FROM BulkPurchase bp WHERE bp.purchaseDate >= :startDate AND bp.purchaseDate <= :endDate AND bp.uniqueKey = :uniqueKey")
    BigDecimal getTotalPurchaseAmountForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT COUNT(bp) FROM BulkPurchase bp WHERE bp.purchaseDate >= :startDate AND bp.purchaseDate <= :endDate AND bp.uniqueKey = :uniqueKey")
    Long getTotalPurchaseBillsForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    boolean existsByPurchaseBillNoAndUniqueKey(String purchaseBillNo, String uniqueKey);

    boolean existsByPurchaseBillNo(String purchaseBillNo);

    // Row-level isolation: find all by unique key
    List<BulkPurchase> findAllByUniqueKey(String uniqueKey);

    @Query("SELECT DISTINCT bp FROM BulkPurchase bp LEFT JOIN FETCH bp.purchaseItems WHERE bp.uniqueKey = :uniqueKey ORDER BY bp.purchaseDate DESC")
    List<BulkPurchase> findAllWithPurchaseItems(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT bp FROM BulkPurchase bp WHERE bp.uniqueKey = :uniqueKey ORDER BY bp.purchaseDate DESC")
    List<BulkPurchase> findAllOrderByPurchaseDateDesc(@Param("uniqueKey") String uniqueKey);

    // Global access methods (for ADMIN bypass)
    @Query("SELECT DISTINCT bp FROM BulkPurchase bp LEFT JOIN FETCH bp.purchaseItems ORDER BY bp.purchaseDate DESC")
    List<BulkPurchase> findAllWithItems();
}