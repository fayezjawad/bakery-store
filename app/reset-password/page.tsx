import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-[#080504] text-neutral-200">
          Loading...
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
