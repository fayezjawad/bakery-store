import { Suspense } from "react";
import SignupClient from "./SignupClient";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-[#080504] text-neutral-200">
          Loading...
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  );
}
