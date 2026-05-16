// Dashboard service for fetching dashboard data from backend API
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';


/** Helper — returns Content-Type + Authorization header for API calls */
function getHeaders(): HeadersInit {
  return authService.getAuthHeaders() as HeadersInit;
}

export interface DashboardData {
  purchases: PurchaseData[];
  sales: SalesData[];
  summary: SummaryStats;
  categoryBreakdown: CategoryData[];
  branchPerformance: BranchData[];
  recentActivity: RecentActivity[];
}

export interface PurchaseData {
  date: string;
  amount: number;
  category: string;
  branch: string;
}

export interface SalesData {
  date: string;
  amount: number;
  cost?: number;
  category: string;
  branch: string;
}

export interface SummaryStats {
  totalPurchases: number;
  totalSales: number;
  netProfit: number;
  profitMargin: number;
  activeCustomers: number;
  monthlyGrowth: number;
}

export interface CategoryData {
  category: string;
  sales: number;
  purchases: number;
  percentage: number;
}

export interface BranchData {
  name: string;
  code: string;
  sales: number;
  purchases: number;
  profit: number;
}

export interface RecentActivity {
  type: string;
  count: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  lastActivity: string;
}

class DashboardService {
  private baseUrl = `${API_BASE_URL}/dashboard`;

  // Get full dashboard data from backend
  async getDashboardData(timeFilter: 'daily' | 'monthly' | 'yearly', year: number): Promise<DashboardData> {
    try {
      const response = await fetch(`${this.baseUrl}?timeFilter=${timeFilter}&year=${year}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return this.transformDashboardData(data);
      }
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Get summary statistics from backend
  async getSummaryStats(timeFilter: 'daily' | 'monthly' | 'yearly', year: number): Promise<SummaryStats> {
    try {
      const response = await fetch(`${this.baseUrl}/summary?timeFilter=${timeFilter}&year=${year}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Failed to fetch summary stats: ${response.status}`);
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      throw error;
    }
  }

  // Get category breakdown from backend
  async getCategoryBreakdown(timeFilter: 'daily' | 'monthly' | 'yearly', year: number): Promise<CategoryData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/category-breakdown?timeFilter=${timeFilter}&year=${year}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Failed to fetch category breakdown: ${response.status}`);
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  }

  // Get branch performance from backend
  async getBranchPerformance(timeFilter: 'daily' | 'monthly' | 'yearly', year: number): Promise<BranchData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/branch-performance?timeFilter=${timeFilter}&year=${year}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Failed to fetch branch performance: ${response.status}`);
    } catch (error) {
      console.error('Error fetching branch performance:', error);
      throw error;
    }
  }

  // Get recent activity from backend
  async getRecentActivity(timeFilter: 'daily' | 'monthly' | 'yearly', year: number): Promise<RecentActivity[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recent-activity?timeFilter=${timeFilter}&year=${year}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Failed to fetch recent activity: ${response.status}`);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  // Transform backend response to frontend format
  private transformDashboardData(data: any): DashboardData {
    return {
      purchases: data.purchases || [],
      sales: data.sales || [],
      summary: data.summary || {
        totalPurchases: 0,
        totalSales: 0,
        netProfit: 0,
        profitMargin: 0,
        activeCustomers: 0,
        monthlyGrowth: 0
      },
      categoryBreakdown: data.categoryBreakdown || [],
      branchPerformance: data.branchPerformance || [],
      recentActivity: data.recentActivity || []
    };
  }

  // Process data for different time periods (for charts)
  processDataByTimeFilter(
    data: DashboardData,
    timeFilter: 'daily' | 'monthly' | 'yearly',
    selectedYear?: number
  ) {
    if (timeFilter === 'yearly') {
      const yearlyData = new Map<number, { purchases: number; sales: number }>();

      data.purchases.forEach(p => {
        const year = parseInt(p.date.split('-')[0]);
        const existing = yearlyData.get(year) || { purchases: 0, sales: 0 };
        existing.purchases += p.amount;
        yearlyData.set(year, existing);
      });

      data.sales.forEach(s => {
        const year = parseInt(s.date.split('-')[0]);
        const existing = yearlyData.get(year) || { purchases: 0, sales: 0 };
        existing.sales += s.amount;
        yearlyData.set(year, existing);
      });

      const years = Array.from(yearlyData.keys()).sort();
      return {
        labels: years.map(y => y.toString()),
        purchases: years.map(y => yearlyData.get(y)?.purchases || 0),
        sales: years.map(y => yearlyData.get(y)?.sales || 0)
      };
    } else if (timeFilter === 'monthly') {
      const monthlyData = new Map<string, { purchases: number; sales: number }>();
      const year = selectedYear || new Date().getFullYear();

      data.purchases.forEach(p => {
        if (p.date.startsWith(year.toString())) {
          const monthKey = p.date.slice(0, 7);
          const existing = monthlyData.get(monthKey) || { purchases: 0, sales: 0 };
          existing.purchases += p.amount;
          monthlyData.set(monthKey, existing);
        }
      });

      data.sales.forEach(s => {
        if (s.date.startsWith(year.toString())) {
          const monthKey = s.date.slice(0, 7);
          const existing = monthlyData.get(monthKey) || { purchases: 0, sales: 0 };
          existing.sales += s.amount;
          monthlyData.set(monthKey, existing);
        }
      });

      const months = Array.from(monthlyData.keys()).sort();
      return {
        labels: months.map(m => {
          const [, month] = m.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames[parseInt(month) - 1];
        }),
        purchases: months.map(m => monthlyData.get(m)?.purchases || 0),
        sales: months.map(m => monthlyData.get(m)?.sales || 0)
      };
    } else {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = selectedYear || new Date().getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const dailyData = new Map<number, { purchases: number; sales: number }>();

      data.purchases.forEach(p => {
        if (p.date.startsWith(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`)) {
          const day = parseInt(p.date.split('-')[2]);
          const existing = dailyData.get(day) || { purchases: 0, sales: 0 };
          existing.purchases += p.amount;
          dailyData.set(day, existing);
        }
      });

      data.sales.forEach(s => {
        if (s.date.startsWith(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`)) {
          const day = parseInt(s.date.split('-')[2]);
          const existing = dailyData.get(day) || { purchases: 0, sales: 0 };
          existing.sales += s.amount;
          dailyData.set(day, existing);
        }
      });

      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      return {
        labels: days.map(d => `Day ${d}`),
        purchases: days.map(d => dailyData.get(d)?.purchases || 0),
        sales: days.map(d => dailyData.get(d)?.sales || 0)
      };
    }
  }

  // Get chart data for different chart types
  getChartData(data: DashboardData, timeFilter: 'daily' | 'monthly' | 'yearly', selectedYear?: number) {
    const processedData = this.processDataByTimeFilter(data, timeFilter, selectedYear);

    return {
      barChart: {
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
      },
      pieChart: {
        labels: data.categoryBreakdown.map(item => item.category),
        datasets: [
          {
            data: data.categoryBreakdown.map(item => item.percentage),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
            ],
            borderWidth: 2,
          },
        ],
      },
    };
  }
}

export default new DashboardService();
