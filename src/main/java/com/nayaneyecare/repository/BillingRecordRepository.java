package com.nayaneyecare.repository;

import com.nayaneyecare.entity.BillingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingRecordRepository extends JpaRepository<BillingRecord, Long> {

    Optional<BillingRecord> findByBillNumber(String billNumber);

    List<BillingRecord> findByBillNumberAndUniqueKey(String billNumber, String uniqueKey);

    List<BillingRecord> findByBranchCodeAndUniqueKey(String branchCode, String uniqueKey);

    List<BillingRecord> findByBranchCodeAndUniqueKeyOrderByBillDateDescIdDesc(String branchCode, String uniqueKey);

    List<BillingRecord> findByBranchNameAndUniqueKey(String branchName, String uniqueKey);

    List<BillingRecord> findByCustomerContactAndUniqueKey(String customerContact, String uniqueKey);

    List<BillingRecord> findByCustomerNameContainingIgnoreCaseAndUniqueKey(String customerName, String uniqueKey);

    List<BillingRecord> findByBillDateBetweenAndUniqueKey(LocalDate startDate, LocalDate endDate, String uniqueKey);

    @Query("SELECT br FROM BillingRecord br WHERE br.billDate >= :startDate AND br.billDate <= :endDate AND br.uniqueKey = :uniqueKey")
    List<BillingRecord> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT br FROM BillingRecord br WHERE br.finalPayable >= :minAmount AND br.finalPayable <= :maxAmount AND br.uniqueKey = :uniqueKey")
    List<BillingRecord> findByAmountRange(@Param("minAmount") BigDecimal minAmount, @Param("maxAmount") BigDecimal maxAmount, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT br FROM BillingRecord br WHERE br.paymentStatus = :status AND br.uniqueKey = :uniqueKey")
    List<BillingRecord> findByPaymentStatus(@Param("status") String status, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT br FROM BillingRecord br WHERE br.customerContact = :mobileNo AND br.uniqueKey = :uniqueKey ORDER BY br.billDate DESC")
    List<BillingRecord> findCustomerBillingHistory(@Param("mobileNo") String mobileNo, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT SUM(br.finalPayable) FROM BillingRecord br WHERE br.billDate >= :startDate AND br.billDate <= :endDate AND br.uniqueKey = :uniqueKey")
    BigDecimal getTotalRevenueForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT COUNT(br) FROM BillingRecord br WHERE br.billDate >= :startDate AND br.billDate <= :endDate AND br.uniqueKey = :uniqueKey")
    Long getTotalBillsForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT DISTINCT br FROM BillingRecord br LEFT JOIN FETCH br.products WHERE br.billDate >= :startDate AND br.billDate <= :endDate AND br.uniqueKey = :uniqueKey ORDER BY br.billDate DESC")
    List<BillingRecord> findByYearWithProducts(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT DISTINCT br FROM BillingRecord br LEFT JOIN FETCH br.products WHERE br.uniqueKey = :uniqueKey ORDER BY br.billDate DESC")
    List<BillingRecord> findAllWithProducts(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT br FROM BillingRecord br WHERE br.uniqueKey = :uniqueKey ORDER BY br.billDate ASC, br.id ASC")
    List<BillingRecord> findAllOrderByBillDateAscIdAsc(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT DISTINCT br FROM BillingRecord br LEFT JOIN FETCH br.products WHERE br.billNumber = :billNumber AND br.uniqueKey = :uniqueKey")
    Optional<BillingRecord> findByBillNumberWithProducts(@Param("billNumber") String billNumber, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT DISTINCT br FROM BillingRecord br LEFT JOIN FETCH br.products WHERE br.billNumber = :billNumber")
    Optional<BillingRecord> findByBillNumberWithProductsGlobal(@Param("billNumber") String billNumber);

    // Row-level isolation: find all by unique key
    List<BillingRecord> findAllByUniqueKey(String uniqueKey);

    // Check existence by unique key
    boolean existsByBillNumberAndUniqueKey(String billNumber, String uniqueKey);

    // Global access methods (for ADMIN bypass)
    @Query("SELECT DISTINCT br FROM BillingRecord br LEFT JOIN FETCH br.products ORDER BY br.billDate DESC")
    List<BillingRecord> queryAllGlobalWithProducts();

    @Query("SELECT br FROM BillingRecord br ORDER BY br.billDate DESC")
    List<BillingRecord> queryAllGlobal();

    @Query("SELECT DISTINCT br FROM BillingRecord br LEFT JOIN FETCH br.products WHERE br.billDate >= :startDate AND br.billDate <= :endDate ORDER BY br.billDate DESC")
    List<BillingRecord> findByYearWithProductsGlobal(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(br.finalPayable) FROM BillingRecord br WHERE br.billDate >= :startDate AND br.billDate <= :endDate")
    BigDecimal getTotalRevenueForPeriodGlobal(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(br) FROM BillingRecord br WHERE br.billDate >= :startDate AND br.billDate <= :endDate")
    Long getTotalBillsForPeriodGlobal(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
