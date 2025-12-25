"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import FloatingInput from "@/components/FloatingInput";
import BannerUploader from "@/components/images/BrandImageUploader";

// Helper functions outside component
const formatNumber = (value: string): string => {
  const numericValue = value.replace(/[^0-9]/g, "");
  if (!numericValue) return "";
  return Number(numericValue).toLocaleString("en-US");
};

const parseNumber = (value: string): string => {
  return value.replace(/,/g, "");
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type DiscountFormValues = {
  name: string;
  slug: string;
  description: string;
  type: "percentage" | "fixed";
  value: string;
  maxDiscountValue?: string;
  bannerImageId?: string;
  bannerImage?: {
    id: string;
    publicUrl: string;
    altText?: string;
  };
  status?: "draft" | "scheduled" | "happening" | "canceled" | "expired";
};

interface DiscountFormProps {
  initial: DiscountFormValues;
  submitLabel?: string;
  onSubmit: (values: DiscountFormValues) => Promise<void> | void;
  onCancel: () => void;
}

export function DiscountForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: DiscountFormProps) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);
  const [description, setDescription] = useState(initial.description || "");
  const [type, setType] = useState<"percentage" | "fixed">(
    initial.type || "fixed"
  );
  const [value, setValue] = useState(initial.value || "0");
  const [maxDiscountValue, setMaxDiscountValue] = useState(
    initial.maxDiscountValue || ""
  );
  const [banner, setBanner] = useState<{
    publicUrl: string;
    id?: string;
    altText?: string;
  } | null>(
    initial.bannerImage
      ? {
          id: initial.bannerImage.id,
          publicUrl: initial.bannerImage.publicUrl,
          altText: initial.bannerImage.altText,
        }
      : null
  );

  const [loading, setLoading] = useState(false);

  // Allow updating type, value, maxDiscountValue when status is draft or scheduled
  // Disable when status is happening (or when creating new discount)
  const canUpdateDiscountValues = 
    submitLabel === "Update" 
      ? initial.status === "draft" || initial.status === "scheduled"
      : true; // Always allow when creating new

  const autoSlug = useMemo(() => slugify(name), [name]);
  const displaySlug = (slugEdited ? slug : autoSlug).trim();

  const canSubmit = useMemo(() => {
    if (parseFloat(value) < 0) return false;
    return true;
  }, [value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        slug: displaySlug,
        description: description.trim(),
        value: value || "0",
      };

      // Only include type when creating (not updating)
      if (submitLabel !== "Update") {
        payload.type = type;
      }

      // Only include maxDiscountValue for percentage type
      if (type === "percentage" && maxDiscountValue) {
        payload.maxDiscountValue = maxDiscountValue;
      }

      // Include bannerImageId if provided (either from new upload or existing banner)
      if (banner?.id) {
        payload.bannerImageId = banner.id;
      } else if (initial.bannerImage?.id) {
        // Keep existing banner if no new banner was uploaded
        payload.bannerImageId = initial.bannerImage.id;
      }

      console.log("Payload before sending:", JSON.stringify(payload, null, 2));
      await onSubmit(payload);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        "An error occurred";
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
          label="Discount Name"
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
              Suggested: <span className="font-medium">{autoSlug}</span>
            </p>
          )}
        </div>
      </div>

      <FloatingInput
        id="description"
        label="Description"
        as="textarea"
        rows={3}
        value={description}
        onChange={setDescription}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingInput
          id="type"
          label="Type"
          as="select"
          required
          value={type}
          onChange={(v) => setType(v as "percentage" | "fixed")}
          disabled={loading || !canUpdateDiscountValues}
          options={[
            { value: "percentage", label: "Percentage" },
            { value: "fixed", label: "Fixed Amount" },
          ]}
        />

        {type === "percentage" ? (
          <div className="relative">
            <FloatingInput
              id="value"
              label="Discount Percentage"
              type="text"
              required
              value={value}
              onChange={(v) => {
                // Remove non-numeric characters except decimal point
                const numValue = v.replace(/[^\d.]/g, "");
                // Parse to number and check range
                const num = parseFloat(numValue);
                if (numValue === "" || (num >= 0 && num <= 100)) {
                  setValue(numValue);
                }
              }}
              disabled={loading || !canUpdateDiscountValues}
            />
            {value && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                %
              </span>
            )}
          </div>
        ) : (
          <div className="relative">
            <FloatingInput
              id="value"
              label="Discount Amount"
              type="text"
              required
              value={formatNumber(value)}
              onChange={(v) => {
                const rawValue = parseNumber(v);
                // Only allow positive numbers
                if (
                  rawValue === "" ||
                  (!isNaN(Number(rawValue)) && Number(rawValue) >= 0)
                ) {
                  setValue(rawValue);
                }
              }}
              disabled={loading || !canUpdateDiscountValues}
            />
            {value && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                đ
              </span>
            )}
          </div>
        )}
      </div>

      {type === "percentage" && (
        <div className="relative">
          <FloatingInput
            id="maxDiscountValue"
            label="Maximum Discount Value"
            type="text"
            value={formatNumber(maxDiscountValue)}
            onChange={(v) => {
              const rawValue = parseNumber(v);
              // Only allow positive numbers
              if (
                rawValue === "" ||
                (!isNaN(Number(rawValue)) && Number(rawValue) > 0)
              ) {
                setMaxDiscountValue(rawValue);
              }
            }}
            disabled={loading || !canUpdateDiscountValues}
          />
          {maxDiscountValue && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              đ
            </span>
          )}
        </div>
      )}

      <BannerUploader
        label="Banner Image"
        value={banner}
        onChange={(v) => setBanner(v)}
        disabled={loading}
        ownerImageType="discount"
      />

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
          className="h-10 w-20 bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
          disabled={loading || !canSubmit}
          title={!canSubmit ? "Please check your inputs" : submitLabel}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
