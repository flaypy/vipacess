import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/products
 * Public route to list products filtered by geolocation
 * STRICT REGION EXCLUSIVITY: Products are ONLY shown if:
 * 1. They have at least one ProductRegion associated with them, AND
 * 2. One of those regions matches the user's detected country
 *
 * Products with NO assigned regions are NOT visible to anyone.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userCountryCode = req.geo?.countryCode;

    // Get all active products with their regions and prices
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        prices: {
          include: {
            orders: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
        regions: true,
      },
    });

    // Filter products based on STRICT geolocation rules
    const filteredProducts = products.filter((product) => {
      // REQUIREMENT: Product must have at least one region assigned
      if (product.regions.length === 0) {
        return false; // Products without regions are NOT visible
      }

      // If we can't determine user's location, don't show any products
      if (!userCountryCode) {
        return false;
      }

      // Check if user's country matches one of the product's assigned regions
      // Special handling for NON_BR (all regions except Brazil)
      return product.regions.some((region) => {
        if (region.countryCode === 'NON_BR') {
          // NON_BR means: show to everyone EXCEPT Brazil
          return userCountryCode !== 'BR';
        }
        // Regular country code matching
        return region.countryCode === userCountryCode;
      });
    });

    // Calculate sales count for each product and sort by sales (highest first)
    const productsWithSales = filteredProducts.map((product) => {
      const salesCount = product.prices.reduce((total, price) => {
        return total + price.orders.length;
      }, 0);

      // Remove orders from prices before sending to client
      const { regions, prices, ...productData } = product;
      const cleanPrices = prices.map(({ orders, ...price }) => price);

      return {
        ...productData,
        prices: cleanPrices,
        availableInRegion: true,
        salesCount,
      };
    });

    // Sort by sales count (descending) - best sellers first
    productsWithSales.sort((a, b) => b.salesCount - a.salesCount);

    res.json({
      products: productsWithSales,
      detectedCountry: userCountryCode,
      totalCount: productsWithSales.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/products/:id
 * Public route to get a single product's details
 * STRICT REGION EXCLUSIVITY: Product must have regions assigned and match user's country
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userCountryCode = req.geo?.countryCode;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        prices: true,
        regions: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(404).json({ error: 'Product not available' });
    }

    // STRICT REGION CHECK: Product must have at least one region assigned
    if (product.regions.length === 0) {
      return res.status(403).json({
        error: 'Product not available - no regions configured',
        detectedCountry: userCountryCode,
      });
    }

    // Check if user's country matches one of the assigned regions
    if (!userCountryCode) {
      return res.status(403).json({
        error: 'Product not available - location not detected',
        detectedCountry: null,
      });
    }

    // Check region availability with NON_BR support
    const isAvailableInRegion = product.regions.some((region) => {
      if (region.countryCode === 'NON_BR') {
        // NON_BR means: available to everyone EXCEPT Brazil
        return userCountryCode !== 'BR';
      }
      // Regular country code matching
      return region.countryCode === userCountryCode;
    });

    if (!isAvailableInRegion) {
      return res.status(403).json({
        error: 'Product not available in your region',
        detectedCountry: userCountryCode,
      });
    }

    // Remove regions from response
    const { regions, ...productData } = product;

    res.json({
      product: productData,
      detectedCountry: userCountryCode,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
