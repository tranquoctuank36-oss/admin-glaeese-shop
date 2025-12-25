"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";

interface DiscountProductsViewerProps {
  discountId: string;
}

export default function DiscountProductsViewer({
  discountId,
}: DiscountProductsViewerProps) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push(Routes.sales.discounts.targets(discountId))}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
    >
      <Eye size={18} />
      View Product Variants
    </Button>
  );
}
