"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import FloatingInput from "@/components/FloatingInput";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration, { DurationUnitType } from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(isBetween);

// Helper functions - defined outside component to avoid recreation
const formatNumber = (num: string): string => {
  if (!num) return "";
  const numStr = num.replace(/,/g, "");
  if (isNaN(Number(numStr))) return num;
  return Number(numStr).toLocaleString("en-US");
};

const parseNumber = (formatted: string): string => {
  return formatted.replace(/,/g, "");
};

// Convert UTC ISO string to Vietnam datetime-local format
const convertUTCtoVietnamLocal = (isoString: string): string => {
  if (!isoString) return "";
  return dayjs(isoString).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm");
};

// Convert Vietnam datetime-local to UTC ISO string
const convertVietnamLocalToUTC = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  return dayjs.tz(dateTimeLocal, "Asia/Ho_Chi_Minh").utc().toISOString();
};

export type VoucherFormValues = {
  code: string;
  description: string;
  minOrderAmount: string;
  maxDiscountValue?: string;
  maxUsage: number;
  type: "fixed" | "percentage" | "free_shipping";
  value: string;
  validFrom: string;
  validTo: string;
  status?: "upcoming" | "active" | "expired" | "used_up";
};

export default function VoucherForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial: VoucherFormValues;
  submitLabel?: string;
  onSubmit: (values: VoucherFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial.code ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [minOrderAmount, setMinOrderAmount] = useState(
    initial.minOrderAmount ?? "0"
  );
  const [maxDiscountValue, setMaxDiscountValue] = useState(
    initial.maxDiscountValue ?? ""
  );
  const [maxUsage, setMaxUsage] = useState(initial.maxUsage ?? 0);
  const [type, setType] = useState<"fixed" | "percentage" | "free_shipping">(
    initial.type ?? "fixed"
  );
  const [value, setValue] = useState(initial.value ?? "0");
  const [validFrom, setValidFrom] = useState(
    initial.validFrom ? convertUTCtoVietnamLocal(initial.validFrom) : ""
  );
  const [validTo, setValidTo] = useState(
    initial.validTo ? convertUTCtoVietnamLocal(initial.validTo) : ""
  );

  const [loading, setLoading] = useState(false);

  // Allow updating type only when status is upcoming
  const canUpdateType = initial.status === "upcoming" || submitLabel !== "Update";

  const canSubmit = useMemo(() => {
    // Skip value validation for free_shipping
    if (type !== "free_shipping" && parseFloat(value) < 0) return false;

    if (!validFrom) return false;
    if (!validTo) return false;

    // Check if validTo is after validFrom
    const fromDate = new Date(validFrom);
    const toDate = new Date(validTo);
    if (toDate <= fromDate) return false;

    return true;
  }, [type, validFrom, validTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        minOrderAmount: minOrderAmount || "0",
        maxUsage: maxUsage,
        validFrom: convertVietnamLocalToUTC(validFrom),
        validTo: convertVietnamLocalToUTC(validTo),
      };

      // Only include type when creating (not updating)
      if (submitLabel !== "Update") {
        payload.type = type;
      }

      // Only include value for non-free_shipping types
      if (type !== "free_shipping") {
        payload.value = value || "0";
      }

      // Only include maxDiscountValue for percentage type
      if (type === "percentage" && maxDiscountValue) {
        payload.maxDiscountValue = maxDiscountValue;
      }

      console.log("Payload before sending:", JSON.stringify(payload, null, 2));
      await onSubmit(payload);
    } catch (err: any) {
      const detail =
      err?.response?.data?.detail || err?.detail || err?.message || "An error occurred";
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
          id="code"
          label="Voucher Code"
          required
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          disabled={loading}
        />

        <FloatingInput
          id="type"
          label="Type"
          as="select"
          required
          value={type}
          onChange={(v) =>
            setType(v as "fixed" | "percentage" | "free_shipping")
          }
          disabled={loading || !canUpdateType}
          options={[
            { value: "fixed", label: "Fixed Amount" },
            { value: "percentage", label: "Percentage" },
            { value: "free_shipping", label: "Free Shipping" },
          ]}
        />
      </div>

      <FloatingInput
        id="description"
        label="Description"
        as="textarea"
        rows={3}
        required
        value={description}
        onChange={setDescription}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {type !== "free_shipping" && (
          <div>
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
                    const numValue = v.replace(/[^\d.]/g, '');
                    // Parse to number and check range
                    const num = parseFloat(numValue);
                    if (numValue === "" || (num >= 0 && num <= 100)) {
                      setValue(numValue);
                    }
                  }}
                  disabled={loading}
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
                  value={formatNumber(value)}
                  onChange={(v) => {
                    const rawValue = parseNumber(v);
                    // Only allow positive numbers
                    if (rawValue === "" || (!isNaN(Number(rawValue)) && Number(rawValue) > 0)) {
                      setValue(rawValue);
                    }
                  }}
                  disabled={loading}
                />
                {value && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                    đ
                  </span>
                )}
              </div>
            )}
            {type === "percentage" && (
              <p className="mt-1 text-xs text-gray-500">
                Must be between 0 and 100
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <FloatingInput
            id="minOrderAmount"
            label="Minimum Order Amount"
            type="text"
            required
            value={formatNumber(minOrderAmount)}
            onChange={(v) => {
              const rawValue = parseNumber(v);
              // Only allow positive numbers
              if (rawValue === "" || (!isNaN(Number(rawValue)) && Number(rawValue) > 0)) {
                setMinOrderAmount(rawValue);
              }
            }}
            disabled={loading}
          />
          {minOrderAmount && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              đ
            </span>
          )}
        </div>

        {(type === "free_shipping" || type === "fixed") && (
          <FloatingInput
            id="maxUsage"
            label="Maximum Usage Count"
            type="number"
            required
            min={0}
            step={1}
            value={String(maxUsage)}
            onChange={(v) => setMaxUsage(parseInt(v) || 0)}
            disabled={loading}
          />
        )}
      </div>

      {type === "percentage" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput
            id="maxUsage"
            label="Maximum Usage Count"
            type="number"
            required
            min={0}
            step={1}
            value={String(maxUsage)}
            onChange={(v) => setMaxUsage(parseInt(v) || 0)}
            disabled={loading}
          />
          <div className="relative">
            <FloatingInput
              id="maxDiscountValue"
              label="Maximum Discount Value"
              type="text"
              value={formatNumber(maxDiscountValue)}
              onChange={(v) => {
                const rawValue = parseNumber(v);
                // Only allow positive numbers
                if (rawValue === "" || (!isNaN(Number(rawValue)) && Number(rawValue) > 0)) {
                  setMaxDiscountValue(rawValue);
                }
              }}
              disabled={loading}
            />
            {maxDiscountValue && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                đ
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="validFrom"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Valid From <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="validFrom"
            required
            min={dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="validTo"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Valid To <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="validTo"
            required
            min={validFrom || dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {validFrom && validTo && new Date(validTo) <= new Date(validFrom) && (
        <p className="text-sm text-red-600">
          Valid To must be after Valid From
        </p>
      )}

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
