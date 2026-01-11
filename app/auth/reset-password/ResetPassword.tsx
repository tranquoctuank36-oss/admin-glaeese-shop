"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/services/authService";
import FloatingInput from "@/components/shared/FloatingInput";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { Routes } from "@/lib/routes";

const MIN_SPIN_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forceValidate, setForceValidate] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passMin8 = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasTypedPwd = password.length > 0;
  const matchConfirm = confirmPwd === password;

  const isValidPassword =
    passMin8 && hasNumber && hasUppercase && hasLowercase && hasSpecial;

  const handleReset = async () => {
    if (!password.trim() || !confirmPwd.trim()) {
      setForceValidate(true);
      return;
    }
    if (!matchConfirm) {
      setForceValidate(true);
      setErrorMsg("Mật khẩu không khớp.");
      return;
    }
    if (!isValidPassword) {
      setForceValidate(true);
      return;
    }
    if (!token) {
      return;
    }

    setLoading(true);
    const startedAt = Date.now();
    
    try {
      await resetPassword(token, password.trim());

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPIN_MS) await sleep(MIN_SPIN_MS - elapsed);

      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.", {
        duration: 2000,
        position: "top-center",
      });

      router.push(Routes.root);
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPIN_MS) await sleep(MIN_SPIN_MS - elapsed);

      setErrorMsg("Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 space-y-4">
        <h1 className="text-2xl font-bold text-center">Đặt lại mật khẩu</h1>
        <p className="text-center text-gray-500">
          Nhập mật khẩu mới của bạn bên dưới.
        </p>

        {/* Password */}
        <FloatingInput
          id="new-password"
          label="* Mật khẩu mới"
          type={showPwd ? "text" : "password"}
          required
          value={password}
          onChange={setPassword}
          forceValidate={forceValidate}
          rightIcon={
            <Button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="drop-shadow-none bg-white w-9 h-9 flex items-center justify-center
                rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              {showPwd ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
          }
        />

        {/* Password rules */}
        {!hasTypedPwd ? (
          <ul className="mt-1 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-gray-500 text-gray-500" />
              <span className="text-gray-600">Ít nhất 8 ký tự</span>
            </li>
            <li className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-gray-500 text-gray-500" />
              <span className="text-gray-600">
                Bao gồm số, chữ hoa, chữ thường và ký tự đặc biệt
              </span>
            </li>
          </ul>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              {passMin8 ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-2 h-2 fill-red-500 text-red-500" />
              )}
              <span className={passMin8 ? "text-green-600" : "text-red-500"}>
                Ít nhất 8 ký tự
              </span>
            </li>
            <li className="flex items-center gap-2">
              {hasNumber && hasUppercase && hasLowercase && hasSpecial ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-2 h-2 fill-red-500 text-red-500" />
              )}
              <span
                className={
                  hasNumber && hasUppercase && hasLowercase && hasSpecial
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                Bao gồm số, chữ hoa, chữ thường và ký tự đặc biệt
              </span>
            </li>
          </ul>
        )}

        {/* Confirm Password */}
        <FloatingInput
          id="confirm-password"
          label="* Xác nhận mật khẩu"
          type={showConfirmPwd ? "text" : "password"}
          required
          value={confirmPwd}
          onChange={setConfirmPwd}
          forceValidate={forceValidate}
          rightIcon={
            <Button
              type="button"
              onClick={() => setShowConfirmPwd((v) => !v)}
              className="drop-shadow-none bg-white w-9 h-9 flex items-center justify-center
                rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              {showConfirmPwd ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
          }
        />

        {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
        {forceValidate && confirmPwd && !matchConfirm && (
            <p className="text-xs text-red-500 mt-1">
              Mật khẩu xác nhận không khớp
            </p>
          )}

        <Button
          onClick={handleReset}
          disabled={loading}
          className="w-full !h-12 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="font-semibold text-lg">Đặt lại</span>
          )}
        </Button>
      </div>
    </div>
  );
}
