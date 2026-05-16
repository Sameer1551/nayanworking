package com.nayaneyecare.controller;

import com.nayaneyecare.entity.Coupon;
import com.nayaneyecare.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validateCoupon(@PathVariable String code) {
        Optional<Coupon> coupon = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(code);
        if (coupon.isPresent()) {
            return ResponseEntity.ok(coupon.get());
        } else {
            return ResponseEntity.status(404).body("Invalid or expired coupon code.");
        }
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seedCoupons() {
        if (couponRepository.findByCodeIgnoreCaseAndIsActiveTrue("MyFirstSHOP15").isEmpty()) {
            Coupon coupon = new Coupon("MyFirstSHOP15", 15.0, true);
            couponRepository.save(coupon);
            return ResponseEntity.ok("Coupon seeded successfully.");
        }
        return ResponseEntity.ok("Coupon already exists.");
    }
}
