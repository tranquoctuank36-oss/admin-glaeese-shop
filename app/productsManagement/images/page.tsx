"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/data/Pagination";
import { useListQuery } from "@/components/data/useListQuery";
import { getImages, bulkDeleteImages } from "@/services/imagesService";
import { ImageItem } from "@/types/image";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import ConfirmPopover from "@/components/ConfirmPopover";
import toast from "react-hot-toast";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ImagesPage() {
  const router = useRouter();
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    imageStatus: "all",
    ownerType: "all",
    sortField: "createdAt",
    sortOrder: "DESC",
  });

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    }
  };

  const [rows, setRows] = useState<ImageItem[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
    currentPage?: number;
  }>();

  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [openBulkDelete, setOpenBulkDelete] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getImages(apiParams);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
          currentPage: res.meta?.currentPage,
        });
      } catch (e) {
        console.error("Failed to fetch images:", e);
        if (alive) {
          setRows([]);
          setMeta(undefined);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey]);

  const handleBulkDelete = async () => {
    try {
      setDeletingBulk(true);
      await bulkDeleteImages(selectedImages);
      setRows((prev) => prev.filter((r) => !selectedImages.includes(r.id)));
      setSelectedImages([]);
      toast.success(`${selectedImages.length} image(s) deleted successfully`);
    } catch (e: any) {
      console.error("Bulk delete failed:", e);
      const errorMessage = e?.response?.data?.detail || e?.detail || "Failed to delete images";
      toast.error(errorMessage);
    } finally {
      setDeletingBulk(false);
      setOpenBulkDelete(false);
    }
  };

  const allSelected = rows.length > 0 && selectedImages.length === rows.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedImages(checked ? rows.map((r) => r.id) : []);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const hasNext =
    meta?.currentPage && meta?.totalPages
      ? meta.currentPage < meta.totalPages
      : false;
  const hasPrev = (meta?.currentPage ?? 1) > 1;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Danh Sách Hình Ảnh {meta?.totalItems !== undefined && `(${meta.totalItems})`}</h1>
                <p className="text-gray-600 mt-1">
                  Quản lý tất cả hình ảnh tải lên cho sản phẩm, thương hiệu và khuyến mãi
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/productsManagement/images/add")}
              className="flex items-center gap-2 h-12 bg-blue-600 hover:bg-blue-700 text-white text-base transition-all"
            >
              <Plus size={20} />
              Thêm Hình Ảnh
            </Button>
          </div>

          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            imageStatus={q.imageStatus as any}
            ownerType={q.ownerType as any}
            onFiltersChange={(patch) =>
              setAndResetPage({ ...(patch as any), page: 1 })
            }
            placeholder="Tìm kiếm theo văn bản thay thế..."
          />
        </motion.div>

        {/* Bulk actions */}
        {selectedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between"
          >
            <div className="text-blue-800 font-medium">
              {selectedImages.length} hình ảnh được chọn
            </div>
            <ConfirmPopover
              open={openBulkDelete}
              onOpenChange={setOpenBulkDelete}
              title="Xóa các hình ảnh được chọn?"
              message={`Bạn có chắc chắn muốn xóa ${selectedImages.length} hình ảnh?`}
              confirmText="Xóa"
              onConfirm={handleBulkDelete}
              confirmDisabled={deletingBulk}
              confirmLoading={deletingBulk}
              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
              side="bottom"
              sideOffset={8}
              widthClass="w-[320px]"
            >
              <Button className="h-12 px-4 py-2 bg-red-500 text-white/90 rounded-lg hover:bg-red-700">
                <Trash2 className="text-white/90 size-5" />
                Xóa Các HÌnh Được Chọn
              </Button>
            </ConfirmPopover>
            {/* <ConfirmPopover
              open={openId === image.id}
              onOpenChange={(o) => setOpenId(o ? image.id : null)}
              title="Delete this image?"
              message={
                <p className="text-xs text-gray-600 font-bold truncate">
                  {image.key}
                </p>
              }
              confirmText="Delete"
              onConfirm={async () => {
                setDeletingId(image.id);
                try {
                  await handleDelete(image.id);
                } finally {
                  setDeletingId(null);
                }
              }}
              confirmDisabled={deletingId === image.id}
              confirmLoading={deletingId === image.id}
              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
              side="bottom"
              sideOffset={8}
              widthClass="w-[280px]"
            >
              <Button
                size="icon-sm"
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete"
                onClick={() => setOpenId(image.id)}
                disabled={deletingId === image.id}
              >
                <Trash2 className="text-red-600 size-5" />
              </Button>
            </ConfirmPopover> */}
          </motion.div>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible"
          >
            <div className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Hình Ảnh
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        URL / Key
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Trạng Thái
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Loại
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Ngày Tạo
                          </span>
                          <button
                            type="button"
                            onClick={toggleCreatedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "createdAt"
                                ? `Sắp xếp: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (nhấp để thay đổi)`
                                : "Không sắp xếp (nhấp để sắp xếp theo Ngày Tạo)"
                            }
                          >
                            {q.sortField === "createdAt" ? (
                              q.sortOrder === "ASC" ? (
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
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {rows.map((image) => (
                      <tr
                        key={image.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(image.id)}
                            onChange={() => toggleSelectOne(image.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-20 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                            {image.publicUrl ? (
                              <img
                                src={image.publicUrl}
                                alt={image.altText || "Image"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[320px]">
                          <div className="max-w-md">
                            <a
                              href={image.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm font-medium block truncate"
                              title={image.publicUrl}
                            >
                              {image.publicUrl}
                            </a>
                            <span
                              className="text-xs text-gray-500 font-mono block truncate mt-1"
                              title={image.key}
                            >
                              {image.key}
                            </span>
                            {image.altText && (
                              <span className="text-xs text-gray-600 italic block mt-1">
                                Alt: {image.altText}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              image.status === "used"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {image.status === "used" ? "Được Sử Dụng" : "Nháp"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                              image.ownerType === "product_variant" || image.ownerType === "product"
                                ? "bg-blue-100 text-blue-700"
                                : image.ownerType === "brand"
                                ? "bg-purple-100 text-purple-700"
                                : image.ownerType === "discount"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {image.ownerType === "product_variant" || image.ownerType === "product"
                              ? "Biến Thể Sản Phẩm"
                              : image.ownerType === "brand"
                              ? "Thương Hiệu"
                              : image.ownerType === "discount"
                              ? "Khuyến Mãi"
                              : image.ownerType.charAt(0).toUpperCase() + image.ownerType.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-gray-600 text-sm">
                            {formatDate(image.createdAt) || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-gray-600">
                              Không tìm thấy hình ảnh nào.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Hàng trên trang:</span>
                <select
                  className="border rounded-md px-2 py-1"
                  value={q.limit}
                  onChange={(e) =>
                    setAndResetPage({ limit: Number(e.target.value), page: 1 })
                  }
                >
                  {[10, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <Pagination
                page={q.page}
                totalPages={meta?.totalPages}
                hasPrev={hasPrev}
                hasNext={hasNext}
                onChange={(p) => {
                  const capped = meta?.totalPages
                    ? Math.min(p, meta.totalPages)
                    : p;
                  setQ((prev) => ({ ...prev, page: Math.max(1, capped) }));
                }}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
