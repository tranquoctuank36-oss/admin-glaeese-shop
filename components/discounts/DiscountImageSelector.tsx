"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getImages } from "@/services/imagesService";
import { ImageItem } from "@/types/image";
import { ImagePlus, Loader2 } from "lucide-react";

interface DiscountImageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (imageId: string | null, image: ImageItem | null) => void;
  selectedId?: string;
}

export default function DiscountImageSelector({
  open,
  onOpenChange,
  onSelect,
  selectedId,
}: DiscountImageSelectorProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadImages();
  }, [open, page, search]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const result = await getImages({
        page,
        limit: 20,
        search: search || undefined,
        status: "draft",
        ownerType: "discount",
        sortField: "createdAt",
        sortOrder: "DESC",
      });
      
      if (page === 1) {
        setImages(result.data);
      } else {
        setImages(prev => [...prev, ...result.data]);
      }
      
      const totalPages = result.meta?.totalPages || 1;
      setHasMore(page < totalPages);
    } catch (e) {
      console.error("Failed to load images:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSelectImage = (img: ImageItem) => {
    onSelect(img.id, img);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="flex flex-col"
        style={{ maxWidth: '1200px', width: '98vw', maxHeight: '90vh' }}
      >
        <DialogHeader>
          <DialogTitle>Chọn hình ảnh Banner</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && page === 1 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="size-8 animate-spin text-blue-600" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImagePlus className="size-16 mx-auto mb-4 text-gray-300" />
              <p>Không tìm thấy hình ảnh. Vui lòng tải lên hình ảnh trước.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectImage(img)}
                    className="group relative h-30 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer bg-white"
                  >
                    <img
                      src={img.publicUrl}
                      alt={img.altText || "image"}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center mt-6">
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
