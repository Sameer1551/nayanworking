import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import SpectaclesPage from './pages/categories/Spectacles';
import SunglassesPage from './pages/categories/Sunglasses';
import ContactLensesPage from './pages/categories/ContactLenses';
import FramesPage from './pages/categories/Frames';
import SolutionsPage from './pages/categories/Solutions';
import ProductDetailPage from './pages/products/ProductDetail';
import SearchPage from './pages/products/Search';
import CartPage from './pages/shop/Cart';
import CheckoutPage from './pages/shop/Checkout';

import OrderSuccessPage from './pages/shop/OrderSuccess';
import SupplierDashboard from './pages/supplier/Dashboard';
import SupplierProfilePage from './pages/supplier/Profile';
import NewBillingPage from './pages/supplier/NewBilling';
import BillingRecords from './components/BillingRecords';
import CustomersPage from './pages/supplier/Customers';
import AdminSuppliersPage from './pages/supplier/AdminSuppliers';

import PurchasePage from './pages/supplier/Purchase';
import BulkPurchasePage from './pages/supplier/BulkPurchase';
import PurchaseHistoryPage from './pages/supplier/PurchaseHistory';
import PurchaseReturnPage from './pages/supplier/PurchaseReturn';
import SalesReturnPage from './pages/supplier/SalesReturn';
import DataPage from './pages/supplier/Data';
import InventoryPage from './pages/supplier/Inventory';
import CustomerAuthPage from './pages/customer/Auth';
import CustomerDashboardPage from './pages/customer/Dashboard';
import CustomerProfilePage from './pages/customer/Profile';
import CustomerBillsPage from './pages/customer/Bills';
import CustomerPrescriptionsPage from './pages/customer/Prescriptions';
import CustomerReturnsPage from './pages/customer/Returns';
import CustomerBookEyeTestPage from './pages/customer/BookEyeTest';
import CustomerContactLensReordersPage from './pages/customer/ContactLensReorders';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Debug effect to log auth state changes
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const checkAuthStatus = () => {
    const authenticated = authService.isAuthenticated();
    const userData = authService.getUser();
    
    console.log('checkAuthStatus called:', { authenticated, userData });
    
    // Always update state when called from onAuthChange to ensure re-rendering
    setIsAuthenticated(authenticated);
    setUser(userData);
    setIsLoading(false);
  };

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage change event triggered');
      checkAuthStatus();
    };

    const handleAuthChange = () => {
      console.log('Auth change event triggered');
      // Force a fresh check of authentication status
      const authenticated = authService.isAuthenticated();
      const userData = authService.getUser();
      console.log('Fresh auth check:', { authenticated, userData });
      
      setIsAuthenticated(authenticated);
      setUser(userData);
    };

    const handleSessionExpired = () => {
      console.warn('Session expired — clearing auth state and redirecting to home.');
      setIsAuthenticated(false);
      setUser(null);
      // Small delay to allow the router to be ready
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('authSessionExpired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('authSessionExpired', handleSessionExpired);
    };
  }, []); // Remove user dependency to prevent infinite loops

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header onAuthChange={checkAuthStatus} />
        <Routes>
          {/* Redirect authenticated suppliers to dashboard */}
          <Route
            path="/"
            element={
              (() => {
                console.log('Root route check:', { isAuthenticated, userType: user?.userType });
                
                // Double-check authentication status directly from service
                const serviceAuth = authService.isAuthenticated();
                const serviceUser = authService.getUser();
                console.log('Service auth check in root:', { serviceAuth, serviceUser });
                
                if ((isAuthenticated && (user?.userType === 'supplier' || user?.userType === 'admin')) || 
                    (serviceAuth && (serviceUser?.userType === 'supplier' || serviceUser?.userType === 'admin'))) {
                  console.log('Redirecting supplier/admin to dashboard');
                  return <Navigate to="/supplier/dashboard" replace />;
                }
                console.log('Showing home page');
                return <Home />;
              })()
            }
          />
          
          {/* Explicit supplier redirect route */}
          <Route
            path="/supplier"
            element={
              isAuthenticated && (user?.userType === 'supplier' || user?.userType === 'admin')
                ? <Navigate to="/supplier/dashboard" replace />
                : <Navigate to="/" replace />
            }
          />

          <Route
            path="/customer"
            element={
              (isAuthenticated && user?.userType === 'customer') ||
              (authService.isAuthenticated() && authService.getUser()?.userType === 'customer')
                ? <Navigate to="/customer/dashboard" replace />
                : <Navigate to="/customer/login" replace />
            }
          />
          
          {/* Force redirect for supplier dashboard */}
          <Route
            path="/supplier/dashboard"
            element={
              (() => {
                console.log('Supplier dashboard route check:', { isAuthenticated, userType: user?.userType });
                
                // Double-check authentication status directly from service
                const serviceAuth = authService.isAuthenticated();
                const serviceUser = authService.getUser();
                console.log('Service auth check:', { serviceAuth, serviceUser });
                
                if ((isAuthenticated && (user?.userType === 'supplier' || user?.userType === 'admin')) || 
                    (serviceAuth && (serviceUser?.userType === 'supplier' || serviceUser?.userType === 'admin'))) {
                  console.log('Showing supplier/admin dashboard');
                  return <SupplierDashboard />;
                }
                console.log('Redirecting to home');
                return <Navigate to="/" replace />;
              })()
            }
          />
          <Route
            path="/supplier/profile"
            element={
              <ProtectedRoute requireSupplier>
                <SupplierProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/spectacles" element={<SpectaclesPage />} />
          <Route path="/sunglasses" element={<SunglassesPage />} />
          <Route path="/contact-lenses" element={<ContactLensesPage />} />
          <Route path="/frames" element={<FramesPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/products/search" element={<SearchPage />} />
          <Route path="/product/:productCode" element={<ProductDetailPage />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute requireCustomer>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requireCustomer>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/customer/login" element={<CustomerAuthPage mode="login" />} />
          <Route path="/customer/register" element={<CustomerAuthPage mode="register" />} />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bills"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerBillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/prescriptions"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerPrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/returns"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerReturnsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book-eye-test"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerBookEyeTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/contact-lens-reorders"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerContactLensReordersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/billing"
            element={
              <ProtectedRoute requireSupplier>
                <NewBillingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supplier/billing-records"
            element={
              <ProtectedRoute requireSupplier>
                <BillingRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/customers"
            element={
              <ProtectedRoute requireSupplier>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/admin-suppliers"
            element={
              <ProtectedRoute requireSupplier>
                <AdminSuppliersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supplier/purchase"
            element={
              <ProtectedRoute requireSupplier>
                <PurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/bulk-purchase"
            element={
              <ProtectedRoute requireSupplier>
                <BulkPurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/purchase-history"
            element={
              <ProtectedRoute requireSupplier>
                <PurchaseHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/purchase-return"
            element={
              <ProtectedRoute requireSupplier>
                <PurchaseReturnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/sales-return"
            element={
              <ProtectedRoute requireSupplier>
                <SalesReturnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/data"
            element={
              <ProtectedRoute requireSupplier>
                <DataPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/inventory"
            element={
              <ProtectedRoute requireSupplier>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
