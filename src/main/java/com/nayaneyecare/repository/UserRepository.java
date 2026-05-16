package com.nayaneyecare.repository;

import com.nayaneyecare.entity.User;
import com.nayaneyecare.entity.UserType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByGstNumber(String gstNumber);

    Optional<User> findByEmailAndUserType(String email, UserType userType);

    Optional<User> findByPhoneAndUserType(String phone, UserType userType);

    boolean existsByEmailAndUserType(String email, UserType userType);

    boolean existsByPhoneAndUserType(String phone, UserType userType);

    // Unique supplier key queries for row-level isolation
    Optional<User> findByUniqueSupplierKey(String uniqueSupplierKey);

    boolean existsByUniqueSupplierKey(String uniqueSupplierKey);

    List<User> findAllByUserType(UserType userType);
} 