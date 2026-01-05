"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type CancelOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderCode: string;
};

export default function CancelOrderDialog({
  open,
  onClose,
  onConfirm,
  orderCode,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do hủy đơn");
      return;
    }
    onConfirm(reason);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>Bạn có chắc chắn muốn hủy đơn hàng này?</DialogTitle>
          <DialogDescription className="text-base">
            <span className="text-black">Mã đơn hàng:</span>{" "}
            <span className="font-bold text-blue-700">{orderCode}</span>
          </DialogDescription>
        </DialogHeader>

        <div>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            placeholder="Lý do"
            rows={3}
            className={`w-full border focus:outline-none focus:border-gray-800 rounded-lg px-3 py-2 resize-none mt-2 text-base ${
              error ? "border-red-500" : "border-gray-400"
            }`}
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-4 mt-5">
          <Button
            variant="outline"
            type="button"
            className="h-10 w-20 bg-white border border-2 border-gray-400 hover:border-gray-800 text-base font-bold text-gray-400 hover:text-gray-800 hover:bg-white rounded-lg"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="h-10 w-20 bg-blue-600 text-white text-base font-bold hover:bg-blue-800 rounded-lg"
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
