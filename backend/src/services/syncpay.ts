import axios, { AxiosInstance } from 'axios';
import QRCode from 'qrcode';

interface SyncPayConfig {
  clientId: string;
  clientSecret: string;
  baseURL: string;
}

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
}

interface ClientInfo {
  name: string;
  cpf: string;
  email: string;
  phone: string;
}

interface CreateCashInRequest {
  amount: number; // Value in reais (not cents)
  description?: string;
  webhook_url: string;
  client: ClientInfo;
}

interface CreateCashInResponse {
  message: string;
  pix_code: string;
  qr_code_base64: string; // Generated QR code in base64
  identifier: string; // Transaction ID
}

interface TransactionStatusResponse {
  id: string;
  status: 'PENDING' | 'PAID_OUT' | 'FAILED' | 'REFUNDED' | 'MED';
  amount: number;
  final_amount: number;
  pix_code: string;
  client: ClientInfo;
  payment_method: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface WebhookPayload {
  data: {
    id: string;
    client: ClientInfo;
    pix_code: string;
    amount: number;
    final_amount: number;
    currency: string;
    status: 'PENDING' | 'PAID_OUT' | 'FAILED' | 'REFUNDED' | 'MED';
    payment_method: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * SyncPay API Service
 * Documentation: https://syncpay.apidog.io
 */
export class SyncPayService {
  private client: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(config: SyncPayConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseURL = config.baseURL;

    console.log('SyncPay Service initialized:', {
      baseURL: this.baseURL,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
    });

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Check if the current token is valid
   */
  private isTokenValid(): boolean {
    const isValid = !!(this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt);
    if (!isValid) {
      console.log('Token validation failed:', {
        hasToken: !!this.accessToken,
        hasExpiry: !!this.tokenExpiresAt,
        expiresAt: this.tokenExpiresAt?.toISOString(),
        now: new Date().toISOString(),
      });
    }
    return isValid;
  }

  /**
   * Manually reset token (for debugging or force refresh)
   */
  public resetToken(): void {
    console.log('Manually resetting SyncPay token');
    this.accessToken = null;
    this.tokenExpiresAt = null;
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Authenticate and get access token
   * Tokens expire after 1 hour
   */
  private async authenticate(forceRefresh: boolean = false): Promise<void> {
    // Check if we have a valid token (unless forcing refresh)
    if (!forceRefresh && this.isTokenValid()) {
      console.log('Using existing valid token, expires at:', this.tokenExpiresAt);
      return; // Token still valid
    }

    // Clear any existing token data before authenticating
    this.accessToken = null;
    this.tokenExpiresAt = null;
    delete this.client.defaults.headers.common['Authorization'];

    try {
      console.log('Authenticating with SyncPay...', forceRefresh ? '(forced refresh)' : '');

      const response = await this.client.post<AuthTokenResponse>(
        '/api/partner/v1/auth-token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiration 5 minutes before actual expiry for safety
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      // Update client headers with new token
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      console.log('SyncPay authentication successful, token expires at:', this.tokenExpiresAt);
    } catch (error: any) {
      console.error('SyncPay Authentication Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        `Failed to authenticate with SyncPay: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Create a new PIX cash-in payment
   *
   * @param amountInCents - Amount in cents (will be converted to reais)
   * @param webhookUrl - Webhook URL for payment notifications
   * @param clientInfo - Payer information (CPF, name, email, phone)
   * @param retryCount - Internal retry counter to prevent infinite loops
   * @returns Payment data with PIX code and identifier
   */
  async createPixPayment(
    amountInCents: number,
    webhookUrl: string,
    clientInfo: ClientInfo,
    retryCount: number = 0
  ): Promise<CreateCashInResponse> {
    if (amountInCents < 50) {
      throw new Error('Minimum transaction amount is 50 cents (R$ 0.50)');
    }

    // Ensure we have a valid token
    await this.authenticate();

    try {
      const amountInReais = amountInCents / 100; // Convert cents to reais

      const payload: CreateCashInRequest = {
        amount: amountInReais,
        description: 'Payment via Vip Acess',
        webhook_url: webhookUrl,
        client: clientInfo,
      };

      console.log('Creating SyncPay PIX payment:', {
        url: `${this.baseURL}/api/partner/v1/cash-in`,
        payload,
      });

      const response = await this.client.post(
        '/api/partner/v1/cash-in',
        payload
      );

      console.log('SyncPay PIX payment created successfully:', {
        identifier: response.data.identifier,
        message: response.data.message,
      });

      // Generate QR code base64 from pix_code
      const qrCodeBase64 = await this.generateQRCodeBase64(response.data.pix_code);

      // Return response with generated QR code
      return {
        message: response.data.message,
        pix_code: response.data.pix_code,
        qr_code_base64: qrCodeBase64,
        identifier: response.data.identifier,
      };
    } catch (error: any) {
      console.error('SyncPay API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // If 401, try to re-authenticate and retry once
      if (error.response?.status === 401 && retryCount < 1) {
        console.log('Token expired or invalid (attempt', retryCount + 1, '), forcing re-authentication...');
        await this.authenticate(true); // Force refresh
        return this.createPixPayment(amountInCents, webhookUrl, clientInfo, retryCount + 1);
      }

      if (error.response?.status === 401 && retryCount >= 1) {
        throw new Error('Failed to authenticate with SyncPay after retry. Please check your credentials.');
      }

      throw new Error(
        `Failed to create SyncPay PIX payment: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Generate QR code in base64 format from PIX code
   */
  private async generateQRCodeBase64(pixCode: string): Promise<string> {
    try {
      // Generate QR code as data URL (base64)
      const qrCodeDataURL = await QRCode.toDataURL(pixCode, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 512,
        margin: 1,
      });

      // Remove the data URL prefix to get just the base64 string
      const base64 = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');

      console.log('QR code base64 generated successfully');
      return base64;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Parse webhook payload from SyncPay
   */
  parseWebhookPayload(payload: any): {
    id: string;
    status: 'PENDING' | 'PAID_OUT' | 'FAILED' | 'REFUNDED' | 'MED';
    amount: number;
    final_amount: number;
    pix_code: string;
  } {
    console.log('Full raw webhook payload from SyncPay:', JSON.stringify(payload, null, 2));

    if (!payload.data || !payload.data.id) {
      console.error('CRITICAL: Could not find `data.id` in the webhook payload.');
      throw new Error('Transaction ID not found in webhook payload');
    }

    console.log(`Successfully extracted SyncPay transactionId: ${payload.data.id}`);

    return {
      id: payload.data.id,
      status: payload.data.status,
      amount: payload.data.amount,
      final_amount: payload.data.final_amount,
      pix_code: payload.data.pix_code,
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
let syncPayService: SyncPayService | null = null;

export function getSyncPayService(): SyncPayService {
  if (!syncPayService) {
    const clientId = process.env.SYNCPAY_CLIENT_ID;
    const clientSecret = process.env.SYNCPAY_CLIENT_SECRET;
    const baseURL = process.env.SYNCPAY_BASE_URL || 'https://api.syncpay.com.br';

    if (!clientId || !clientSecret) {
      throw new Error('SYNCPAY_CLIENT_ID and SYNCPAY_CLIENT_SECRET environment variables are required');
    }

    syncPayService = new SyncPayService({
      clientId,
      clientSecret,
      baseURL,
    });
  }
  return syncPayService;
}
