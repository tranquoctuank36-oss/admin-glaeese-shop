"use client";

import { ChevronDown, Filter, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

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
type OwnerTypeOption = "all" | "product_variant" | "brand" | "discount" | "review" | "order_return" | "banner";
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

// Custom Select Component
type CustomSelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
};

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setOpen(!open)}
        className={`
          w-full h-10 px-3 rounded-md border bg-white text-sm cursor-pointer
          flex items-center justify-between transition
          hover:border-gray-400
          ${open ? "border-2 border-blue-400" : "border-gray-300"}
        `}
      >
        <span className="text-gray-800 truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`size-4 text-gray-400 transition-transform flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`
                  px-3 py-2 cursor-pointer transition-colors text-sm
                  ${
                    opt.value === value
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "hover:bg-gray-100 text-gray-800"
                  }
                `}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ToolbarSearchFilters({
  value,
  onSearchChange,
  placeholder = "Tìm kiếm...",
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button className={`h-11 rounded-xl px-4 relative bg-white text-gray-500 hover:text-gray-700 transition-all ${
              isFilterOpen 
                ? 'border-1 border-blue-500' 
                : 'border border-gray-300 hover:border-gray-500'
            }`}>
              <Filter className="mr-2 size-4" />
              Bộ lọc
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
                  <div className="mb-1 font-medium text-gray-700">Hoạt động</div>
                  <CustomSelect
                    value={isActive}
                    onChange={(v) => onFiltersChange({ isActive: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "true", label: "Có" },
                      { value: "false", label: "Không" },
                    ]}
                  />
                </div>
              )}

              {typeof brandStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <CustomSelect
                    value={brandStatus}
                    onChange={(v) => onFiltersChange({ brandStatus: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "active", label: "Hoạt động" },
                      { value: "hidden", label: "Ẩn" },
                      { value: "archived", label: "Lưu trữ" },
                    ]}
                  />
                </div>
              )}

              {typeof categoryStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <CustomSelect
                    value={categoryStatus}
                    onChange={(v) => onFiltersChange({ categoryStatus: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "draft", label: "Bản nháp" },
                      { value: "published", label: "Đã xuất bản" },
                      { value: "unpublished", label: "Chưa xuất bản" },
                    ]}
                  />
                </div>
              )}

              {typeof productStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <CustomSelect
                    value={productStatus}
                    onChange={(v) => onFiltersChange({ productStatus: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "draft", label: "Bản nháp" },
                      { value: "published", label: "Đã xuất bản" },
                      { value: "unlisted", label: "Không liệt kê" },
                      { value: "archived", label: "Lưu trữ" },
                    ]}
                  />
                </div>
              )}

              {typeof imageStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <CustomSelect
                    value={imageStatus}
                    onChange={(v) => onFiltersChange({ imageStatus: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "draft", label: "Bản nháp" },
                      { value: "used", label: "Đã sử dụng" },
                    ]}
                  />
                </div>
              )}

              {typeof ownerType !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Loại hình ảnh</div>
                  <CustomSelect
                    value={ownerType}
                    onChange={(v) => onFiltersChange({ ownerType: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "product_variant", label: "Biến thể sản phẩm" },
                      { value: "brand", label: "Thương hiệu" },
                      { value: "discount", label: "Chương trình giảm giá" },
                      { value: "review", label: "Đánh giá" },
                      { value: "order_return", label: "Trả hàng" },
                      { value: "banner", label: "Banner" },
                    ]}
                  />
                </div>
              )}

              {typeof stockStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <CustomSelect
                    value={stockStatus}
                    onChange={(v) => onFiltersChange({ stockStatus: v })}
                    options={[
                      { value: "all", label: "Tất cả trạng thái" },
                      { value: "in_stock", label: "Còn hàng" },
                      { value: "low_stock", label: "Sắp hết hàng" },
                      { value: "out_of_stock", label: "Hết hàng" },
                      { value: "unknown", label: "Không xác định" },
                    ]}
                  />
                </div>
              )}

              {typeof userRole !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Vai trò</div>
                  <div className="space-y-2">
                    {["admin", "customer"].map((role) => {
                      const roleLabel = role === "admin" ? "Admin" : "Khách hàng";
                      return (
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
                          <span className="text-sm">{roleLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {typeof userStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <div className="space-y-2">
                    {["active", "inactive", "suspended"].map((status) => {
                      const statusLabel = 
                        status === "active" ? "Hoạt động" :
                        status === "inactive" ? "Chưa xác thực" :
                        "Bị khóa";
                      return (
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
                          <span className="text-sm">{statusLabel}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {typeof voucherStatus !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Trạng thái</div>
                  <CustomSelect
                    value={voucherStatus}
                    onChange={(v) => onFiltersChange({ voucherStatus: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "draft", label: "Bản nháp" },
                      { value: "scheduled", label: "Đã lên lịch" },
                      { value: "happening", label: "Đang diễn ra" },
                      { value: "canceled", label: "Đã hủy" },
                      { value: "expired", label: "Đã hết hạn" },
                    ]}
                  />
                </div>
              )}

              {typeof voucherType !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Loại</div>
                  <CustomSelect
                    value={voucherType}
                    onChange={(v) => onFiltersChange({ voucherType: v })}
                    options={[
                      { value: "all", label: "Tất cả" },
                      { value: "fixed", label: "Cố định" },
                      { value: "percentage", label: "Phần trăm" },
                    ]}
                  />
                </div>
              )}

              {typeof depth !== "undefined" && (
                <div>
                  <div className="mb-1 font-medium text-gray-700">Độ sâu</div>
                  <CustomSelect
                    value={depthValue}
                    onChange={(v) => onFiltersChange({ depth: v })}
                    options={depthOptions.map((opt) => ({
                      value: opt,
                      label: opt,
                    }))}
                  />
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
                  Đặt lại
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
