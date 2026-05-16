package com.nayaneyecare.repository;

import com.nayaneyecare.entity.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {

    Optional<SalesReturn> findByReturnNumber(String returnNumber);

    Optional<SalesReturn> findByReturnNumberAndUniqueKey(String returnNumber, String uniqueKey);

    Optional<SalesReturn> findByBillNumberAndUniqueKey(String billNumber, String uniqueKey);

    List<SalesReturn> findByBranchNameAndUniqueKey(String branchName, String uniqueKey);

    @Query("SELECT DISTINCT sr FROM SalesReturn sr LEFT JOIN FETCH sr.items i WHERE i.productCode = :productCode AND sr.uniqueKey = :uniqueKey ORDER BY sr.returnDate DESC")
    List<SalesReturn> findByItemProductCode(@Param("productCode") String productCode, @Param("uniqueKey") String uniqueKey);

    List<SalesReturn> findByReturnDateBetweenAndUniqueKey(LocalDate startDate, LocalDate endDate, String uniqueKey);

    @Query("SELECT sr FROM SalesReturn sr WHERE sr.returnDate >= :startDate AND sr.returnDate <= :endDate AND sr.uniqueKey = :uniqueKey")
    List<SalesReturn> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT SUM(sr.totalReturnAmount) FROM SalesReturn sr WHERE sr.returnDate >= :startDate AND sr.returnDate <= :endDate AND sr.uniqueKey = :uniqueKey")
    BigDecimal getTotalReturnValueForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT COUNT(sr) FROM SalesReturn sr WHERE sr.returnDate >= :startDate AND sr.returnDate <= :endDate AND sr.uniqueKey = :uniqueKey")
    Long getTotalReturnsForPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("uniqueKey") String uniqueKey);

    // Row-level isolation: find all by unique key
    List<SalesReturn> findAllByUniqueKey(String uniqueKey);

    @Query("SELECT sr FROM SalesReturn sr LEFT JOIN FETCH sr.items WHERE sr.uniqueKey = :uniqueKey ORDER BY sr.returnDate DESC")
    List<SalesReturn> findAllWithItems(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT sr FROM SalesReturn sr LEFT JOIN FETCH sr.items ORDER BY sr.returnDate DESC")
    List<SalesReturn> queryAllGlobalWithItems();

    @Query("SELECT sr FROM SalesReturn sr WHERE sr.uniqueKey = :uniqueKey ORDER BY sr.returnDate DESC")
    List<SalesReturn> findAllOrderByReturnDateDesc(@Param("uniqueKey") String uniqueKey);
}