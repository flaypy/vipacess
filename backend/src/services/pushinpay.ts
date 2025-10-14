import axios, { AxiosInstance } from 'axios';

interface PushinPayConfig {
  token: string;
  environment: 'production' | 'sandbox';
}

interface CreatePixPaymentRequest {
  value: number; // Amount in cents (minimum 50)
  webhook_url?: string;
  expires_in?: number; // Expiration time in seconds
  split_rules?: Array<{
    account_id: string;
    percentage: number;
  }>;
}

interface CreatePixPaymentResponse {
  id: string;
  qr_code: string; // Full PIX payment code (copy-paste)
  qr_code_base64: string; // Base64 encoded QR code image
  status: 'created' | 'paid' | 'expired';
  value: number;
  created_at: string;
  expires_at: string;
}

interface TransactionStatusResponse {
  id: string;
  status: 'created' | 'paid' | 'expired';
  value: number;
  end_to_end_id?: string; // Central Bank transaction ID (available after payment)
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

interface WebhookPayload {
  id: string;
  status: 'paid' | 'expired';
  value: number;
  end_to_end_id?: string;
  paid_at?: string;
}

/**
 * PushinPay API Service
 * Official documentation: https://app.theneo.io/pushinpay/pix
 *
 * Environment URLs:
 * - Production: https://api.pushinpay.com.br
 * - Sandbox: https://api-sandbox.pushinpay.com.br
 */
export class PushinPayService {
  private client: AxiosInstance;
  private token: string;
  private baseURL: string;

  constructor(config: PushinPayConfig) {
    this.token = config.token;
    this.baseURL =
      config.environment === 'production'
        ? 'https://api.pushinpay.com.br'
        : 'https://api-sandbox.pushinpay.com.br';

    console.log('PushinPay Service initialized:', {
      baseURL: this.baseURL,
      environment: config.environment,
      hasToken: !!this.token,
      tokenPrefix: this.token.substring(0, 10) + '...',
    });

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Create a new PIX payment
   * Generates QR code and copy-paste PIX code
   *
   * @param amountInCents - Amount in cents (minimum 50 cents = R$ 0.50)
   * @param webhookUrl - Optional webhook URL for payment notifications
   * @param expiresInMinutes - Expiration time in minutes (default: 30)
   * @returns Payment data with QR code
   */
  async createPixPayment(
    amountInCents: number,
    webhookUrl?: string,
    expiresInMinutes: number = 30
  ): Promise<CreatePixPaymentResponse> {
    if (amountInCents < 50) {
      throw new Error('Minimum transaction amount is 50 cents (R$ 0.50)');
    }

    try {
      const payload: CreatePixPaymentRequest = {
        value: amountInCents,
        expires_in: expiresInMinutes * 60, // Convert minutes to seconds
      };

      if (webhookUrl) {
        payload.webhook_url = webhookUrl;
      }

      console.log('Creating PIX payment:', {
        url: `${this.baseURL}/api/pix/cashIn`,
        payload,
        headers: {
          Authorization: `Bearer ${this.token.substring(0, 10)}...`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const response = await this.client.post<CreatePixPaymentResponse>(
        '/api/pix/cashIn',
        payload
      );

      console.log('PIX payment created successfully:', {
        transactionId: response.data.id,
        status: response.data.status,
      });

      return response.data;
    } catch (error: any) {
      console.error('PushinPay API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      });
      throw new Error(
        `Failed to create PIX payment: ${error.response?.data?.message || error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Check transaction status
   * NOTE: Limited to once per minute to avoid account blocking
   *
   * @param transactionId - Transaction ID returned from createPixPayment
   * @returns Transaction status
   */
  async getTransactionStatus(
    transactionId: string
  ): Promise<TransactionStatusResponse> {
    try {
      const response = await this.client.get<TransactionStatusResponse>(
        `/api/transactions/${transactionId}`
      );

      return response.data;
    } catch (error: any) {
      console.error('PushinPay API Error:', error.response?.data || error.message);
      throw new Error(
        `Failed to get transaction status: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Verify webhook signature (if implemented by PushinPay)
   * This is a placeholder - implement according to PushinPay's webhook security docs
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implement signature verification if PushinPay provides it
    // For now, we'll verify the webhook URL in the route middleware
    return true;
  }

  /**
   * Parse webhook payload
   */
  // backend/src/services/pushinpay.ts

  parseWebhookPayload(payload: any): WebhookPayload {
    // The transaction ID is nested inside a `transaction` object in the webhook payload.
    // We log the entire payload to be sure.
    console.log('Full raw webhook payload from PushinPay:', JSON.stringify(payload, null, 2));

    const transactionId = payload.transaction?.id || payload.transaction_id;

    if (!transactionId) {
      console.error('CRITICAL: Could not find `transaction.id` or `transaction_id` in the webhook payload.');
      throw new Error('Transaction ID not found in webhook payload');
    }

    console.log(`Successfully extracted transactionId: ${transactionId}`);

    return {
      id: transactionId,
      status: payload.status,
      value: payload.value,
      end_to_end_id: payload.end_to_end_id,
      paid_at: payload.paid_at,
    };
  }

  /**
   * Format amount from cents to BRL currency string
   */
  static formatCurrency(amountInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amountInCents / 100);
  }

  /**
   * Convert price amount to cents
   */
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }
}

// Export singleton instance
let pushinPayService: PushinPayService | null = null;

export function getPushinPayService(): PushinPayService {
  if (!pushinPayService) {
    const token = process.env.PUSHINPAY_TOKEN;
    const environment = (process.env.NODE_ENV === 'production'
      ? 'production'
      : 'sandbox') as 'production' | 'sandbox';

    if (!token) {
      throw new Error('PUSHINPAY_TOKEN environment variable is not set');
    }

    pushinPayService = new PushinPayService({
      token,
      environment,
    });
  }

  return pushinPayService;
}
