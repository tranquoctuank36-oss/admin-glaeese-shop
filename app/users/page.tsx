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
import Pagination from "@/components/data/Pagination";
import { useListQuery } from "@/components/data/useListQuery";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import { getUsers } from "@/services/userService";
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
                <h1 className="text-3xl font-bold text-gray-800">Users</h1>
                <p className="text-gray-600 mt-1">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
          </div>

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
            placeholder="Search by email..."
            userRole={(q.roles || []) as any}
            userStatus={(q.statuses || []) as any}
          />
        </motion.div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
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

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Role
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

                      <th className="px-6 py-4 min-w-[150px] text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Gender
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Date of Birth
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-xs font-bold text-gray-600">
                            Status
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

                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">
                            Created At
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

                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
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
                            <Mail size={18} className="text-gray-400" />
                            <span className="text-gray-800 font-medium">
                              {user.email}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeClass(
                              user.roles[0] || "customer"
                            )}`}
                          >
                            {(user.roles[0] || "customer").charAt(0).toUpperCase() +
                              (user.roles[0] || "customer").slice(1)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            <span className="text-gray-700">
                              {user.fullName || "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-600 capitalize">
                            {user.gender || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-600">
                            {user.dateOfBirth
                              ? new Date(user.dateOfBirth).toLocaleDateString(
                                  "en-GB"
                                )
                              : "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(
                              user.status
                            )}`}
                          >
                            {user.status.charAt(0).toUpperCase() +
                              user.status.slice(1)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-gray-600">
                            {formatDate(user.createdAt) || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View Details"
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
                              title="Edit"
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
                            No users found.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Rows per page:</span>
                <select
                  className="border rounded-md px-2 py-1"
                  value={q.limit}
                  onChange={(e) =>
                    setAndResetPage({ limit: Number(e.target.value), page: 1 })
                  }
                >
                  {[10, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <Pagination
                page={q.page}
                totalPages={meta?.totalPages}
                hasPrev={hasPrev}
                hasNext={hasNext}
                onChange={(p) => {
                  const capped = meta?.totalPages
                    ? Math.min(p, meta.totalPages)
                    : p;
                  setQ((prev) => ({ ...prev, page: Math.max(1, capped) }));
                }}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default withAuthCheck(UsersPage);
