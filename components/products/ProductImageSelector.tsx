"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getImages } from "@/services/imagesService";
import { ImageItem } from "@/types/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ProductImageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageIds: string[]) => void;
  selectedIds?: string[];
  maxSelection?: number;
}

export default function ProductImageSelector({
  open,
  onOpenChange,
  onSelect,
  selectedIds = [],
  maxSelection = 5,
}: ProductImageSelectorProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedImageIds, setSelectedImageIds] =
    useState<string[]>(selectedIds);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (open) {
      loadImages(true);
      setSelectedImageIds(selectedIds);
    }
  }, [open, selectedIds]);

  const loadImages = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await getImages({
        page: currentPage,
        limit: 20,
        search: search || undefined,
        status: "draft",
        ownerType: "product_variant",
      });

      if (reset) {
        setImages(res.data || []);
        setPage(1);
      } else {
        setImages((prev) => [...prev, ...(res.data || [])]);
      }

      setHasMore((res.data?.length || 0) === 20);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
    loadImages(false);
  };

  const toggleImage = (imageId: string) => {
    setSelectedImageIds((prev) => {
      if (prev.includes(imageId)) {
        // Deselect - always allowed
        return prev.filter((id) => id !== imageId);
      } else {
        // Select - check limit
        if (prev.length >= maxSelection) {
          toast.error(`Tối đa ${maxSelection} hình ảnh được phép`);
          return prev;
        }
        return [...prev, imageId];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(selectedImageIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col"
        style={{ maxWidth: "1200px", width: "98vw", maxHeight: "90vh" }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Chọn hình ảnh biến thể sản phẩm
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
          {/* Selected Count */}
          {selectedImageIds.length > 0 && (
            <div className="flex items-center justify-between pl-3 pr-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-700 font-medium">
                Đã chọn: {selectedImageIds.length} hình ảnh
              </span>
              <Button
                type="button"
                onClick={() => setSelectedImageIds([])}
                className="text-xs bg-blue-50 hover:bg-blue-50 text-blue-600 hover:text-blue-800 underline hover:no-underline p-0"
              >
                Xóa tất cả
              </Button>
            </div>
          )}

          {/* Image Grid */}
          {loading && images.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="size-8 animate-spin text-blue-600" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImagePlus className="size-16 mx-auto mb-4 text-gray-300" />
              Không tìm thấy hình ảnh. Vui lòng tải lên hình ảnh trước.
            </div>
          ) : (
            <div className="grid grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-4 pb-4">
              {images.map((img) => {
                const isSelected = selectedImageIds.includes(img.id);
                return (
                  <div
                    key={img.id}
                    onClick={() => toggleImage(img.id)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-blue-500"
                        : "border-gray-200 hover:border-blue-500"
                    }`}
                  >
                    <div
                      className={`h-30 relative ${
                        isSelected ? "bg-white" : "bg-white"
                      }`}
                    >
                      <img
                        src={img.publicUrl}
                        alt={img.altText || "Product image"}
                        className={`w-full h-full object-contain group-hover:scale-105 transition-transform ${
                          isSelected ? "brightness-90" : ""
                        }`}
                        style={{
                          filter: "brightness(1.05) contrast(1.1)",
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* {img.altText && (
                      <div className={`p-2 ${isSelected ? "bg-gray-200" : "bg-white"}`}>
                        <p className="text-xs text-gray-600 truncate">{img.altText}</p>
                      </div>
                    )} */}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && images.length > 0 && (
            <div className="text-center pt-4">
              <Button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Tải thêm"}
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            className="bg-gray-500 hover:bg-gray-700 text-white"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Xác nhận ({selectedImageIds.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
