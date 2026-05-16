package com.nayaneyecare.service;

import com.nayaneyecare.entity.SupplierData;
import com.nayaneyecare.entity.User;
import com.nayaneyecare.entity.UserType;
import com.nayaneyecare.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for managing supplier data — backed entirely by the MySQL {@code users} table.
 * <p>
 * The old {@code data/supplier.json} file is no longer used. All reads/writes
 * go through {@link UserRepository} filtered by {@link UserType#SUPPLIER}.
 */
@Service
public class SupplierFileService {

    private static final Logger logger = LoggerFactory.getLogger(SupplierFileService.class);
    private static final Pattern GST_PATTERN =
        Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // -------------------------------------------------------------------------
    // Query helpers — all delegate to MySQL users table
    // -------------------------------------------------------------------------

    /** Return all suppliers from MySQL as SupplierData DTOs. */
    public List<SupplierData> loadSuppliers() {
        return userRepository.findAll().stream()
                .filter(u -> UserType.SUPPLIER.equals(u.getUserType()))
                .map(this::toSupplierData)
                .collect(Collectors.toList());
    }

    public Optional<SupplierData> findByEmail(String email) {
        if (email == null || email.trim().isEmpty()) return Optional.empty();
        return userRepository.findByEmailAndUserType(email.trim().toLowerCase(), UserType.SUPPLIER)
                .map(this::toSupplierData);
    }

    public Optional<SupplierData> findByPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) return Optional.empty();
        return userRepository.findByPhoneAndUserType(phone.trim(), UserType.SUPPLIER)
                .map(this::toSupplierData);
    }

    public Optional<SupplierData> findByGstNumber(String gstNumber) {
        if (gstNumber == null || gstNumber.trim().isEmpty()) return Optional.empty();
        return userRepository.findAll().stream()
                .filter(u -> UserType.SUPPLIER.equals(u.getUserType()))
                .filter(u -> gstNumber.trim().equalsIgnoreCase(u.getGstNumber()))
                .findFirst()
                .map(this::toSupplierData);
    }

    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    public boolean existsByPhone(String phone) {
        return findByPhone(phone).isPresent();
    }

    public boolean existsByGstNumber(String gstNumber) {
        return findByGstNumber(gstNumber).isPresent();
    }

    public boolean isValidGstNumber(String gstNumber) {
        return gstNumber != null && GST_PATTERN.matcher(gstNumber).matches();
    }

    // -------------------------------------------------------------------------
    // Write helpers
    // -------------------------------------------------------------------------

    /**
     * Create a new supplier in MySQL (used where a separate ID is not pre-assigned).
     */
    public SupplierData createSupplier(String firstName, String lastName, String email,
            String phone, String plainPassword, String companyName, String gstNumber,
            String businessAddress) {
        return createSupplier(null, firstName, lastName, email, phone, plainPassword,
                companyName, gstNumber, businessAddress);
    }

    public SupplierData createSupplier(Long supplierId, String firstName, String lastName,
            String email, String phone, String plainPassword, String companyName,
            String gstNumber, String businessAddress) {

        User supplier = new User();
        if (supplierId != null) {
            supplier.setId(supplierId);
        }
        supplier.setFirstName(firstName.trim());
        supplier.setLastName(lastName.trim());
        supplier.setEmail(email.toLowerCase().trim());
        supplier.setPhone(phone != null ? phone.trim() : null);
        supplier.setPassword(passwordEncoder.encode(plainPassword));
        supplier.setUserType(UserType.SUPPLIER);
        supplier.setCompanyName(companyName.trim());
        supplier.setGstNumber(gstNumber.trim().toUpperCase());
        supplier.setBusinessAddress(businessAddress.trim());
        supplier.setIsActive(true);

        User saved = userRepository.save(supplier);
        logger.info("Created supplier in MySQL with id={} email={}", saved.getId(), saved.getEmail());
        return toSupplierData(saved);
    }

    /** No-op: saving is purely via JPA — kept for API compatibility. */
    public void saveSuppliers(List<SupplierData> suppliers) {
        logger.debug("saveSuppliers() called — no-op, MySQL is the store");
    }

    public void updateSupplier(SupplierData updatedSupplier) {
        userRepository.findById(updatedSupplier.getId()).ifPresent(user -> {
            user.setFirstName(updatedSupplier.getFirstName());
            user.setLastName(updatedSupplier.getLastName());
            user.setEmail(updatedSupplier.getEmail());
            user.setPhone(updatedSupplier.getPhone());
            user.setIsActive(updatedSupplier.isActive());
            userRepository.save(user);
        });
    }

    public void deactivateSupplier(Long supplierId) {
        userRepository.findById(supplierId).ifPresent(user -> {
            user.setIsActive(false);
            userRepository.save(user);
        });
    }

    /**
     * Verify password against stored hash.
     */
    public boolean verifyPassword(SupplierData supplier, String plainPassword) {
        return passwordEncoder.matches(plainPassword, supplier.getHashedPassword());
    }

    // -------------------------------------------------------------------------
    // Mapping helper
    // -------------------------------------------------------------------------

    private SupplierData toSupplierData(User user) {
        SupplierData sd = new SupplierData();
        sd.setId(user.getId());
        sd.setFirstName(user.getFirstName());
        sd.setLastName(user.getLastName());
        sd.setEmail(user.getEmail());
        sd.setPhone(user.getPhone());
        sd.setHashedPassword(user.getPassword());
        sd.setCompanyName(user.getCompanyName());
        sd.setGstNumber(user.getGstNumber());
        sd.setBusinessAddress(user.getBusinessAddress());
        sd.setActive(Boolean.TRUE.equals(user.getIsActive()));
        return sd;
    }
}
