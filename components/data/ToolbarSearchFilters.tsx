"use client";

import { Filter, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type DepthFilter = `${number}`;
type BrandStatusOption = "all" | "active" | "hidden" | "archived";
type CategoryStatusOption = "all" | "draft" | "published" | "unpublished";
export type ProductStatusOption =
  | "all"
  | "draft"
  | "published"
  | "unlisted"
  | "archived";
type ImageStatusOption = "all" | "draft" | "used";
type OwnerTypeOption = "all" | "product_variant" | "brand" | "discount";
type StockStatusOption = "all" | "in_stock" | "low_stock" | "out_of_stock" | "unknown";
type UserRoleOption = "admin" | "customer";
type UserStatusOption = "active" | "inactive" | "suspended";
type VoucherStatusOption = "all" | "draft" | "scheduled" | "happening" | "canceled" | "expired";
type VoucherTypeOption = "all" | "fixed" | "percentage";

type Props = {
  value: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;

  isActive?: "all" | "true" | "false";
  brandStatus?: BrandStatusOption;
  categoryStatus?: CategoryStatusOption;
  productStatus?: ProductStatusOption;
  imageStatus?: ImageStatusOption;
  ownerType?: OwnerTypeOption;
  stockStatus?: StockStatusOption;
  userRole?: UserRoleOption[];
  userStatus?: UserStatusOption[];
  voucherStatus?: VoucherStatusOption;
  voucherType?: VoucherTypeOption;

  maxDepth?: number;

  onFiltersChange: (patch: {
    isActive?: "all" | "true" | "false";
    brandStatus?: BrandStatusOption;
    categoryStatus?: CategoryStatusOption;
    productStatus?: ProductStatusOption;
    imageStatus?: ImageStatusOption;
    ownerType?: OwnerTypeOption;
    stockStatus?: StockStatusOption;
    userRole?: UserRoleOption[];
    userStatus?: UserStatusOption[];
    voucherStatus?: VoucherStatusOption;
    voucherType?: VoucherTypeOption;
    depth?: DepthFilter;
  }) => void;

  depth?: DepthFilter;
};

export default function ToolbarSearchFilters({
  value,
  onSearchChange,
  placeholder = "Search...",
  isActive,
  brandStatus,
  categoryStatus,
  productStatus,
  imageStatus,
  ownerType,
  stockStatus,
  userRole,
  userStatus,
  voucherStatus,
  voucherType,
  onFiltersChange,
  depth,
  maxDepth,
}: Props) {
  const parsedMax = Number.isFinite(Number(maxDepth))
    ? Math.trunc(Number(maxDepth))
    : 0;
  const safeMax = Math.max(1, parsedMax);

  useEffect(() => {
    if (parsedMax > 0 && typeof depth === "undefined") {
      onFiltersChange({ depth: `${parsedMax}` as DepthFilter });
    }
  }, [parsedMax, depth, onFiltersChange]);

  const depthOptions: DepthFilter[] = Array.from(
    { length: parsedMax + 1 },
    (_, i) => `${i}` as DepthFilter
  );

  const depthValue: DepthFilter = depth ?? (`${parsedMax || 1}` as DepthFilter);

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={value}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-3 h-11 rounded-xl border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button className="h-11 rounded-xl px-4 relative border border-gray-300 bg-white hover:border-gray-500 text-gray-500 hover:text-gray-700">
              <Filter className="mr-2 size-4" />
              Filters
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={10}
            alignOffset={-10}
            className="relative w-[220px] p-4"
          >
            <div className="space-y-3 text-sm">
              {typeof isActive !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Active</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={isActive}
                    onChange={(e) =>
                      onFiltersChange({ isActive: e.target.value as any })
                    }
                  >
                    <option value="all">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}

              {typeof brandStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={brandStatus}
                    onChange={(e) =>
                      onFiltersChange({
                        brandStatus: e.target.value as BrandStatusOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              {typeof categoryStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={categoryStatus}
                    onChange={(e) =>
                      onFiltersChange({
                        categoryStatus: e.target.value as CategoryStatusOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </div>
              )}

              {typeof productStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={productStatus}
                    onChange={(e) =>
                      onFiltersChange({
                        productStatus: e.target.value as ProductStatusOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              {typeof imageStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={imageStatus}
                    onChange={(e) =>
                      onFiltersChange({
                        imageStatus: e.target.value as ImageStatusOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              )}

              {typeof ownerType !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Image Type</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={ownerType}
                    onChange={(e) =>
                      onFiltersChange({
                        ownerType: e.target.value as OwnerTypeOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="product_variant">Product Variant</option>
                    <option value="brand">Brand</option>
                    <option value="discount">Discount</option>
                  </select>
                </div>
              )}

              {typeof stockStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={stockStatus}
                    onChange={(e) =>
                      onFiltersChange({
                        stockStatus: e.target.value as StockStatusOption,
                      })
                    }
                  >
                    <option value="all">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              )}

              {typeof userRole !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Role</div>
                  <div className="space-y-2">
                    {["admin", "customer"].map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(userRole)
                              ? userRole.includes(role as any)
                              : false
                          }
                          onChange={(e) => {
                            const currentRoles = Array.isArray(userRole)
                              ? userRole
                              : [];
                            const newRoles = e.target.checked
                              ? [...currentRoles, role]
                              : currentRoles.filter((r) => r !== role);
                            onFiltersChange({
                              userRole: newRoles as any,
                            });
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {typeof userStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <div className="space-y-2">
                    {["active", "inactive", "suspended"].map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(userStatus)
                              ? userStatus.includes(status as any)
                              : false
                          }
                          onChange={(e) => {
                            const currentStatuses = Array.isArray(userStatus)
                              ? userStatus
                              : [];
                            const newStatuses = e.target.checked
                              ? [...currentStatuses, status]
                              : currentStatuses.filter((s) => s !== status);
                            onFiltersChange({
                              userStatus: newStatuses as any,
                            });
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {typeof voucherStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Status</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={voucherStatus}
                    onChange={(e) =>
                      onFiltersChange({
                        voucherStatus: e.target.value as VoucherStatusOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="happening">Happening</option>
                    <option value="canceled">Canceled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              )}

              {typeof voucherType !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Type</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={voucherType}
                    onChange={(e) =>
                      onFiltersChange({
                        voucherType: e.target.value as VoucherTypeOption,
                      })
                    }
                  >
                    <option value="all">All</option>
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              )}

              {typeof depth !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Depth</div>
                  <select
                    className="w-full border rounded-md px-2 py-2 cursor-pointer"
                    value={depthValue}
                    onChange={(e) =>
                      onFiltersChange({ depth: e.target.value as DepthFilter })
                    }
                  >
                    {depthOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  className="hover:bg-gray-100 text-gray-700"
                  onClick={() =>
                    onFiltersChange({
                      ...(typeof isActive !== "undefined"
                        ? { isActive: "all" }
                        : {}),
                      ...(typeof brandStatus !== "undefined"
                        ? { brandStatus: "all" }
                        : {}),
                      ...(typeof categoryStatus !== "undefined"
                        ? { categoryStatus: "all" }
                        : {}),
                      ...(typeof productStatus !== "undefined"
                        ? { productStatus: "all" }
                        : {}),
                      ...(typeof imageStatus !== "undefined"
                        ? { imageStatus: "all" }
                        : {}),
                      ...(typeof ownerType !== "undefined"
                        ? { ownerType: "all" }
                        : {}),
                      ...(typeof stockStatus !== "undefined"
                        ? { stockStatus: "all" }
                        : {}),
                      ...(typeof userRole !== "undefined"
                        ? { userRole: [] }
                        : {}),
                      ...(typeof userStatus !== "undefined"
                        ? { userStatus: [] }
                        : {}),
                      ...(typeof voucherStatus !== "undefined"
                        ? { voucherStatus: "all" }
                        : {}),
                      ...(typeof voucherType !== "undefined"
                        ? { voucherType: "all" }
                        : {}),
                      depth: `${safeMax}` as DepthFilter,
                    })
                  }
                >
                  Reset
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
