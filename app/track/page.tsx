import { Suspense } from "react";
import TrackClient from "./TrackClient";

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <TrackClient />
    </Suspense>
  );
}
