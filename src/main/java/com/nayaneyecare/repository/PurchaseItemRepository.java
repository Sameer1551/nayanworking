package com.nayaneyecare.repository;

import com.nayaneyecare.entity.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

    List<PurchaseItem> findByBulkPurchaseIdAndUniqueKey(Long bulkPurchaseId, String uniqueKey);

    List<PurchaseItem> findByProductCodeAndUniqueKey(String productCode, String uniqueKey);

    @Query("SELECT pi FROM PurchaseItem pi WHERE pi.bulkPurchase.id = :bulkPurchaseId AND pi.uniqueKey = :uniqueKey")
    List<PurchaseItem> findByBulkPurchaseId(@Param("bulkPurchaseId") Long bulkPurchaseId, @Param("uniqueKey") String uniqueKey);

    // Row-level isolation: find all by unique key
    List<PurchaseItem> findAllByUniqueKey(String uniqueKey);
}
