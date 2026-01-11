"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  Mail,
  User as UserIcon,
  Eye,
  Edit,
} from "lucide-react";
import TablePagination from "@/components/shared/TablePagination";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import ToolbarSearchFilters from "@/components/listing/ToolbarSearchFilters";
import { getUsers, getUserStatistics } from "@/services/userService";
import type { User, UserRole, UserStatus } from "@/types/user";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
    inactive: "Chưa xác thực",
    suspended: "Bị khóa",
  };
  return statusMap[status] || status;
}

function UsersPage() {
  const router = useRouter();
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
    sortField: "createdAt",
    sortOrder: "DESC",
  });

  const toggleCreatedAtSort = () => {
    if (q.sortField !== "createdAt") {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "DESC") {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    }
  };

  const toggleEmailSort = () => {
    if (q.sortField !== "email") {
      setAndResetPage({
        sortField: "email",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({
        sortField: "email",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    }
  };

  const toggleRoleSort = () => {
    if (q.sortField !== "role") {
      setAndResetPage({
        sortField: "role",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({
        sortField: "role",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    }
  };

  const toggleStatusSort = () => {
    if (q.sortField !== "status") {
      setAndResetPage({
        sortField: "status",
        sortOrder: "ASC" as const,
        page: 1,
      });
    } else if (q.sortOrder === "ASC") {
      setAndResetPage({
        sortField: "status",
        sortOrder: "DESC" as const,
        page: 1,
      });
    } else {
      setAndResetPage({
        sortField: "createdAt",
        sortOrder: "DESC" as const,
        page: 1,
      });
    }
  };

  // Convert API params to userService format
  const getUsersParams = {
    page: apiParams.page,
    limit: apiParams.limit,
    search: apiParams.search,
    sortField: apiParams.sortField as any,
    sortOrder: apiParams.sortOrder,
    roles:
      apiParams.roles && apiParams.roles.length > 0
        ? (apiParams.roles as UserRole[])
        : undefined,
    statuses:
      apiParams.statuses && apiParams.statuses.length > 0
        ? (apiParams.statuses as UserStatus[])
        : undefined,
  };

  const [rows, setRows] = useState<User[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const statsData = await getUserStatistics();
      setStats(statsData.data ?? statsData);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getUsers(getUsersParams);
        if (!alive) return;
        setRows(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch users:", e);
        if (alive) {
          setRows([]);
          setMeta(undefined);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey]);

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

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Danh sách người dùng
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý tài khoản và quyền người dùng
                </p>
              </div>
            </div>
          </div>

          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.total ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {stats.active ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chưa xác thực</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {stats.inactive ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bị khóa</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {(stats.suspended ?? 0) + (stats.locked ?? 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Người dùng mới</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">
                      {stats.newUsers ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã xác thực</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      {stats.verified ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admin</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {stats.adminCount ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Khách hàng</p>
                    <p className="text-2xl font-bold text-cyan-600 mt-1">
                      {stats.customerCount ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <ToolbarSearchFilters
            value={q.search}
            onSearchChange={(v) => setAndResetPage({ search: v, page: 1 })}
            onFiltersChange={(patch: any) => {
              const updates: any = { page: 1 };
              if (patch.userRole !== undefined) {
                updates.roles =
                  patch.userRole.length > 0 ? patch.userRole : undefined;
              }
              if (patch.userStatus !== undefined) {
                updates.statuses =
                  patch.userStatus.length > 0 ? patch.userStatus : undefined;
              }
              setAndResetPage(updates);
            }}
            placeholder="Tìm kiếm theo email..."
            userRole={(q.roles || []) as any}
            userStatus={(q.statuses || []) as any}
          />
        </motion.div>

        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible"
          >
            <div className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Email
                          </span>
                          <button
                            type="button"
                            onClick={toggleEmailSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                            title={
                              q.sortField === "email"
                                ? `Sorting: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (click to change)`
                                : "No sorting (click to sort by Email)"
                            }
                          >
                            {q.sortField === "email" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5 relative top-[1px]" />
                              ) : (
                                <ArrowDownAZ className="size-5 relative top-[1px]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5 relative top-[1px]" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Vai trò
                          </span>
                          <button
                            type="button"
                            onClick={toggleRoleSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                          >
                            {q.sortField === "role" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-xs font-bold text-gray-600">
                            Trạng thái
                          </span>
                          <button
                            type="button"
                            onClick={toggleStatusSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                          >
                            {q.sortField === "status" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Ngày tạo
                          </span>
                          <button
                            type="button"
                            onClick={toggleCreatedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              q.sortField === "createdAt"
                                ? `Sorting: ${
                                    q.sortOrder === "ASC" ? "ASC" : "DESC"
                                  } (click to change)`
                                : "No sorting (click to sort by Created At)"
                            }
                          >
                            {q.sortField === "createdAt" ? (
                              q.sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Ngày xác minh Email
                          </span>
                        </div>
                      </th>

                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {rows.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-gray-800 font-medium block">
                                {user.email}
                              </span>
                              <span className="text-gray-600 text-sm">
                                Tên: {user.fullName || "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeClass(
                                    role
                                  )}`}
                                >
                                  {getRoleLabel(role)}
                                </span>
                              ))
                            ) : (
                              <span
                                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeClass(
                                  "customer"
                                )}`}
                              >
                                {getRoleLabel("customer")}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(
                              user.status
                            )}`}
                          >
                            {getStatusLabel(user.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {formatDate(user.createdAt) || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-600">
                            {user.emailVerifiedAt
                              ? new Date(
                                  user.emailVerifiedAt
                                ).toLocaleDateString("en-GB")
                              : "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Xem chi tiết"
                              onClick={() =>
                                router.push(
                                  Routes.users.details.replace("[id]", user.id)
                                )
                              }
                            >
                              <Eye className="text-blue-600 size-5" />
                            </Button>

                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                              onClick={() =>
                                router.push(
                                  Routes.users.edit.replace("[id]", user.id)
                                )
                              }
                            >
                              <Edit className="text-green-600 size-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-6">
                          <div className="text-center text-gray-600">
                            Không tìm thấy người dùng.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <TablePagination
              page={q.page}
              limit={q.limit}
              totalPages={meta?.totalPages}
              totalItems={meta?.totalItems}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPageChange={(p) => setQ((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setAndResetPage({ limit: l, page: 1 })}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default withAuthCheck(UsersPage);
