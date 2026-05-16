package com.nayaneyecare.repository;

import com.nayaneyecare.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Optional<Purchase> findByPurchaseBillNo(String purchaseBillNo);

    Optional<Purchase> findByPurchaseBillNoAndUniqueKey(String purchaseBillNo, String uniqueKey);

    List<Purchase> findByPurchaseDateBetweenAndUniqueKey(LocalDate startDate, LocalDate endDate, String uniqueKey);

    List<Purchase> findByMaterialNameContainingIgnoreCaseAndUniqueKey(String materialName, String uniqueKey);

    List<Purchase> findByProductDescriptionContainingIgnoreCaseAndUniqueKey(String description, String uniqueKey);

    List<Purchase> findByHsnContainingIgnoreCaseAndUniqueKey(String hsn, String uniqueKey);

    List<Purchase> findBySupplierNameContainingIgnoreCaseAndUniqueKey(String supplierName, String uniqueKey);

    List<Purchase> findByProductCodeContainingIgnoreCaseAndUniqueKey(String productCode, String uniqueKey);

    List<Purchase> findBySupplierAddressContainingIgnoreCaseAndUniqueKey(String address, String uniqueKey);

    List<Purchase> findByRemarksContainingIgnoreCaseAndUniqueKey(String remarks, String uniqueKey);

    List<Purchase> findByCategoryAndUniqueKey(Purchase.ProductCategory category, String uniqueKey);

    List<Purchase> findBySubcategoryAndUniqueKey(String subcategory, String uniqueKey);

    List<Purchase> findByBranchAndUniqueKey(String branch, String uniqueKey);

    @Query("SELECT p FROM Purchase p WHERE " +
           "(:dateFrom IS NULL OR p.purchaseDate >= :dateFrom) AND " +
           "(:dateTo IS NULL OR p.purchaseDate <= :dateTo) AND " +
           "(:productName IS NULL OR p.materialName LIKE %:productName% OR p.productDescription LIKE %:productName%) AND " +
           "(:hsn IS NULL OR p.hsn LIKE %:hsn%) AND " +
           "(:supplierName IS NULL OR p.supplierName LIKE %:supplierName%) AND " +
           "(:purchaseBillNo IS NULL OR p.purchaseBillNo LIKE %:purchaseBillNo%) AND " +
           "(:productCode IS NULL OR p.productCode LIKE %:productCode%) AND " +
           "(:branchName IS NULL OR p.branch LIKE %:branchName%) AND " +
           "(:importRef IS NULL OR p.remarks LIKE %:importRef% OR p.productCode LIKE %:importRef%) AND " +
           "(:uniqueKey IS NULL OR p.uniqueKey = :uniqueKey)")
    List<Purchase> findWithFilters(
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("productName") String productName,
        @Param("hsn") String hsn,
        @Param("supplierName") String supplierName,
        @Param("purchaseBillNo") String purchaseBillNo,
        @Param("productCode") String productCode,
        @Param("branchName") String branchName,
        @Param("importRef") String importRef,
        @Param("uniqueKey") String uniqueKey
    );

    boolean existsByPurchaseBillNoAndUniqueKey(String purchaseBillNo, String uniqueKey);

    boolean existsByPurchaseBillNo(String purchaseBillNo);

    // Row-level isolation: find all by unique key
    List<Purchase> findAllByUniqueKey(String uniqueKey);

    // Global access methods (for ADMIN bypass)
    @Query("SELECT p FROM Purchase p ORDER BY p.purchaseDate DESC")
    List<Purchase> queryAllGlobal();
}