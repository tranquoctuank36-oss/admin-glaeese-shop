"use client";

import React, { useMemo, useState } from "react";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import FloatingInput from "@/components/FloatingInput";
import BannerUploader from "@/components/images/BrandImageUploader";
import { toast } from "react-hot-toast";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type BrandFormValues = {
  name: string;
  slug: string;
  websiteUrl?: string;
  description?: string;
  isActive: boolean;
  bannerImageId?: string;
  bannerImage?: {
    id: string;
    publicUrl: string;
    altText?: string;
  };
  priority?: number;
};

export default function BrandForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial: BrandFormValues;
  submitLabel?: string;
  onSubmit: (values: BrandFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);

  const [websiteUrl, setWebsiteUrl] = useState(initial.websiteUrl ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [isActive, setIsActive] = useState<"yes" | "no">(
    initial.isActive ? "yes" : "no"
  );

  const [banner, setBanner] = useState<{
    publicUrl: string;
    id?: string;
    altText?: string;
  } | null>(
    initial.bannerImage?.publicUrl
      ? {
          publicUrl: initial.bannerImage.publicUrl,
          id: initial.bannerImage.id,
          altText: initial.bannerImage.altText,
        }
      : null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoSlug = useMemo(() => slugify(name), [name]);
  const displaySlug = (slugEdited ? slug : autoSlug).trim();

  const [priority, setPriority] = useState<number>(
    Number.isFinite(initial.priority as any)
      ? (initial.priority as number)
      : 100
  );

  const isPriorityValid =
    Number.isFinite(priority) && priority >= 0 && priority <= 100;

  const canSubmit = useMemo(() => {
    return true;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const payload: any = {
        name: name.trim(),
        slug: displaySlug,
        websiteUrl: websiteUrl.trim() || null,
        description: description.trim() || null,
        isActive: isActive === "yes",
        priority: isPriorityValid ? priority : 100,
      };
      if (banner?.id) payload.bannerImageId = banner.id;

      await onSubmit(payload as any);
    } catch (err: any) {
      const detail =
          err?.response?.data?.detail ||
          err?.detail 
        toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingInput
          id="name"
          label="Tên"
          required
          value={name}
          onChange={(v) => {
            setName(v);
            if (!slugEdited) {
              setSlug(slugify(v));
            }
          }}
          disabled={loading}
        />

        <div className="flex flex-col">
          <FloatingInput
            id="slug"
            label="Slug"
            required
            value={displaySlug}
            onChange={(v) => {
              setSlug(v);
              setSlugEdited(true);
            }}
            disabled={loading}
          />
          {name && (
            <p className="mt-1 text-xs text-gray-500">
              Gợi ý: <span className="font-medium">{autoSlug}</span>
            </p>
          )}
        </div>

        <FloatingInput
          id="isActive"
          label="Hoạt động"
          as="select"
          value={isActive}
          onChange={(v) =>
            setIsActive(
              (["yes", "no"].includes(v)
                ? v
                : "yes") as any
            )
          }
          disabled={loading}
          options={[
            { value: "yes", label: "Có" },
            { value: "no", label: "Không" },
          ]}
        />

        <FloatingInput
          id="priority"
          label="Mức ưu tiên (0–100)"
          type="number"
          min={0}
          max={100}
          step={1}
          value={String(priority ?? 100)}
          onChange={(v) => {
            if (v === "" || v === null) {
              setPriority(NaN as any);
              return;
            }
            const n = Number(v);
            if (Number.isFinite(n)) {
              const clamped = Math.max(0, Math.min(100, Math.trunc(n)));
              setPriority(clamped);
            }
          }}
          disabled={loading}
        />
      </div>

      <FloatingInput
        id="websiteUrl"
        label="URL trang web"
        value={websiteUrl}
        onChange={setWebsiteUrl}
        disabled={loading}
      />

      <FloatingInput
        id="description"
        label="Mô tả"
        as="textarea"
        rows={4}
        value={description}
        onChange={setDescription}
        disabled={loading}
      />

      <BannerUploader
        label="Hình ảnh banner"
        value={banner}
        onChange={(v) => setBanner(v)}
        disabled={loading}
      />
      {error && (
        <p className="text-center text-sm text-red-600 pt-2">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          className="h-10 bg-gray-500 hover:bg-gray-700 text-white"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
          disabled={loading || !canSubmit}
          title={!canSubmit ? "Vui lòng kiểm tra dữ liệu nhập" : submitLabel}
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
