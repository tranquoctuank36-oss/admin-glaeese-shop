"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Home, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { getUserAddresses, type UserAddress } from "@/services/userService";
import { Routes } from "@/lib/routes";

function UserAddressesPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState<{
    totalItems?: number;
  }>();

  useEffect(() => {
    if (!userId) return;

    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getUserAddresses(userId);
        if (alive && res.success) {
          setAddresses(res.data || []);
          setMeta({ totalItems: res.meta?.totalItems });
        }
      } catch (e) {
        console.error("Failed to fetch addresses:", e);
        if (alive) {
          setError("Failed to load addresses");
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

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <p className="text-center text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <div className="text-center gap-3 mb-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.push(Routes.users.details.replace('[id]', userId))}
              title="Back"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold text-gray-800">
                User Addresses
              </h1>
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
              onClick={() => router.push(Routes.users.details.replace('[id]', userId))}
              title="Back"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>

            <div className="flex items-end gap-3 ">
              <h1 className="text-3xl font-bold text-gray-800">User Addresses</h1>
              <p className="text-gray-600">
                Total {meta?.totalItems || 0} address(es)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No addresses found</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-lg border-2 p-6 relative ${
                  address.isDefault ? "border-blue-500" : "border-gray-200"
                }`}
              >
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      <CheckCircle2 size={14} />
                      Default
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Home size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {address.recipientName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {address.recipientPhone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-[160px_1fr] gap-y-1 text-sm text-gray-700">
                  <p className="font-semibold">House Number / Street:</p>
                  <p>{address.addressLine}</p>

                  <p className="font-semibold">Ward / Commune:</p>
                  <p>{address.wardName}</p>

                  <p className="font-semibold">District:</p>
                  <p>{address.districtName}</p>

                  <p className="font-semibold">Province / City:</p>
                  <p>{address.provinceName}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuthCheck(UserAddressesPage);
