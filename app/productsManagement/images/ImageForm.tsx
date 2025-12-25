"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FloatingInput from "@/components/FloatingInput";
import { ImagePlus, X, Upload } from "lucide-react";
import {
  getPresignedUrl,
  uploadWithPresignedUrl,
} from "@/services/imagesService";

export type ImageFormValues = {
  ownerType: "product_variant" | "brand" | "discount";
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
    "product_variant" | "brand" | "discount"
  >(initial.ownerType ?? "product_variant");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    let hasError = false;

    selectedFiles.forEach((selectedFile) => {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, file: "Please select image files only" }));
        hasError = true;
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          file: "Each file size must be less than 5MB",
        }));
        hasError = true;
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

    if (!hasError) {
      setFiles((prev) => [...prev, ...validFiles]);
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (files.length === 0) {
      newErrors.file = "Please select at least one image file";
    }

    if (!ownerType) {
      newErrors.ownerType = "Please select image type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (files.length === 0) return;

    setLoading(true);
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
    } catch (err) {
      console.error("Upload failed:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err instanceof Error ? err.message : "Upload failed. Please try again.",
      }));
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
          label="Image Type"
          as="select"
          value={ownerType}
          onChange={(value) =>
            setOwnerType(value as "product_variant" | "brand" | "discount")
          }
          disabled={loading}
          required
          options={[
            { value: "product_variant", label: "Product Variant" },
            { value: "brand", label: "Brand" },
            { value: "discount", label: "Discount" },
          ]}
        />

        {/* File Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Files <span className="text-red-500">*</span>
          </label>

          <div
            className={[
              "rounded-xl border-2",
              errors.file ? "border-red-500" : "border-gray-300",
            ].join(" ")}
          >
            {previews.length === 0 ? (
              <label
                className={[
                  "w-full min-h-[200px] border-2 border-dashed rounded-lg",
                  "flex flex-col items-center justify-center transition cursor-pointer",
                  loading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50",
                  errors.file
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
                  Click to select images (multiple)
                </span>
                {/* <span className="text-xs text-gray-500 mt-1">
                  Max 5MB per file
                </span> */}
              </label>
            ) : (
              <div className="p-4">
                <div className="max-h-[500px] overflow-y-auto space-y-3">
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
                      <div className="absolute right-3 top-3 flex gap-2">
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
                      {/* <p className="text-xs text-gray-600 mt-2 px-2">
                        {files[index]?.name}
                      </p> */}
                    </div>
                  ))}
                </div>

                {/* Add more images button */}
                <label
                  className={[
                    "mt-3 w-full min-h-[80px] border-2 border-dashed rounded-lg",
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
                    Add more images
                  </span>
                </label>
              </div>
            )}
          </div>

          {errors.file && (
            <p className="mt-2 text-sm text-red-600">{errors.file}</p>
          )}

          {files.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <strong>{files.length}</strong> image{files.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 w-20 px-6 bg-gray-500 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-20 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {/* Uploading... */}
              </>
            ) : (
              <>
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
