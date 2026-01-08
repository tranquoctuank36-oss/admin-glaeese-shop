"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowLeft,
  Filter,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TablePagination from "@/components/TablePagination";
import ConfirmPopover from "@/components/ConfirmPopover";
import {
  getDiscountById,
  getDiscountTargets,
  removeDiscountTarget,
} from "@/services/discountService";
import type { Discount } from "@/types/discount";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { Routes } from "@/lib/routes";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  finalPrice: string;
  originalPrice?: string;
  quantityOnHand: number;
  thumbnailImage?: {
    id: string;
    publicUrl: string;
    altText?: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
    brand?: {
      id: string;
      name: string;
    };
  };
  colors?: Array<{
    id: string;
    name: string;
    hexCode?: string;
  }>;
}

function DiscountTargetsPage() {
  const router = useRouter();
  const params = useParams();
  const discountId = params.id as string;

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [productType, setProductType] = useState<string>("all");
  const [brandId, setBrandId] = useState<string>("");
  const [gender, setGender] = useState<string>("all");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  const fetchDiscount = async () => {
    try {
      const data = await getDiscountById(discountId);
      setDiscount(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to load discount");
      router.push(Routes.sales.discounts.root);
    }
  };

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const data = await getDiscountTargets(discountId, {
        search,
        page,
        limit,
        sortField,
        sortOrder,
        productType: productType !== "all" ? productType : undefined,
        brandId: brandId || undefined,
        gender: gender !== "all" ? gender : undefined,
      });
      setVariants(data.data);
      setTotalItems(data.meta.totalItems);
      setTotalPages(data.meta.totalPages);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to fetch discount targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscount();
  }, [discountId]);

  useEffect(() => {
    fetchVariants();
  }, [page, limit, search, sortField, sortOrder, productType, brandId, gender]);

  const handleRemoveTarget = async (targetId: string, variantName: string) => {
    try {
      setBusyId(targetId);
      await removeDiscountTarget(discountId, targetId);
      toast.success(`Removed ${variantName} from discount`);
      fetchVariants();
    } catch (error: any) {
      console.error("Failed to remove target:", error);
      toast.error(error?.response?.data?.detail || "Failed to remove product variant");
    } finally {
      setBusyId(null);
    }
  };

  const toggleSort = (field: "name" | "createdAt") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
  };



  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.push(Routes.sales.discounts.details(discountId))}
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Sản phẩm áp dụng cho chương trình giảm giá
                </h1>
                {discount && (
                  <p className="text-gray-600 mt-1">
                    Quản lý sản phẩm cho: <strong>{discount.name}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-2xl shadow-lg p-3 border border-gray-200"
          >
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600 text-lg">Đang tải sản phẩm...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Hình ảnh
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span>TÊN SẢN PHẨM</span>
                          <button
                            type="button"
                            onClick={() => toggleSort("name")}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "name"
                                ? `Sorting: ${sortOrder} (click to change)`
                                : "No sorting (click to sort by Name)"
                            }
                          >
                            {sortField === "name" ? (
                              sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        SKU
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tồn kho
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Giá gốc
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Giá cuối
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>ADDED AT</span>
                          <button
                            type="button"
                            onClick={() => toggleSort("createdAt")}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "createdAt"
                                ? `Sorting: ${sortOrder} (click to change)`
                                : "No sorting (click to sort by Added At)"
                            }
                          >
                            {sortField === "createdAt" ? (
                              sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {variants.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                          {search
                            ? "No product variants found"
                            : "No product variants added yet"}
                        </td>
                      </tr>
                    ) : (
                      variants.map((variant, idx) => (
                        <motion.tr
                          key={variant.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                        {/* Image */}
                        <td className="px-6 py-4">
                          {variant.thumbnailImage?.publicUrl ? (
                            <img
                              src={variant.thumbnailImage.publicUrl}
                              alt={variant.name}
                              className="w-16 h-14 object-contain rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightboxImage({
                                url: variant.thumbnailImage!.publicUrl,
                                alt: variant.name
                              })}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </td>

                        {/* Product & Variant */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {variant.product?.name}
                            </p>
                            <p className="text-gray-500">
                              {variant.product?.brand?.name}
                            </p>
                            <p className="text-gray-700 mt-1">{variant.name}</p>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {variant.sku}
                          </code>
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={[
                              "text-sm font-medium",
                              variant.quantityOnHand > 0
                                ? "text-gray-600"
                                : "text-red-600",
                            ].join(" ")}
                          >
                            {variant.quantityOnHand ?? '-'}
                          </span>
                        </td>
                        {/* Original Price */}
                        <td className="px-6 py-4 text-center">
                          {variant.originalPrice ? (
                            <span className="text-gray-500 line-through">
                              {Number(variant.originalPrice).toLocaleString("en-US")}đ
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {/* Price */}
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-green-600">
                            {Number(variant.finalPrice).toLocaleString("en-US")}đ
                          </span>
                        </td>

                        {/* Added At */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-gray-600">
                            {new Date().toLocaleDateString("en-GB")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <ConfirmPopover
                              title="Xóa phân loại sản phẩm"
                            message={
                              <div>
                                Xóa <strong>{variant.name}</strong> khỏi giảm giá này?
                              </div>
                            }
                            confirmText="Xóa"
                            onConfirm={() =>
                              handleRemoveTarget(variant.id, variant.name)
                            }
                          >
                            <Button
                              size="icon-sm"
                              className="bg-red-50 hover:bg-red-100 text-red-600"
                              disabled={busyId === variant.id}
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </ConfirmPopover>
                        </td>
                      </motion.tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && variants.length > 0 && (
              <TablePagination
                page={page}
                limit={limit}
                totalPages={totalPages}
                totalItems={totalItems}
                hasPrev={page > 1}
                hasNext={page < totalPages}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
              onClick={() => setLightboxImage(null)}
              title="Đóng"
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
      </main>
    </div>
  );
}

export default withAuthCheck(DiscountTargetsPage);
