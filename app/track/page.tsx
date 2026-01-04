import { Suspense } from "react";
import TrackClient from "./TrackClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TrackClient />
    </Suspense>
  );
}
