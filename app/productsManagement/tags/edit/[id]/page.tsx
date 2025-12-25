"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import TagForm, { TagFormValues } from "../../TagForm";
import { getTagById, updateTag } from "@/services/tagService";
import { toast } from "react-hot-toast";

export default function EditTagPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<TagFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await getTagById(id);
        if (!alive) return;
        if (!t) {
          setInitial(null);
          return;
        }
        setInitial({
          name: t.name,
          slug: t.slug,
          isActive: !!t.isActive,
        });
      } catch (e) {
        console.error("Failed to load tag:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="p-6 flex items-center justify-center">Loading...</p>;
  if (!initial) return <p className="p-6 text-red-600">Tag not found.</p>;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[980px] mx-auto py-6 px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Tag</h1>

        <TagForm
          initial={initial}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            await updateTag(id, values);
            router.push(Routes.productsManagement.tags.root);
            toast.success("Tag updated successfully!");
          }}
          submitLabel="Update"
        />
      </main>
    </div>
  );
}
