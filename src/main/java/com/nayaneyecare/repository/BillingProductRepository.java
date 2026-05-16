package com.nayaneyecare.repository;

import com.nayaneyecare.entity.BillingProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillingProductRepository extends JpaRepository<BillingProduct, Long> {

    List<BillingProduct> findByBillingRecordIdAndUniqueKey(Long billingRecordId, String uniqueKey);

    List<BillingProduct> findByProductCodeAndUniqueKey(String productCode, String uniqueKey);

    Optional<BillingProduct> findByIdAndUniqueKey(Long id, String uniqueKey);

    @Query("SELECT bp FROM BillingProduct bp WHERE bp.billingRecord.id = :billingRecordId AND bp.uniqueKey = :uniqueKey")
    List<BillingProduct> findByBillingRecordId(@Param("billingRecordId") Long billingRecordId, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT bp FROM BillingProduct bp WHERE bp.uniqueKey = :uniqueKey ORDER BY bp.id DESC")
    List<BillingProduct> findAllOrderByIdDesc(@Param("uniqueKey") String uniqueKey);

    // Row-level isolation: find all by unique key
    List<BillingProduct> findAllByUniqueKey(String uniqueKey);
}
