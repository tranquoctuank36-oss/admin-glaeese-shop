import { Suspense } from "react";
import ResetPasswordClient from "./ResetPassword";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div>Loading…</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}