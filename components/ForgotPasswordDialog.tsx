"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { forgotPassword } from "@/services/authService";
import FloatingInput from "./FloatingInput";

function isAxiosLikeError(
  err: unknown
): err is { response?: { status?: number } } {
  return typeof err === "object" && err !== null && "response" in err;
}

type ForgotPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
};

const MIN_SPIN_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ForgotPasswordDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [forceValidate, setForceValidate] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleForgot = async () => {
    if (!isValidEmail(email.trim()) && email.trim() !== "") {
      setErrorMsg("Vui lòng nhập địa chỉ email hợp lệ.");
      setForceValidate(true);
      return;
    }
    if (!email.trim()) {
      setForceValidate(true);
      return;
    }
    setLoading(true);
    const startedAt = Date.now();

    try {
      await forgotPassword(email.trim());
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPIN_MS) await sleep(MIN_SPIN_MS - elapsed);

      toast.success("Email đã được gửi thành công! Vui lòng kiểm tra hộp thư của bạn.", {
        duration: 2000,
        position: "top-center",
      });

      setForceValidate(false);
      setEmail("");
      setErrorMsg("");
      onOpenChange(false);
    } catch (err: unknown) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPIN_MS) await sleep(MIN_SPIN_MS - elapsed);

      if (isAxiosLikeError(err) && err.response?.status === 400) {
        setErrorMsg("Email này chưa được đăng ký.");
      } else {
        setErrorMsg("Không thể gửi liên kết đặt lại. Vui lòng thử lại sau!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg rounded-xl overflow-y-auto px-8"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="mt-2 text-center text-2xl font-bold">
            Quên mật khẩu?
          </DialogTitle>
          <DialogDescription className="mt-5 text-center text-base text-gray-500 font-bold">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <FloatingInput
            id="email"
            label="* Địa chỉ Email"
            type="email"
            required
            value={email}
            onChange={(val) => {
              setEmail(val);
              setErrorMsg("");
            }}
          />

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

          <Button
            onClick={handleForgot}
            disabled={loading}
            className="w-full h-12 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="font-semibold text-lg">Gửi liên kết cho tôi</span>
            )}
          </Button>

          <Button
            type="button"
            className="text-center text-sm text-blue-500 hover:underline cursor-pointer w-full px-0 py-0"
            onClick={() => {
              onOpenChange(false);
              onSwitchToLogin?.();
            }}
          >
            Thực ra, tôi nhớ mật khẩu của mình
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
