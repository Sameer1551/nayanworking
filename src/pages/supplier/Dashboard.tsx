import React, { useState, useEffect, useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import authService from '../../services/authService';
import dashboardService, { DashboardData } from '../../services/dashboardService';
// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type TimeFilter = 'daily' | 'monthly' | 'yearly';

const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentUser = authService.getUser();
  const isAdmin = currentUser?.userType === 'admin';
  const dashboardTitle = isAdmin ? 'Admin Dashboard' : 'Supplier Dashboard';

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch dashboard data
  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await dashboardService.getDashboardData(timeFilter, selectedYear);
      console.log('Raw dashboard data received:', data);
      console.log('Dashboard summary:', data.summary);
      console.log('Dashboard sales:', data.sales);
      console.log('Dashboard purchases:', data.purchases);
      setDashboardData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setFetchError('Failed to load dashboard data from the server. Please check your connection and try refreshing.');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter, selectedYear]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [timeFilter, selectedYear]);

  // Navigation handlers for quick actions
  const handleCreateInvoice = () => {
    navigate('/supplier/billing');
  };

  const handleAddCustomer = () => {
    navigate('/supplier/customers');
  };

  const handleRecordPurchase = () => {
    navigate('/supplier/purchase');
  };

  const handleBulkPurchase = () => {
    navigate('/supplier/bulk-purchase');
  };

  const handleViewReports = () => {
    navigate('/supplier/data');
  };

  // Navigation handlers for summary cards
  const handleViewPurchases = () => {
    navigate('/supplier/purchase-history');
  };

  const handleViewSales = () => {
    navigate('/supplier/billing-records');
  };

  const handleViewInventory = () => {
    navigate('/supplier/inventory');
  };

  const handleViewCustomers = () => {
    navigate('/supplier/customers');
  };

  // Navigation handlers for branch performance
  const handleViewBranchDetails = (branchCode: string) => {
    navigate(`/supplier/data?branch=${branchCode}`);
  };



  // Process data based on time filter
  const processedData = useMemo(() => {
    if (!dashboardData) return { labels: [], purchases: [], sales: [] };
    
    // Use the dashboard service to process data properly
    try {
      const result = dashboardService.processDataByTimeFilter(dashboardData, timeFilter, selectedYear);
      console.log('Dashboard service processed data:', result);
      return result;
    } catch (error) {
      console.error('Error processing data:', error);
      // Fallback to improved processing
      if (timeFilter === 'monthly') {
        // Group by month for the selected year
        const monthlyData = new Map<string, { purchases: number; sales: number }>();
        
        dashboardData.purchases.forEach(item => {
          if (item.date.startsWith(selectedYear.toString())) {
            const month = item.date.substring(0, 7); // YYYY-MM format
            const existing = monthlyData.get(month) || { purchases: 0, sales: 0 };
            existing.purchases += item.amount;
            monthlyData.set(month, existing);
          }
        });
        
        dashboardData.sales.forEach(item => {
          if (item.date.startsWith(selectedYear.toString())) {
            const month = item.date.substring(0, 7); // YYYY-MM format
            const existing = monthlyData.get(month) || { purchases: 0, sales: 0 };
            existing.sales += item.amount;
            monthlyData.set(month, existing);
          }
        });
        
        const months = Array.from(monthlyData.keys()).sort();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const result = {
          labels: months.map(m => {
            const monthNum = parseInt(m.split('-')[1]) - 1;
            return monthNames[monthNum];
          }),
          purchases: months.map(m => monthlyData.get(m)?.purchases || 0),
          sales: months.map(m => monthlyData.get(m)?.sales || 0)
        };
        console.log('Fallback monthly processing:', { monthlyData, result });
        return result;
      } else if (timeFilter === 'yearly') {
        // Group by year
        const yearlyData = new Map<number, { purchases: number; sales: number }>();
        
        dashboardData.purchases.forEach(item => {
          const year = parseInt(item.date.split('-')[0]);
          const existing = yearlyData.get(year) || { purchases: 0, sales: 0 };
          existing.purchases += item.amount;
          yearlyData.set(year, existing);
        });
        
        dashboardData.sales.forEach(item => {
          const year = parseInt(item.date.split('-')[0]);
          const existing = yearlyData.get(year) || { purchases: 0, sales: 0 };
          existing.sales += item.amount;
          yearlyData.set(year, existing);
        });
        
        const years = Array.from(yearlyData.keys()).sort();
        const result = {
          labels: years.map(y => y.toString()),
          purchases: years.map(y => yearlyData.get(y)?.purchases || 0),
          sales: years.map(y => yearlyData.get(y)?.sales || 0)
        };
        console.log('Fallback yearly processing:', { yearlyData, result });
        return result;
      } else {
        // Daily - group by day for current month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthPrefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        
        const dailyData = new Map<number, { purchases: number; sales: number }>();
        
        dashboardData.purchases.forEach(item => {
          if (item.date.startsWith(monthPrefix)) {
            const day = parseInt(item.date.split('-')[2]);
            const existing = dailyData.get(day) || { purchases: 0, sales: 0 };
            existing.purchases += item.amount;
            dailyData.set(day, existing);
          }
        });
        
        dashboardData.sales.forEach(item => {
          if (item.date.startsWith(monthPrefix)) {
            const day = parseInt(item.date.split('-')[2]);
            const existing = dailyData.get(day) || { purchases: 0, sales: 0 };
            existing.sales += item.amount;
            dailyData.set(day, existing);
          }
        });
        
        const days = Array.from({ length: 30 }, (_, i) => i + 1);
        const result = {
          labels: days.map(d => `Day ${d}`),
          purchases: days.map(d => dailyData.get(d)?.purchases || 0),
          sales: days.map(d => dailyData.get(d)?.sales || 0)
        };
        console.log('Fallback daily processing:', { dailyData, result });
        return result;
      }
    }
  }, [dashboardData, timeFilter, selectedYear]);

  // Chart data for bar chart
  const barChartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Purchases',
        data: processedData.purchases,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Sales',
        data: processedData.sales,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Chart data for pie chart
  const pieChartData = {
    labels: dashboardData?.categoryBreakdown?.map(item => item.category) || [],
    datasets: [
      {
        data: dashboardData?.categoryBreakdown?.map(item => item.percentage) || [],
        backgroundColor: (() => {
          // Dynamic color generation for categories
          const categories = dashboardData?.categoryBreakdown?.map(item => item.category) || [];
          const colorPalette = [
            'rgba(59, 130, 246, 0.8)',   // Blue
            'rgba(16, 185, 129, 0.8)',  // Green
            'rgba(245, 158, 11, 0.8)',  // Yellow/Orange
            'rgba(239, 68, 68, 0.8)',   // Red
            'rgba(139, 92, 246, 0.8)',  // Purple
            'rgba(236, 72, 153, 0.8)',  // Pink
            'rgba(34, 197, 94, 0.8)',   // Emerald
            'rgba(251, 146, 60, 0.8)',  // Orange
            'rgba(6, 182, 212, 0.8)',   // Cyan
            'rgba(168, 85, 247, 0.8)',  // Violet
            'rgba(34, 197, 94, 0.8)',   // Lime
            'rgba(249, 115, 22, 0.8)',  // Amber
          ];
          
          return categories.map((_, index) => colorPalette[index % colorPalette.length]);
        })(),
        borderColor: (() => {
          // Dynamic border color generation for categories
          const categories = dashboardData?.categoryBreakdown?.map(item => item.category) || [];
          const borderColorPalette = [
            'rgba(59, 130, 246, 1)',   // Blue
            'rgba(16, 185, 129, 1)',  // Green
            'rgba(245, 158, 11, 1)',  // Yellow/Orange
            'rgba(239, 68, 68, 1)',   // Red
            'rgba(139, 92, 246, 1)',  // Purple
            'rgba(236, 72, 153, 1)',  // Pink
            'rgba(34, 197, 94, 1)',   // Emerald
            'rgba(251, 146, 60, 1)',  // Orange
            'rgba(6, 182, 212, 1)',   // Cyan
            'rgba(168, 85, 247, 1)',  // Violet
            'rgba(34, 197, 94, 1)',   // Lime
            'rgba(249, 115, 22, 1)',  // Amber
          ];
          
          return categories.map((_, index) => borderColorPalette[index % borderColorPalette.length]);
        })(),
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      title: {
        display: true,
        text: `${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Purchase vs Sales Trend`,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return '₹' + (value / 1000).toFixed(0) + 'K';
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      title: {
        display: true,
        text: 'Sales by Category (Quantity)',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      },
    },
  };

  // Calculate summary statistics
  const totalPurchases = dashboardData?.summary.totalPurchases || 0;
  const totalSales = dashboardData?.summary.totalSales || 0;
  const netProfit = dashboardData?.summary.netProfit || 0; // Use the correct net profit from service
  const profitMargin = dashboardData?.summary.profitMargin || 0; // Use the correct profit margin from service

  console.log('Dashboard summary data:', {
    totalPurchases,
    totalSales,
    netProfit,
    profitMargin,
    summary: dashboardData?.summary
  });

  // Check if there's any data to display
  const hasData = dashboardData && (
    dashboardData.purchases.length > 0 || 
    dashboardData.sales.length > 0 || 
    dashboardData.summary.activeCustomers > 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show empty state when no data exists
  if (!hasData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              {dashboardTitle}
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back! Here's your business overview and analytics.
            </p>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">No Data Available</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your dashboard is currently empty because there are no purchase records, sales records, or customer data. 
              Start by adding some data to see your business analytics here.
            </p>
            
            {/* Quick Actions for Empty State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <button 
                onClick={handleRecordPurchase}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Record Purchase
              </button>
              <button 
                onClick={handleBulkPurchase}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Bulk Purchase
              </button>
              <button 
                onClick={handleCreateInvoice}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Create Invoice
              </button>
              <button 
                onClick={handleAddCustomer}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Add Customer
              </button>
              <button 
                onClick={handleViewInventory}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Manage Inventory
              </button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>No records found in the database. Start by recording a purchase or creating an invoice.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                {dashboardTitle}
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back! Here's your business overview and analytics.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <div className="text-xs text-gray-500 text-right">
                <div>Last updated:</div>
                <div>{lastRefresh.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fetch error banner */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{fetchError}</span>
            <button
              onClick={() => setFetchError(null)}
              className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Time Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">Time Period:</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              {timeFilter !== 'yearly' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = [];
                    for (let y = 2023; y <= currentYear + 1; y++) {
                      years.push(y);
                    }
                    return years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ));
                  })()}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {showNotification && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-4 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
                <span className="font-medium">System Update: New inventory tracking features available</span>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <span className="text-sm">Dismiss</span>
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={handleViewPurchases}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalPurchases > 0 ? `₹${totalPurchases.toLocaleString()}` : '₹0'}
                </p>
                <p className="text-sm text-gray-500">This {timeFilter}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view purchase history →
            </div>
          </div>

          <div 
            onClick={handleViewSales}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSales > 0 ? `₹${totalSales.toLocaleString()}` : '₹0'}
                </p>
                <p className="text-sm text-gray-500">This {timeFilter}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-red-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view sales history →
            </div>
          </div>

          <div 
            onClick={handleViewInventory}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {netProfit > 0 ? `₹${netProfit.toLocaleString()}` : '₹0'}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {profitMargin > 0 ? `+${profitMargin}% margin` : 'No sales data'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view inventory →
            </div>
          </div>

          <div 
            onClick={handleViewCustomers}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.summary.activeCustomers > 0 ? 
                    dashboardData.summary.activeCustomers.toLocaleString() : '0'
                  }
                </p>
                <p className="text-sm text-purple-600 font-medium">
                  {dashboardData?.summary.monthlyGrowth > 0 ? 
                    `+${dashboardData.summary.monthlyGrowth}% this month` : 'No growth data'
                  }
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view customers →
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Purchase vs Sales Trend</h3>
            </div>
            <div className="h-80">
              {processedData.labels.length > 0 && (processedData.purchases.some((p: number) => p > 0) || processedData.sales.some((s: number) => s > 0)) ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No Data Available</p>
                    <p className="text-sm">Add purchase and sales records to see trends</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Time filter: {timeFilter}, Year: {selectedYear}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chart Summary */}
            {processedData.labels.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-600 font-medium">Total Purchases</p>
                  <p className="text-lg font-bold text-blue-800">
                    ₹{(dashboardData?.summary.totalPurchases || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-medium">Total Sales</p>
                  <p className="text-lg font-bold text-red-800">
                    ₹{(dashboardData?.summary.totalSales || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Sales Distribution (by Quantity)</h3>
            </div>
            <div className="h-80">
              {dashboardData?.categoryBreakdown && dashboardData.categoryBreakdown.length > 0 ? (
                <>
                  <Pie data={pieChartData} options={pieChartOptions} />
                  <div className="text-center mt-4 text-sm text-gray-600">
                    <p>Chart shows the number of items sold in each category</p>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No Category Data</p>
                    <p className="text-sm">Add sales records to see category breakdown</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={handleCreateInvoice}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Create New Invoice
              </button>
              <button 
                onClick={handleAddCustomer}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Add Customer
              </button>
              <button 
                onClick={handleRecordPurchase}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Record Purchase
              </button>
              <button 
                onClick={handleBulkPurchase}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Bulk Purchase
              </button>
              <button 
                onClick={handleViewReports}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                View Reports
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Recent Activity (Last 24 Hours)
            </h3>
            <div className="space-y-3">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      // Handle different activity types
                      switch (activity.type) {
                        case 'purchase':
                          navigate('/supplier/purchase');
                          break;
                        case 'sale':
                          navigate('/supplier/billing');
                          break;
                        case 'customer':
                          navigate('/supplier/customers');
                          break;
                        default:
                          break;
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-all cursor-pointer group ${
                      activity.color === 'green' ? 'bg-green-50 hover:bg-green-100' :
                      activity.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100' :
                      activity.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100' :
                      'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activity.color === 'green' ? 'bg-green-500' :
                      activity.color === 'blue' ? 'bg-blue-500' :
                      activity.color === 'purple' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{activity.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        activity.color === 'green' ? 'text-green-600' :
                        activity.color === 'blue' ? 'text-blue-600' :
                        activity.color === 'purple' ? 'text-purple-600' :
                        'text-gray-600'
                      }`}>
                        {activity.count}
                      </div>
                      <div className="text-xs text-gray-400">{activity.lastActivity}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs">Activities will appear here as they occur</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Monthly Growth</span>
                  <span className="text-sm font-medium text-green-600">
                    {dashboardData?.summary.monthlyGrowth > 0 ? 
                      `+${dashboardData.summary.monthlyGrowth}%` : '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: `${Math.min((dashboardData?.summary.monthlyGrowth || 0) * 5, 100)}%` }}>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-medium text-blue-600">
                    {dashboardData?.summary.activeCustomers > 0 ? '4.8/5.0' : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: dashboardData?.summary.activeCustomers > 0 ? '96%' : '0%' }}>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Inventory Turnover</span>
                  <span className="text-sm font-medium text-purple-600">
                    {dashboardData?.summary.totalSales > 0 ? '8.2x' : '0x'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: dashboardData?.summary.totalSales > 0 ? '82%' : '0%' }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Branch Performance</h3>
          {dashboardData?.branchPerformance && dashboardData.branchPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {dashboardData.branchPerformance.map((branch) => (
                <div 
                  key={branch.code} 
                  onClick={() => handleViewBranchDetails(branch.code)}
                  className="text-center group hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                    <span className="text-2xl font-bold text-blue-600">{branch.code.charAt(0)}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{branch.name}</h4>
                  <p className="text-sm text-gray-600">₹{(branch.sales / 100000).toFixed(1)}L sales</p>
                  <p className="text-xs text-green-600 font-medium">₹{(branch.profit / 100000).toFixed(1)}L profit</p>
                  <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for details →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">No Branch Data Available</h4>
              <p className="text-sm text-gray-500 mb-6">Add purchase and sales records with branch information to see performance metrics</p>
              <button 
                onClick={handleRecordPurchase}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Recording Data
              </button>
            </div>
          )}
        </div>

        {/* Footer with additional info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Dashboard auto-refreshes every 30 seconds • Last updated: {lastRefresh.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
