# Nayan Eye Care - E-commerce Platform

A comprehensive full-stack e-commerce application for eyewear products with React frontend and Java Spring Boot backend, featuring advanced billing systems, customer management, purchase tracking, and inventory management.

## 🚀 Features

### Frontend (React + TypeScript)
- **Product Catalog**: Spectacles, Sunglasses, Contact Lenses, Frames with detailed categorization
- **User Authentication**: Separate login/signup for Customers and Suppliers with role-based access
- **Advanced Billing System**: Comprehensive billing with real-time updates and auto-fill features
- **Customer Management**: Complete customer database with search, filter, and management capabilities
- **Purchase Management**: Track purchases, returns, and supplier interactions with bulk purchase support
- **Inventory Management**: Real-time inventory tracking, movement history, and stock synchronization
- **Dashboard Analytics**: Comprehensive supplier dashboard with sales calculations and insights
- **Responsive Design**: Mobile-first approach with modern Tailwind CSS styling
- **Interactive UI**: Product filtering, image carousels, user profiles, and advanced search
- **Data Export**: Excel integration for billing, customer, and inventory data export

### Backend (Java Spring Boot)
- **Authentication & Security**: JWT-based security with role management and Spring Security
- **User Management**: Customer and Supplier registration/login with comprehensive profile management
- **Billing Management**: Advanced billing system with database storage and real-time functionality
- **Purchase System**: Complete purchase tracking, returns management, bulk purchases, and supplier interactions
- **Inventory System**: Real-time inventory tracking, movement history, and stock management
- **File Management**: Secure file upload/download with proper validation
- **Database Integration**: H2 database with JPA/Hibernate for robust data persistence
- **RESTful APIs**: Comprehensive CRUD operations with proper validation and error handling
- **Data Synchronization**: Real-time data sync between frontend and backend systems

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Lucide React** for beautiful, consistent icons
- **React Router** for seamless navigation
- **Axios** for HTTP client operations

### Backend
- **Java 17** with modern language features
- **Spring Boot 3.2.0** for rapid application development
- **Spring Security** with JWT for robust authentication
- **Spring Data JPA** for data access layer
- **H2 Database** for reliable data storage and development
- **Maven** for dependency management and build automation
- **Hibernate** for ORM capabilities

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Java** (v17 or higher)
- **Maven** (v3.6 or higher)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd project
```

### 2. Backend Setup

The application uses H2 database by default for development:

1. **Install dependencies and run**:
```bash
# Install dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

**H2 Database Console**: Access at `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:file:./data/nayan-db`
- **Username**: `sa`
- **Password**: (leave empty)

### 3. Frontend Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 5. Data Population

Run the data population scripts to create sample data:
```bash
# Generate demo data
cd sample-data-js
node generate-demo-data.js
node generate-purchase-data.js
node load-customer-data.js
```

## 📊 Data Management

### Demo Data Generation
The project includes comprehensive scripts for generating demo data:
- `generate-demo-data.js` - Creates sample customer and billing records
- `generate-purchase-data.js` - Generates purchase and supplier data
- `load-customer-data.js` - Loads customer data into the system
- `verify-data.js` - Validates data integrity
- `create-sample-supplier.js` - Creates sample supplier accounts

### Data Storage
- **Customer Records**: `data/customer-records.json`
- **Billing Records**: `data/billing-records.json`
- **Purchase Records**: `data/purchase-records.json`
- **Bulk Purchase Records**: `data/bulkpurchase-records.json`
- **Inventory Records**: `data/inventory-records.json`
- **User Signups**: `signup.json`

### Database Files
- **H2 Database**: `data/nayan-db.mv.db` (for development)
- **Database Scripts**: `database-setup.sql`, `populate-database.sql`

## 🔐 Authentication System

### Local Authentication (Frontend)
The application now uses a local authentication system that stores user data in the browser's localStorage. This allows for immediate testing without requiring a backend server.

**Features:**
- Local user registration and login
- Data persistence in browser storage
- User data export functionality
- Support for both customer and supplier accounts
- Role-based access control

**Testing the Authentication:**
1. Open `test-auth.html` in your browser for a standalone test
2. Use the main application's supplier login/signup functionality
3. Access user management from the supplier dashboard

### Backend Authentication
- JWT-based authentication system
- Role-based access control (CUSTOMER/SUPPLIER)
- Secure password encryption
- Session management

### User Data Management
- User data is stored locally in the browser
- Export functionality available to download user data as JSON
- Data can be imported/exported for backup purposes
- Real-time synchronization with backend when available

## 🔌 API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/validate` | Validate JWT token |
| POST | `/api/auth/verify-otp` | Verify OTP for phone login |

### Purchase Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/purchases` | Create new purchase |
| GET | `/api/purchases` | Get all purchases |
| GET | `/api/purchases/{id}` | Get purchase by ID |
| PUT | `/api/purchases/{id}` | Update purchase |
| DELETE | `/api/purchases/{id}` | Delete purchase |
| GET | `/api/purchases/history` | Get purchase history |

### Bulk Purchase Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bulk-purchases` | Create bulk purchase |
| GET | `/api/bulk-purchases` | Get all bulk purchases |
| GET | `/api/bulk-purchases/{id}` | Get bulk purchase by ID |
| PUT | `/api/bulk-purchases/{id}` | Update bulk purchase |
| DELETE | `/api/bulk-purchases/{id}` | Delete bulk purchase |

### File Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload files |
| GET | `/api/files/download/{filename}` | Download files |
| GET | `/api/files/list` | List all files |

## 📝 Request/Response Examples

### Signup Request
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "userType": "customer",
  "address": "123 Main St, City",
  "agreeToTerms": true
}
```

### Login Request
```json
{
  "email": "john@example.com",
  "password": "password123",
  "userType": "customer",
  "method": "email"
}
```

### Purchase Request
```json
{
  "productName": "Ray-Ban Aviator",
  "quantity": 2,
  "unitPrice": 150.00,
  "supplierId": 1,
  "purchaseDate": "2024-01-15",
  "productCategory": "SUNGLASSES"
}
```

### Bulk Purchase Request
```json
{
  "supplierName": "Optical Supplies Co",
  "purchaseDate": "2024-01-15",
  "items": [
    {
      "productName": "Contact Lens Solution",
      "quantity": 100,
      "unitPrice": 5.00,
      "productCategory": "SOLUTIONS"
    }
  ]
}
```

### Authentication Response
```json
{
  "token": "jwt_token_here",
  "type": "Bearer",
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "userType": "CUSTOMER"
}
```

## 🗄️ Database Schema

### Users Table
- `id` (Primary Key)
- `first_name`
- `last_name`
- `email` (Unique)
- `phone` (Unique)
- `password` (Encrypted)
- `user_type` (CUSTOMER/SUPPLIER)
- `is_active`
- `created_at`
- `updated_at`

### Customer Fields (in users table)
- `address`

### Supplier Fields (in users table)
- *No additional fields required (simplified registration)*

### Purchases Table
- `id` (Primary Key)
- `product_name`
- `quantity`
- `unit_price`
- `total_amount`
- `supplier_id` (Foreign Key)
- `purchase_date`
- `status`
- `product_category`
- `created_at`
- `updated_at`

### Bulk Purchases Table
- `id` (Primary Key)
- `supplier_name`
- `purchase_date`
- `total_amount`
- `status`
- `created_at`
- `updated_at`

### Purchase Items Table
- `id` (Primary Key)
- `bulk_purchase_id` (Foreign Key)
- `product_name`
- `quantity`
- `unit_price`
- `product_category`

## 🔐 User Authentication Flow

1. **Signup**: User provides details → Backend validates → Account created → JWT returned
2. **Login**: User provides credentials → Backend validates → JWT returned
3. **OTP Verification**: Phone-based login with WhatsApp OTP verification
4. **Protected Routes**: Frontend sends JWT in headers → Backend validates → Access granted
5. **Logout**: Frontend clears token → User logged out

## ✨ Features Implemented

### ✅ Completed Features
- **User Management**: Registration for customers and suppliers
- **Authentication**: JWT-based authentication with role management
- **Security**: Password encryption and Spring Security integration
- **Billing System**: Comprehensive billing with JSON storage, append functionality, auto-fill, and validation
- **Customer Management**: Complete customer database with search, filter, and management
- **Purchase System**: Purchase tracking, returns, bulk purchases, and supplier management
- **Inventory Management**: Real-time inventory tracking, movement history, and stock synchronization
- **Data Export**: Excel integration for data export
- **File Management**: Secure file upload/download system
- **UI/UX**: Responsive design with modern styling and enhanced navigation
- **Form Validation**: Comprehensive client and server-side validation
- **Dashboard**: Analytics and overview for suppliers with sales calculations
- **OTP System**: WhatsApp-based OTP verification for enhanced security
- **Category Management**: Product categorization and filtering
- **Movement History**: Complete tracking of inventory movements
- **Data Persistence**: Robust database persistence with H2 and MySQL support

### 🚧 Future Enhancements
- **Product Management**: Advanced CRUD operations for products
- **Shopping Cart**: Full e-commerce cart functionality
- **Order Management**: Complete order lifecycle management
- **Payment Integration**: Multiple payment gateway support
- **Email Notifications**: Automated email system
- **Advanced Analytics**: Enhanced reporting and insights
- **Mobile App**: Native mobile application
- **Multi-language Support**: Internationalization features
- **Advanced Search**: Elasticsearch integration
- **Real-time Chat**: Customer support chat system

## 🏗️ Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── main/java/          # Java backend
│       ├── config/         # Configuration classes
│       ├── controller/     # REST controllers
│       ├── dto/            # Data transfer objects
│       ├── entity/         # JPA entities
│       ├── repository/     # Data access layer
│       ├── service/        # Business logic
│       └── util/           # Utility classes
├── data/                   # JSON data files and database
├── sample-data-js/         # Data generation scripts
├── target/                 # Compiled Java classes
├── test/                   # Test files and HTML pages
└── docs/                   # Documentation
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**: 
   - Ensure H2 database is running (default port 8080)
   - Check file permissions in `data/` directory

2. **Port Already in Use**:
   - Frontend: Change port in `vite.config.ts`
   - Backend: Add `server.port=8081` in `application.properties`

3. **CORS Issues**:
   - Ensure frontend URL is added to CORS configuration in `SecurityConfig.java`
   - Check if backend is running on correct port

4. **Authentication Not Working**:
   - Check if JWT secret is properly configured
   - Verify token is being sent in Authorization header
   - Check user credentials in database
   - For local auth, check browser localStorage

5. **Data Loading Issues**:
   - Run `node generate-demo-data.js` to create sample data
   - Verify JSON files are properly formatted
   - Check file permissions
   - Ensure database tables are created

6. **Inventory Sync Issues**:
   - Check if backend is running
   - Verify database connection
   - Check for any validation errors in console

### Performance Optimization
- Use H2 database for development to avoid MySQL setup
- Enable H2 console for database inspection
- Use batch operations for large data imports
- Implement proper indexing for database queries

## 📚 Additional Documentation

- **Billing Implementation**: See `readmes/BILLING_APPEND_IMPLEMENTATION.md`
- **Customer Management**: See `readmes/CUSTOMER_MANAGEMENT_README.md`
- **Excel Integration**: See `readmes/EXCEL_INTEGRATION_README.md`
- **Purchase Returns**: See `readmes/PURCHASE_RETURN_ENHANCEMENT.md`
- **Inventory Management**: See `readmes/INVENTORY_SYSTEM_README.md`
- **Dashboard Features**: See `readmes/DASHBOARD_ENHANCEMENT_README.md`
- **Bulk Purchase**: See `readmes/BULK_PURCHASE_IMPLEMENTATION_SUMMARY.md`

## 🧪 Testing

### Test Files
The project includes comprehensive test files for various features:
- `test-auth.html` - Authentication testing
- `test-billing-*.html` - Billing system testing
- `test-inventory.html` - Inventory management testing
- `test-purchase-*.html` - Purchase system testing
- `test-dashboard-*.html` - Dashboard functionality testing

### Running Tests
1. Open test files in a web browser
2. Follow the instructions in each test file
3. Check browser console for any errors
4. Verify functionality as described in test files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly using provided test files
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

### Development Guidelines
- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update documentation for any API changes
- Ensure backward compatibility
- Test on multiple browsers and devices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact & Support

For any queries, support, or collaboration opportunities, please contact the development team:

- **Email**: [Your Email]
- **GitHub**: [Your GitHub Profile]
- **LinkedIn**: [Your LinkedIn Profile]

## 🎯 Project Status

**Current Version**: 2.0.0
**Last Updated**: January 2025
**Status**: Active Development
**Next Milestone**: Enhanced Product Management System

---

**Made with ❤️ by the Nayan Eye Care Development Team**

*This README is continuously updated to reflect the latest features and improvements.* 