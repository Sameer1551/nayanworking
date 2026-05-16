package com.nayaneyecare.repository;

import com.nayaneyecare.entity.SalesReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesReturnItemRepository extends JpaRepository<SalesReturnItem, Long> {

    List<SalesReturnItem> findBySalesReturnIdAndUniqueKey(Long salesReturnId, String uniqueKey);

    List<SalesReturnItem> findByProductCodeAndUniqueKey(String productCode, String uniqueKey);

    @Query("SELECT sri FROM SalesReturnItem sri WHERE sri.salesReturn.id = :salesReturnId AND sri.uniqueKey = :uniqueKey")
    List<SalesReturnItem> findBySalesReturnId(@Param("salesReturnId") Long salesReturnId, @Param("uniqueKey") String uniqueKey);

    // Row-level isolation: find all by unique key
    List<SalesReturnItem> findAllByUniqueKey(String uniqueKey);
}
