"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import FloatingInput from "@/components/FloatingInput";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type FrameMaterialFormValues = {
  name: string;
  slug: string;
  isActive: boolean;
};

export default function FrameMaterialForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial: FrameMaterialFormValues;
  onSubmit: (values: FrameMaterialFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);

  const [slug, setSlug] = useState(initial.slug ?? "");
  const [isActiveStr, setIsActiveStr] = useState<"true" | "false">(
    initial.isActive ? "true" : "false"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoSlug = useMemo(() => slugify(name), [name]);
  const displaySlug = (slugEdited ? slug : autoSlug).trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit({
        name: name.trim(),
        slug: displaySlug.trim(),
        isActive: isActiveStr === "true",
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Không thể lưu chất liệu gọng.");
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
        <p className="-mt-2 text-xs text-gray-500">
          Đề xuất: <span className="font-medium">{autoSlug}</span>
        </p>
      )}

      <FloatingInput
        id="isActive"
        label="Hoạt động"
        as="select"
        value={isActiveStr}
        onChange={(v) => setIsActiveStr(v === "true" ? "true" : "false")}
        disabled={loading}
        options={[
          { value: "true", label: "Có" },
          { value: "false", label: "Không" },
        ]}
      />

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
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : submitLabel}
        </Button>
      </div>
      {error && <p className="text-red-500 flex justify-center">{error}</p>}
    </form>
  );
}
