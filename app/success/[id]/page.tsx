// app/success/[id]/page.tsx
import SuccessClient from "./SuccessClient";

type Ctx = { params: Promise<{ id: string }> };

export default async function SuccessPage({ params }: Ctx) {
  const { id } = await params;
  return <SuccessClient id={id} />;
}
