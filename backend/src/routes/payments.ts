import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { getPushinPayService, PushinPayService } from '../services/pushinpay';

const router = Router();
const prisma = new PrismaClient();

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
        const { priceId } = req.body;
        const userId = req.user?.userId;

        if (!priceId) {
          return res.status(400).json({ error: 'priceId é obrigatório' });
        }

        if (!userId) {
          return res.status(401).json({ error: 'Autenticação de usuário necessária' });
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

        const order = await prisma.order.create({
          data: {
            userId,
            priceId,
            status: 'PENDING',
          },
        });

        const amountInCents = PushinPayService.toCents(price.amount);

        // ✅ *** MUDANÇA 1: CONSTRÓI A URL DO WEBHOOK DINÂMICA ***
        // Adicionamos o ID do nosso pedido diretamente na URL do webhook.
        const webhookUrl = `${process.env.BACKEND_URL}/api/payments/webhook/${order.id}`;

        const pushinpay = getPushinPayService();

        const pixPayment = await pushinpay.createPixPayment(
            amountInCents,
            webhookUrl, // Passa a URL dinâmica para a PushinPay
            30
        );

        await prisma.order.update({
          where: { id: order.id },
          data: {
            pushinpayTxId: pixPayment.id,
          },
        });

        console.log('Dados da resposta do pagamento:', {
          hasQrCode: !!pixPayment.qr_code,
          hasQrCodeBase64: !!pixPayment.qr_code_base64,
          qrCodeBase64Length: pixPayment.qr_code_base64?.length,
          qrCodeBase64Preview: pixPayment.qr_code_base64?.substring(0, 50),
        });

        res.json({
          success: true,
          orderId: order.id,
          pushinpayTransactionId: pixPayment.id,
          pixCode: pixPayment.qr_code,
          pixQrCodeBase64: pixPayment.qr_code_base64,
          amount: PushinPayService.formatCurrency(amountInCents),
          amountInCents: pixPayment.value,
          status: pixPayment.status,
          expiresAt: pixPayment.expires_at,
          productName: price.product.name,
          priceCategory: price.category,
        });
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
// ✅ *** MUDANÇA 2: ATUALIZA A ROTA PARA ACEITAR UM ID DINÂMICO ***
router.post('/webhook/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    console.log(`Webhook da PushinPay recebido para o pedido: ${orderId}`, req.body);

    const { status } = req.body;

    // ✅ *** MUDANÇA 3: BUSCA O PEDIDO DIRETAMENTE PELO ID DA URL ***
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

        const pushinpay = getPushinPayService();
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

export default router;
