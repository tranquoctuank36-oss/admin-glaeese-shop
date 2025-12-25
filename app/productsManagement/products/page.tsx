"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import {
  getProducts,
  softDeleteProduct,
  countTrashProductsClient,
} from "@/services/productService";
import type { Product } from "@/types/product";
import Pagination from "@/components/data/Pagination";
import { Button } from "@/components/ui/button";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import { useListQuery } from "@/components/data/useListQuery";
import { Routes } from "@/lib/routes";
import { useRouter } from "next/navigation";
import ConfirmPopover from "@/components/ConfirmPopover";
import { toast } from "react-hot-toast";

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "unpublished":
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

function fmt(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function ProductsPage() {
  // const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const router = useRouter();

  const [rows, setRows] = useState<Product[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trashCount, setTrashCount] = useState(0);

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    sortField: "createdAt",
    sortOrder: "DESC",
    isDeleted: "false",
  });

  const toggleNameSort = () => {
    if (q.sortField !== "name")
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    else if (q.sortOrder === "ASC")
      setAndResetPage({ sortField: "name", sortOrder: "DESC" as const });
    else
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
  };

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "DESC" as const });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({ sortField: "createdAt", sortOrder: "ASC" as const });
    } else {
      setAndResetPage({ sortField: "name", sortOrder: "ASC" as const });
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProducts(apiParams);
        console.log("Fetched products:", res);
        if (!alive) return;
        setRows(res.data ?? []);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e: any) {
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const count = await countTrashProductsClient();
        if (!alive) return;
        setTrashCount(count);
      } catch (error) {
        console.error("Failed to fetch trash count:", error);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const allSelected =
    rows.length > 0 && selectedProducts.length === rows.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? rows.map((r) => r.id) : []);
  };
  const toggleSelectOne = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await softDeleteProduct(id);
      // Refresh the list after deletion
      const res = await getProducts(apiParams);
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      // Refresh trash count
      const count = await countTrashProductsClient();
      setTrashCount(count);
      // Show success message if you have a toast/notification system
      console.log(`Product "${name}" deleted successfully`);
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => softDeleteProduct(id)));
      setSelectedProducts([]);
      // Refresh the list after deletion
      const res = await getProducts(apiParams);
      setRows(res.data ?? []);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
      // Refresh trash count
      const count = await countTrashProductsClient();
      setTrashCount(count);
      console.log(`${selectedProducts.length} products deleted successfully`);
    } catch (error: any) {
      console.error("Failed to delete products:", error);
      const detail = error?.response?.data?.detail || error?.detail;
      toast.error(detail);
    }
  };

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
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Products</h1>
              <p className="text-gray-600 mt-1">
                Manage your eyewear inventory
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() =>
                  router.push(Routes.productsManagement.products.trash)
                }
                className="flex h-12 items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-base"
              >
                <Trash2 size={20} />
                Trash Bin
                {trashCount > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {trashCount}
                  </span>
                )}
              </Button>
              <Button
                onClick={() =>
                  router.push(Routes.productsManagement.products.add)
                }
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Add Product
              </Button>
            </div>
          </div>

          {/* Search & Filter */}
          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            productStatus={(q as any).productStatus ?? "all"}
            onFiltersChange={(patch) => {
              if (typeof patch.productStatus !== "undefined") {
                setAndResetPage({
                  productStatus: patch.productStatus,
                  page: 1,
                } as any);
              }
            }}
            placeholder="Search by product name or slug or description..."
          />

          {/* <ProductListToolbar
            value={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchSideEffect={() => setPage(1)}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((s) => !s)}
          >
            <div className="text-sm text-gray-500">More filters…</div>
          </ProductListToolbar> */}
        </motion.div>

        {/* Bulk actions */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between"
          >
            <div className="text-blue-800 font-medium">
              {selectedProducts.length} product(s) selected
            </div>
            <div className="flex gap-2">
              <ConfirmPopover
                title="Are you sure you want to delete the selected products?"
                message={`${selectedProducts.length} product(s)`}
                confirmText="Remove"
                onConfirm={handleBulkDelete}
              >
                <Button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Delete Selected
                </Button>
              </ConfirmPopover>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {error && (
            <div className="p-4 text-red-600 border-b border-red-200 bg-red-50">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="table-auto w-max min-w-[1440px]">
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
                  <th className="px-6 py-4 w-50 text-left text-xs font-semibold text-gray-600 uppercase">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">
                        Name
                      </span>
                      <button
                        type="button"
                        onClick={toggleNameSort}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        {q.sortField === "name" ? (
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
                  <th className="px-6 py-4 w-50 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Slug
                  </th>
                  <th className="px-6 py-4 w-20 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Brand
                  </th>
                  <th className="px-6 py-4 w-40 text-left text-xs font-bold text-gray-600 uppercase">
                    Product Type & Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Frame Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Dimensions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Review / Sold
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrapp">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">
                        Created At
                      </span>
                      <button
                        type="button"
                        onClick={toggleCreatedAtSort}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                        title={
                          q.sortField === "createdAt"
                            ? `Sorting: ${
                                q.sortOrder === "ASC" ? "ASC" : "DESC"
                              } (click to change)`
                            : "No sorting (click to sort by Created At)"
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
                  <th className="px-6 py-4 pl-8 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500 italic"
                    >
                      Products is empty.
                    </td>
                  </tr>
                ) : (
                  rows.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {product.name}
                            </div>
                            <div className="text-sm text-blue-600 mt-0.5">
                              {product.productVariants?.length} variant(s)
                            </div>
                            {product.description && (
                              <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                                <span className="text-gray-700 not-italic">
                                  Description:
                                </span>{" "}
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.slug}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-base text-gray-600 block max-w-[100px] truncate">
                          {product.brand?.name ?? "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-800">
                            {product.productType ?? "—"}
                          </div>
                          <div className="text-gray-600">
                            {product.gender ?? "—"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1 block ">
                          <div>
                            <span className="text-gray-500">Type: </span>
                            <span className="font-medium text-gray-600 ">
                              {product.frameType?.name ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Shape: </span>
                            <span className="font-medium text-gray-600">
                              {product.frameShape?.name ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Material: </span>
                            <span className="font-medium text-gray-600">
                              {product.frameMaterial?.name ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <div>
                            <span className="text-gray-500">Lens Width: </span>
                            <span className="font-medium text-gray-600 ">
                              {product.lensWidth !== null &&
                              product.lensWidth !== undefined
                                ? product.lensWidth
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Lens Height: </span>
                            <span className="font-medium text-gray-600 ">
                              {product.lensHeight !== null &&
                              product.lensHeight !== undefined
                                ? product.lensHeight
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Bridge Width:{" "}
                            </span>
                            <span className="font-medium text-gray-600 ">
                              {product.bridgeWidth !== null &&
                              product.bridgeWidth !== undefined
                                ? product.bridgeWidth
                                : "—"}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Temple Length:{" "}
                            </span>
                            <span className="font-medium text-gray-600 ">
                              {product.templeLength !== null &&
                              product.templeLength !== undefined
                                ? product.templeLength
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800 text-center">
                          {product.reviewCount ?? "—"} /{" "}
                          {product.totalSold ?? "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusBadgeClass(
                            product.productStatus
                          )}`}
                        >
                          {formatStatusLabel(product.productStatus)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {fmt(product.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                            onClick={() =>
                              router.push(
                                Routes.productsManagement.products.details(
                                  product.id
                                )
                              )
                            }
                          >
                            <Eye className="text-blue-600 size-5" />
                          </Button>
                          <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>
                          <Button
                            size="icon-sm"
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Edit"
                            onClick={() =>
                              router.push(
                                Routes.productsManagement.products.edit(
                                  product.id
                                )
                              )
                            }
                          >
                            <Edit className="text-green-600 size-5" />
                          </Button>
                          <span className="text-gray-500 text-sm leading-none">
                            |
                          </span>
                          <ConfirmPopover
                            title="Are you sure you want to delete the product?"
                            message={<b>{product.name}</b>}
                            confirmText="Remove"
                            onConfirm={() =>
                              handleDelete(product.id, product.name)
                            }
                          >
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="text-red-600 size-5" />
                            </Button>
                          </ConfirmPopover>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {/* Rows per page (left) */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span>Rows per page:</span>
              <select
                className="h-9 rounded-md border border-gray-300 px-2 bg-white"
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

            {/* Controls (right) */}
            <div className="flex items-center gap-4">
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
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(ProductsPage);
