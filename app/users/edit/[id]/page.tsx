"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById, updateUser } from "@/services/userService";
import type { User, UserRole, UserStatus } from "@/types/user";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import toast from "react-hot-toast";
import { Routes } from "@/lib/routes";
import FloatingInput from "@/components/shared/FloatingInput";

function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    status: "" as UserStatus,
    roles: [] as UserRole[],
    password: "",
  });

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getUserById(userId);
        setUser(data);
        setFormData({
          status: data.status,
          roles: data.roles || ["customer"],
          password: "",
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Không thể tải dữ liệu người dùng");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

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
    if (!userId) return;

    // Validate password if it's been entered
    if (formData.password.trim()) {
      const errors = validatePassword(formData.password);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        // toast.error("Đổi mật khẩu không đạt yêu cầu");
        return;
      }
    }

    setSaving(true);
    try {
      const updatePayload: any = {
        status: formData.status,
        roles: formData.roles,
      };
      
      // Only include password if it's been entered
      if (formData.password.trim()) {
        updatePayload.password = formData.password;
      }
      
      await updateUser(userId, updatePayload);
      toast.success("Cập nhật thành công!");
      router.push(Routes.users.root);
    } catch (err) {
      console.error("Failed to update user:", err);
      let errorMessage = 
        (err as any)?.response?.data?.detail || 
        (err as any)?.response?.data?.message || 
        "Cập nhật người dùng thất bại. Vui lòng thử lại.";
      
      if (errorMessage.includes("Admin không thể tự cập nhật trạng thái và vai trò của chính mình")) {
        errorMessage = "Quản trị viên không thể cập nhật trạng thái và vai trò của chính mình";
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
          <p className="text-center text-gray-600">Đang tải...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
          <p className="text-center text-red-600">Không tìm thấy người dùng</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa thông tin người dùng</h1>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email and Full Name row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email (Read-only) */}
              <FloatingInput
                id="email"
                label="Email"
                value={user.email}
                onChange={() => {}}
                disabled
              />

              {/* Full Name (Read-only) */}
              <FloatingInput
                id="fullName"
                label="Họ và tên"
                value={user.fullName || "-"}
                onChange={() => {}}
                disabled
              />
            </div>

            {/* Password and Status row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <FloatingInput
                id="status"
                label="Trạng thái"
                as="select"
                value={formData.status}
                onChange={(val) =>
                  setFormData({ ...formData, status: val as UserStatus })
                }
                required
                options={[
                  { value: "active", label: "Hoạt động" },
                  { value: "inactive", label: "Chưa xác thực" },
                  { value: "suspended", label: "Bị khóa" },
                ]}
              />
              {/* Password */}
              <div className="space-y-1">
                <FloatingInput
                  id="password"
                  label="Mật khẩu mới"
                  type={showPwd ? "text" : "password"}
                  value={formData.password}
                  onChange={(val) => {
                    setFormData({ ...formData, password: val });
                    if (val.trim()) {
                      setPasswordErrors(validatePassword(val));
                    } else {
                      setPasswordErrors([]);
                    }
                  }}
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
            </div>

            {/* Role - Full width below */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vai trò
              </label>
              <div className="space-y-2">
                {(["admin", "customer"] as UserRole[]).map((roleOption) => (
                  <label key={roleOption} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(roleOption)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            roles: [...formData.roles, roleOption],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            roles: formData.roles.filter((r) => r !== roleOption),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700">
                      {roleOption === "admin" ? "Admin" : "Khách hàng"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                className="h-10 w-20 bg-gray-500 hover:bg-gray-700 text-white"
                onClick={() => router.back()}
                disabled={saving}  
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 w-20 bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Lưu
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(EditUserPage);
