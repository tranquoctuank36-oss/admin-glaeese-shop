"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import FloatingInput from "./FloatingInput";
import ForgotPasswordDialog from "./ForgotPasswordDialog";

type ApiError = { response?: { status?: number } };
function isAxiosLikeError(e: unknown): e is ApiError {
  return !!(e && typeof e === "object" && "response" in (e as any));
}

export default function LoginDialog({
  open,
  onOpenChange,
  onLoginSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}) {
  const { loginProbe, commitSession, logout } = useAuth();

  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập cả email và mật khẩu.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const session = await loginProbe(email.trim(), password.trim());
      const roles = session.user.roles;

      console.log("Logged in user roles:", roles);

      if (!roles || !roles.includes("admin")) {
        setErrorMsg("Bạn không phải là quản trị viên.");
        return;
      }

      await commitSession(session);

      toast.success("Đăng nhập thành công!", {
        duration: 2000,
        position: "top-center",
      });
      onLoginSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      if (isAxiosLikeError(err) && err.response?.status === 401) {
        setErrorMsg("Email hoặc mật khẩu không chính xác!");
      } else {
        setErrorMsg("Đăng nhập thất bại. Vui lòng thử lại sau!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-md max-h-[80vh] rounded-xl overflow-y-auto px-8"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="mt-2 text-center text-2xl font-bold">
              Đăng nhập
            </DialogTitle>
            <p className="text-center text-sm text-gray-500">
              Truy cập bảng điều khiển của bạn.
            </p>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-3"
          >
            <FloatingInput
              id="email"
              label="Địa chỉ Email"
              type="email"
              value={email}
              onChange={(val) => {
                setEmail(val);
                setErrorMsg("");
              }}
              required
            />

            <FloatingInput
              id="password"
              label="Mật khẩu"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(val) => {
                setPassword(val);
                setErrorMsg("");
              }}
              required
              rightIcon={
                <Button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="drop-shadow-none bg-white
                w-9 h-9 flex items-center justify-center
                rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  {showPwd ? (
                    <EyeOff className="!h-5 !w-5" />
                  ) : (
                    <Eye className="!h-5 !w-5" />
                  )}
                </Button>
              }
            />

            {errorMsg && (
              <p className="text-xs text-red-500 mt-1">{errorMsg}</p>
            )}

            <div className="text-center">
              <Button 
              type="button"
                onClick={() => {
                  onOpenChange(false);
                  setForgotOpen(true);
                }}
                className="text-sm text-gray-400 underline hover:text-black/60 cursor-pointer px-0 py-0"
              >
                Quên mật khẩu?
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full !h-12 mt-8 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="font-semibold text-lg">Tiếp tục</span>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        onSwitchToLogin={() => {
          setForgotOpen(false);
          onOpenChange(true);
        }}
      />
    </>
  );
}
