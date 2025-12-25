"use client";

import { useEffect, useState } from "react";
import { ImagePlus, X, Search } from "lucide-react";
import { getImages } from "@/services/imagesService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageItem } from "@/types/image";

export type BannerUploaderProps = {
  label?: string;
  value?: { publicUrl: string; id?: string; altText?: string } | null;
  onChange: (v: { publicUrl: string; id?: string; altText?: string } | null) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  error?: boolean | string;
  helperText?: string;
  ownerImageType?: "product_variant" | "brand" | "discount";
};

export default function BrandImageUploader({
  label = "Banner Image",
  value,
  onChange,
  disabled,
  className = "",
  required,
  error,
  helperText,
  ownerImageType = "brand",
}: BannerUploaderProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const hasError =
    (!!error && typeof error === "boolean") ||
    !!(typeof error === "string" && error);

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
        ownerType: ownerImageType,
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

  // const handleSearchChange = (value: string) => {
  //   setSearch(value);
  //   setPage(1);
  // };

  const handleSelectImage = (img: ImageItem) => {
    onChange({
      publicUrl: img.publicUrl,
      id: img.id,
      altText: img.altText || undefined,
    });
    setOpen(false);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </p>

      <div
        className={[
          "rounded-xl",
          hasError
            ? "border-2 border-red-500 p-1"
            : "border-2 border-gray-300 p-1",
        ].join(" ")}
        aria-invalid={hasError ? "true" : "false"}
      >
        {!value?.publicUrl ? (
          <button
            type="button"
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
            className={[
              "w-full min-h-[150px] border-2 border-dashed rounded-lg",
              "flex flex-col items-center justify-center transition cursor-pointer",
              disabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-gray-50",
              hasError
                ? "border-red-400 bg-red-50/30"
                : "border-gray-300 bg-white",
            ].join(" ")}
          >
            <ImagePlus className="size-8 text-gray-500" />
            <span className="mt-2 text-sm text-gray-600">
              Click to select banner image
            </span>
          </button>
        ) : (
          <div className="relative">
            <img
              src={value.publicUrl}
              alt={value.altText || "banner"}
              className={[
                "h-full w-full object-cover rounded-lg border",
                hasError ? "border-red-400" : "border-gray-200",
              ].join(" ")}
            />
            <div className="absolute right-2 top-2 flex gap-2">
              <Button
                type="button"
                size="icon-sm"
                className="bg-white/90 hover:bg-white"
                title="Change"
                onClick={() => !disabled && setOpen(true)}
                disabled={disabled}
              >
                <ImagePlus className="size-4 text-gray-700" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                className="bg-white/90 hover:bg-white"
                title="Remove"
                onClick={() => onChange(null)}
                disabled={disabled}
              >
                <X className="size-4 text-red-600" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {hasError ? (
        <p className="text-sm text-red-600">
          {typeof error === "string" && error
            ? error
            : "Please select a banner image."}
        </p>
      ) : (
        helperText && <p className="text-xs text-gray-500">{helperText}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className="flex flex-col"
          style={{ maxWidth: '1200px', width: '98vw', maxHeight: '90vh' }}
        >
          <DialogHeader>
            <DialogTitle>Select Banner Image</DialogTitle>
          </DialogHeader>

          {/* <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div> */}

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && page === 1 ? (
              <div className="text-center py-8 text-gray-500">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImagePlus className="size-16 mx-auto mb-4 text-gray-300" />
                <p>No images found. Please upload images first.</p>
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
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
