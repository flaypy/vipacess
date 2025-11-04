'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { paymentAPI, Order } from '@/lib/api';
import { Link } from '@/i18n/routing';

export default function PaymentSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const t = useTranslations('payment');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'not_found' | 'network' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [downloadCopied, setDownloadCopied] = useState(false);

  useEffect(() => {
    fetchOrderWithRetry();
  }, [orderId]);

  const fetchOrderWithRetry = async (manualRetry = false) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo

    if (manualRetry) {
      setRetrying(true);
      setError(null);
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Verifica se o token existe antes de fazer a requisição
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            console.error('No auth token found');
            setErrorType('auth');
            setError('Authentication token missing. Please refresh the page.');
            setLoading(false);
            setRetrying(false);
            return;
          }
        }

        console.log(`Fetching order (attempt ${attempt + 1}/${maxRetries + 1})...`);
        const data = await paymentAPI.getOrder(orderId);

        // Sucesso!
        setOrder(data.order);
        setError(null);
        setRetryCount(0);
        console.log('Order fetched successfully:', data.order);
        break;

      } catch (err: any) {
        const status = err.response?.status;
        const errorMessage = err.response?.data?.error;

        console.error(`Fetch attempt ${attempt + 1} failed:`, {
          status,
          message: errorMessage,
          fullError: err
        });

        // Determinar o tipo de erro
        if (status === 403) {
          setErrorType('auth');
          setError('Access denied. Your session may have expired.');
        } else if (status === 404) {
          setErrorType('not_found');
          setError('Order not found.');
        } else if (status === 401) {
          setErrorType('auth');
          setError('Authentication failed. Please refresh the page.');
        } else if (!status || status >= 500) {
          setErrorType('network');
          setError('Server error. Retrying...');
        } else {
          setErrorType('unknown');
          setError(errorMessage || 'Failed to load order');
        }

        // Se não for o último attempt, aguarda e tenta novamente
        if (attempt < maxRetries) {
          // Não faz retry em erros de auth ou not found
          if (status === 403 || status === 404 || status === 401) {
            console.log('Not retrying due to auth/not-found error');
            break;
          }

          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          setRetryCount(attempt + 1);
        } else {
          console.error('Max retries reached');
        }
      }
    }

    setLoading(false);
    setRetrying(false);
  };

  const copyDownloadLink = async () => {
    if (!order?.downloadLink) return;

    try {
      await navigator.clipboard.writeText(order.downloadLink);
      setDownloadCopied(true);
      setTimeout(() => setDownloadCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading order details...</p>
          {retryCount > 0 && (
            <p className="text-sm text-accent-rose mt-2">
              Retry attempt {retryCount}...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card-noir text-center">
            {/* Ícone de erro */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 mb-4">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-red-400 mb-2">
              {errorType === 'auth' && 'Authentication Error'}
              {errorType === 'not_found' && 'Order Not Found'}
              {errorType === 'network' && 'Connection Error'}
              {errorType === 'unknown' && 'Error Loading Order'}
            </h1>

            <p className="text-gray-400 mb-6">
              {error || 'Failed to load order details'}
            </p>

            {/* Botões de ação */}
            <div className="space-y-3">
              {/* Mostrar botão de retry para erros de rede */}
              {(errorType === 'network' || errorType === 'unknown') && (
                <button
                  onClick={() => {
                    setLoading(true);
                    fetchOrderWithRetry(true);
                  }}
                  disabled={retrying}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Retrying...
                    </span>
                  ) : (
                    'Try Again'
                  )}
                </button>
              )}

              {/* Para erros de auth, sugerir refresh */}
              {errorType === 'auth' && (
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary w-full"
                >
                  Refresh Page
                </button>
              )}

              <Link href="/store" className="btn-secondary block">
                Back to Store
              </Link>
            </div>

            {/* Informações de debug */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-noir-light text-left">
                <p className="text-xs text-gray-600 mb-2">Debug Info:</p>
                <pre className="text-xs text-gray-500 bg-noir-darker p-2 rounded overflow-auto">
                  {JSON.stringify({ errorType, orderId, hasToken: !!localStorage.getItem('auth_token') }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-600 mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-serif font-bold text-accent-gold mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-400">
            Your payment has been confirmed
          </p>
        </div>

        {/* Order Details */}
        <div className="card-noir mb-6">
          <div className="border-b border-noir-light pb-4 mb-4">
            <h2 className="text-xl font-bold text-accent-gold mb-2">
              Order Details
            </h2>
            <p className="text-gray-400 text-sm">Order ID: {order.id}</p>
          </div>

          {order.price && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Product:</span>
                <span className="text-gray-200 font-semibold">
                  {order.price.product?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality:</span>
                <span className="text-gray-200">{order.price.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount Paid:</span>
                <span className="text-accent-rose font-bold text-lg">
                  {order.price.currency} {order.price.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-500 font-semibold">
                  {order.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Download Link */}
        {order.downloadLink && (
          <div className="card-noir mb-6">
            <h3 className="text-xl font-bold text-accent-purple mb-4">
              Download Your Content
            </h3>

            <div className="bg-noir-darker p-4 rounded border border-noir-light mb-4">
              <code className="text-sm text-gray-300 break-all">
                {order.downloadLink}
              </code>
            </div>

            <div className="flex gap-4">
              <a
                href={order.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-center"
              >
                Download Now
              </a>

              <button
                onClick={copyDownloadLink}
                className={`btn-secondary ${downloadCopied ? 'bg-green-600' : ''}`}
              >
                {downloadCopied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              💡 Tip: Save this link! You can access your download anytime.
            </p>

            <div className="mt-6 pt-6 border-t border-noir-light text-center">
              <a
                href="https://t.me/SUPORTEPARADISE02"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent-gold hover:text-accent-rose transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"></path>
                </svg>
                <span className="font-semibold">{t('support')}</span>
              </a>
              <p className="text-sm text-gray-500 mt-2">
                {t('needHelp')}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="text-center space-y-4">
          <Link href="/store" className="btn-secondary inline-block">
            Browse More Products
          </Link>

          <p className="text-sm text-gray-600">
            Thank you for your purchase! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
