'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    failedOrders: number;
    conversionRate: number;
    uniqueCustomers: number;
    averageOrderValue: number;
  };
  revenueByProduct: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orders: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    orders: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
  recentOrders: any[];
}

interface Product {
  id: string;
  name: string;
}

const COLORS = ['#D4AF37', '#FFD700', '#C5A572', '#B8860B', '#DAA520', '#F0E68C'];

export default function AnalyticsPage() {
  const t = useTranslations('admin.analytics');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d' | '1y'>('30d');
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    productId: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Update filters when period changes
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'today':
        startDate = now;
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }

    setFilters({
      ...filters,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    });
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.productId) params.append('productId', filters.productId);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-gold"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-gray-400 py-8">
        {t('noData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-serif font-bold text-accent-gold mb-2">
          {t('title')}
        </h2>
        <p className="text-gray-400">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
        <h3 className="text-lg font-semibold text-accent-gold mb-4">
          {t('filters')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t('period')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === 'today'
                    ? 'bg-accent-gold text-noir-darker'
                    : 'bg-noir-darker text-gray-300 hover:bg-noir-lighter'
                }`}
              >
                {t('today')}
              </button>
              <button
                onClick={() => setSelectedPeriod('7d')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === '7d'
                    ? 'bg-accent-gold text-noir-darker'
                    : 'bg-noir-darker text-gray-300 hover:bg-noir-lighter'
                }`}
              >
                {t('last7Days')}
              </button>
              <button
                onClick={() => setSelectedPeriod('30d')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === '30d'
                    ? 'bg-accent-gold text-noir-darker'
                    : 'bg-noir-darker text-gray-300 hover:bg-noir-lighter'
                }`}
              >
                {t('last30Days')}
              </button>
              <button
                onClick={() => setSelectedPeriod('1y')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === '1y'
                    ? 'bg-accent-gold text-noir-darker'
                    : 'bg-noir-darker text-gray-300 hover:bg-noir-lighter'
                }`}
              >
                {t('last1Year')}
              </button>
            </div>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t('product')}
            </label>
            <select
              value={filters.productId}
              onChange={(e) =>
                setFilters({ ...filters, productId: e.target.value })
              }
              className="w-full px-4 py-2 bg-noir-darker border border-noir-lighter rounded-lg text-gray-300 focus:outline-none focus:border-accent-gold"
            >
              <option value="">{t('allProducts')}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('totalRevenue')}
          </h3>
          <p className="text-3xl font-bold text-accent-gold">
            {formatCurrency(analytics.summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('totalOrders')}
          </h3>
          <p className="text-3xl font-bold text-green-400">
            {analytics.summary.totalOrders}
          </p>
        </div>
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('conversionRate')}
          </h3>
          <p className="text-3xl font-bold text-blue-400">
            {analytics.summary.conversionRate}%
          </p>
        </div>
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('averageOrderValue')}
          </h3>
          <p className="text-3xl font-bold text-purple-400">
            {formatCurrency(analytics.summary.averageOrderValue)}
          </p>
        </div>
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('uniqueCustomers')}
          </h3>
          <p className="text-3xl font-bold text-indigo-400">
            {analytics.summary.uniqueCustomers}
          </p>
        </div>
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('pendingOrders')}
          </h3>
          <p className="text-3xl font-bold text-yellow-400">
            {analytics.summary.pendingOrders}
          </p>
        </div>
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t('failedOrders')}
          </h3>
          <p className="text-3xl font-bold text-red-400">
            {analytics.summary.failedOrders}
          </p>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
        <h3 className="text-lg font-semibold text-accent-gold mb-4">
          {t('dailyRevenue')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tickFormatter={(value) => formatDate(value)}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#D4AF37' }}
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#D4AF37"
              strokeWidth={2}
              name={t('revenue')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Product and Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Product */}
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-lg font-semibold text-accent-gold mb-4">
            {t('revenueByProduct')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueByProduct}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="productName" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#D4AF37" name={t('revenue')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Category */}
        <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
          <h3 className="text-lg font-semibold text-accent-gold mb-4">
            {t('revenueByCategory')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.revenueByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) =>
                  `${props.category}: ${formatCurrency(props.revenue as number)}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {analytics.revenueByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Product Table */}
      <div className="bg-noir-light rounded-lg p-6 border border-noir-lighter">
        <h3 className="text-lg font-semibold text-accent-gold mb-4">
          {t('productPerformance')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-noir-lighter">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  {t('product')}
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  {t('orders')}
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  {t('revenue')}
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  {t('avgOrderValue')}
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.revenueByProduct.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b border-noir-darker hover:bg-noir-darker transition-colors"
                >
                  <td className="py-3 px-4 text-gray-300">
                    {product.productName}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">
                    {product.orders}
                  </td>
                  <td className="py-3 px-4 text-right text-accent-gold font-semibold">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">
                    {formatCurrency(product.revenue / product.orders)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
