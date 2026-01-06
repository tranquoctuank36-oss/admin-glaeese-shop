"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FloatingInput from "@/components/FloatingInput";
import { ImagePlus, X, Upload, Loader2 } from "lucide-react";
import {
  getPresignedUrl,
  uploadWithPresignedUrl,
} from "@/services/imagesService";

export type ImageFormValues = {
  ownerType: "product_variant" | "brand" | "discount" | "banner" | "review" | "order_return";
  file: File | null;
  files?: File[];
};

export default function ImageForm({
  initial,
  submitLabel = "Upload",
  onSubmit,
  onCancel,
}: {
  initial: ImageFormValues;
  submitLabel?: string;
  onSubmit: (values: ImageFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [ownerType, setOwnerType] = useState<
    "product_variant" | "brand" | "discount" | "banner" | "review" | "order_return"
  >(initial.ownerType ?? "product_variant");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    selectedFiles.forEach((selectedFile) => {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        setError("Vui lòng chỉ chọn tệp hình ảnh");
        return;
      }

      validFiles.push(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(selectedFile);
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setError("");
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (files.length === 0) {
      setError("Vui lòng chọn ít nhất một hình ảnh");
      return;
    }

    if (!ownerType) {
      setError("Vui lòng chọn loại hình ảnh");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Upload all files
      for (const file of files) {
        // Get presigned URL
        const presignData = await getPresignedUrl({
          ownerType,
          contentType: file.type,
        });

        console.log("Presigned URL data:", presignData);

        // Upload file to S3
        await uploadWithPresignedUrl(presignData.putUrl, file, file.type);
      }

      // Call parent onSubmit
      await onSubmit({
        ownerType,
        file: null,
        files,
      });
    } catch (err : any) {
      console.error("Upload failed:", err);
      setError(err?.response?.data?.detail || err?.message || "Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {/* Owner Image Type */}
        <FloatingInput
          id="ownerType"
          label="Loại hình ảnh"
          as="select"
          value={ownerType}
          onChange={(value) =>
            setOwnerType(value as "product_variant" | "brand" | "discount" | "banner" | "review" | "order_return")
          }
          disabled={loading}
          required
          options={[
            { value: "product_variant", label: "Biến thể sản phẩm" },
            { value: "brand", label: "Thương hiệu" },
            { value: "discount", label: "Giảm giá" },
            { value: "banner", label: "Banner" },
            { value: "review", label: "Đánh giá" },
            { value: "order_return", label: "Trả hàng" },
          ]}
        />

        {/* File Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh <span className="text-red-500">*</span>
          </label>

          {previews.length === 0 ? (
            <label
              className={[
                "w-full min-h-[200px] border-2 border-dashed rounded-lg",
                "flex flex-col items-center justify-center transition cursor-pointer",
                loading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-50",
                error
                  ? "border-red-400 bg-red-50/30"
                  : "border-gray-300 bg-white",
              ].join(" ")}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <Upload className="size-12 text-gray-400 mb-3" />
              <span className="text-sm text-gray-600 font-medium">
                Nhấp để chọn hình ảnh
              </span>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="max-h-[500px] overflow-y-auto space-y-3 border-2 border-gray-200 rounded-lg p-3">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-gray-200 bg-gray-50 p-2"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-auto max-h-64 object-contain rounded-lg"
                    />
                    <div className="absolute right-3 top-3">
                      <Button
                        type="button"
                        size="icon-sm"
                        className="bg-white/90 hover:bg-white shadow-md"
                        onClick={() => handleRemoveFile(index)}
                        disabled={loading}
                      >
                        <X className="size-5 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add more images button */}
              <label
                className={[
                  "w-full min-h-[80px] border-2 border-dashed rounded-lg",
                  "flex flex-col items-center justify-center transition cursor-pointer",
                  loading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50",
                  "border-gray-300 bg-white",
                ].join(" ")}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                />
                <ImagePlus className="size-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 font-medium">
                  Thêm hình ảnh khác
                </span>
              </label>
            </div>
          )}
          
          {/* Error message right below upload area */}
          {/* {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )} */}

          {/* Show count */}
          {files.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Đã chọn: <strong>{files.length}</strong> hình ảnh
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 px-6 bg-gray-500 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>

        {/* Error message at bottom */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    </form>
  );
}
