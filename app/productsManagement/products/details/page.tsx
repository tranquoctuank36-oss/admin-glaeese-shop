"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";
import { getProductById } from "@/services/productService";
import type { Product } from "@/types/product";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";

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

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getProductById(id);
        if (!alive) return;
        setData(p ?? null);
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
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.push(Routes.productsManagement.products.root)}
                title="Back"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-800">Product Details</h1>
            </div>
            {data && (
              <Button
                onClick={() => router.push(Routes.productsManagement.products.edit(data.id))}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Edit className="w-4 h-4" />
                Edit Product
              </Button>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Loading product details...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : !data ? (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
              <p className="text-red-600">Product not found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 border-b pb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-bold text-gray-900">{data.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Slug:</span>{" "}
                      <span className="font-medium text-gray-800">{data.slug}</span>
                    </div>
                    {data.brand?.name && (
                      <div>
                        <span className="text-gray-600">Brand:</span>{" "}
                        <span className="font-medium text-gray-800">{data.brand.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Variants:</span>{" "}
                      <span className="font-medium text-blue-600">{data.productVariants?.length ?? 0}</span>
                    </div>
                  </div>
                  {data.description && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{data.description}</p>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg ${statusBadgeClass(
                      data.productStatus
                    )}`}
                  >
                    {formatStatusLabel(data.productStatus)}
                  </span>
                </div>
              </div>

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Type & Gender */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Type & Gender</h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Type:</span>{" "}
                      <span className="font-medium text-gray-800">{data.productType ?? "-"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Gender:</span>{" "}
                      <span className="font-medium text-gray-800">{data.gender ?? "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Frame Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Frame Details</h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Type:</span>{" "}
                      <span className="font-medium text-gray-800">{data.frameType?.name ?? "-"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Shape:</span>{" "}
                      <span className="font-medium text-gray-800">{data.frameShape?.name ?? "-"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Material:</span>{" "}
                      <span className="font-medium text-gray-800">{data.frameMaterial?.name ?? "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Dimensions</h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Lens Width:</span>{" "}
                      <span className="font-medium text-gray-800">{data.lensWidth ?? "-"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Lens Height:</span>{" "}
                      <span className="font-medium text-gray-800">{data.lensHeight ?? "-"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Bridge Width:</span>{" "}
                      <span className="font-medium text-gray-800">{data.bridgeWidth ?? "-"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Temple Length:</span>{" "}
                      <span className="font-medium text-gray-800">{data.templeLength ?? "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Statistics</h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Reviews:</span>{" "}
                      <span className="font-medium text-gray-800">{data.reviewCount ?? 0}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Total Sold:</span>{" "}
                      <span className="font-medium text-gray-800">{data.totalSold ?? 0}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Average Rating:</span>{" "}
                      <span className="font-medium text-gray-800">{data.averageRating ?? "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Meta Information</h3>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Created:</span>{" "}
                      <span className="font-medium text-gray-800">{fmt(data.createdAt)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Featured:</span>{" "}
                      <span className="font-medium text-gray-800">{data.isFeatured ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {data.tags && data.tags.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg lg:col-span-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Section */}
              {data.productVariants && data.productVariants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Product Variants ({data.productVariants.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.productVariants.map((variant: any, idx: number) => (
                      <div key={variant.id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-800 mb-2">{variant.name}</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-600">SKU:</span>{" "}
                            <span className="font-medium text-gray-800">{variant.sku}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price:</span>{" "}
                            <span className="font-medium text-gray-800">
                              {Number(variant.originalPrice || 0).toLocaleString("en-US")}đ
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity:</span>{" "}
                            <span className="font-medium text-gray-800">{variant.quantityAvailable || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>{" "}
                            <span className={`font-medium ${variant.isActive ? "text-green-600" : "text-red-600"}`}>
                              {variant.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {variant.colors && variant.colors.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-600 text-xs">Colors:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {variant.colors.map((color: any, cidx: number) => (
                                  <div key={cidx} className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs">
                                    {color.hexCode && (
                                      <div
                                        className="w-3 h-3 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color.hexCode }}
                                      />
                                    )}
                                    <span>{color.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(ProductDetailPage);
