import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-[#080504] text-neutral-200">
          Loading...
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}
