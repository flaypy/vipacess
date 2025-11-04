import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication and admin middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/products
 * Get all products (no filtering)
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        prices: true,
        regions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/products
 * Create a new product with telegramLink and prices with deliveryLink
 */
router.post('/products', async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl, isActive, telegramLink, prices } = req.body;

    // Validation
    if (!name || !description || !imageUrl) {
      return res.status(400).json({
        error: 'Name, description, and imageUrl are required',
      });
    }

    // Validate prices if provided - each must have deliveryLink
    if (prices && Array.isArray(prices)) {
      for (const price of prices) {
        if (!price.deliveryLink) {
          return res.status(400).json({
            error: 'Each price tier must have a deliveryLink',
          });
        }
        if (!price.amount || !price.currency || !price.category) {
          return res.status(400).json({
            error: 'Each price must have amount, currency, and category',
          });
        }
      }
    }

    // Create product with optional prices and telegramLink
    const product = await prisma.product.create({
      data: {
        name,
        description,
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
        telegramLink: telegramLink || null,
        prices: prices
          ? {
              create: prices.map((price: any) => ({
                amount: price.amount,
                currency: price.currency,
                category: price.category,
                deliveryLink: price.deliveryLink,
              })),
            }
          : undefined,
      },
      include: {
        prices: true,
        regions: true,
      },
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update a product including telegramLink
 */
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, isActive, telegramLink } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        imageUrl: imageUrl || existingProduct.imageUrl,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
        telegramLink: telegramLink !== undefined ? telegramLink : existingProduct.telegramLink,
      },
      include: {
        prices: true,
        regions: true,
      },
    });

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product
 */
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (cascade will delete related prices and regions)
    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/products/regions
 * Associate a product with a country region
 */
router.post('/products/regions', async (req: Request, res: Response) => {
  try {
    const { productId, countryCode } = req.body;

    // Validation
    if (!productId || !countryCode) {
      return res.status(400).json({
        error: 'productId and countryCode are required',
      });
    }

    // Validate country code format (should be 2 letters)
    if (countryCode.toUpperCase() !== 'NON_BR' && !/^[A-Z]{2}$/i.test(countryCode)) {
      return res.status(400).json({
        error: 'countryCode must be a 2-letter ISO code (e.g., BR, US, ES) or NON_BR',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create or update region association
    const region = await prisma.productRegion.upsert({
      where: {
        productId_countryCode: {
          productId,
          countryCode: countryCode.toUpperCase(),
        },
      },
      create: {
        productId,
        countryCode: countryCode.toUpperCase(),
      },
      update: {},
    });

    res.status(201).json({
      message: 'Product region association created',
      region,
    });
  } catch (error) {
    console.error('Error creating product region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/products/regions/:id
 * Remove a product region association
 */
router.delete('/products/regions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.productRegion.delete({
      where: { id },
    });

    res.json({ message: 'Product region association deleted' });
  } catch (error) {
    console.error('Error deleting product region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/products/:productId/prices
 * Add a new price tier to a product
 */
router.post('/products/:productId/prices', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { amount, currency, category, deliveryLink } = req.body;

    // Validation
    if (!amount || !currency || !category || !deliveryLink) {
      return res.status(400).json({
        error: 'amount, currency, category, and deliveryLink are required',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create price
    const price = await prisma.price.create({
      data: {
        amount,
        currency,
        category,
        deliveryLink,
        productId,
      },
    });

    res.status(201).json({
      message: 'Price tier created successfully',
      price,
    });
  } catch (error) {
    console.error('Error creating price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/prices/bulk-update
 * Update multiple price tiers at once (for bulk operations)
 * IMPORTANT: This route must be BEFORE /prices/:id to avoid matching "bulk-update" as an ID
 */
router.put('/prices/bulk-update', async (req: Request, res: Response) => {
  try {
    const { priceIds, deliveryLink } = req.body;

    // Validation
    if (!priceIds || !Array.isArray(priceIds) || priceIds.length === 0) {
      return res.status(400).json({
        error: 'priceIds must be a non-empty array',
      });
    }

    if (!deliveryLink) {
      return res.status(400).json({
        error: 'deliveryLink is required',
      });
    }

    console.log(`Bulk updating ${priceIds.length} prices with deliveryLink: ${deliveryLink}`);

    // Update all prices in a single transaction
    const updateResult = await prisma.price.updateMany({
      where: {
        id: {
          in: priceIds,
        },
      },
      data: {
        deliveryLink,
      },
    });

    console.log(`Successfully updated ${updateResult.count} prices`);

    res.json({
      message: 'Prices updated successfully',
      updatedCount: updateResult.count,
    });
  } catch (error) {
    console.error('Error bulk updating prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/prices/:id
 * Update a price tier
 */
router.put('/prices/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, currency, category, deliveryLink } = req.body;

    // Check if price exists
    const existingPrice = await prisma.price.findUnique({
      where: { id },
    });

    if (!existingPrice) {
      return res.status(404).json({ error: 'Price not found' });
    }

    // Update price - use explicit checks to allow empty strings
    const price = await prisma.price.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : existingPrice.amount,
        currency: currency !== undefined ? currency : existingPrice.currency,
        category: category !== undefined ? category : existingPrice.category,
        deliveryLink: deliveryLink !== undefined ? deliveryLink : existingPrice.deliveryLink,
      },
    });

    res.json({
      message: 'Price tier updated successfully',
      price,
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/prices/:id
 * Delete a price tier
 */
router.delete('/prices/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.price.delete({
      where: { id },
    });

    res.json({ message: 'Price tier deleted successfully' });
  } catch (error) {
    console.error('Error deleting price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/orders
 * Get all orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        price: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/analytics
 * Get analytics data with optional filters
 * Query params: startDate, endDate, productId
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, productId } = req.query;

    // Build date filter (convert from Brazil timezone to UTC for database query)
    const dateFilter: any = {};
    if (startDate) {
      // Start of day in Brazil timezone (00:00 BRT) = 03:00 UTC
      const startDateBr = new Date(startDate as string + 'T00:00:00-03:00');
      dateFilter.gte = startDateBr;
    }
    if (endDate) {
      // End of day in Brazil timezone (23:59:59 BRT) = 02:59:59 UTC next day
      const endDateBr = new Date(endDate as string + 'T23:59:59-03:00');
      dateFilter.lte = endDateBr;
    }

    // Build where clause
    const whereClause: any = {
      status: 'COMPLETED',
    };

    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // Fetch completed orders with filters
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        price: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Filter by product if specified
    const filteredOrders = productId
      ? orders.filter((order) => order.price?.product?.id === productId)
      : orders;

    // Calculate total revenue
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + (order.price?.amount || 0),
      0
    );

    // Calculate revenue by product
    const revenueByProduct: Record<string, { name: string; revenue: number; count: number }> = {};
    filteredOrders.forEach((order) => {
      if (order.price?.product) {
        const productId = order.price.product.id;
        if (!revenueByProduct[productId]) {
          revenueByProduct[productId] = {
            name: order.price.product.name,
            revenue: 0,
            count: 0,
          };
        }
        revenueByProduct[productId].revenue += order.price.amount;
        revenueByProduct[productId].count += 1;
      }
    });

    // Calculate revenue by category (HD, 4K, etc.)
    const revenueByCategory: Record<string, { revenue: number; count: number }> = {};
    filteredOrders.forEach((order) => {
      if (order.price) {
        const category = order.price.category;
        if (!revenueByCategory[category]) {
          revenueByCategory[category] = { revenue: 0, count: 0 };
        }
        revenueByCategory[category].revenue += order.price.amount;
        revenueByCategory[category].count += 1;
      }
    });

    // Calculate daily revenue for chart (Brazil timezone UTC-3)
    const dailyRevenue: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      // Convert UTC to Brazil timezone (UTC-3 means subtract 3 hours from UTC to get local time)
      // But since we want the date in Brazil timezone, we need to subtract 3 hours
      const utcTime = order.createdAt.getTime();
      const brazilTime = utcTime - (3 * 60 * 60 * 1000);
      const brazilDate = new Date(brazilTime);
      const date = brazilDate.toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += order.price?.amount || 0;
    });

    // Convert daily revenue to array format
    const dailyRevenueArray = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate conversion metrics (including PENDING orders)
    const dateWhereClause: any = {};
    if (Object.keys(dateFilter).length > 0) {
      dateWhereClause.createdAt = dateFilter;
    }

    const totalOrders = await prisma.order.count({
      where: dateWhereClause,
    });

    const completedOrders = filteredOrders.length;
    const pendingOrders = await prisma.order.count({
      where: {
        ...dateWhereClause,
        status: 'PENDING',
      },
    });
    const failedOrders = await prisma.order.count({
      where: {
        ...dateWhereClause,
        status: 'FAILED',
      },
    });

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Get unique customers
    const uniqueCustomers = new Set(filteredOrders.map((order) => order.userId)).size;

    // Calculate average order value
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Response
    res.json({
      summary: {
        totalRevenue,
        totalOrders: completedOrders,
        pendingOrders,
        failedOrders,
        conversionRate: Math.round(conversionRate * 100) / 100,
        uniqueCustomers,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      },
      revenueByProduct: Object.entries(revenueByProduct).map(([id, data]) => ({
        productId: id,
        productName: data.name,
        revenue: data.revenue,
        orders: data.count,
      })),
      revenueByCategory: Object.entries(revenueByCategory).map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orders: data.count,
      })),
      dailyRevenue: dailyRevenueArray,
      recentOrders: filteredOrders.slice(-10).reverse(), // Last 10 orders
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/popup
 * Get popup configuration
 */
router.get('/popup', async (req: Request, res: Response) => {
  try {
    // Get the first (and should be only) popup config
    const popup = await prisma.popupConfig.findFirst();

    res.json({ popup });
  } catch (error) {
    console.error('Error fetching popup config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/popup
 * Create or update popup configuration
 */
router.put('/popup', async (req: Request, res: Response) => {
  try {
    const { message, buttonText, buttonLink, isActive } = req.body;

    // Validation
    if (!message || !buttonText || !buttonLink) {
      return res.status(400).json({
        error: 'message, buttonText, and buttonLink are required',
      });
    }

    // Get existing popup or create new one
    const existingPopup = await prisma.popupConfig.findFirst();

    let popup;
    if (existingPopup) {
      // Update existing
      popup = await prisma.popupConfig.update({
        where: { id: existingPopup.id },
        data: {
          message,
          buttonText,
          buttonLink,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } else {
      // Create new
      popup = await prisma.popupConfig.create({
        data: {
          message,
          buttonText,
          buttonLink,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    res.json({
      message: 'Popup configuration saved successfully',
      popup,
    });
  } catch (error) {
    console.error('Error saving popup config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
