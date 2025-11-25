'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminAPI, Order } from '@/lib/api';

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await adminAPI.getOrders();
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-emerald"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-accent-emerald">{t('orders')}</h2>

      {orders.length === 0 ? (
        <div className="card-noir text-center py-16">
          <p className="text-gray-400 text-lg">{t('noOrders')}</p>
        </div>
      ) : (
        <div className="card-noir overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-noir-light">
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">{t('customer')}</th>
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">{t('orderStatus')}</th>
                <th className="text-left py-3 px-4">{t('orderDate')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-noir-medium">
                  <td className="py-3 px-4 font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4">{order.user?.email || 'N/A'}</td>
                  <td className="py-3 px-4">
                    {order.price?.product?.name || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {order.price?.amount} {order.price?.currency}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
