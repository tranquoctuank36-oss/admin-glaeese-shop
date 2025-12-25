"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Calendar,
  Tag,
  Package,
  TrendingUp,
  Star,
  Glasses,
  Ruler,
  Layers,
  Box,
  BadgeCheck,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Routes } from "@/lib/routes";
import {
  getProductById,
  softDeleteVariant,
  restoreVariant,
  getVariantsByProductId,
  softDeleteProduct,
} from "@/services/productService";
import type { Product, ProductVariant } from "@/types/product";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import AddVariantDialog from "@/components/products/AddVariantDialog";
import ConfirmPopover from "@/components/ConfirmPopover";
import { toast } from "react-hot-toast";

function fmt(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "unlisted":
      return "bg-yellow-100 text-yellow-700";
    case "archived":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatStatusLabel(status?: string | null) {
  if (!status) return "-";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addVariantOpen, setAddVariantOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentVariantImages, setCurrentVariantImages] = useState<any[]>([]);
  const [editingVariant, setEditingVariant] = useState<
    Partial<ProductVariant> | undefined
  >(undefined);
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(
    null
  );
  const [openedFromTrash, setOpenedFromTrash] = useState(false);
  const [activeVariants, setActiveVariants] = useState<any[]>([]);
  const [deletedVariants, setDeletedVariants] = useState<any[]>([]);
  const [removePopoverOpen, setRemovePopoverOpen] = useState<string | null>(null);
  const [restorePopoverOpen, setRestorePopoverOpen] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const refreshProduct = async () => {
    if (!id) return;
    try {
      const p = await getProductById(id, true);
      setData(p ?? null);

      // Fetch active variants (isDeleted=false)
      const active = await getVariantsByProductId(id, false);
      setActiveVariants(active || []);

      // Fetch deleted variants (isDeleted=true)
      const deleted = await getVariantsByProductId(id, true);
      setDeletedVariants(deleted || []);
    } catch (err: any) {
      console.error("Failed to refresh product:", err);
    }
  };

  const handleEditVariant = (variant: any) => {
    setEditingVariant({
      ...variant,
      colorIds: variant.colors?.map((c: any) => c.id) || [],
      productImagesIds: variant.productImages?.map((img: any) => img.id) || [],
      productImages: variant.productImages || [], // Add full image objects
    });
    setAddVariantOpen(true);
  };

  const handleDeleteVariant = async (variantId: string) => {
    // Get active variants count (not deleted)
    const activeVariants =
      data?.productVariants?.filter((v: any) => !v.isDeleted) || [];

    if (activeVariants.length <= 1) {
      toast.error("A product needs to have at least one Product Variant.");
      return;
    }

    try {
      setDeletingVariantId(variantId);
      await softDeleteVariant(variantId);
      await refreshProduct();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete variant");
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleRestoreVariant = async (variantId: string) => {
    try {
      await restoreVariant(variantId);
      toast.success("Variant restored successfully");
      await refreshProduct();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to restore variant");
    }
  };

  const handleDeleteProduct = async () => {
    if (!data) return;
    try {
      setBusyAction(true);
      await softDeleteProduct(data.id);
      toast.success("Product moved to trash");
      router.push(Routes.productsManagement.products.root);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete product");
    } finally {
      setBusyAction(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getProductById(id, true);
        if (!alive) return;
        setData(p ?? null);

        // Fetch active variants (isDeleted=false)
        const active = await getVariantsByProductId(id, false);
        if (!alive) return;
        setActiveVariants(active || []);

        // Fetch deleted variants (isDeleted=true)
        const deleted = await getVariantsByProductId(id, true);
        if (!alive) return;
        setDeletedVariants(deleted || []);
      } catch (err: any) {
        if (!alive) return;
        setError("Failed to load product.");
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200 shadow-md hover:shadow-lg transition-all"
                onClick={() =>
                  router.push(Routes.productsManagement.products.root)
                }
                title="Back"
              >
                <ArrowLeft className="text-gray-700 size-6" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Product Details
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  View complete information
                </p>
              </div>
            </div>

            {!loading && data && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <Button
                  onClick={() =>
                    router.push(
                      Routes.productsManagement.products.edit(data.id)
                    )
                  }
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={busyAction}
                >
                  <Edit size={20} />
                  Edit
                </Button>

                <ConfirmPopover
                  title="Delete Product"
                  message={
                    <div>
                      Are you sure you want to delete <strong>{data.name}</strong>?
                    </div>
                  }
                  confirmText="Delete"
                  onConfirm={handleDeleteProduct}
                >
                  <Button
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={busyAction}
                  >
                    <Trash2 size={20} />
                    Delete
                  </Button>
                </ConfirmPopover>
              </motion.div>
            )}
          </div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Loading product details…</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center"
            >
              <p className="text-red-600 text-xl font-semibold">{error}</p>
            </motion.div>
          ) : !data ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center"
            >
              <p className="text-red-600 text-xl font-semibold">
                Product not found.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <motion.div
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white shadow-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold mb-3">{data.name}</h2>
                    <p className="text-green-100 text-lg font-medium mb-4">
                      {data.slug}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {data.brand?.name && (
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                          <BadgeCheck className="size-4" />
                          <span className="text-sm font-medium">
                            {data.brand.name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                        <Package className="size-4" />
                        <span className="text-sm font-medium">
                          {data.productVariants?.length ?? 0} Variants
                        </span>
                      </div>
                      {data.isFeatured && (
                        <div className="flex items-center gap-2 bg-yellow-400/90 text-yellow-900 px-3 py-1.5 rounded-lg">
                          <Star className="size-4 fill-current" />
                          <span className="text-sm font-semibold">
                            Featured
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-base font-semibold shadow-lg ${statusBadgeClass(
                        data.productStatus
                      )} ring-2 ring-white`}
                    >
                      {formatStatusLabel(data.productStatus)}
                    </span>
                  </div>
                </div>
                {data.description && (
                  <div className="mt-4 pt-2 border-t border-white/20">
                    <p className="text-green-50 leading-relaxed">
                      <span className="italic">Description:</span>{" "}
                      {data.description}
                    </p>
                  </div>
                )}
              </motion.div>
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Type Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Glasses className="size-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Product Type
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {data.productType ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Gender: {data.gender ?? "-"}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Frame Details Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Box className="size-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-3">
                        Frame Details
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-semibold text-gray-800">
                            {data.frameType?.name ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shape:</span>
                          <span className="font-semibold text-gray-800">
                            {data.frameShape?.name ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Material:</span>
                          <span className="font-semibold text-gray-800">
                            {data.frameMaterial?.name ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Dimensions Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Ruler className="size-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-3">
                        Dimensions
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Lens Width/Height:
                          </span>
                          <span className="font-semibold text-gray-800">
                            {data.lensWidth ?? "-"} / {data.lensHeight ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bridge Width:</span>
                          <span className="font-semibold text-gray-800">
                            {data.bridgeWidth ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Temple Length:</span>
                          <span className="font-semibold text-gray-800">
                            {data.templeLength ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Statistics Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <TrendingUp className="size-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-3">
                        Statistics
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reviews:</span>
                          <span className="font-semibold text-gray-800">
                            {data.reviewCount ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sold:</span>
                          <span className="font-semibold text-gray-800">
                            {data.totalSold ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span className="font-semibold text-gray-800">
                            {data.averageRating ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Meta Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Calendar className="size-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Created Date
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {fmt(data.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tags Section */}
              {data.tags && data.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag: any) => (
                      <span
                        key={tag.id}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Variants Section */}
              {(activeVariants.length > 0 || deletedVariants.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="bg-white rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                      Product Variants ({activeVariants.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setTrashDialogOpen(true)}
                        className="flex items-center gap-2 h-10 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 size={18} />
                        Trash bin
                        {deletedVariants.length > 0 && (
                          <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                            {deletedVariants.length}
                          </span>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingVariant(undefined);
                          setAddVariantOpen(true);
                        }}
                        className="flex items-center gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus size={18} />
                        Add Product Variant
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeVariants.map(
                      (variant: any, idx: number) => (
                        <motion.div
                          key={variant.id || idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + idx * 0.05 }}
                          className="border-2 rounded-xl p-5 bg-gradient-to-br border-gray-200 from-gray-50 to-white hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-gray-900 text-lg flex-1">
                              {variant.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => handleEditVariant(variant)}
                                className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                                title="Edit variant"
                              >
                                <Edit size={16} />
                              </Button>
                              <ConfirmPopover
                                open={removePopoverOpen === variant.id}
                                onOpenChange={(open) => setRemovePopoverOpen(open ? variant.id : null)}
                                title="Remove Variant?"
                                message={
                                  <div>
                                    Are you sure you want to remove{" "}
                                    <strong>
                                      {variant.name || "this variant"}
                                    </strong>
                                    ?
                                  </div>
                                }
                                onConfirm={() =>
                                  handleDeleteVariant(variant.id)
                                }
                                confirmText="Remove"
                              >
                                <Button
                                  className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                  disabled={
                                    deletingVariantId === variant.id
                                  }
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </ConfirmPopover>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-600">SKU:</span>
                              <span className="font-semibold text-gray-800">
                                {variant.sku}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-600">Price:</span>
                              <span className="font-bold text-gray-600">
                                {Number(
                                  variant.originalPrice || 0
                                ).toLocaleString("en-US")}
                                đ
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-semibold text-gray-800">
                                {variant.quantityAvailable || 0}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-600">Status:</span>
                              <span
                                className={`font-semibold ${
                                  variant.isActive
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {variant.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            {variant.colors && variant.colors.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-600 text-xs font-medium block mb-2">
                                  Colors:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {variant.colors.map(
                                    (color: any, cidx: number) => (
                                      <div
                                        key={cidx}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm"
                                      >
                                        {color.hexCode && (
                                          <div
                                            className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
                                            style={{
                                              backgroundColor: color.hexCode,
                                            }}
                                          />
                                        )}
                                        <span className="text-xs font-medium text-gray-700">
                                          {color.name}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Variant Images */}
                            {variant.productImages &&
                              variant.productImages.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs text-gray-500 font-medium mb-2">
                                    Images ({variant.productImages.length})
                                  </p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {variant.productImages.map(
                                      (img: any, imgIdx: number) => (
                                        <div
                                          key={imgIdx}
                                          onClick={() => {
                                            setSelectedImage(img.publicUrl);
                                            setSelectedImageIndex(imgIdx);
                                            setCurrentVariantImages(
                                              variant.productImages
                                            );
                                          }}
                                          className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer bg-white"
                                        >
                                          <img
                                            src={img.publicUrl}
                                            alt={img.altText || variant.name}
                                            className="w-full h-full object-contain"
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Image Lightbox Modal */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedImage(null);
              if (openedFromTrash) {
                setTrashDialogOpen(true);
                setOpenedFromTrash(false);
              }
            }}
          >
            <button
              onClick={() => {
                setSelectedImage(null);
                if (openedFromTrash) {
                  setTrashDialogOpen(true);
                  setOpenedFromTrash(false);
                }
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Previous Button */}
            {currentVariantImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex =
                    selectedImageIndex > 0
                      ? selectedImageIndex - 1
                      : currentVariantImages.length - 1;
                  setSelectedImageIndex(newIndex);
                  setSelectedImage(currentVariantImages[newIndex].publicUrl);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            <div
              className="max-w-5xl max-h-[95vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Product variant"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />

              {/* Thumbnails */}
              {currentVariantImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-2">
                  {currentVariantImages.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedImage(img.publicUrl);
                        setSelectedImageIndex(idx);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all bg-white ${
                        idx === selectedImageIndex
                          ? "border-green-400 ring-1 ring-green-400"
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
            {currentVariantImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex =
                    selectedImageIndex < currentVariantImages.length - 1
                      ? selectedImageIndex + 1
                      : 0;
                  setSelectedImageIndex(newIndex);
                  setSelectedImage(currentVariantImages[newIndex].publicUrl);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </motion.div>
        )}
      </main>

      {/* Add/Edit Variant Dialog */}
      <AddVariantDialog
        open={addVariantOpen}
        onOpenChange={(open) => {
          setAddVariantOpen(open);
          if (!open) {
            setEditingVariant(undefined);
          }
        }}
        productId={id}
        variant={editingVariant}
        variantId={editingVariant?.id as string}
        onAdd={async () => {
          await refreshProduct();
          setAddVariantOpen(false);
          setEditingVariant(undefined);
        }}
      />

      {/* Trash Bin Dialog */}
      <Dialog open={trashDialogOpen} onOpenChange={setTrashDialogOpen}>
        <DialogContent className="!max-w-[1400px] w-[70vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trash2 className="text-red-600" size={24} />
              Trash Bin - Deleted Variants ({deletedVariants.length})
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {deletedVariants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Trash2 size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No deleted variants</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deletedVariants.map((variant: any, idx: number) => (
                  <motion.div
                    key={variant.id || idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-2 border-red-200 rounded-xl p-5 bg-gradient-to-br from-red-50 to-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-900 text-lg flex-1">
                        {variant.name}
                      </h4>
                      <ConfirmPopover
                        open={restorePopoverOpen === variant.id}
                        onOpenChange={(open) => setRestorePopoverOpen(open ? variant.id : null)}
                        title="Restore Variant?"
                        message={
                          <div>
                            Are you sure you want to restore{" "}
                            <strong>{variant.name || "this variant"}</strong>?
                          </div>
                        }
                        onConfirm={() => handleRestoreVariant(variant.id)}
                        confirmText="Restore"
                        confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                        widthClass="w-[320px]"
                      >
                        <Button
                          className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                          title="Restore variant"
                        >
                          <RotateCcw size={16} />
                        </Button>
                      </ConfirmPopover>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">SKU:</span>
                        <span className="font-semibold text-gray-800">
                          {variant.sku}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-gray-600">
                          {Number(variant.originalPrice || 0).toLocaleString(
                            "en-US"
                          )}
                          đ
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-semibold text-gray-800">
                          {variant.quantityAvailable || 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-semibold ${
                            variant.isActive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {variant.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {variant.colors && variant.colors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-gray-600 text-xs font-medium block mb-2">
                            Colors:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {variant.colors.map((color: any, cidx: number) => (
                              <div
                                key={cidx}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm"
                              >
                                {color.hexCode && (
                                  <div
                                    className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
                                    style={{
                                      backgroundColor: color.hexCode,
                                    }}
                                  />
                                )}
                                <span className="text-xs font-medium text-gray-700">
                                  {color.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {variant.productImages &&
                        variant.productImages.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-medium mb-2">
                              Images ({variant.productImages.length})
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {variant.productImages.map(
                                (img: any, imgIdx: number) => (
                                  <div
                                    key={imgIdx}
                                    onClick={() => {
                                      setTrashDialogOpen(false);
                                      setOpenedFromTrash(true);
                                      setSelectedImage(img.publicUrl);
                                      setSelectedImageIndex(imgIdx);
                                      setCurrentVariantImages(
                                        variant.productImages
                                      );
                                    }}
                                    className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors cursor-pointer bg-white"
                                  >
                                    <img
                                      src={img.publicUrl}
                                      alt={img.altText || variant.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuthCheck(ProductDetailPage);
