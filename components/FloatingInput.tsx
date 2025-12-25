"use client";
import React from "react";
import { ChevronDown } from "lucide-react";

export type FloatingInputProps = {
  id: string;
  label: string;
  as?: "input" | "select" | "textarea";
  type?: React.HTMLInputTypeAttribute;    
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  maxLength?: number;
  forceValidate?: boolean;

  min?: number;
  max?: number;
  step?: number;
};

export default function FloatingInput({
  id,
  label,
  type = "text",
  required,
  value,
  onChange,
  rightIcon,
  disabled = false,
  placeholder,
  as = "input",
  options = [],
  rows = 4,
  maxLength,
  min,
  max,
  step,
}: FloatingInputProps) {
  const [touched, setTouched] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const showError = required && touched && !value;

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    if (as !== "select") return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTouched(true);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, as]);

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
    setTouched(true);
  };

  const baseClassCommon =
    "peer w-full rounded-md border bg-white text-[16px] text-gray-800 focus:border-2 focus:border-blue-400 focus:outline-none transition" +
    (disabled
      ? "!bg-gray-200 !text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-800") +
    (showError ? " border-red-500 bg-red-50" : " border-gray-300");

  const inputSelectClass = `${baseClassCommon} h-12 px-3 pt-4 pb-1${
    rightIcon ? "pr-14" : ""
  }`;
  const textareaClass = `${baseClassCommon} px-3 pt-6 pb-3 min-h-[104px] resize-y ${
    rightIcon ? "pr-14" : ""
  }`;

  return (
    <div className="w-full" ref={as === "select" ? containerRef : null}>
      <div className="relative group w-full">
        {as === "input" && (
          <input
            id={id}
            type={type}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={inputSelectClass}
            // chỉ áp dụng cho number
            {...(type === "number"
              ? { min, max, step, inputMode: "numeric", pattern: "[0-9]*" }
              : {})}
          />
        )}

        {as === "select" && (
          <div className="relative">
            <div
              onClick={() => !disabled && setOpen(!open)}
              className={`
                w-full h-12 px-3 rounded-md border bg-white text-[16px] cursor-pointer
                flex items-center justify-between transition
                ${disabled ? "!bg-gray-200 !text-gray-500 cursor-not-allowed" : "hover:border-gray-400"}
                ${showError ? "border-red-500 bg-red-50" : open ? "border-2 border-blue-400" : "border-gray-300"}
              `}
            >
              <span className={`${value ? "text-gray-800 pt-4" : "text-transparent"} truncate pr-2`}>
                {selectedOption?.label || "placeholder"}
              </span>
              <ChevronDown 
                className={`size-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} 
              />
            </div>

            <label
              htmlFor={id}
              className={`absolute left-3 transition-all pointer-events-none
                ${value ? "top-1 text-xs text-gray-500" : "top-1/2 -translate-y-1/2 text-[15px] text-gray-500"}
              `}
            >
              {label} {required && <span className="text-red-500 ml-[1px]">*</span>}
            </label>

            {/* Dropdown */}
            {open && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {options.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No options available
                    </div>
                  ) : (
                    options.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value)}
                        className={`
                          px-4 py-2.5 cursor-pointer transition-colors text-sm
                          ${opt.value === value 
                            ? "bg-blue-50 text-blue-600 font-medium" 
                            : "hover:bg-gray-100 text-gray-800"
                          }
                        `}
                      >
                        {opt.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {as === "textarea" && (
          <textarea
            id={id}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={textareaClass}
          />
        )}

        {as !== "select" && (
          <label
            htmlFor={id}
            className={`absolute left-3 transition-all pointer-events-none
              ${
                value
                  ? "top-1 text-xs text-gray-500"
                  : as === "textarea"
                  ? "top-3 text-[15px] text-gray-500"
                  : "top-1/2 -translate-y-1/2 text-[15px] text-gray-500"
              }
              peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-500`}
          >
            {label} {required && <span className="text-red-500 ml-[1px]">*</span>}
          </label>
        )}

        {rightIcon && as !== "select" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>

      {showError && (
        <p className="text-xs text-red-500 mt-1">Please enter your details</p>
      )}
    </div>
  );
}
