"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import ProductForm, { ProductFormValues } from "../../ProductForm";
import { getProductById, updateProduct } from "@/services/productService";
import { toast } from "react-hot-toast";
import type { Product, ProductType, Gender } from "@/types/product";

// Helper functions to normalize API values
function normalizeProductType(value?: string | null): ProductType {
  if (!value) return "Eyeglasses";
  const lower = value.toLowerCase();
  if (lower === "sunglasses") return "Sunglasses";
  return "Eyeglasses";
}

function normalizeGender(value?: string | null): Gender {
  if (!value) return "Male";
  const lower = value.toLowerCase();
  if (lower === "female") return "Female";
  if (lower === "unisex") return "Unisex";
  if (lower === "kids") return "Kid";
  return "Male";
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear draft when entering edit page
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("product_form_draft");
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(id);
        if (!alive) return;
        console.log("=== PRODUCT DATA ===");
        console.log("Product Type:", data.productType, typeof data.productType);
        console.log("Gender:", data.gender, typeof data.gender);
        console.log("Full product:", data);
        setProduct(data);
      } catch (err: any) {
        if (!alive) return;
        setError("Failed to load product.");
        setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">Loading product...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 text-xl font-semibold">
              {error || "Product not found."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const initial: ProductFormValues = {
    name: product.name || "",
    slug: product.slug || "",
    status: (product.productStatus as "draft" | "published" | "unlisted" | "archived") || "draft",
    description: product.description || "",
    productType: normalizeProductType(product.productType),
    gender: normalizeGender(product.gender),
    lensWidth: product.lensWidth?.toString() || "",
    bridgeWidth: product.bridgeWidth?.toString() || "",
    templeLength: product.templeLength?.toString() || "",
    lensHeight: product.lensHeight?.toString() || "",
    frameShapeId: product.frameShape?.id || "",
    frameTypeId: product.frameType?.id || "",
    frameMaterialId: product.frameMaterial?.id || "",
    brandId: product.brand?.id || "",
    categoryIds: product.categories?.map((c: any) => c.id) || [],
    tagIds: product.tags?.map((t: any) => t.id) || [],
    isFeatured: product.isFeatured || false,
    variants: product.productVariants || [],
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Product</h1>
        <ProductForm
          initial={initial}
          onCancel={() => router.back()}
          disableVariants={true}
          onSubmit={async (v, variants) => {
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

            // Note: Variants are not updated here - they have separate endpoints

            console.log("=== UPDATE PRODUCT DEBUG ===");
            console.log("Product ID:", id);
            console.log("Payload being sent:", JSON.stringify(payload, null, 2));

            await updateProduct(id, payload);

            console.log("Product updated successfully");

            router.push(Routes.productsManagement.products.root);
            toast.success("Product updated successfully!");
          }}
          submitLabel="Update"
        />
      </main>
    </div>
  );
}
