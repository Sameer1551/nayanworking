package com.nayaneyecare.repository;

import com.nayaneyecare.entity.PurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {

    Optional<PurchaseReturn> findByReturnNumber(String returnNumber);

    Optional<PurchaseReturn> findByReturnNumberAndUniqueKey(String returnNumber, String uniqueKey);

    List<PurchaseReturn> findByOriginalPurchaseBillNoAndUniqueKey(String originalPurchaseBillNo, String uniqueKey);

    List<PurchaseReturn> findByReturnDateBetweenAndUniqueKey(LocalDate startDate, LocalDate endDate, String uniqueKey);

    List<PurchaseReturn> findBySupplierNameContainingIgnoreCaseAndUniqueKey(String supplierName, String uniqueKey);

    List<PurchaseReturn> findByBranchNameAndUniqueKey(String branchName, String uniqueKey);

    List<PurchaseReturn> findByProductCodeAndUniqueKey(String productCode, String uniqueKey);

    @Query("SELECT pr FROM PurchaseReturn pr WHERE pr.returnDate >= :startDate AND pr.returnDate <= :endDate AND pr.uniqueKey = :uniqueKey")
    List<PurchaseReturn> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT SUM(pr.totalAmount) FROM PurchaseReturn pr WHERE pr.returnDate >= :startDate AND pr.returnDate <= :endDate AND pr.uniqueKey = :uniqueKey")
    BigDecimal getTotalReturnValueForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT COUNT(pr) FROM PurchaseReturn pr WHERE pr.returnDate >= :startDate AND pr.returnDate <= :endDate AND pr.uniqueKey = :uniqueKey")
    Long getTotalReturnsForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT COALESCE(SUM(pr.returnQuantity), 0) FROM PurchaseReturn pr " +
           "WHERE pr.sourceRecordType = :sourceRecordType AND pr.sourceRecordId = :sourceRecordId " +
           "AND pr.uniqueKey = :uniqueKey AND (:excludeId IS NULL OR pr.id <> :excludeId)")
    Long getReturnedQuantityForSource(
            @Param("sourceRecordType") String sourceRecordType,
            @Param("sourceRecordId") Long sourceRecordId,
            @Param("uniqueKey") String uniqueKey,
            @Param("excludeId") Long excludeId
    );

    @Query("SELECT COALESCE(SUM(pr.returnQuantity), 0) FROM PurchaseReturn pr " +
           "WHERE pr.originalPurchaseBillNo = :billNumber AND pr.productCode = :productCode " +
           "AND pr.uniqueKey = :uniqueKey AND (:excludeId IS NULL OR pr.id <> :excludeId)")
    Long getReturnedQuantityForBillAndProduct(
            @Param("billNumber") String billNumber,
            @Param("productCode") String productCode,
            @Param("uniqueKey") String uniqueKey,
            @Param("excludeId") Long excludeId
    );

    // Row-level isolation: find all by unique key
    List<PurchaseReturn> findAllByUniqueKey(String uniqueKey);

    @Query("SELECT pr FROM PurchaseReturn pr WHERE pr.uniqueKey = :uniqueKey ORDER BY pr.returnDate DESC")
    List<PurchaseReturn> findAllByOrderByReturnDateDesc(@Param("uniqueKey") String uniqueKey);
}