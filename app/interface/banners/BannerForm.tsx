"use client";

import React, { useState, useRef } from "react";
import FloatingInput from "@/components/FloatingInput";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Upload, X, Loader } from "lucide-react";
import Image from "next/image";
import {
  uploadImage,
} from "@/services/imagesService";
import toast from "react-hot-toast";

export type BannerFormValues = {
  title: string;
  imageId: string;
  imageUrl?: string; // For preview only
  linkUrl?: string;
  sortOrder?: number;
};

export default function BannerForm({
  initial,
  submitLabel = "Lưu",
  onSubmit,
  onCancel,
}: {
  initial: BannerFormValues;
  submitLabel?: string;
  onSubmit: (values: BannerFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [imageId, setImageId] = useState(initial.imageId ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl ?? "");
  const [sortOrder, setSortOrder] = useState(
    initial.sortOrder?.toString() ?? "0"
  );

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = title.trim().length > 0 && imageId.trim().length > 0;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chỉ chọn tệp hình ảnh");
      toast.error("Vui lòng chỉ chọn tệp hình ảnh");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Upload image directly using the helper function
      const uploadResult = await uploadImage(file, "banner");

      // Set the image ID and URL from upload result
      setImageId(uploadResult.id);
      setImageUrl(uploadResult.publicUrl);
    } catch (err: any) {
      console.error("Upload failed:", err);
      const detail = err?.response?.data?.detail || err?.message;
      setError(detail || "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setImageId("");
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      if (!imageId.trim()) {
        setError("Vui lòng chọn hình ảnh");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit({
        title: title.trim(),
        imageId: imageId.trim(),
        linkUrl: linkUrl.trim() || undefined,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || err?.detail || "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <FloatingInput
        id="title"
        label="Tiêu đề"
        required
        value={title}
        onChange={setTitle}
        disabled={loading}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Hình ảnh <span className="text-red-500">*</span>
        </label>

        {!imageUrl ? (
          <div
            onClick={() =>
              !loading && !uploading && fileInputRef.current?.click()
            }
            className={[
              "relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
              loading || uploading
                ? "opacity-60 cursor-not-allowed"
                : "hover:border-gray-400 hover:bg-gray-50",
              error
                ? "border-red-400 bg-red-50/30"
                : "border-gray-300 bg-gray-50",
            ].join(" ")}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={loading || uploading}
              className="hidden"
              id="banner-image-upload"
            />

            {uploading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="size-12 text-gray-400 animate-spin mb-3" />
                <p className="text-gray-600">Đang tải...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Upload className="size-12 text-gray-400 mb-3" />
                <p className="text-gray-600">Nhấp để chọn hình ảnh</p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative rounded-lg border-2 border-gray-200 bg-gray-50 p-3">
            <Image
              src={imageUrl}
              alt="Banner preview"
              width={600}
              height={200}
              className="w-full h-auto max-h-64 object-contain rounded-lg"
              onError={() => setError("Không thể tải hình ảnh")}
            />
            <div className="absolute right-4 top-4 flex gap-2">
              <Button
                type="button"
                size="icon-sm"
                className="bg-white/90 hover:bg-white shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploading}
                title="Thay đổi hình ảnh"
              >
                <Pencil className="size-5 text-blue-600" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                className="bg-white/90 hover:bg-white shadow-md"
                onClick={handleRemoveImage}
                disabled={loading || uploading}
                title="Xóa ảnh"
              >
                <X className="size-5 text-red-600" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={loading || uploading}
              className="hidden"
            />
          </div>
        )}
      </div>

      <FloatingInput
        id="linkUrl"
        label="Link URL"
        value={linkUrl}
        onChange={setLinkUrl}
        disabled={loading}
      />

      <FloatingInput
        id="sortOrder"
        label="Thứ tự sắp xếp"
        type="number"
        value={sortOrder}
        onChange={setSortOrder}
        disabled={loading}
        placeholder="0"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          className="h-10 w-25 bg-gray-500 hover:bg-gray-700 text-white"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="h-10 w-25 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : submitLabel}
        </Button>
      </div>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </form>
  );
}
