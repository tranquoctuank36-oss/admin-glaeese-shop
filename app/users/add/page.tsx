"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { createUser, type CreateUserPayload } from "@/services/userService";
import { toast } from "react-hot-toast";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import type { UserRole } from "@/types/user";
import FloatingInput from "@/components/shared/FloatingInput";

function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateUserPayload>({
    email: "",
    roles: ["customer"],
    sendInviteEmail: true,
    temporaryPassword: "",
  });

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length > 0) {
      const passMin8 = password.length >= 8;
      const hasNumber = /\d/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (!passMin8) errors.push("Mật khẩu phải có ít nhất 8 ký tự");
      if (!hasNumber) errors.push("Mật khẩu phải chứa ít nhất 1 chữ số");
      if (!hasUppercase) errors.push("Mật khẩu phải chứa ít nhất 1 chữ hoa");
      if (!hasLowercase) errors.push("Mật khẩu phải chứa ít nhất 1 chữ thường");
      if (!hasSpecial) errors.push("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Email không hợp lệ";
    }

    if (formData.roles.length === 0) {
      newErrors.roles = "Vui lòng chọn ít nhất một vai trò";
    }

    if (!formData.sendInviteEmail && !formData.temporaryPassword) {
      newErrors.temporaryPassword = "Vui lòng nhập mật khẩu tạm thời hoặc chọn gửi email mời";
    } else if (formData.temporaryPassword) {
      const pwdErrors = validatePassword(formData.temporaryPassword);
      if (pwdErrors.length > 0) {
        newErrors.temporaryPassword = "Mật khẩu không đạt yêu cầu";
      }
    }

    // If there are errors, display them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const payload: CreateUserPayload = {
        email: formData.email,
        roles: formData.roles,
        sendInviteEmail: formData.sendInviteEmail,
      };

      if (!formData.sendInviteEmail && formData.temporaryPassword) {
        payload.temporaryPassword = formData.temporaryPassword;
      }

      await createUser(payload);
      toast.success("Tạo người dùng thành công!");
      router.push(Routes.users.root);
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const detail = error?.response?.data?.detail || error?.detail || "Không thể tạo người dùng";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter((r) => r !== role),
    }));
    setErrors((prev) => ({ ...prev, roles: "" }));
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Thêm người dùng mới
              </h1> 
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <FloatingInput
                  id="email"
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(v) => {
                    setFormData((prev) => ({ ...prev, email: v }));
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes("customer")}
                      onChange={(e) => handleRoleChange("customer", e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Khách hàng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes("admin")}
                      onChange={(e) => handleRoleChange("admin", e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Quản trị viên</span>
                  </label>
                </div>
                {errors.roles && (
                  <p className="text-xs text-red-500 mt-1">{errors.roles}</p>
                )}
              </div>

              {/* Send Invite Email */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendInviteEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sendInviteEmail: e.target.checked,
                        temporaryPassword: e.target.checked ? "" : prev.temporaryPassword,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Gửi email mời người dùng đặt mật khẩu
                  </span>
                </label>
              </div>

              {/* Temporary Password */}
              {!formData.sendInviteEmail && (
                <div className="space-y-1">
                  <FloatingInput
                    id="temporaryPassword"
                    label="Mật khẩu tạm thời"
                    type={showPwd ? "text" : "password"}
                    required
                    value={formData.temporaryPassword || ""}
                    onChange={(v) => {
                      setFormData((prev) => ({
                        ...prev,
                        temporaryPassword: v,
                      }));
                      setErrors((prev) => ({ ...prev, temporaryPassword: "" }));
                      if (v.trim()) {
                        setPasswordErrors(validatePassword(v));
                      } else {
                        setPasswordErrors([]);
                      }
                    }}
                    disabled={loading}
                    autoComplete="new-password"
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
                  {passwordErrors.length > 0 && (
                    <div className="space-y-1">
                      {passwordErrors.map((error, index) => (
                        <p key={index} className="text-xs text-red-500">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-6 mt-2">
              <Button
                type="button"
                onClick={() => router.back()}
                className="h-10 w-20 bg-gray-500 hover:bg-gray-700 text-white"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 w-20 bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  "Tạo"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(AddUserPage);
