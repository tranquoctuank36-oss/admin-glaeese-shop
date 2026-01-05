"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ConfirmPopoverProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Trigger
  children: React.ReactNode; // button/icon trigger

  // Texts
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;

  // Actions
  onConfirm: () => Promise<void> | void;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;

  // UI
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  widthClass?: string; // e.g. "w-[300px]"
  confirmClassName?: string; // e.g. "bg-emerald-600 ..."
  cancelClassName?: string;  // e.g. "bg-gray-300 ..."
};

export default function ConfirmPopover({
  open,
  onOpenChange,
  children,
  title = "Bạn có chắc chắn?",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  confirmDisabled,
  confirmLoading,
  side = "bottom",
  sideOffset = 8,
  widthClass = "w-[250px]",
  confirmClassName = "h-10 bg-red-600 hover:bg-red-700 text-white",
  cancelClassName = "h-10 bg-gray-300 hover:bg-gray-400 text-gray-800",
}: ConfirmPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" side={side} sideOffset={sideOffset} className={`${widthClass} p-4 shadow-xl rounded-xl`}>
        {title && <p className="text-sm text-gray-700 text-center">{title}</p>}
        {message && <div className="mt-1 text-sm text-gray-800 text-center font-medium">{message}</div>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            className={cancelClassName}
            onClick={() => setIsOpen?.(false)}
            disabled={confirmLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            className={confirmClassName}
            onClick={async () => {
              await onConfirm();
              setIsOpen?.(false);
            }}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
