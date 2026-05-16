import { FormEvent, useState, useEffect, useRef } from 'react';
import { Eye, Search, ShoppingCart, User, Menu, X, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import authService from '../services/authService';
import shopService from '../services/shopService';

interface HeaderProps {
  onAuthChange?: () => void;
}

const Header = ({ onAuthChange }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginType, setLoginType] = useState<'customer' | 'supplier'>('customer');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [showDataDropdown, setShowDataDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(shopService.getCartCount());
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const purchaseDropdownRef = useRef<HTMLDivElement | null>(null);
  const salesDropdownRef = useRef<HTMLDivElement | null>(null);
  const dataDropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const syncCartCount = () => setCartCount(shopService.getCartCount());

    syncCartCount();
    window.addEventListener('cartUpdated', syncCartCount);

    return () => {
      window.removeEventListener('cartUpdated', syncCartCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        showUserDropdown &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(targetNode)
      ) {
        setShowUserDropdown(false);
      }
      if (
        showPurchaseDropdown &&
        purchaseDropdownRef.current &&
        !purchaseDropdownRef.current.contains(targetNode)
      ) {
        setShowPurchaseDropdown(false);
      }
      if (
        showSalesDropdown &&
        salesDropdownRef.current &&
        !salesDropdownRef.current.contains(targetNode)
      ) {
        setShowSalesDropdown(false);
      }
      if (
        showDataDropdown &&
        dataDropdownRef.current &&
        !dataDropdownRef.current.contains(targetNode)
      ) {
        setShowDataDropdown(false);
      }
    };

    if (showUserDropdown || showPurchaseDropdown || showSalesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown, showPurchaseDropdown, showSalesDropdown]);

  const checkAuthStatus = () => {
    const authenticated = authService.isAuthenticated();
    const userData = authService.getUser();
    setIsAuthenticated(authenticated);
    setUser(userData);

    console.log('Header checkAuthStatus:', { authenticated, userData });

    // Notify parent component about auth change
    if (onAuthChange) {
      console.log('Calling onAuthChange callback');
      onAuthChange();
    }
  };

  const handleLoginClick = (type: 'customer' | 'supplier') => {
    setLoginType(type);
    setIsLoginModalOpen(true);
  };

  const handleAuthSuccess = () => {
    console.log('handleAuthSuccess called');
    checkAuthStatus();
    setIsLoginModalOpen(false);

    // Add a small delay to ensure state is properly updated
    setTimeout(() => {
      const u = authService.getUser();
      console.log('User data after delay:', u);
      if (u?.userType === 'supplier' || u?.userType === 'admin') {
        console.log('Navigating to supplier/admin dashboard');
        window.location.href = '/supplier/dashboard';
      } else if (u?.userType === 'customer') {
        console.log('Customer logged in. Keeping user on current page.');
        // Intentionally not redirecting to /customer/dashboard
      }
    }, 100);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setShowUserDropdown(false);
    window.location.replace('/');
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      if (user?.userType === 'supplier' || user?.userType === 'admin') {
        navigate('/supplier/dashboard');
      } else if (user?.userType === 'customer') {
        navigate('/');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleSearchSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedQuery = searchQuery.trim();
    navigate(trimmedQuery ? `/products/search?q=${encodeURIComponent(trimmedQuery)}` : '/products/search');
    setIsMenuOpen(false);
  };

  // removed smooth-scroll in favor of dedicated category routes

  const SupplierMenu = () => (
    <nav className="hidden md:flex items-center space-x-6">
      <Link to="/supplier/billing" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Billing</Link>

      {/* Sales Dropdown */}
      <div className="relative" ref={salesDropdownRef}>
        <button
          onClick={() => setShowSalesDropdown(!showSalesDropdown)}
          className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
        >
          <span>Sales</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Sales Dropdown Menu */}
        {showSalesDropdown && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            <Link
              to="/supplier/billing-records"
              onClick={() => setShowSalesDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Sales</span>
            </Link>
            <Link
              to="/supplier/sales-return"
              onClick={() => setShowSalesDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Sales Return</span>
            </Link>
          </div>
        )}
      </div>

      <Link to="/supplier/customers" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors">Customers</Link>

      {/* Purchase Dropdown */}
      <div className="relative" ref={purchaseDropdownRef}>
        <button
          onClick={() => setShowPurchaseDropdown(!showPurchaseDropdown)}
          className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
        >
          <span>Purchase</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Purchase Dropdown Menu */}
        {showPurchaseDropdown && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            <Link
              to="/supplier/purchase"
              onClick={() => setShowPurchaseDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Purchase</span>
            </Link>
            <Link
              to="/supplier/bulk-purchase"
              onClick={() => setShowPurchaseDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Bulk Purchase</span>
            </Link>
            <Link
              to="/supplier/purchase-history"
              onClick={() => setShowPurchaseDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Purchase History</span>
            </Link>
            <Link
              to="/supplier/purchase-return"
              onClick={() => setShowPurchaseDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Purchase Return History</span>
            </Link>
          </div>
        )}
      </div>

      {/* Data Dropdown */}
      <div className="relative" ref={dataDropdownRef}>
        <button
          onClick={() => setShowDataDropdown(!showDataDropdown)}
          className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
        >
          <span>Data</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Data Dropdown Menu */}
        {showDataDropdown && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            <Link
              to="/supplier/data"
              onClick={() => setShowDataDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Data Dashboard</span>
            </Link>
            <Link
              to="/supplier/inventory"
              onClick={() => setShowDataDropdown(false)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span>Inventory</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity p-2 -m-2 flex-shrink-0 mr-4 lg:mr-8"
              onClick={handleLogoClick}
              title="Click to go to home/dashboard"
            >
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <span className="text-lg sm:text-xl md:text-xl xl:text-2xl font-bold text-gray-800 whitespace-nowrap">Nayan Eye Care</span>
            </div>

            {/* Desktop Navigation */}
            {isAuthenticated && (user?.userType === 'supplier' || user?.userType === 'admin') ? (
              <SupplierMenu />
            ) : (
              <nav className="hidden md:flex items-center space-x-3 lg:space-x-4 xl:space-x-6 text-sm xl:text-base flex-shrink-0 flex-nowrap ml-6 lg:ml-8 xl:ml-12">
                <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap">Home</Link>
                <Link to="/spectacles" className="text-gray-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap">Spectacles</Link>
                <Link to="/sunglasses" className="text-gray-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap">Sunglasses</Link>
                <Link to="/contact-lenses" className="text-gray-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap">Contact Lenses</Link>
                <Link to="/frames" className="text-gray-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap">Frames</Link>
              </nav>
            )}

            {/* Right Side Section (Search + Auth) */}
            <div className="ml-auto flex items-center space-x-3 lg:space-x-4 xl:space-x-6 flex-shrink-0">
              {/* Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden lg:flex items-center bg-gray-100 rounded-full px-4 py-2 lg:ml-2 xl:ml-3 w-40 xl:w-56 2xl:w-64"
              >
                <Search className="h-5 w-5 text-gray-500 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for spectacles, lenses..."
                  className="bg-transparent outline-none flex-1 text-gray-700"
                />
              </form>

              {/* Icons & Auth Buttons */}
              <div className="flex items-center space-x-4">
                {/* Authenticated User Section */}
                {isAuthenticated && user ? (
                  <div className="relative" ref={userDropdownRef}>
                    {/* Desktop User Dropdown */}
                    <div className="hidden lg:block">
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${user.userType === 'customer'
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                      >
                        <UserCircle className="h-5 w-5" />
                        <span className="font-medium">{user.firstName}</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Medium Screen User Dropdown */}
                    <div className="hidden md:block lg:hidden">
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${user.userType === 'customer'
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                      >
                        <UserCircle className="h-4 w-4" />
                        <span className="font-medium">{user.firstName}</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Mobile User Icon */}
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <UserCircle className="h-6 w-6" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.userType}</p>
                        </div>

                        {user.userType === 'customer' && (
                          <>
                            <Link to="/customer/dashboard" onClick={() => setShowUserDropdown(false)} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <UserCircle className="h-4 w-4 mr-3 opacity-0" /> {/* Spacer for alignment */}
                              Dashboard
                            </Link>
                            <div className="border-t border-gray-100 my-1"></div>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            if (user.userType === 'supplier' || user.userType === 'admin') {
                              navigate('/supplier/profile');
                            } else if (user.userType === 'customer') {
                              navigate('/customer/profile');
                            }
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <UserCircle className="h-4 w-4 mr-3" />
                          Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Unauthenticated Login Buttons */
                  <>
                    {/* Login Buttons */}
                    <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleLoginClick('customer')}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap flex-shrink-0"
                      >
                        Customer Login
                      </button>
                      <button
                        onClick={() => handleLoginClick('supplier')}
                        className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm whitespace-nowrap flex-shrink-0"
                      >
                        Supplier Login
                      </button>
                    </div>

                    {/* Medium Screen Login Buttons */}
                    <div className="hidden md:flex lg:hidden items-center space-x-2">
                      <button
                        onClick={() => handleLoginClick('customer')}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        Customer
                      </button>
                      <button
                        onClick={() => handleLoginClick('supplier')}
                        className="bg-emerald-600 text-white px-2 py-1 rounded text-xs hover:bg-emerald-700 transition-colors"
                      >
                        Supplier
                      </button>
                    </div>
                    {/* Mobile Login Icon */}
                    <button
                      onClick={() => handleLoginClick('customer')}
                      className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <User className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Cart - Only show for customers */}
                {(!isAuthenticated || user?.userType === 'customer') && (
                  <div 
                    onClick={() => {
                      if (!isAuthenticated) {
                        handleLoginClick('customer');
                      } else {
                        navigate('/cart');
                      }
                    }} 
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 bg-white">
              <div className="flex flex-col space-y-4">
                {/* Mobile Search */}
                <form onSubmit={handleSearchSubmit} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <Search className="h-5 w-5 text-gray-500 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search..."
                    className="bg-transparent outline-none flex-1 text-gray-700"
                  />
                </form>

                {/* Navigation Links */}
                {isAuthenticated && (user?.userType === 'supplier' || user?.userType === 'admin') ? (
                  <>
                    <Link to="/supplier/billing" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Billing</Link>
                    <Link to="/supplier/billing-records" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Sales</Link>
                    <Link to="/supplier/customers" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Customers</Link>
                    <Link to="/supplier/purchase" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Purchase</Link>
                    <Link to="/supplier/purchase-history" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Purchase History</Link>
                    <Link to="/supplier/purchase-return" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Purchase Return History</Link>
                    <Link to="/supplier/data" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Data Dashboard</Link>
                    <Link to="/supplier/inventory" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-emerald-600 font-medium py-2">Inventory</Link>
                  </>
                ) : isAuthenticated && user?.userType === 'customer' ? (
                  <>
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Home</Link>
                    <Link to="/spectacles" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Spectacles</Link>
                    <Link to="/sunglasses" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Sunglasses</Link>
                    <Link to="/contact-lenses" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Contact Lenses</Link>
                    <Link to="/frames" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Frames</Link>

                    <div className="border-t border-gray-200 mt-2 mb-1"></div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 mt-2">My Account</div>

                    <Link to="/customer/dashboard" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Dashboard</Link>
                    <Link to="/customer/profile" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Profile</Link>
                  </>
                ) : (
                  <>
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Home</Link>
                    <Link to="/spectacles" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Spectacles</Link>
                    <Link to="/sunglasses" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Sunglasses</Link>
                    <Link to="/contact-lenses" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Contact Lenses</Link>
                    <Link to="/frames" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 font-medium py-2">Frames</Link>
                  </>
                )}

                {/* Mobile Login Buttons */}
                {!isAuthenticated && (
                  <div className="flex flex-col space-y-2 pt-4">
                    <button
                      onClick={() => handleLoginClick('customer')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Customer Login
                    </button>
                    <button
                      onClick={() => handleLoginClick('supplier')}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Supplier Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        type={loginType}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Header;
