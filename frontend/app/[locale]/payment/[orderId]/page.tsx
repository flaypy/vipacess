'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { paymentAPI, PixPaymentResponse } from '@/lib/api';
import { Link } from '@/i18n/routing';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const locale = params.locale as string;
  const t = useTranslations('payment');

  const [paymentData, setPaymentData] = useState<PixPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Store payment data in sessionStorage for page refresh
  useEffect(() => {
    const storedData = sessionStorage.getItem(`payment_${orderId}`);
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setPaymentData(data);
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse stored payment data');
        setError(t('paymentNotFound'));
        setLoading(false);
      }
    } else {
      setError(t('paymentNotFound'));
      setLoading(false);
    }
  }, [orderId]);

  // Auto-check payment status every 10 seconds
  useEffect(() => {
    if (!paymentData) return;

    const interval = setInterval(async () => {
      try {
        const orderData = await paymentAPI.getOrder(orderId);
        if (orderData.order.status === 'COMPLETED') {
          clearInterval(interval);
          // Redirect to success page
          router.push(`/${locale}/payment/success/${orderId}`);
        } else if (orderData.order.status === 'FAILED') {
          clearInterval(interval);
          setError(t('paymentFailed'));
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [paymentData, orderId, router]);

  const copyPixCode = async () => {
    if (!paymentData) return;

    try {
      await navigator.clipboard.writeText(paymentData.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const manualCheckStatus = async () => {
    if (!paymentData || checkingStatus) return;

    setCheckingStatus(true);
    try {
      const orderData = await paymentAPI.getOrder(orderId);
      if (orderData.order.status === 'COMPLETED') {
        router.push(`/${locale}/payment/success/${orderId}`);
      } else if (orderData.order.status === 'FAILED') {
        setError(t('paymentFailed'));
      }
    } catch (err: any) {
      console.error('Error checking payment status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-emerald"></div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            {error || t('paymentNotFound')}
          </h1>
          <Link href="/store" className="btn-secondary">
            {t('backToStore')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-accent-emerald mb-2">
            {t('pixPayment')}
          </h1>
          <p className="text-gray-400">
            {t('scanQrCode')}
          </p>
        </div>

        {/* Payment Info Card */}
        <div className="card-noir mb-6">
          <div className="border-b border-noir-light pb-4 mb-4">
            <h2 className="text-xl font-bold text-accent-emerald mb-2">
              {paymentData.productName}
            </h2>
            <p className="text-gray-400">{paymentData.priceCategory}</p>
          </div>

          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-300">{t('amountToPay')}:</span>
            <span className="text-3xl font-bold text-accent-gold">
              {paymentData.amount}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="card-noir text-center mb-6">
          <h3 className="text-xl font-bold text-accent-lime mb-4">
            {t('scanWithApp')}
          </h3>

          {paymentData.pixQrCodeBase64 ? (
            <>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    paymentData.pixQrCodeBase64.startsWith('data:')
                      ? paymentData.pixQrCodeBase64
                      : `data:image/png;base64,${paymentData.pixQrCodeBase64}`
                  }
                  alt="PIX QR Code"
                  width={256}
                  height={256}
                  className="rounded"
                  onError={(e) => {
                    console.error('QR Code failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {t('openBankApp')}
              </p>
            </>
          ) : (
            <div className="bg-noir-darker p-8 rounded-lg mb-4">
              <p className="text-gray-400">
                {t('qrCodeNotAvailable')}
              </p>
            </div>
          )}
        </div>

        {/* Copy-Paste Code */}
        <div className="card-noir mb-6">
          <h3 className="text-xl font-bold text-accent-emerald mb-4">
            {t('orCopyCode')}
          </h3>

          <div className="bg-noir-darker p-4 rounded border border-noir-light mb-4">
            <code className="text-sm text-gray-300 break-all">
              {paymentData.pixCode}
            </code>
          </div>

          <button
            onClick={copyPixCode}
            className={`btn-primary w-full ${copied ? 'bg-green-600' : ''}`}
          >
            {copied ? t('copied') : t('copyPixCode')}
          </button>

          <p className="text-sm text-gray-500 mt-4 whitespace-pre-line">
            {t('instructions')}
          </p>
        </div>

        {/* Status Check */}
        <div className="card-noir text-center">
          <p className="text-gray-400 mb-4">
            {t('waitingConfirmation')}
          </p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-accent-emerald"></div>
            <span className="text-sm text-gray-500">
              {t('checkingStatus')}
            </span>
          </div>

          <button
            onClick={manualCheckStatus}
            disabled={checkingStatus}
            className="btn-secondary"
          >
            {checkingStatus ? t('checking') : t('checkStatusNow')}
          </button>

          <p className="text-xs text-gray-600 mt-4">
            {t('paymentExpires')}: {paymentData.expiresAt ? new Date(paymentData.expiresAt).toLocaleString() : 'N/A'}
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link href="/store" className="text-accent-emerald hover:underline">
            ← {t('backToStore')}
          </Link>
        </div>
      </div>
    </div>
  );
}
