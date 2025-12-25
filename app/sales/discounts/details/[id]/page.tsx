"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Trash2, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";
import { getDiscountById, deleteDiscount, cancelDiscount, scheduleDiscount } from "@/services/discountService";
import type { Discount } from "@/types/discount";
import toast from "react-hot-toast";
import ConfirmPopover from "@/components/ConfirmPopover";
import DiscountTargetSelector from "@/components/discounts/DiscountTargetSelector";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import DiscountProductsViewer from "@/components/discounts/DiscountProductsViewer";

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return dayjs.utc(dateString).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
  } catch {
    return "-";
  }
};

function getStatusBadge(status: string) {
  switch (status) {
    case "happening":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Happening
        </span>
      );
    case "scheduled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Scheduled
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Expired
        </span>
      );
    case "canceled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          Canceled
        </span>
      );
    case "draft":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Draft
        </span>
      );
    default:
      return null;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "percentage":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
          Percentage
        </span>
      );
    case "fixed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
          Fixed Amount
        </span>
      );
    default:
      return null;
  }
}

function DiscountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleEndAt, setScheduleEndAt] = useState("");

  const fetchDiscount = async () => {
    try {
      setLoading(true);
      const data = await getDiscountById(id);
      setDiscount(data);
    } catch (error: any) {
      console.error("Failed to fetch discount:", error);
      toast.error(error?.response?.data?.detail || "Failed to load discount");
      router.push(Routes.sales.discounts.root);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscount();
  }, [id]);

  const handleCancel = async () => {
    if (!discount) return;
    try {
      setBusyAction(true);
      await cancelDiscount(discount.id);
      toast.success("Discount canceled successfully");
      fetchDiscount();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to cancel discount");
    } finally {
      setBusyAction(false);
    }
  };

  const handleDelete = async () => {
    if (!discount) return;
    try {
      setBusyAction(true);
      await deleteDiscount(discount.id);
      toast.success("Discount moved to trash");
      router.push(Routes.sales.discounts.root);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete discount");
    } finally {
      setBusyAction(false);
    }
  };

  const handleSchedule = async () => {
    if (!discount || !scheduleStartAt || !scheduleEndAt) {
      toast.error("Please provide both start and end dates");
      return;
    }
    try {
      setBusyAction(true);
      await scheduleDiscount(discount.id, {
        startAt: scheduleStartAt,
        endAt: scheduleEndAt,
      });
      toast.success("Discount scheduled successfully");
      setShowScheduleDialog(false);
      fetchDiscount();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to schedule discount");
    } finally {
      setBusyAction(false);
    }
  };

  const openScheduleDialog = () => {
    if (discount?.startAt) {
      setScheduleStartAt(dayjs.utc(discount.startAt).format("YYYY-MM-DDTHH:mm"));
    }
    if (discount?.endAt) {
      setScheduleEndAt(dayjs.utc(discount.endAt).format("YYYY-MM-DDTHH:mm"));
    }
    setShowScheduleDialog(true);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-600 text-lg">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!discount) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <p className="text-red-600 text-lg">Discount not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.push(Routes.sales.discounts.root)}
                title="Go Back"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Discount Details</h1>
                <p className="text-gray-600 mt-1">View and manage discount information</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {(discount.status === "scheduled" || discount.status === "draft") && (
                <Button
                  onClick={() => router.push(Routes.sales.discounts.edit(discount.id))}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={busyAction}
                >
                  <Edit size={18} />
                  Edit
                </Button>
              )}
              
              <Button
                onClick={openScheduleDialog}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={busyAction}
              >
                <Calendar size={18} />
                Schedule
              </Button>
              
              <ConfirmPopover
                title="Cancel Discount"
                message={
                  <div>
                    Are you sure you want to cancel <strong>{discount.name}</strong>?
                  </div>
                }
                confirmText="Cancel Discount"
                onConfirm={handleCancel}
              >
                <Button
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={busyAction}
                >
                  <XCircle size={18} />
                  Cancel
                </Button>
              </ConfirmPopover>

              <ConfirmPopover
                title="Delete Discount"
                message={
                  <div>
                    Are you sure you want to delete <strong>{discount.name}</strong>?
                  </div>
                }
                confirmText="Delete"
                onConfirm={handleDelete}
              >
                <Button
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  disabled={busyAction}
                >
                  <Trash2 size={18} />
                  Delete
                </Button>
              </ConfirmPopover>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{discount.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Slug</label>
                    <p className="text-gray-800 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded">{discount.slug}</code>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-800 mt-1">{discount.description || "-"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="mt-2">{getTypeBadge(discount.type)}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Value</label>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {discount.type === "percentage"
                          ? `${parseFloat(discount.value)}%`
                          : `${parseFloat(discount.value).toLocaleString("en-US")}đ`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-2">{getStatusBadge(discount.status)}</div>
                  </div>
                </div>
              </motion.div>

              {/* Product Targets Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Applied Products</h2>
                  <div className="flex items-center gap-2">
                    <DiscountProductsViewer discountId={discount.id} />
                    <DiscountTargetSelector
                      discountId={discount.id}
                      onTargetsAdded={() => {
                        toast.success("Products added to discount");
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Banner Image */}
              {discount.bannerImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Banner Image</h2>
                  <img
                    src={discount.bannerImage.publicUrl}
                    alt={discount.bannerImage.altText || "Banner"}
                    className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImage(discount.bannerImage!.publicUrl)}
                  />
                </motion.div>
              )}

              {/* Date Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Date Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-gray-800 mt-1">{formatDateTime(discount.startAt)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-gray-800 mt-1">{formatDateTime(discount.endAt)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-gray-800 mt-1">{formatDateTime(discount.createdAt)}</p>
                  </div>

                  {discount.canceledAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Canceled At</label>
                      <p className="text-gray-800 mt-1">{formatDateTime(discount.canceledAt)}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
              onClick={() => setLightboxImage(null)}
              title="Close"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </Button>
            <div className="max-w-7xl max-h-[90vh] p-4">
              <img
                src={lightboxImage}
                alt="Banner"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Schedule Dialog */}
        {showScheduleDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowScheduleDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Schedule Discount</h2>
                <Button
                  size="icon-sm"
                  className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  onClick={() => setShowScheduleDialog(false)}
                >
                  <ArrowLeft size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                    value={scheduleStartAt}
                    onChange={(e) => setScheduleStartAt(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                    value={scheduleEndAt}
                    onChange={(e) => setScheduleEndAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  onClick={handleSchedule}
                  disabled={busyAction || !scheduleStartAt || !scheduleEndAt}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg disabled:opacity-50"
                >
                  {busyAction ? "Scheduling..." : "Schedule"}
                </Button>
                <Button
                  onClick={() => setShowScheduleDialog(false)}
                  disabled={busyAction}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuthCheck(DiscountDetailsPage);
