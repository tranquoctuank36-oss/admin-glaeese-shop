"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FloatingInput from "@/components/FloatingInput";
import type { ProductVariant } from "@/types/product";
import { getColors } from "@/services/colorService";
import ProductImageSelector from "./ProductImageSelector";
import { getImages } from "@/services/imagesService";
import type { ImageItem } from "@/types/image";
import { X, Plus, Search } from "lucide-react";
import { createVariant, updateVariant, addImagesToVariant, removeImagesFromVariant } from "@/services/productService";

interface AddVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (variant: Partial<ProductVariant>) => void;
  variant?: Partial<ProductVariant>;
  editIndex?: number;
  variantId?: string;
  productId?: string;
}

export default function AddVariantDialog({
  open,
  onOpenChange,
  onAdd,
  variant,
  editIndex,
  variantId,
  productId,
}: AddVariantDialogProps) {
  // Format number with thousands separator
  const formatPrice = (value: string) => {
    if (!value) return "0";
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue || numericValue === "0") return "0";
    return Number(numericValue).toLocaleString("es-US");
  };

  // Get raw number from formatted string
  const getRawPrice = (value: string) => {
    return value.replace(/[^0-9]/g, "");
  };

  const [name, setName] = useState(variant?.name || "");
  const [sku, setSku] = useState(variant?.sku || "");
  const [quantityAvailable, setQuantityAvailable] = useState(
    String(variant?.quantityAvailable || 0)
  );
  const [originalPrice, setOriginalPrice] = useState(
    variant?.originalPrice ? formatPrice(variant.originalPrice) : "0"
  );
  const [colorIds, setColorIds] = useState<string[]>(variant?.colorIds || []);
  const [productImagesIds, setProductImagesIds] = useState<string[]>(
    variant?.productImagesIds || []
  );
  const [isActive, setIsActive] = useState<boolean>(variant?.isActive ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load colors
  const [colors, setColors] = useState<any[]>([]);
  const [colorSearch, setColorSearch] = useState("");
  const [loadingColors, setLoadingColors] = useState(true);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  
  // Image lightbox states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const MAX_IMAGES = 5;

  const handleOpenImageSelector = () => {
    if (selectedImages.length >= MAX_IMAGES) {
      toast.error(`You are only allowed to select a maximum of ${MAX_IMAGES} images.`);
      return;
    }
    setShowImageSelector(true);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync Dialog open state with prop
  useEffect(() => {
    setIsDialogOpen(open && !lightboxImage);
  }, [open, lightboxImage]);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      } else if (e.key === 'ArrowLeft' && selectedImages.length > 1) {
        const newIndex = lightboxImageIndex > 0 ? lightboxImageIndex - 1 : selectedImages.length - 1;
        setLightboxImageIndex(newIndex);
        setLightboxImage(selectedImages[newIndex].publicUrl);
      } else if (e.key === 'ArrowRight' && selectedImages.length > 1) {
        const newIndex = lightboxImageIndex < selectedImages.length - 1 ? lightboxImageIndex + 1 : 0;
        setLightboxImageIndex(newIndex);
        setLightboxImage(selectedImages[newIndex].publicUrl);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxImageIndex, selectedImages]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingColors(true);
        const res = await getColors({ limit: 100, isActive: true });
        if (!alive) return;
        setColors(res.data || []);
      } catch (err) {
        console.error("Failed to load colors:", err);
      } finally {
        if (alive) setLoadingColors(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Update form when variant changes (for edit mode)
  useEffect(() => {
    if (variant) {
      setName(variant.name || "");
      setSku(variant.sku || "");
      setQuantityAvailable(String(variant.quantityAvailable || 0));
      setOriginalPrice(
        variant.originalPrice ? formatPrice(variant.originalPrice) : "0"
      );
      setColorIds(variant.colorIds || []);
      setProductImagesIds(variant.productImagesIds || []);
      setIsActive(variant.isActive ?? true);

      // Load selected images for preview
      if (variant.productImages && variant.productImages.length > 0) {
        // Use existing productImages if available - map to ImageItem format
        setSelectedImages(variant.productImages.map(img => ({
          id: img.id,
          publicUrl: img.publicUrl,
          altText: img.altText || null,
          sortOrder: img.sortOrder || null,
          key: img.id, // Use id as key
          status: 'active', // Default status
          ownerType: 'product_variant',
          createdAt: new Date().toISOString(), // Fallback date
        })));
      } else if (variant.productImagesIds && variant.productImagesIds.length > 0) {
        // Fallback: fetch images if only IDs are available
        (async () => {
          try {
            const res = await getImages({
              limit: 100,
              status: "draft",
              ownerType: "product_variant",
            });
            const selected = (res.data || []).filter((img) =>
              variant.productImagesIds!.includes(img.id)
            );
            setSelectedImages(selected);
          } catch (error) {
            console.error("Error loading selected images:", error);
          }
        })();
      } else {
        setSelectedImages([]);
      }
    } else {
      // Reset form when switching to add mode
      setName("");
      setSku("");
      setQuantityAvailable("0");
      setOriginalPrice("0");
      setColorIds([]);
      setProductImagesIds([]);
      setSelectedImages([]);
      setIsActive(true);
    }
    setError("");
  }, [variant]);

  const handleImageSelect = async (imageIds: string[]) => {
    const previousIds = productImagesIds;
    
    // Update state first
    setProductImagesIds(imageIds);

    // If editing existing variant with variantId, update images on backend immediately
    if (variantId) {
      try {
        // Find images to add (in new but not in previous)
        const imagesToAdd = imageIds.filter(id => !previousIds.includes(id));
        
        // Find images to remove (in previous but not in new)
        const imagesToRemove = previousIds.filter(id => !imageIds.includes(id));

        // Smart update order
        const currentCount = previousIds.length;
        const totalAfterAdding = currentCount + imagesToAdd.length;
        const removingAll = imagesToRemove.length === previousIds.length;
        
        if (totalAfterAdding > MAX_IMAGES || !removingAll) {
          // Remove first to avoid exceeding limit
          if (imagesToRemove.length > 0) {
            await removeImagesFromVariant(variantId, imagesToRemove);
          }
          if (imagesToAdd.length > 0) {
            await addImagesToVariant(variantId, imagesToAdd);
          }
        } else {
          // Add first to maintain at least 1 image
          if (imagesToAdd.length > 0) {
            await addImagesToVariant(variantId, imagesToAdd);
          }
          if (imagesToRemove.length > 0) {
            await removeImagesFromVariant(variantId, imagesToRemove);
          }
        }
        toast.success("Images updated successfully!");
      } catch (error: any) {
        console.error("Error updating images:", error);
        toast.error(error?.response?.data?.detail || "Failed to update images");
        // Revert on error
        setProductImagesIds(previousIds);
        return;
      }
    }
    // If creating new variant (no variantId yet), just update local state
    // Images will be saved when form is submitted

    // Load full image data for preview (for both cases)
    if (imageIds.length > 0) {
      try {
        // Get existing images that are already loaded
        const existingImages = selectedImages.filter(img => imageIds.includes(img.id));
        const existingImageIds = existingImages.map(img => img.id);
        
        // Find new image IDs that need to be fetched
        const newImageIds = imageIds.filter(id => !existingImageIds.includes(id));
        
        if (newImageIds.length > 0) {
          // Fetch images without filters to get all selected images
          const res = await getImages({
            limit: 500, // Increase limit to ensure we get all images
          });
          
          const newImages = (res.data || []).filter((img) =>
            newImageIds.includes(img.id)
          );
          
          // Combine existing and new images, preserve order based on imageIds
          const allImagesMap = new Map([...existingImages, ...newImages].map(img => [img.id, img]));
          const orderedImages = imageIds.map(id => allImagesMap.get(id)).filter(Boolean) as ImageItem[];
          setSelectedImages(orderedImages);
        } else {
          // Preserve order based on imageIds
          const orderedImages = imageIds.map(id => 
            existingImages.find(img => img.id === id)
          ).filter(Boolean) as ImageItem[];
          setSelectedImages(orderedImages);
        }
      } catch (error) {
        console.error("Error loading selected images:", error);
      }
    } else {
      setSelectedImages([]);
    }
  };

  const removeImage = async (imageId: string) => {
    // If editing existing variant with variantId, remove from backend immediately
    if (variantId) {
      try {
        await removeImagesFromVariant(variantId, [imageId]);
        toast.success("Image removed successfully!");
      } catch (error: any) {
        console.error("Error removing image:", error);
        toast.error(error?.response?.data?.detail || "Failed to remove image");
        return; // Don't update UI if API call failed
      }
    }
    // If creating new variant (no variantId yet), just update local state
    // Images will be saved when form is submitted
    
    // Update local state for both cases
    setProductImagesIds((prev) => prev.filter((id) => id !== imageId));
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Variant name is required");
      return;
    }
    if (!sku.trim()) {
      setError("SKU is required");
      return;
    }
    if (!originalPrice.trim()) {
      setError("Price is required");
      return;
    }
    if (colorIds.length === 0) {
      setError("Please select a color");
      return;
    }
    if (productImagesIds.length === 0) {
      setError("Please select product images");
      return;
    }

    setLoading(true);

    try {
      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, 500));

      const rawPrice = getRawPrice(originalPrice);
      const variantData = {
        name: name.trim(),
        sku: sku.trim(),
        quantityAvailable: Number(quantityAvailable),
        originalPrice: rawPrice,
        isActive: isActive,
        colorIds: colorIds.length > 0 ? colorIds : undefined,
        productImagesIds:
          productImagesIds.length > 0 ? productImagesIds : undefined,
      };

      // If editing existing variant with ID, call update API
      if (variantId) {
        const updatePayload = {
          name: variantData.name,
          sku: variantData.sku,
          originalPrice: variantData.originalPrice || null,
          isActive: variantData.isActive,
          colorIds: variantData.colorIds || [],
          imageIds: variantData.productImagesIds || [],
        };

        await updateVariant(variantId, updatePayload);
        
        // Images are already updated via handleImageSelect and removeImage
        // No need to update images here since they're updated immediately on each action
      } else if (productId) {
        // Creating new variant - call API to create
        const createPayload = {
          name: variantData.name,
          sku: variantData.sku,
          quantityAvailable: variantData.quantityAvailable,
          originalPrice: variantData.originalPrice || null,
          isActive: variantData.isActive,
          colorIds: variantData.colorIds || [],
          imageIds: variantData.productImagesIds || [],
        };

        await createVariant(productId, createPayload);
      }

      // Show success toast - use editIndex to determine if editing (works for both DB-saved and local variants)
      const isEditing = editIndex !== undefined || !!variantId;
      toast.success(isEditing ? "Variant updated successfully!" : "Variant created successfully!");

      // Wait for parent to refresh data
      await onAdd(variantData as any);

      // Reset form
      setName("");
      setSku("");
      setQuantityAvailable("0");
      setOriginalPrice("");
      setColorIds([]);
      setProductImagesIds([]);
      setSelectedImages([]);
      setIsActive(true);
      setError("");
      setLoading(false);
      onOpenChange(false);
    } catch (error: any) {
      setError(error?.response?.data?.detail || "Failed to save variant");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setSku("");
    setQuantityAvailable("0");
    setOriginalPrice("");
    setColorIds([]);
    setProductImagesIds([]);
    setSelectedImages([]);
    setIsActive(true);
    setError("");
    setColorSearch("");
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setColorSearch("");
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editIndex !== undefined || variantId
              ? "Edit Product Variant"
              : "Add Product Variant"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              id="variant-name"
              label="Product Variant Name"
              required
              value={name}
              onChange={setName}
              disabled={loading}
            />

            <FloatingInput
              id="variant-sku"
              label="SKU"
              required
              value={sku}
              onChange={setSku}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FloatingInput
                id="variant-original-price"
                label="Price"
                type="text"
                required
                value={originalPrice}
                onChange={(v) => setOriginalPrice(formatPrice(v))}
                disabled={loading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                đ
              </span>
            </div>

            <FloatingInput
              id="variant-status"
              label="Status"
              as="select"
              required
              value={isActive ? "true" : "false"}
              onChange={(v) => setIsActive(v === "true")}
              disabled={loading}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </div>

          {/* Colors Section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Colors <span className="text-red-500">*</span>
              </label>
              {colors.length > 0 && (
                <Button
                  type="button"
                  onClick={() => {
                    if (colorIds.length === colors.length) {
                      setColorIds([]);
                    } else {
                      setColorIds(colors.map((c) => c.id));
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline p-0"
                >
                  {colorIds.length === colors.length ? "" : "Select All"}
                </Button>
              )}
            </div>

            {!loadingColors && colors.length > 0 && (
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search colors..."
                  value={colorSearch}
                  onChange={(e) => setColorSearch(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {loadingColors ? (
              <p className="text-sm text-gray-500 italic">Loading colors...</p>
            ) : colors.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No colors available
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {colors
                  .filter((color) =>
                    color.name.toLowerCase().includes(colorSearch.toLowerCase())
                  )
                  .map((color) => (
                  <label
                    key={color.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={colorIds.includes(color.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setColorIds((prev) => [...prev, color.id]);
                        } else {
                          setColorIds((prev) =>
                            prev.filter((id) => id !== color.id)
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      {color.hexCode && (
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color.hexCode }}
                        />
                      )}
                      <span className="text-sm text-gray-700">
                        {color.name}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {colorIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
                  Selected: <strong>{colorIds.length}</strong> color
                  {colorIds.length !== 1 ? "s" : ""}
                </span>
                <Button
                  type="button"
                  onClick={() => setColorIds([])}
                  className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline p-0"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Product Images (Optional)
              </label>
              <Button
                type="button"
                onClick={handleOpenImageSelector}
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5"
                disabled={loading}
              >
                <Plus className="w-3.5 h-3.5" />
                Select Images
              </Button>
            </div>

            {selectedImages.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No images selected yet.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {selectedImages.map((img, imgIdx) => (
                  <div
                    key={img.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(img.publicUrl);
                      setLightboxImageIndex(imgIdx);
                    }}
                  >
                    <img
                      src={img.publicUrl}
                      alt={img.altText || "Product image"}
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedImages.length > 0 && (
              <p className="mt-2 text-xs text-gray-600">
                Selected: <strong>{selectedImages.length}</strong> image
                {selectedImages.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              className="h-10 w-20 bg-gray-500 hover:bg-gray-700 text-white"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="h-10 w-20 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editIndex !== undefined
                ? "Update"
                : "Save"}
            </Button>
          </div>
        </form>

        {/* Product Image Selector Modal */}
        <ProductImageSelector
          open={showImageSelector}
          onOpenChange={setShowImageSelector}
          onSelect={handleImageSelect}
          selectedIds={productImagesIds}
          maxSelection={MAX_IMAGES}
        />
      </DialogContent>
    </Dialog>

    {/* Image Lightbox Modal - Outside Dialog */}
    {lightboxImage && isMounted && createPortal(
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget) {
            setLightboxImage(null);
          }
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLightboxImage(null);
          }}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 cursor-pointer"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Previous Button */}
        {selectedImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = lightboxImageIndex > 0 ? lightboxImageIndex - 1 : selectedImages.length - 1;
              setLightboxImageIndex(newIndex);
              setLightboxImage(selectedImages[newIndex].publicUrl);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors z-10 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="max-w-7xl max-h-[95vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <img
            src={lightboxImage}
            alt="Product image"
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
          
          {/* Thumbnails */}
          {selectedImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-2">
              {selectedImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(img.publicUrl);
                    setLightboxImageIndex(idx);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all bg-white ${
                    idx === lightboxImageIndex
                      ? "border-blue-400 ring-1 ring-blue-400"
                      : "border-white/30 hover:border-white/60"
                  }`}
                >
                  <img
                    src={img.publicUrl}
                    alt={img.altText || `Image ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Next Button */}
        {selectedImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newIndex = lightboxImageIndex < selectedImages.length - 1 ? lightboxImageIndex + 1 : 0;
              setLightboxImageIndex(newIndex);
              setLightboxImage(selectedImages[newIndex].publicUrl);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors z-10 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>,
      document.body
    )}
  </>
  );
}
