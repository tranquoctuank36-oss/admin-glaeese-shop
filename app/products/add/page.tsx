"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import ProductForm, { ProductFormValues } from "../ProductForm";
import { createProduct, addImagesToVariant } from "@/services/productService";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

export default function AddProductPage() {
  const router = useRouter();

  // Clear draft when entering add product page
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("product_form_draft");
    }
  }, []);

  const initial: ProductFormValues = {
    name: "",
    slug: "",
    status: "published",
    description: "",
    productType: "frame",
    gender: "male",
    lensWidth: "",
    bridgeWidth: "",
    templeLength: "",
    lensHeight: "",
    frameShapeId: "",
    frameTypeId: "",
    frameMaterialId: "",
    brandId: "",
    categoryIds: [],
    tagIds: [],
    isFeatured: false,
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm sản phẩm</h1>
        <ProductForm
          initial={initial}
          onCancel={() => router.back()}
          onSubmit={async (v, variants) => {
            try {
              const payload: any = {
                name: v.name,
                slug: v.slug,
                description: v.description,
                productType: v.productType.toLowerCase(),
                gender: v.gender.toLowerCase(),
                brandId: v.brandId,
                frameDetail: {
                  lensWidth: v.lensWidth ? Number(v.lensWidth) : 0,
                  lensHeight: v.lensHeight ? Number(v.lensHeight) : 0,
                  bridgeWidth: v.bridgeWidth ? Number(v.bridgeWidth) : 0,
                  templeLength: v.templeLength ? Number(v.templeLength) : 0,
                  frameShapeId: v.frameShapeId,
                  frameTypeId: v.frameTypeId,
                  frameMaterialId: v.frameMaterialId,
                },
                status: v.status,
              };

              // Add optional arrays
              if (v.categoryIds.length > 0) payload.categoryIds = v.categoryIds;
              if (v.tagIds.length > 0) payload.tagIds = v.tagIds;

              // Add variants to payload with correct field name
              if (variants && variants.length > 0) {
                payload.variants = variants.map((variant) => ({
                  name: variant.name,
                  sku: variant.sku,
                  originalPrice: variant.originalPrice || null,
                  colorIds: variant.colorIds || [],
                  imageIds: variant.productImagesIds || [],
                  isActive: variant.isActive ?? true,
                }));
              }

              const createdProduct = await createProduct(payload);

              console.log("Created product response:", createdProduct);

              // Images are already added in the create payload, so we don't need addImagesToVariant
              // unless the API doesn't accept productImageIds in create

              toast.success("Sản phẩm được tạo thành công!");
              router.push(Routes.products.root);
            } catch (error: any) {
              console.error("Failed to create product:", error);
              const errorMessage = error?.response?.data?.detail || error?.message || "Không thể tạo sản phẩm";
              toast.error(errorMessage);
              throw error; // Re-throw to let ProductForm handle loading state
            }
          }}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
