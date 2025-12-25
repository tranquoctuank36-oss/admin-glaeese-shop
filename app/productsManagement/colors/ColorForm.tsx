"use client";

import { useMemo, useState } from "react";
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

export type ColorFormValues = {
  name: string;
  slug: string;
  hexCode?: string;
  isActive: boolean;
};

export default function ColorForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial: ColorFormValues;
  onSubmit: (values: ColorFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);
  const [hexCode, setHexCode] = useState(initial.hexCode ?? "");
  const [isActiveStr, setIsActiveStr] = useState<"true" | "false">(
    initial.isActive ? "true" : "false"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoSlug = useMemo(() => slugify(name), [name]);
  const displaySlug = (slugEdited ? slug : autoSlug).trim();

  const normalizedHex = useMemo(() => {
    if (!hexCode) return "";
    return hexCode.startsWith("#")
      ? hexCode.toUpperCase()
      : `#${hexCode.toUpperCase()}`;
  }, [hexCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit({
        name: name.trim(),
        slug: displaySlug.trim(),
        hexCode: normalizedHex || undefined,
        isActive: isActiveStr === "true",
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Failed to save color. Please try again.");
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
        label="Name"
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

      <div>
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
      </div>
      {name && (
        <p className="-mt-2 text-xs text-gray-500">
          Suggested: <span className="font-medium">{autoSlug}</span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <FloatingInput
            id="hexCode"
            label="Hex code (#RRGGBB or #RGB)"
            value={hexCode}
            disabled={loading}
            required
            onChange={(v) => {
              if (v.length <= 7) setHexCode(v);
            }}
          />
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full border border-gray-300"
              style={{ backgroundColor: normalizedHex || "#FFFFFF" }}
              title={normalizedHex || "No color"}
            />
            <input
              type="color"
              className="h-8 w-8 p-0 border-none cursor-pointer"
              value={
                /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalizedHex)
                  ? normalizedHex
                  : "#ffffff"
              }
              onChange={(e) => setHexCode(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        {hexCode && (
          <p className="text-xs text-gray-800">
            Hex code cannot exceed 7 characters.
          </p>
        )}
      </div>

      <FloatingInput
        id="isActive"
        label="Active"
        as="select"
        value={isActiveStr}
        onChange={(v) => setIsActiveStr(v === "true" ? "true" : "false")}
        disabled={loading}
        options={[
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ]}
      />

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          className="h-10 w-20 bg-gray-500 hover:bg-gray-700 text-white"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-10 w-20 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading || !name.trim()}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>

      {error && <p className="text-red-500 flex justify-center">{error}</p>}
    </form>
  );
}
