'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminAPI, Product, Price } from '@/lib/api';

// Available countries for region selection
const COUNTRIES = [
  { code: 'NON_BR', name: '🌍 All Regions EXCEPT Brazil', special: true },
  { code: 'BR', name: 'Brazil' },
  { code: 'US', name: 'United States' },
  { code: 'ES', name: 'Spain' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PT', name: 'Portugal' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
];

export default function AdminProductsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Bulk update state
  const [bulkDeliveryLink, setBulkDeliveryLink] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    previewMediaUrl: '',
    telegramLink: '',
    isActive: true,
  });

  // Price form state
  const [showPriceForm, setShowPriceForm] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<Price | null>(null);
  const [priceForm, setPriceForm] = useState({
    amount: '',
    currency: 'BRL',
    category: 'HD',
    deliveryLink: '',
  });

  // Region form state
  const [showRegionForm, setShowRegionForm] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('BR');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await adminAPI.getProducts();
      setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Product CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, {
          ...productForm,
          previewMediaUrl: productForm.previewMediaUrl || undefined,
          telegramLink: productForm.telegramLink || undefined,
        });
      } else {
        await adminAPI.createProduct({
          ...productForm,
          previewMediaUrl: productForm.previewMediaUrl || undefined,
          telegramLink: productForm.telegramLink || undefined,
        });
      }
      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      fetchProducts();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      previewMediaUrl: product.previewMediaUrl || '',
      telegramLink: product.telegramLink || '',
      isActive: product.isActive,
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure? This will delete all prices and regions.')) return;
    try {
      await adminAPI.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      imageUrl: '',
      previewMediaUrl: '',
      telegramLink: '',
      isActive: true,
    });
  };

  // Price CRUD
  const handlePriceSubmit = async (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    try {
      const priceData = {
        amount: parseFloat(priceForm.amount),
        currency: priceForm.currency,
        category: priceForm.category,
        deliveryLink: priceForm.deliveryLink,
      };

      if (editingPrice) {
        await adminAPI.updatePrice(editingPrice.id, priceData);
      } else {
        await adminAPI.addPrice(productId, priceData);
      }

      setShowPriceForm(null);
      setEditingPrice(null);
      resetPriceForm();
      fetchProducts();
    } catch (err: any) {
      console.error('Failed to save price:', err);
      alert(err.response?.data?.error || 'Failed to save price');
    }
  };

  const handleEditPrice = (price: Price, productId: string) => {
    setEditingPrice(price);
    setPriceForm({
      amount: price.amount.toString(),
      currency: price.currency,
      category: price.category,
      deliveryLink: price.deliveryLink,
    });
    setShowPriceForm(productId);
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm('Delete this price tier?')) return;
    try {
      await adminAPI.deletePrice(priceId);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete price:', err);
      alert('Failed to delete price');
    }
  };

  const resetPriceForm = () => {
    setPriceForm({
      amount: '',
      currency: 'BRL',
      category: 'HD',
      deliveryLink: '',
    });
  };

  // Region CRUD
  const handleAddRegion = async (productId: string) => {
    try {
      await adminAPI.addProductRegion(productId, selectedCountry);
      setShowRegionForm(null);
      fetchProducts();
    } catch (err: any) {
      console.error('Failed to add region:', err);
      alert(err.response?.data?.error || 'Failed to add region');
    }
  };

  const handleDeleteRegion = async (regionId: string) => {
    if (!confirm('Remove this region?')) return;
    try {
      await adminAPI.deleteProductRegion(regionId);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete region:', err);
      alert('Failed to delete region');
    }
  };

  const toggleExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // Bulk update delivery links
  const handleBulkUpdateDeliveryLinks = async () => {
    if (!bulkDeliveryLink.trim()) {
      alert('Please enter a delivery link');
      return;
    }

    if (!confirm(`This will update the delivery link for ALL price tiers across ALL products to:\n\n${bulkDeliveryLink}\n\nAre you sure?`)) {
      return;
    }

    setIsBulkUpdating(true);
    setBulkProgress({ current: 0, total: 0 });

    try {
      // Collect all price IDs from all products
      const allPriceIds: string[] = [];

      products.forEach(product => {
        if (product.prices && product.prices.length > 0) {
          product.prices.forEach(price => {
            allPriceIds.push(price.id);
          });
        }
      });

      if (allPriceIds.length === 0) {
        alert('No price tiers found to update');
        return;
      }

      setBulkProgress({ current: 0, total: allPriceIds.length });
      console.log(`Starting bulk update of ${allPriceIds.length} price tiers...`);

      // Update all prices in a single request
      const result = await adminAPI.bulkUpdatePrices(allPriceIds, bulkDeliveryLink);

      setBulkProgress({ current: allPriceIds.length, total: allPriceIds.length });

      // Show results
      alert(`Bulk update completed!\n\n✓ Successfully updated ${result.updatedCount} price tiers`);

      // Refresh products to show updated links
      await fetchProducts();

      // Clear the input
      setBulkDeliveryLink('');
    } catch (err: any) {
      console.error('Bulk update error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      alert(`An error occurred during bulk update:\n\n${errorMsg}`);
    } finally {
      setIsBulkUpdating(false);
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
      {/* Bulk Update Delivery Links Section */}
      <div className="card-noir mb-6 border-2 border-accent-emerald">
        <h2 className="text-xl font-bold mb-4 text-accent-emerald">
          Atualização em Massa - Delivery Link
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Use esta ferramenta para atualizar o link de delivery de TODOS os produtos e price tiers de uma vez.
        </p>
        <div className="flex gap-3">
          <input
            type="url"
            value={bulkDeliveryLink}
            onChange={(e) => setBulkDeliveryLink(e.target.value)}
            className="input-noir flex-1"
            placeholder="https://cdn.example.com/new-file.zip"
            disabled={isBulkUpdating}
          />
          <button
            onClick={handleBulkUpdateDeliveryLinks}
            disabled={isBulkUpdating || !bulkDeliveryLink.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {isBulkUpdating ? 'Atualizando...' : 'Atualizar Todos'}
          </button>
        </div>
        {isBulkUpdating && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-accent-emerald mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-accent-emerald"></div>
              <span className="text-sm">
                Atualizando: {bulkProgress.current} de {bulkProgress.total} price tiers
              </span>
            </div>
            {bulkProgress.total > 0 && (
              <div className="w-full bg-noir-medium rounded-full h-2">
                <div
                  className="bg-accent-emerald h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Product Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowProductForm(!showProductForm);
            setEditingProduct(null);
            resetProductForm();
          }}
          className="btn-primary"
        >
          {showProductForm ? tCommon('cancel') : t('createProduct')}
        </button>
      </div>

      {/* Product Form */}
      {showProductForm && (
        <div className="card-noir mb-8">
          <h2 className="text-2xl font-bold mb-6 text-accent-emerald">
            {editingProduct ? t('editProduct') : t('createProduct')}
          </h2>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Name *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="input-noir"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="input-noir"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Image URL *</label>
              <input
                type="url"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="input-noir"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Preview Media URL (Video/Image/GIF)
              </label>
              <input
                type="url"
                value={productForm.previewMediaUrl}
                onChange={(e) => setProductForm({ ...productForm, previewMediaUrl: e.target.value })}
                className="input-noir"
                placeholder="https://example.com/preview.mp4"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - Link to a video, image, or GIF to preview the product
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Telegram Link (for non-BR customers)
              </label>
              <input
                type="url"
                value={productForm.telegramLink}
                onChange={(e) => setProductForm({ ...productForm, telegramLink: e.target.value })}
                className="input-noir"
                placeholder="https://t.me/your_channel"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - Used for customers outside Brazil
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                {tCommon('save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                }}
                className="btn-secondary"
              >
                {tCommon('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="card-noir">
            {/* Product Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-accent-emerald">{product.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{product.description.substring(0, 100)}...</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className={product.isActive ? 'text-green-400' : 'text-red-400'}>
                    {product.isActive ? '● Active' : '● Inactive'}
                  </span>
                  <span className="text-gray-500">{product.prices?.length || 0} prices</span>
                  <span className="text-gray-500">{(product as any).regions?.length || 0} regions</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleExpand(product.id)}
                  className="btn-secondary text-sm"
                >
                  {expandedProduct === product.id ? 'Collapse' : 'Manage'}
                </button>
                <button
                  onClick={() => handleEditProduct(product)}
                  className="text-accent-emerald hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-400 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedProduct === product.id && (
              <div className="mt-6 space-y-6 border-t border-noir-light pt-6">

                {/* Regions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-accent-gold">Regions</h4>
                    <button
                      onClick={() => setShowRegionForm(showRegionForm === product.id ? null : product.id)}
                      className="btn-secondary text-sm"
                    >
                      {showRegionForm === product.id ? 'Cancel' : '+ Add Region'}
                    </button>
                  </div>

                  {showRegionForm === product.id && (
                    <div className="bg-noir-medium p-4 rounded-lg mb-4">
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="input-noir mb-2"
                      >
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name} ({country.code})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAddRegion(product.id)}
                        className="btn-primary text-sm"
                      >
                        Add Region
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(product as any).regions && (product as any).regions.length > 0 ? (
                      (product as any).regions.map((region: any) => (
                        <div
                          key={region.id}
                          className="px-3 py-1 bg-accent-lime/20 text-accent-lime rounded-full text-sm flex items-center gap-2"
                        >
                          {region.countryCode}
                          <button
                            onClick={() => handleDeleteRegion(region.id)}
                            className="hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No regions assigned - product is invisible!</p>
                    )}
                  </div>
                </div>

                {/* Prices Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-accent-emerald">Price Tiers</h4>
                    <button
                      onClick={() => {
                        setShowPriceForm(showPriceForm === product.id ? null : product.id);
                        setEditingPrice(null);
                        resetPriceForm();
                      }}
                      className="btn-secondary text-sm"
                    >
                      {showPriceForm === product.id ? 'Cancel' : '+ Add Price'}
                    </button>
                  </div>

                  {showPriceForm === product.id && (
                    <form
                      onSubmit={(e) => handlePriceSubmit(e, product.id)}
                      className="bg-noir-medium p-4 rounded-lg mb-4 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1">Amount *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={priceForm.amount}
                            onChange={(e) => setPriceForm({ ...priceForm, amount: e.target.value })}
                            className="input-noir"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Currency *</label>
                          <input
                            type="text"
                            value={priceForm.currency}
                            onChange={(e) => setPriceForm({ ...priceForm, currency: e.target.value })}
                            className="input-noir"
                            placeholder="BRL, USD"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Category *</label>
                        <input
                          type="text"
                          value={priceForm.category}
                          onChange={(e) => setPriceForm({ ...priceForm, category: e.target.value })}
                          className="input-noir"
                          placeholder="HD, 4K, SD"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs mb-1">Delivery Link * (Download URL)</label>
                        <input
                          type="url"
                          value={priceForm.deliveryLink}
                          onChange={(e) => setPriceForm({ ...priceForm, deliveryLink: e.target.value })}
                          className="input-noir"
                          placeholder="https://cdn.example.com/file.zip"
                          required
                        />
                      </div>

                      <button type="submit" className="btn-primary text-sm">
                        {editingPrice ? 'Update Price' : 'Add Price'}
                      </button>
                    </form>
                  )}

                  <div className="space-y-2">
                    {product.prices && product.prices.length > 0 ? (
                      product.prices.map((price) => (
                        <div
                          key={price.id}
                          className="bg-noir-medium p-3 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-accent-emerald">{price.category}</span>
                            <span className="mx-2">-</span>
                            <span className="text-gray-300">
                              {price.currency} {price.amount.toFixed(2)}
                            </span>
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-md">
                              {price.deliveryLink}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPrice(price, product.id)}
                              className="text-accent-emerald hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePrice(price.id)}
                              className="text-red-400 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No prices added yet</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
