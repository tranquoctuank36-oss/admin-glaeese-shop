"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/services/authService";
import FloatingInput from "@/components/FloatingInput";
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
      setErrorMsg("Passwords do not match.");
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

      toast.success("Password reset successfully! Please log in again.", {
        duration: 2000,
        position: "top-center",
      });

      router.push(Routes.root);
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPIN_MS) await sleep(MIN_SPIN_MS - elapsed);

      setErrorMsg("Failed to reset password. The link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 space-y-4">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        <p className="text-center text-gray-500">
          Enter your new password below.
        </p>

        {/* Password */}
        <FloatingInput
          id="new-password"
          label="* New Password"
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
              <span className="text-gray-600">At least 8 characters</span>
            </li>
            <li className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-gray-500 text-gray-500" />
              <span className="text-gray-600">
                Includes number, uppercase, lowercase and special character
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
                At least 8 characters
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
                Includes number, uppercase, lowercase and special character
              </span>
            </li>
          </ul>
        )}

        {/* Confirm Password */}
        <FloatingInput
          id="confirm-password"
          label="* Confirm Password"
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
              Confirm password does not match
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
            <span className="font-semibold text-lg">Reset</span>
          )}
        </Button>
      </div>
    </div>
  );
}
