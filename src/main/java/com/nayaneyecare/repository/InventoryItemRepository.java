package com.nayaneyecare.repository;

import com.nayaneyecare.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findByProductCode(String productCode);

    Optional<InventoryItem> findByProductCodeAndUniqueKey(String productCode, String uniqueKey);

    List<InventoryItem> findByCategoryAndUniqueKey(String category, String uniqueKey);

    List<InventoryItem> findBySubcategoryAndUniqueKey(String subcategory, String uniqueKey);

    List<InventoryItem> findBySupplierNameAndUniqueKey(String supplierName, String uniqueKey);

    @Query("SELECT i FROM InventoryItem i WHERE (i.productName LIKE %:searchTerm% OR i.productCode LIKE %:searchTerm% OR i.description LIKE %:searchTerm%) AND (:uniqueKey IS NULL OR i.uniqueKey = :uniqueKey)")
    List<InventoryItem> findBySearchTerm(@Param("searchTerm") String searchTerm, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT i FROM InventoryItem i WHERE i.quantity <= i.reorderPoint AND (:uniqueKey IS NULL OR i.uniqueKey = :uniqueKey)")
    List<InventoryItem> findLowStockItems(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT i FROM InventoryItem i WHERE i.quantity = 0 AND (:uniqueKey IS NULL OR i.uniqueKey = :uniqueKey)")
    List<InventoryItem> findOutOfStockItems(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT i FROM InventoryItem i WHERE i.quantity > 0 AND (:uniqueKey IS NULL OR i.uniqueKey = :uniqueKey) ORDER BY i.quantity ASC")
    List<InventoryItem> findItemsByStockLevel(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT i FROM InventoryItem i WHERE i.expiryDate IS NOT NULL AND i.expiryDate <= :expiryDate AND (:uniqueKey IS NULL OR i.uniqueKey = :uniqueKey)")
    List<InventoryItem> findExpiringItems(@Param("expiryDate") String expiryDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT i FROM InventoryItem i WHERE i.quantity > 0 AND i.quantity <= i.minimumStock AND (:uniqueKey IS NULL OR i.uniqueKey = :uniqueKey)")
    List<InventoryItem> findItemsNeedingReorder(@Param("uniqueKey") String uniqueKey);

    // Row-level isolation: find all by unique key
    List<InventoryItem> findAllByUniqueKey(String uniqueKey);

    // Check existence with unique key
    boolean existsByProductCodeAndUniqueKey(String productCode, String uniqueKey);
}
