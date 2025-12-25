"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById, updateUser } from "@/services/userService";
import type { User, UserRole, UserStatus } from "@/types/user";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import toast from "react-hot-toast";
import { Routes } from "@/lib/routes";
import FloatingInput from "@/components/FloatingInput";

function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    status: "" as UserStatus,
    role: "" as UserRole,
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
          role: data.roles[0] || "customer",
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      await updateUser(userId, {
        status: formData.status,
        role: formData.role,
      });
      toast.success("User updated successfully!");
      router.push(Routes.users.root);
    } catch (err) {
      console.error("Failed to update user:", err);
      let errorMessage = 
        (err as any)?.response?.data?.detail || 
        (err as any)?.response?.data?.message || 
        "Failed to update user. Please try again.";
      
      if (errorMessage.includes("Admin không thể tự cập nhật trạng thái và vai trò của chính mình")) {
        errorMessage = "Admins cannot update their own status and role";
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
          <p className="text-center text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
          <p className="text-center text-red-600">User not found</p>
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
                <h1 className="text-3xl font-bold text-gray-800">Edit User</h1>
                {/* <p className="text-gray-600 mt-1">
                  Update user information for {user.email}
                </p> */}
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
                label="Full Name"
                value={user.fullName || "-"}
                onChange={() => {}}
                disabled
              />

              {/* Role */}
              <FloatingInput
                id="role"
                label="Role"
                as="select"
                value={formData.role}
                onChange={(val) =>
                  setFormData({ ...formData, role: val as UserRole })
                }
                required
                options={[
                  { value: "admin", label: "Admin" },
                  { value: "customer", label: "Customer" },
                ]}
              />

              {/* Status */}
              <FloatingInput
                id="status"
                label="Status"
                as="select"
                value={formData.status}
                onChange={(val) =>
                  setFormData({ ...formData, status: val as UserStatus })
                }
                required
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                className="h-10 w-20 bg-gray-500 hover:bg-gray-700 text-white"
                onClick={() => router.back()}
                disabled={saving}  
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 w-20 bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2"
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    Save
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
