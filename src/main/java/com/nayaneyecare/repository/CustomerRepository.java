package com.nayaneyecare.repository;

import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.entity.User;
import com.nayaneyecare.entity.UserType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByMobileNo(String mobileNo);

    Optional<Customer> findByMobileNoAndUniqueKey(String mobileNo, String uniqueKey);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByEmailAndUniqueKey(String email, String uniqueKey);

    boolean existsByMobileNo(String mobileNo);

    boolean existsByEmail(String email);

    List<Customer> findByBranchName(String branchName);

    List<Customer> findByBranchNameAndUniqueKey(String branchName, String uniqueKey);

    List<Customer> findByBranchCodeAndUniqueKey(String branchCode, String uniqueKey);

    @Query("SELECT c FROM Customer c WHERE (c.fullName LIKE %:searchTerm% OR c.mobileNo LIKE %:searchTerm% OR c.email LIKE %:searchTerm%) AND c.uniqueKey = :uniqueKey")
    List<Customer> findBySearchTerm(@Param("searchTerm") String searchTerm, @Param("uniqueKey") String uniqueKey);

    @Query("SELECT c FROM Customer c WHERE c.visitCount > 0 AND c.uniqueKey = :uniqueKey ORDER BY c.visitCount DESC")
    List<Customer> findTopCustomersByVisitCount(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT c FROM Customer c WHERE c.totalSpent > 0 AND c.uniqueKey = :uniqueKey ORDER BY c.totalSpent DESC")
    List<Customer> findTopCustomersByTotalSpent(@Param("uniqueKey") String uniqueKey);

    @Query("SELECT c FROM Customer c WHERE c.dateOfVisit >= :startDate AND c.dateOfVisit <= :endDate AND c.uniqueKey = :uniqueKey")
    List<Customer> findByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate, @Param("uniqueKey") String uniqueKey);

    // Row-level isolation: find all by unique key
    List<Customer> findAllByUniqueKey(String uniqueKey);

    // Check existence with unique key
    boolean existsByMobileNoAndUniqueKey(String mobileNo, String uniqueKey);

    boolean existsByEmailAndUniqueKey(String email, String uniqueKey);

    // Global access methods (for ADMIN bypass)
    @Query("SELECT c FROM Customer c")
    List<Customer> queryAllGlobal();

    @Query("SELECT c FROM Customer c WHERE c.visitCount > 0 ORDER BY c.visitCount DESC")
    List<Customer> findTopCustomersByVisitCountGlobal();

    @Query("SELECT c FROM Customer c WHERE c.totalSpent > 0 ORDER BY c.totalSpent DESC")
    List<Customer> findTopCustomersByTotalSpentGlobal();

    @Query("SELECT c FROM Customer c WHERE c.dateOfVisit >= :startDate AND c.dateOfVisit <= :endDate")
    List<Customer> findByDateRangeGlobal(@Param("startDate") String startDate, @Param("endDate") String endDate);
}
