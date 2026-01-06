"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingInput from "@/components/FloatingInput";
import { Button } from "@/components/ui/button";
import type { Gender, ProductType, ProductVariant } from "@/types/product";
import { getBrands } from "@/services/brandService";
import { getCategoriesFlat } from "@/services/categoryService";
import { getTags } from "@/services/tagService";
import { getFrameShapes } from "@/services/frameService/frameShapeService";
import { getFrameTypes } from "@/services/frameService/frameTypeService";
import { getFrameMaterials } from "@/services/frameService/frameMaterialService";
import { getImages } from "@/services/imagesService";
import { getColors } from "@/services/colorService";
import type { ProductImage } from "@/types/product";
import AddVariantDialog from "@/components/products/AddVariantDialog";
import type { Brand } from "@/types/product";
import SearchableFloatingSelect from "@/components/SearchableFloatingSelect";
import { Plus, Pencil, Trash2, Edit, X, RotateCcw, Loader2 } from "lucide-react";
import ConfirmPopover from "@/components/ConfirmPopover";
import { deleteVariant } from "@/services/productService";

export type ProductFormValues = {
  name: string;
  slug: string;
  description?: string;
  productType: ProductType;
  gender: Gender;
  lensWidth: string;
  bridgeWidth: string;
  templeLength: string;
  lensHeight: string;
  frameShapeId: string;
  frameTypeId: string;
  frameMaterialId: string;
  brandId: string;
  categoryIds: string[];
  tagIds: string[];
  status: "draft" | "published" | "unlisted" | "archived";
  isFeatured: boolean;
  variants?: Partial<ProductVariant>[];
};

interface ProductFormProps {
  initial?: ProductFormValues;
  onSubmit: (
    values: ProductFormValues,
    variants: Partial<ProductVariant>[]
  ) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  disableVariants?: boolean; // Add flag to disable variants section
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  disableVariants = false,
}: ProductFormProps) {
  const STORAGE_KEY = "product_form_draft";

  // Load saved draft from localStorage
  const loadDraft = () => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const draft = loadDraft();

  const [name, setName] = useState(draft?.name ?? initial?.name ?? "");
  const [slugEdited, setSlugEdited] = useState(
    draft?.slugEdited ?? !!initial?.slug
  );
  const [slug, setSlug] = useState(draft?.slug ?? initial?.slug ?? "");

  const [description, setDescription] = useState(
    draft?.description ?? initial?.description ?? ""
  );
  const [productType, setProductType] = useState<ProductType>(
    draft?.productType ?? initial?.productType ?? "Frame"
  );
  const [gender, setGender] = useState<Gender>(
    draft?.gender ?? initial?.gender ?? "Male"
  );

  const [lensWidth, setLensWidth] = useState(
    draft?.lensWidth ?? String(initial?.lensWidth ?? "")
  );
  const [bridgeWidth, setBridgeWidth] = useState(
    draft?.bridgeWidth ?? String(initial?.bridgeWidth ?? "")
  );
  const [templeLength, setTempleLength] = useState(
    draft?.templeLength ?? String(initial?.templeLength ?? "")
  );
  const [lensHeight, setLensHeight] = useState(
    draft?.lensHeight ?? String(initial?.lensHeight ?? "")
  );

  const [frameShapeId, setFrameShapeId] = useState(
    draft?.frameShapeId ?? initial?.frameShapeId ?? ""
  );
  const [frameTypeId, setFrameTypeId] = useState(
    draft?.frameTypeId ?? initial?.frameTypeId ?? ""
  );
  const [frameMaterialId, setFrameMaterialId] = useState(
    draft?.frameMaterialId ?? initial?.frameMaterialId ?? ""
  );
  const [brandId, setBrandId] = useState(
    draft?.brandId ?? initial?.brandId ?? ""
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    draft?.categoryIds ?? initial?.categoryIds ?? []
  );
  const [tagIds, setTagIds] = useState<string[]>(
    draft?.tagIds ?? initial?.tagIds ?? []
  );
  const [status, setStatus] = useState<
    "draft" | "published" | "unlisted" | "archived"
  >(draft?.status ?? initial?.status ?? "published");
  const [isFeatured, setIsFeatured] = useState(
    draft?.isFeatured ?? initial?.isFeatured ?? false
  );

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [frameShapes, setFrameShapes] = useState<any[]>([]);
  const [frameTypes, setFrameTypes] = useState<any[]>([]);
  const [frameMaterials, setFrameMaterials] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Product Variants state
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
    draft?.variants ?? initial?.variants ?? []
  );
  const [deletedVariants, setDeletedVariants] = useState<
    Partial<ProductVariant>[]
  >(draft?.deletedVariants ?? []);
  const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<
    number | undefined
  >(undefined);
  const [deletingVariantId, setDeletingVariantId] = useState<
    string | undefined
  >(undefined);
  const [expandedVariantIndex, setExpandedVariantIndex] = useState<
    number | null
  >(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removePopoverOpen, setRemovePopoverOpen] = useState<number | null>(null);

  // Lightbox states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentVariantImages, setCurrentVariantImages] = useState<any[]>([]);

  const autoSlug = useMemo(() => slugify(name), [name]);
  const displaySlug = (slugEdited ? slug : autoSlug).trim();

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const formData = {
      name,
      slugEdited,
      slug,
      description,
      productType,
      gender,
      lensWidth,
      bridgeWidth,
      templeLength,
      lensHeight,
      frameShapeId,
      frameTypeId,
      frameMaterialId,
      brandId,
      categoryIds,
      tagIds,
      status,
      isFeatured,
      variants,
      deletedVariants,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [
    name,
    slugEdited,
    slug,
    description,
    productType,
    gender,
    lensWidth,
    bridgeWidth,
    templeLength,
    lensHeight,
    frameShapeId,
    frameTypeId,
    frameMaterialId,
    brandId,
    categoryIds,
    tagIds,
    status,
    isFeatured,
    variants,
    deletedVariants,
  ]);

  // Load related data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [
          brandsRes,
          categoriesRes,
          tagsRes,
          colorsRes,
          frameShapesRes,
          frameTypesRes,
          frameMaterialsRes,
          imagesRes,
        ] = await Promise.all([
          getBrands({ limit: 1000 }),
          getCategoriesFlat({ limit: 1000 }),
          getTags({ limit: 1000 }),
          getColors({ limit: 1000 }),
          getFrameShapes({ limit: 1000 }),
          getFrameTypes({ limit: 1000 }),
          getFrameMaterials({ limit: 1000 }),
          getImages({ limit: 1000 }),
        ]);

        setBrands(brandsRes.data || []);
        setCategories(categoriesRes.data || []);
        setTags(tagsRes.data || []);
        setColors(colorsRes.data || []);
        setFrameShapes(frameShapesRes.data || []);
        setFrameTypes(frameTypesRes.data || []);
        setFrameMaterials(frameMaterialsRes.data || []);
        setProductImages(imagesRes.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setErr("Không thể tải dữ liệu");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);


  const handleAddVariant = async (variant: Partial<ProductVariant>) => {
    if (editingVariantIndex !== undefined) {
      setVariants((prev) => {
        const updated = [...prev];
        updated[editingVariantIndex] = variant;
        return updated;
      });
      setEditingVariantIndex(undefined);
    } else {
      setVariants((prev) => [...prev, variant]);
    }

    // Refresh productImages and colors to include newly selected items
    try {
      const [imagesRes, colorsRes] = await Promise.all([
        getImages({ limit: 1000 }),
        getColors({ limit: 1000 }),
      ]);
      setProductImages(imagesRes.data || []);
      setColors(colorsRes.data || []);
    } catch (error) {
      console.error("Failed to refresh images/colors:", error);
    }
  };

  const removeVariant = async (idx: number) => {
    // Check if this is the last variant
    if (variants.length === 1) {
      setErr("Một sản phẩm cần phải có ít nhất một biến thể.");
      // Clear error after 3 seconds
      setTimeout(() => setErr(""), 3000);
      return;
    }

    const variant = variants[idx];

    // If variant has an ID, call API to soft delete
    if (variant?.id) {
      try {
        await deleteVariant(variant.id);
        // Move to deleted variants
        setDeletedVariants((prev) => [...prev, variant]);
      } catch (error) {
        console.error("Failed to delete variant:", error);
        setErr("Không thể xóa biến thể");
        return;
      }
    } else {
      // For new variants without ID, just move to deleted
      setDeletedVariants((prev) => [...prev, variant]);
    }

    // Remove from active variants
    setVariants((prev) => prev.filter((_, i) => i !== idx));
    setDeletingVariantId(undefined);
  };

  const restoreVariant = (idx: number) => {
    const variant = deletedVariants[idx];
    setVariants((prev) => [...prev, variant]);
    setDeletedVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const permanentDeleteVariant = (idx: number) => {
    setDeletedVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const editVariant = (idx: number) => {
    setEditingVariantIndex(idx);
    setShowAddVariantDialog(true);
  };


  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIndex(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingIndex !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === dropIdx) {
      setDraggingIndex(null);
      return;
    }

    setVariants((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggingIndex, 1);
      updated.splice(dropIdx, 0, draggedItem);
      return updated;
    });

    // Update expanded index if needed
    if (expandedVariantIndex === draggingIndex) {
      setExpandedVariantIndex(dropIdx);
    } else if (expandedVariantIndex !== null) {
      if (
        draggingIndex < expandedVariantIndex &&
        dropIdx >= expandedVariantIndex
      ) {
        setExpandedVariantIndex(expandedVariantIndex - 1);
      } else if (
        draggingIndex > expandedVariantIndex &&
        dropIdx <= expandedVariantIndex
      ) {
        setExpandedVariantIndex(expandedVariantIndex + 1);
      }
    }

    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    // Validate all required fields first
    if (!name.trim()) {
      setErr("Tên sản phẩm là bắt buộc");
      return;
    }

    if (!displaySlug.trim()) {
      setErr("Slug là bắt buộc");
      return;
    }

    if (!productType) {
      setErr("Loại sản phẩm là bắt buộc");
      return;
    }

    if (!gender) {
      setErr("Giới tính là bắt buộc");
      return;
    }

    if (!frameShapeId) {
      setErr("Hình dáng khung là bắt buộc");
      return;
    }

    if (!frameTypeId) {
      setErr("Loại khung là bắt buộc");
      return;
    }

    if (!frameMaterialId) {
      setErr("Chất liệu khung là bắt buộc");
      return;
    }

    if (!brandId) {
      setErr("Thương hiệu là bắt buộc");
      return;
    }

    if (!status) {
      setErr("Trạng thái là bắt buộc");
      return;
    }

    if (variants.length === 0) {
      setErr("Ít nhất 1 biến thể là bắt buộc");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(
        {
          name: name.trim(),
          slug: displaySlug,
          description: description.trim(),
          productType: productType,
          gender,
          lensWidth: lensWidth.trim(),
          bridgeWidth: bridgeWidth.trim(),
          templeLength: templeLength.trim(),
          lensHeight: lensHeight.trim(),
          frameShapeId,
          frameTypeId,
          frameMaterialId,
          brandId,
          categoryIds,
          tagIds,
          status,
          isFeatured,
        },
        variants
      );

      // Clear draft after successful submission
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || "";
      setErr(detail || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center h-screen">
        <div className="text-lg text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      {/* Basic Information */}
      <div className="border-b pb-6">
        <h2 className="text-lg font-bold mb-4">Thông tin cơ bản</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FloatingInput
            id="name"
            label="Tên sản phẩm"
            required
            value={name}
            disabled={loading}
            onChange={(v) => {
              setName(v);
              if (!slugEdited) setSlug(slugify(v));
            }}
          />

          <div>
            <FloatingInput
              id="slug"
              label="Slug"
              required
              value={displaySlug}
              disabled={loading}
              onChange={(v) => {
                setSlug(v);
                setSlugEdited(true);
              }}
            />
            {name && (
              <p className="mt-2 text-xs text-gray-500">
                Gợi ý: <span className="font-medium">{autoSlug}</span>
              </p>
            )}
          </div>
        </div>

        <FloatingInput
          id="description"
          label="Mô tả"
          as="textarea"
          rows={4}
          value={description}
          onChange={setDescription}
          disabled={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FloatingInput
            id="productType"
            label="Loại sản phẩm"
            as="select"
            required
            value={productType}
            disabled={loading}
            onChange={(v) => setProductType(v as ProductType)}
            options={[
              { value: "Frame", label: "Gọng kính" },
              { value: "Sunglasses", label: "Kính mát" },
            ]}
          />

          <FloatingInput
            id="gender"
            label="Giới tính"
            as="select"
            required
            value={gender}
            onChange={(v) => setGender(v as Gender)}
            disabled={loading}
            options={[
              { value: "Male", label: "Nam" },
              { value: "Female", label: "Nữ" },
              { value: "Unisex", label: "Unisex" },
              { value: "Kid", label: "Trẻ em" },
            ]}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="border-b pb-6">
        <h2 className="text-lg font-bold mb-4">Kích thước</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FloatingInput
            id="lensWidth"
            label="Chiều rộng kính (mm)"
            type="number"
            min={0}
            step={1}
            value={lensWidth}
            onChange={setLensWidth}
            disabled={loading}
          />

          <FloatingInput
            id="lensHeight"
            label="Chiều cao kính (mm)"
            type="number"
            min={0}
            step={1}
            value={lensHeight}
            onChange={setLensHeight}
            disabled={loading}
          />

          <FloatingInput
            id="bridgeWidth"
            label="Chiều rộng cầu (mm)"
            type="number"
            min={0}
            step={1}
            value={bridgeWidth}
            onChange={setBridgeWidth}
            disabled={loading}
          />

          <FloatingInput
            id="templeLength"
            label="Chiều dài tay gọng (mm)"
            type="number"
            step={1}
            value={templeLength}
            onChange={setTempleLength}
            disabled={loading}
          />
        </div>
      </div>

      {/* Frame Information */}
      <div className="border-b pb-6">
        <h2 className="text-lg font-bold mb-4">Thông tin khung kính</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FloatingInput
            id="frameShapeId"
            label="Hình dáng khung"
            as="select"
            required
            value={frameShapeId}
            onChange={setFrameShapeId}
            disabled={loading}
            options={[
              ...frameShapes.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />

          <FloatingInput
            id="frameTypeId"
            label="Loại khung"
            as="select"
            required
            value={frameTypeId}
            onChange={setFrameTypeId}
            disabled={loading}
            options={[
              ...frameTypes.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />

          <FloatingInput
            id="frameMaterialId"
            label="Chất liệu khung"
            as="select"
            required
            value={frameMaterialId}
            onChange={setFrameMaterialId}
            disabled={loading}
            options={[
              ...frameMaterials.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        </div>
      </div>

      {/* Relationships */}
      <div className="border-b pb-6">
        <h2 className="text-lg font-bold mb-4">Thông tin liên quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableFloatingSelect
            id="brandId"
            label="Thương hiệu"
            required
            value={brandId}
            onChange={setBrandId}
            disabled={loading}
            searchPlaceholder="Tìm kiếm thương hiệu..."
            options={[...brands.map((b) => ({ value: b.id, label: b.name }))]}
          />

          <FloatingInput
            id="status"
            label="Trạng thái"
            as="select"
            required
            value={status}
            onChange={(v) => setStatus(v as any)}
            disabled={loading}
            options={[
              { value: "draft", label: "Bản nháp" },
              { value: "published", label: "Đã xuất bản" },
              { value: "unlisted", label: "Chưa liệt kê" },
              { value: "archived", label: "Đã lưu trữ" },
            ]}
          />
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Nhãn
            </label>

            {tags.length > 0 && (
              <Button
                type="button"
                onClick={() => {
                  if (tagIds.length === tags.length) {
                    setTagIds([]);
                  } else {
                    setTagIds(tags.map((t) => t.id));
                  }
                }}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline p-0"
              >
                {tagIds.length === tags.length ? "" : "Chọn tất cả"}
              </Button>
            )}
          </div>

          {tags.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Không có thẻ nào</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTagIds((prev) => [...prev, tag.id]);
                      } else {
                        setTagIds((prev) => prev.filter((id) => id !== tag.id));
                      }
                    }}
                    disabled={loading}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{tag.name}</span>
                  {tag.isActive === false && (
                    <span className="text-xs text-red-500">(Không hoạt động)</span>
                  )}
                </label>
              ))}
            </div>
          )}

          {tagIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">
                Đã chọn: <strong>{tagIds.length}</strong> thẻ
              </span>
              <Button
                type="button"
                onClick={() => setTagIds([])}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline p-0"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm font-medium">Nổi bật</span>
          </label>
        </div>
      </div>

      {/* Product Variants */}
      {!disableVariants && (
      <div className="border-b pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Biến thể sản phẩm</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setShowTrashDialog(true)}
              className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white inline-flex items-center gap-2"
              // disabled={deletedVariants.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Thùng rác
              {deletedVariants.length > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {deletedVariants.length}
                  </span>
                )}
            </Button>
            <Button
              type="button"
              onClick={() => setShowAddVariantDialog(true)}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm biến thể sản phẩm
            </Button>
          </div>
        </div>

        {variants.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có biến thể nào được thêm.</p>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, idx) => (
              <div
                key={idx}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                className={`border rounded-lg overflow-hidden transition-all ${
                  draggingIndex === idx
                    ? "opacity-40 scale-95 bg-gray-100"
                    : "bg-gray-50 opacity-100 scale-100"
                } ${
                  dragOverIndex === idx && draggingIndex !== idx
                    ? "border-blue-500 border-2 bg-blue-50 shadow-lg"
                    : "border-gray-300"
                }`}
              >
                <div className="flex justify-between items-center p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                      </svg>
                    </div>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        setExpandedVariantIndex(
                          expandedVariantIndex === idx ? null : idx
                        )
                      }
                    >
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                          expandedVariantIndex === idx ? "rotate-90" : ""
                        }`}
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
                      <div>
                        <h3 className="font-medium text-sm">
                          Biến thể {idx + 1}
                        </h3>
                        <p className="text-xs text-gray-600">
                          Tên:{" "}
                          <span className="font-semibold">
                            {variant.name || "Không tên"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      onClick={() => editVariant(idx)}
                      size="sm"
                      title="Sửa"
                      className="bg-green-500 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <ConfirmPopover
                      open={removePopoverOpen === idx}
                      onOpenChange={(open) => setRemovePopoverOpen(open ? idx : null)}
                      title="Xóa biến thể?"
                      message={
                        <div>
                          Bạn có chắc chắn muốn xóa{" "}
                          <strong>{variant.name || "biến thể này"}</strong>?
                        </div>
                      }
                      confirmText="Xóa"
                      cancelText="Hủy"
                      onConfirm={async () => await removeVariant(idx)}
                      confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                      widthClass="w-[320px]"
                    >
                      <Button
                        type="button"
                        size="sm"
                        title="Xóa"
                        className="bg-red-500 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmPopover>
                  </div>
                </div>

                {expandedVariantIndex === idx && (
                  <div className="px-4 pb-4 pt-2 bg-white border-t space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">SKU:</span>
                        <p className="text-gray-600">{variant.sku || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Số lượng:
                        </span>
                        <p className="text-gray-600">
                          {variant.quantityAvailable || 0}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Giá:
                        </span>
                        <p className="text-gray-600">
                          {Number(variant.originalPrice || 0).toLocaleString(
                            "es-US"
                          )}
                          đ
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Trạng thái:
                        </span>
                        <p className="text-gray-600">
                          {variant.isActive ? "Hoạt động" : "Không hoạt động"}
                        </p>
                      </div>
                    </div>
                    {/* Display Colors */}
                    {((variant.colors && variant.colors.length > 0) ||
                      (variant.colorIds && variant.colorIds.length > 0)) && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Màu sắc:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* If we have colors array directly, use it */}
                          {variant.colors && variant.colors.length > 0 ? (
                            variant.colors.map((color, cidx) => (
                              <div
                                key={cidx}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                              >
                                {color.hexCode && (
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.hexCode }}
                                  />
                                )}
                                <span className="text-xs text-gray-700">
                                  {color.name}
                                </span>
                              </div>
                            ))
                          ) : (
                            /* Otherwise use colorIds to lookup */
                            variant.colorIds?.map((colorId) => {
                              const color = colors.find((c) => c.id === colorId);
                              return color ? (
                                <div
                                  key={colorId}
                                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                                >
                                  {color.hexCode && (
                                    <div
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: color.hexCode }}
                                    />
                                  )}
                                  <span className="text-xs text-gray-700">
                                    {color.name}
                                  </span>
                                </div>
                              ) : null;
                            })
                          )}
                        </div>
                      </div>
                    )}
                    {/* Display Images */}
                    {((variant.productImagesIds && variant.productImagesIds.length > 0) ||
                      (variant.productImages && variant.productImages.length > 0)) && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Hình ảnh ({variant.productImagesIds?.length || variant.productImages?.length || 0}):
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
                            {/* If we have productImages array directly, use it */}
                            {variant.productImages && variant.productImages.length > 0 ? (
                              variant.productImages.map((image, iidx) => (
                                <div
                                  key={image.id}
                                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer hover:border-blue-500 transition-colors"
                                  onClick={() => {
                                    setCurrentVariantImages(variant.productImages!);
                                    setSelectedImage(image.publicUrl);
                                    setSelectedImageIndex(iidx);
                                  }}
                                >
                                  <img
                                    src={image.publicUrl}
                                    alt={image.altText || "Product image"}
                                    className="w-full h-full object-contain p-1"
                                  />
                                </div>
                              ))
                            ) : (
                              /* Otherwise use productImagesIds */
                              variant.productImagesIds?.map((imgId, iidx) => {
                                const image = productImages.find(
                                  (img) => img.id === imgId
                                );
                                return image ? (
                                  <div
                                    key={imgId}
                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer hover:border-blue-500 transition-colors"
                                    onClick={() => {
                                      const images = variant.productImagesIds?.map(id => productImages.find(i => i.id === id)).filter(Boolean) || [];
                                      setCurrentVariantImages(images);
                                      setSelectedImage(image.publicUrl);
                                      setSelectedImageIndex(iidx);
                                    }}
                                  >
                                    <img
                                      src={image.publicUrl}
                                      alt={image.altText || "Product image"}
                                      className="w-full h-full object-contain p-1"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    key={imgId}
                                    className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center"
                                  >
                                    <span className="text-xs text-gray-400">
                                      N/A
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {err && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          className="h-10 bg-gray-600 hover:bg-gray-700 text-white"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </Button>
      </div>

      {/* Add Variant Dialog */}
      {!disableVariants && (
      <AddVariantDialog
        open={showAddVariantDialog}
        onOpenChange={(open) => {
          setShowAddVariantDialog(open);
          if (!open) setEditingVariantIndex(undefined);
        }}
        onAdd={handleAddVariant}
        variant={
          editingVariantIndex !== undefined
            ? variants[editingVariantIndex]
            : undefined
        }
        editIndex={editingVariantIndex}
        variantId={
          editingVariantIndex !== undefined
            ? variants[editingVariantIndex]?.id
            : undefined
        }
      />
      )}

      {/* Trash Dialog */}
      {!disableVariants && showTrashDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  Biến thể đã xóa ({deletedVariants.length})
                </h2>
                <Button
                  type="button"
                  onClick={() => setShowTrashDialog(false)}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full cursor-pointer "
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {deletedVariants.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Không có biến thể đã xóa nào
                </p>
              ) : (
                <div className="space-y-4">
                  {deletedVariants.map((variant, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg mb-2">
                            {variant.name}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">SKU:</span>{" "}
                              {variant.sku}
                            </div>
                            <div>
                              <span className="font-medium">Số lượng:</span>{" "}
                              {variant.quantityAvailable}
                            </div>
                            <div>
                              <span className="font-medium">Giá:</span>{" "}
                              {Number(
                                variant.originalPrice || 0
                              ).toLocaleString("es-US")}
                              đ
                            </div>
                            <div>
                              <span className="font-medium">Trạng thái:</span>{" "}
                              {variant.isActive ? "Hoạt động" : "Không hoạt động"}
                            </div>
                          </div>
                          {variant.colors && variant.colors.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">
                                Màu sắc:
                              </span>{" "}
                              <span className="text-sm text-gray-600">
                                {variant.colors.map((c) => c.name).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            type="button"
                            onClick={() => restoreVariant(idx)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <ConfirmPopover
                            title="Xóa vĩnh viễn?"
                            message="Biến thể sẽ bị xóa vĩnh viễn khỏi thùng rác."
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => permanentDeleteVariant(idx)}
                            confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                            widthClass="w-[320px]"
                          >
                            <Button
                              type="button"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </ConfirmPopover>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 sticky bottom-0">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowTrashDialog(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
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
                alt="Biến thể sản phẩm"
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
      </AnimatePresence>
    </form>
  );
}
