"use client";

import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import TagForm from "../TagForm";
import { createTag } from "@/services/tagService";
import { toast } from "react-hot-toast";

export default function AddTagPage() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[600px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Thêm nhãn</h1>

        <TagForm
          initial={{ name: "", slug: "", isActive: true}}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await createTag(values);
            router.push(Routes.attributes.tags.root);
            toast.success("Nhãn đã được tạo thành công!");
          }}
          submitLabel="Tạo"
        />
      </main>
    </div>
  );
}
