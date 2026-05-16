# Super Admin Implementation Documentation

## Overview
This document describes the implementation of the Super Admin role with hidden trigger, dual-password authentication, and global data bypass.

## Changes Made

### 1. Backend - UserType Enum
**File:** `src/main/java/com/nayaneyecare/entity/UserType.java` (line 3-7)
```java
public enum UserType {
    CUSTOMER,
    SUPPLIER,
    ADMIN
}
```
- Added `ADMIN` to the UserType enum

### 2. Backend - User Entity
**File:** `src/main/java/com/nayaneyecare/entity/User.java` (line 73-81)
```java
// Unique Supplier Key - 10 character alphanumeric for row-level data isolation
@Size(max = 10)
@Column(name = "unique_supplier_key", unique = true, nullable = true)
private String uniqueSupplierKey;

// Secondary password for dual-password authentication (ADMIN only)
@Column(name = "secondary_password")
private String secondaryPassword;
```
- Added `secondaryPassword` field with getter/setter

### 3. Backend - LoginRequest DTO
**File:** `src/main/java/com/nayaneyecare/dto/LoginRequest.java` (line 19-24)
```java
// Secondary password for dual-password authentication (ADMIN only)
private String secondaryPassword;
```
- Added `secondaryPassword` field with getter/setter

### 4. Backend - AuthService (loginAdmin method)
**File:** `src/main/java/com/nayaneyecare/service/AuthService.java` (lines 208-259)
- Added `loginAdmin()` method for dual-password validation
- Validates both primary password AND secondary password
- Returns JWT token with ADMIN role via `jwtUtils.generateTokenWithAdminRole()`

### 5. Backend - JwtUtils (generateTokenWithAdminRole)
**File:** `src/main/java/com/nayaneyecare/util/JwtUtils.java` (lines 109-122)
```java
public String generateTokenWithAdminRole(User user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("id", user.getId());
    claims.put("firstName", user.getFirstName());
    claims.put("lastName", user.getLastName());
    claims.put(CLAIM_USER_TYPE, "ADMIN");
    claims.put(CLAIM_SUPPLIER_KEY, "GLOBAL_ADMIN_ACCESS");
    claims.put("authSource", "admin");
    return createToken(claims, user.getEmail());
}
```

### 6. Backend - SecurityUtils (isAdmin helper)
**File:** `src/main/java/com/nayaneyecare/util/SecurityUtils.java` (lines 112-140)
- Added `isAdmin()` method to check if current user has ROLE_ADMIN
- Added `getSupplierKeyForQuery()` that returns null for admin (signals no filtering)

### 7. Backend - Repository Global Methods
**Files:**
- `BillingRecordRepository.java` - Added `findAllGlobal()`, `findAllGlobalWithProducts()`, `findByYearWithProductsGlobal()`, `findByBillNumberWithProductsGlobal()`, `getTotalRevenueForPeriodGlobal()`, `getTotalBillsForPeriodGlobal()`
- `CustomerRepository.java` - Added `findAllGlobal()`, `findTopCustomersByVisitCountGlobal()`, `findTopCustomersByTotalSpentGlobal()`, `findByDateRangeGlobal()`, `findAllByUserType(UserType)`
- `PurchaseRepository.java` - Added `findAllGlobal()`
- `BulkPurchaseRepository.java` - Added `findAllWithItems()`

### 8. Backend - BillingRecordService (Admin Bypass)
**File:** `src/main/java/com/nayaneyecare/service/BillingRecordService.java` (lines 46-158)
- Added `SecurityUtils.isAdmin()` checks in all methods
- When admin: uses global repository methods (no uniqueKey filtering)
- When supplier: uses existing uniqueKey filtered methods

### 9. Backend - DashboardService (Admin Bypass)
**File:** `src/main/java/com/nayaneyecare/service/DashboardService.java` (lines 50-72)
```java
if (SecurityUtils.isAdmin()) {
    purchaseHistory = purchaseHistoryService.getGlobalPurchaseHistory();
    billingRecords = billingRecordRepository.findAllGlobalWithProducts();
    customers = customerRepository.findAllGlobal();
} else {
    purchaseHistory = purchaseHistoryService.getPurchaseHistory(uniqueKey);
    billingRecords = billingRecordRepository.findAllWithProducts(uniqueKey);
    customers = customerRepository.findAllByUniqueKey(uniqueKey);
}
```

### 10. Backend - PurchaseHistoryService (Global Method)
**File:** `src/main/java/com/nayaneyecare/service/PurchaseHistoryService.java` (lines 63-91)
- Added `getGlobalPurchaseHistory()` method that returns all records without filtering

### 11. Backend - SecurityConfig (Admin Endpoints)
**File:** `src/main/java/com/nayaneyecare/config/SecurityConfig.java` (line 53)
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```
- Added admin API endpoint protection

### 12. Backend - AdminController (NEW)
**File:** `src/main/java/com/nayaneyecare/controller/AdminController.java`
- `GET /api/admin/suppliers` - List all suppliers
- `GET /api/admin/admins` - List all admins
- `POST /api/admin/suppliers/{id}/deactivate` - Deactivate supplier
- `POST /api/admin/suppliers/{id}/reactivate` - Reactivate supplier
- `DELETE /api/admin/suppliers/{id}` - Delete supplier
- `GET /api/admin/stats` - Get global statistics

### 13. Backend - UserRepository
**File:** `src/main/java/com/nayaneyecare/repository/UserRepository.java` (line 35)
```java
List<User> findAllByUserType(UserType userType);
```

### 14. Frontend - LoginModal (Secret Admin Trigger)
**File:** `src/components/LoginModal.tsx` (lines 12-19, 38-56, 86-87, 131-142, 488-519)
- Added `isAdminMode` state
- Added `showSecondaryPassword` state
- Added `secondaryPassword` to formData
- Added secret clickable dot overlay on Building icon
- Added animated red indicator when admin mode active
- Added slide-down secondary password field
- Updated login to send `userType: 'admin'` when admin mode active

### 15. Frontend - CSS Animation
**File:** `src/index.css` (lines 5-17)
```css
@keyframes slide-down {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 100px;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out forwards;
}
```

### 16. Frontend - TypeScript Types
**File:** `src/types/auth.ts` (lines 36-43)
```typescript
export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  secondaryPassword?: string;
  userType: string;
  method: string;
}
```

### 17. Database Migration
**File:** `src/main/resources/db/migration/V2026_04_19__add_admin_user_type_and_secondary_password.sql`
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_password VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
```

## How to Create an Admin User

1. Run the migration to add the `secondary_password` column
2. Insert admin user with bcrypt encoded passwords:
```sql
INSERT INTO users (first_name, last_name, email, password, secondary_password, user_type, is_active, created_at, updated_at)
VALUES ('Admin', 'User', 'admin@nayaneyecare.com', '$2a$10$...', '$2a$10$...', 'ADMIN', true, NOW(), NOW());
```

## How Admin Mode Works

1. **Trigger**: Click the center dot of the Building icon in Supplier Login modal
2. **Visual Feedback**: Red dot overlay appears with pulsing animation
3. **UI Reveal**: Secondary password field slides down
4. **Login**: Submit with both passwords → `userType: 'admin'` sent to backend
5. **Backend**: Validates BOTH passwords match stored `secondaryPassword`
6. **JWT**: Contains `ROLE_ADMIN` and `supplierKey: "GLOBAL_ADMIN_ACCESS"`
7. **Data Access**: All queries bypass `uniqueKey` filtering → global data access
8. **API Access**: Protected `/api/admin/**` endpoints become accessible

## Security Notes

- Admin users must have both `password` AND `secondaryPassword` fields set
- Secondary password is hashed like primary password using BCrypt
- Both passwords must be correct for authentication to succeed
- JWT tokens for admins use special `GLOBAL_ADMIN_ACCESS` supplier key
- All admin endpoints require `ROLE_ADMIN` authority





additional errors fixing 

● Update(src\main\java\com\nayaneyecare\repository\UserRepository.java)
  ⎿  PreToolUse:Edit hook error                ⎿  Failed with non-blocking status code:
                                                  Python was not found; run without
                                                  arguments to install from the Microsoft
                                                  Store, or disable this shortcut from
                                                  Settings > Apps > Advanced app settings
                                                  > App execu…
  ⎿  Added 1 line
       5  import org.springframework.data.jpa.repository.JpaRepository;
       6  import org.springframework.stereotype.Repository;
       7
       8 +import java.util.List;
       9  import java.util.Optional;
      10
      11  @Repository

  Read 2 files (ctrl+o to expand)

● Update(src\main\java\com\nayaneyecare\service\BillingRecordService.java)
  ⎿  PreToolUse:Edit hook error                ⎿  Failed with non-blocking status code:
                                                  Python was not found; run without
                                                  arguments to install from the Microsoft
                                                  Store, or disable this shortcut from
                                                  Settings > Apps > Advanced app settings
                                                  > App execu…
  ⎿  Added 1 line, removed 1 line
      68       */
      69      public Optional<BillingRecord> getBillingRecordByBillNumber(String bi
          llNumber) {
      70          if (SecurityUtils.isAdmin()) {
      71 -            return billingRecordRepository.findByBillNumberWithProducts(b
         -illNumber);
      71 +            return billingRecordRepository.findByBillNumberWithProductsGl
         +obal(billNumber);
      72          }
      73          String uniqueKey = SecurityUtils.getCurrentSupplierKey();
      74          return billingRecordRepository.findByBillNumberWithProducts(billN
          umber, uniqueKey);

  Read 1 file (ctrl+o to expand)

● Update(src\main\java\com\nayaneyecare\controller\AdminController.java)
  ⎿  PreToolUse:Edit hook error                ⎿  Failed with non-blocking status code:
                                                  Python was not found; run without
                                                  arguments to install from the Microsoft
                                                  Store, or disable this shortcut from
                                                  Settings > Apps > Advanced app settings
                                                  > App execu…
  ⎿  Added 3 lines, removed 3 lines
      110                          return ResponseEntity.badRequest().body(Map.of("
           message", "User is not a supplier"));
      111                      }
      112                  })
      113 -                .orElse(ResponseEntity.notFound().build());
      113 +                .orElse(ResponseEntity.notFound().<Map<String, Object>>b
          +uild());
      114      }
      115
      116      /**
     ...
      132                          return ResponseEntity.badRequest().body(Map.of("
           message", "User is not a supplier"));
      133                      }
      134                  })
      135 -                .orElse(ResponseEntity.notFound().build());
      135 +                .orElse(ResponseEntity.notFound().<Map<String, Object>>b
          +uild());
      136      }
      137
      138      /**
     ...
      153                          return ResponseEntity.badRequest().body(Map.of("
           message", "User is not a supplier"));
      154                      }
      155                  })
      156 -                .orElse(ResponseEntity.notFound().build());
      156 +                .orElse(ResponseEntity.notFound().<Map<String, Object>>b
          +uild());
      157      }
      158
      159      /**

● All 3 compilation errors fixed:

  1. UserRepository.java - Added missing import java.util.List;
  2. BillingRecordService.java - Changed findByBillNumberWithProducts(billNumber) to
  findByBillNumberWithProductsGlobal(billNumber) for admin bypass
  3. AdminController.java - Added explicit type parameter <Map<String, Object>> to
  ResponseEntity.notFound().build() calls

  Try npm run dev:full again.

   Read 1 file (ctrl+o to expand)

● Update(src\main\java\com\nayaneyecare\controller\AdminController.java)
  ⎿  PreToolUse:Edit hook error                ⎿  Failed with non-blocking status code:
                                                  Python was not found; run without
                                                  arguments to install from the Microsoft
                                                  Store, or disable this shortcut from
                                                  Settings > Apps > Advanced app settings
                                                  > App execu…
  ⎿  Added 59 lines, removed 35 lines
       97      @PostMapping("/suppliers/{id}/deactivate")
       98      public ResponseEntity<Map<String, Object>> deactivateSupplier(@PathV
           ariable Long id) {
       99          if (!SecurityUtils.isAdmin()) {
      100 -            return ResponseEntity.status(403).body(Map.of("message", "Ac
          -cess denied"));
      100 +            Map<String, Object> body = new HashMap<>();
      101 +            body.put("message", "Access denied");
      102 +            return ResponseEntity.status(403).body(body);
      103          }
      104
      103 -        return userRepository.findById(id)
      104 -                .map(user -> {
      105 -                    if (user.getUserType() == UserType.SUPPLIER) {
      106 -                        user.setIsActive(false);
      107 -                        userRepository.save(user);
      108 -                        return ResponseEntity.ok(Map.of("message", "Supp
          -lier deactivated successfully"));
      109 -                    } else {
      110 -                        return ResponseEntity.badRequest().body(Map.of("
          -message", "User is not a supplier"));
      111 -                    }
      112 -                })
      113 -                .orElse(ResponseEntity.notFound().<Map<String, Object>>b
          -uild());
      105 +        Optional<User> userOpt = userRepository.findById(id);
      106 +        if (userOpt.isEmpty()) {
      107 +            return ResponseEntity.notFound().build();
      108 +        }
      109 +
      110 +        User user = userOpt.get();
      111 +        if (user.getUserType() != UserType.SUPPLIER) {
      112 +            Map<String, Object> body = new HashMap<>();
      113 +            body.put("message", "User is not a supplier");
      114 +            return ResponseEntity.badRequest().body(body);
      115 +        }
      116 +
      117 +        user.setIsActive(false);
      118 +        userRepository.save(user);
      119 +        Map<String, Object> body = new HashMap<>();
      120 +        body.put("message", "Supplier deactivated successfully");
      121 +        return ResponseEntity.ok(body);
      122      }
      123
      124      /**
     ...
      127      @PostMapping("/suppliers/{id}/reactivate")
      128      public ResponseEntity<Map<String, Object>> reactivateSupplier(@PathV
           ariable Long id) {
      129          if (!SecurityUtils.isAdmin()) {
      122 -            return ResponseEntity.status(403).body(Map.of("message", "Ac
          -cess denied"));
      130 +            Map<String, Object> body = new HashMap<>();
      131 +            body.put("message", "Access denied");
      132 +            return ResponseEntity.status(403).body(body);
      133          }
      134
      125 -        return userRepository.findById(id)
      126 -                .map(user -> {
      127 -                    if (user.getUserType() == UserType.SUPPLIER) {
      128 -                        user.setIsActive(true);
      129 -                        userRepository.save(user);
      130 -                        return ResponseEntity.ok(Map.of("message", "Supp
          -lier reactivated successfully"));
      131 -                    } else {
      132 -                        return ResponseEntity.badRequest().body(Map.of("
          -message", "User is not a supplier"));
      133 -                    }
      134 -                })
      135 -                .orElse(ResponseEntity.notFound().<Map<String, Object>>b
          -uild());
      135 +        Optional<User> userOpt = userRepository.findById(id);
      136 +        if (userOpt.isEmpty()) {
      137 +            return ResponseEntity.notFound().build();
      138 +        }
      139 +
      140 +        User user = userOpt.get();
      141 +        if (user.getUserType() != UserType.SUPPLIER) {
      142 +            Map<String, Object> body = new HashMap<>();
      143 +            body.put("message", "User is not a supplier");
      144 +            return ResponseEntity.badRequest().body(body);
      145 +        }
      146 +
      147 +        user.setIsActive(true);
      148 +        userRepository.save(user);
      149 +        Map<String, Object> body = new HashMap<>();
      150 +        body.put("message", "Supplier reactivated successfully");
      151 +        return ResponseEntity.ok(body);
      152      }
      153
      154      /**
     ...
      157      @DeleteMapping("/suppliers/{id}")
      158      public ResponseEntity<Map<String, Object>> deleteSupplier(@PathVaria
           ble Long id) {
      159          if (!SecurityUtils.isAdmin()) {
      144 -            return ResponseEntity.status(403).body(Map.of("message", "Ac
          -cess denied"));
      160 +            Map<String, Object> body = new HashMap<>();
      161 +            body.put("message", "Access denied");
      162 +            return ResponseEntity.status(403).body(body);
      163          }
      164
      147 -        return userRepository.findById(id)
      148 -                .map(user -> {
      149 -                    if (user.getUserType() == UserType.SUPPLIER) {
      150 -                        userRepository.delete(user);
      151 -                        return ResponseEntity.ok(Map.of("message", "Supp
          -lier deleted successfully"));
      152 -                    } else {
      153 -                        return ResponseEntity.badRequest().body(Map.of("
          -message", "User is not a supplier"));
      154 -                    }
      155 -                })
      156 -                .orElse(ResponseEntity.notFound().<Map<String, Object>>b
          -uild());
      165 +        Optional<User> userOpt = userRepository.findById(id);
      166 +        if (userOpt.isEmpty()) {
      167 +            return ResponseEntity.notFound().build();
      168 +        }
      169 +
      170 +        User user = userOpt.get();
      171 +        if (user.getUserType() != UserType.SUPPLIER) {
      172 +            Map<String, Object> body = new HashMap<>();
      173 +            body.put("message", "User is not a supplier");
      174 +            return ResponseEntity.badRequest().body(body);
      175 +        }
      176 +
      177 +        userRepository.delete(user);
      178 +        Map<String, Object> body = new HashMap<>();
      179 +        body.put("message", "Supplier deleted successfully");
      180 +        return ResponseEntity.ok(body);
      181      }
      182
      183      /**

● Fixed - rewrote the three methods without .map() to avoid type inference issues. Try npm
   run dev:full again.