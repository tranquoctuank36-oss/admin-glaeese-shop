"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  User as UserIcon,
  Calendar,
  Shield,
  Activity,
  Clock,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/services/userService";
import type { User } from "@/types/user";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Routes } from "@/lib/routes";

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
}

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    admin: "Admin",
    customer: "Khách hàng",
  };
  return roleMap[role] || role;
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Hoạt động",
    inactive: "Không hoạt động",
    suspended: "Bị khóa",
  };
  return statusMap[status] || status;
}

function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserById(userId);
        if (alive) {
          setUser(data);
        }
      } catch (e) {
        console.error("Failed to fetch user:", e);
        if (alive) {
          setError("Lỗi khi tải người dùng");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "customer":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-yellow-100 text-yellow-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <p className="text-center text-gray-600">Đang tải...</p>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <div className="text-center gap-3 mb-6">
            <p className="text-red-600 mb-4">{error || "Không tìm thấy người dùng"}</p>
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.push(Routes.users.root)}
              title="Back"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Chi tiết người dùng
                </h1>
                <p className="text-gray-600 mt-1">
                  Xem thông tin chi tiết về người dùng này
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.push(Routes.users.root)}
              title="Back"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Chi tiết người dùng
                </h1>
                <p className="text-gray-600 mt-1">
                  Xem thông tin chi tiết về người dùng này
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserIcon size={20} className="text-blue-600" />
              Thông tin cơ bản
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <p className="text-gray-800">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Họ và tên
                </label>
                <p className="text-gray-800">{user.fullName || "-"}</p>
              </div>

              {/* {user.firstName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    First Name
                  </label>
                  <p className="text-gray-800">{user.firstName}</p>
                </div>
              )}

              {user.lastName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Name
                  </label>
                  <p className="text-gray-800">{user.lastName}</p>
                </div>
              )} */}

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Giới tính
                </label>
                <p className="text-gray-800 capitalize">{user.gender || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar size={16} />
                  Ngày sinh
                </label>
                <p className="text-gray-800">
                  {formatDate(user.dateOfBirth || undefined)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Account Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-purple-600" />
              Trạng thái tài khoản
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Vai trò
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getRoleBadgeClass(
                          role
                        )}`}
                      >
                        {getRoleLabel(role)}
                      </span>
                    ))
                  ) : (
                    <span
                      className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getRoleBadgeClass(
                        "customer"
                      )}`}
                    >
                      {getRoleLabel("customer")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Activity size={16} />
                  Trạng thái
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getStatusBadgeClass(
                      user.status
                    )}`}
                  >
                    {getStatusLabel(user.status)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Timestamps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-gray-600" />
            Lịch sử hoạt động
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Ngày tạo
              </label>
              <p className="text-gray-800">{formatDateTime(user.createdAt)}</p>
            </div>

            {user.emailVerifiedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ngày xác minh Email
                </label>
                <p className="text-gray-800">{formatDateTime(user.emailVerifiedAt)}</p>
              </div>
            )}

            {user.deletedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ngày xóa
                </label>
                <p className="text-red-600">{formatDateTime(user.deletedAt)}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Addresses Button */}
          <button
            onClick={() => router.push(Routes.users.addresses.replace('[id]', userId))}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <MapPin size={28} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Xem địa chỉ
                </h3>
                <p className="text-sm text-gray-600">
                  Quản lý địa chỉ giao hàng của người dùng
                </p>
              </div>
              <ArrowLeft
                size={20}
                className="text-gray-400 rotate-180 group-hover:text-blue-600 transition-colors"
              />
            </div>
          </button>

          {/* Orders Button */}
          <button
            onClick={() => router.push(Routes.users.orders.replace('[id]', userId))}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-green-300 transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <ShoppingBag size={28} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Xem đơn hàng
                </h3>
                <p className="text-sm text-gray-600">
                  Kiểm tra lịch sử đơn hàng của người dùng
                </p>
              </div>
              <ArrowLeft
                size={20}
                className="text-gray-400 rotate-180 group-hover:text-green-600 transition-colors"
              />
            </div>
          </button>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(UserDetailsPage);
