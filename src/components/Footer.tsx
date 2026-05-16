import React from 'react';
import { Eye, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Building, Users, Package, BarChart3 } from 'lucide-react';
import authService from '../services/authService';

const Footer = () => {
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const isSupplier = isAuthenticated && user?.userType === 'supplier';

  // Supplier-specific data
  const supplierData = {
    companyName: user?.companyName || 'Nayan Eye Care',
    businessAddress: user?.businessAddress || '123 Eye Care Street, Mumbai, Maharashtra 400001',
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'info@nayaneyecare.com',
    gstNumber: user?.gstNumber || '27ABCDE1234F1Z5'
  };

  // Customer-focused quick links
  const customerQuickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Spectacles', href: '/spectacles' },
    { name: 'Sunglasses', href: '/sunglasses' },
    { name: 'Contact Lenses', href: '/contact-lenses' },
    { name: 'Frames', href: '/frames' },
    { name: 'Eye Tests', href: '#' }
  ];

  // Supplier-focused quick links
  const supplierQuickLinks = [
    { name: 'Dashboard', href: '/supplier/dashboard', icon: BarChart3 },
    { name: 'Billing', href: '/supplier/billing', icon: Package },
    { name: 'Customers', href: '/supplier/customers', icon: Users },
    { name: 'Inventory', href: '/supplier/inventory', icon: Package },
    { name: 'Purchase', href: '/supplier/purchase', icon: Building },
    { name: 'Sales Data', href: '/supplier/data', icon: BarChart3 }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">
                {isSupplier ? supplierData.companyName : 'Nayan Eye Care'}
              </span>
            </div>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              {isSupplier 
                ? `Your trusted partner for premium eyewear solutions. Managing inventory, sales, and customer relationships with excellence.`
                : 'Your trusted partner for premium eyewear solutions. Serving customers across India with quality spectacles, sunglasses, and contact lenses.'
              }
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-3">
              {isSupplier ? 'Supplier Portal' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {(isSupplier ? supplierQuickLinks : customerQuickLinks).map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2"
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span>{link.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-3">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">
                    {isSupplier ? supplierData.businessAddress.split(',')[0] : '123 Eye Care Street,'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {isSupplier 
                      ? supplierData.businessAddress.split(',').slice(1).join(',').trim()
                      : 'Mumbai, Maharashtra 400001'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <p className="text-gray-400 text-sm">{supplierData.phone}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <p className="text-gray-400 text-sm">{supplierData.email}</p>
              </div>
              {isSupplier && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">GST: {supplierData.gstNumber}</p>
                </div>
              )}
            </div>
            
            {/* Newsletter - Only show for customers */}
            {!isSupplier && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Newsletter</h4>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-l text-sm focus:outline-none focus:border-blue-400"
                  />
                  <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-r text-sm transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            )}

            {/* Supplier-specific info */}
            {isSupplier && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-sm">Business Hours</h4>
                <div className="text-gray-400 text-sm space-y-1">
                  <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                  <p>Saturday: 9:00 AM - 6:00 PM</p>
                  <p>Sunday: 10:00 AM - 4:00 PM</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-gray-400 text-xs text-center sm:text-left">
              © 2025 {isSupplier ? supplierData.companyName : 'Nayan Eye Care'}. All rights reserved. | 
              GST: {supplierData.gstNumber}
            </p>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-gray-400 text-xs">Payment Methods:</span>
              <div className="flex space-x-1">
                <span className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300">UPI</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300">Cards</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded text-xs text-gray-300">Wallets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;