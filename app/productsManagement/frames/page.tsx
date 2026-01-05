"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";

function FramesPage() {
  const router = useRouter();

  useEffect(() => {
    // Chuyển hướng đến Hình dạng Khung theo mặc định
    router.replace(Routes.productsManagement.frames.frameShapes.root);
  }, [router]);

  return (
    <div className="text-center py-12 text-gray-500">
      Đang chuyển hướng...
    </div>
  );
}

export default withAuthCheck(FramesPage);
