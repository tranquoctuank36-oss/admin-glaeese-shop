"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProducts } from "@/services/productService";
import type { Product, ProductVariant } from "@/types/product";
import toast from "react-hot-toast";
import { addDiscountTargets } from "@/services/discountService";

interface DiscountTargetSelectorProps {
  discountId: string;
  onTargetsAdded?: () => void;
}

export default function DiscountTargetSelector({
  discountId,
  onTargetsAdded,
}: DiscountTargetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await getProducts({
        page,
        limit: 10,
        search: search || undefined,
        sortField: "name",
        sortOrder: "ASC",
        isDeleted: false,
      });

      setProducts(result.data);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open, page, search]);

  const toggleVariant = (variantId: string) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedVariants(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedVariants.size === 0) {
      toast.error("Please select at least one product variant");
      return;
    }

    try {
      setSaving(true);
      await addDiscountTargets(discountId, Array.from(selectedVariants));
      setSelectedVariants(new Set());
      setOpen(false);
      onTargetsAdded?.();
    } catch (error: any) {
      console.error("Failed to add targets:", error);
      toast.error(
        error?.response?.data?.detail || "Failed to add product variants"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus size={18} />
        Add Product Variants
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col w-full max-w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Product Variants to Discount</DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Selected Count */}
          {selectedVariants.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">
                {selectedVariants.size} variant(s) selected
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedVariants(new Set())}
                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-50"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Products List */}
          <div className="flex-1 overflow-y-auto min-h-0 border border-gray-200 rounded-lg">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No products found</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    {/* Product Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {product.productImages?.[0]?.publicUrl && (
                        <img
                          src={product.productImages[0].publicUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setLightboxImage({
                            url: product.productImages![0].publicUrl,
                            alt: product.name
                          })}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product.brand?.name}
                        </p>
                      </div>
                    </div>

                    {/* Variants */}
                    {product.productVariants &&
                      product.productVariants.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600 ">
                            Product Variants
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {product.productVariants.map((variant) => (
                              <label
                                key={variant.id}
                                className={[
                                  "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                  selectedVariants.has(variant.id)
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                                ].join(" ")}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedVariants.has(variant.id)}
                                  onChange={() => toggleVariant(variant.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                {variant.thumbnailImage?.publicUrl ||
                                variant.productImages?.[0]?.publicUrl ? (
                                  <img
                                    src={
                                      variant.thumbnailImage?.publicUrl ||
                                      variant.productImages?.[0]?.publicUrl
                                    }
                                    alt={variant.name}
                                    className="w-12 h-12 object-contain rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setLightboxImage({
                                        url: variant.thumbnailImage?.publicUrl || variant.productImages?.[0]?.publicUrl || "",
                                        alt: variant.name
                                      });
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-[10px]">
                                      No image
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">
                                      {variant.name}
                                    </span>
                                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                      {variant.sku}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    {variant.colors &&
                                      variant.colors.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          {variant.colors.map((color) => (
                                            <div
                                              key={color.id}
                                              className="w-4 h-4 rounded-full border border-gray-300"
                                              style={{
                                                backgroundColor:
                                                  color.hexCode || "#ccc",
                                              }}
                                              title={color.name}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    <span className="text-sm text-gray-600">
                                      On Hand:{" "}
                                      <span className="font-semibold">
                                        {variant.quantityAvailable}
                                      </span>
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      Price:{" "}
                                      <span className="font-semibold text-green-600">
                                        {Number(
                                          variant.finalPrice
                                        ).toLocaleString("en-US")}
                                        đ
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && products.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={selectedVariants.size === 0 || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
            onClick={() => setLightboxImage(null)}
            title="Close"
          >
            <X className="w-6 h-6 text-gray-800" />
          </Button>
          <div className="max-w-7xl max-h-[90vh] p-4">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
