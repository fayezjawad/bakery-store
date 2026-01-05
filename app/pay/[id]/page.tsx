import PayClient from "./PayClient";

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayClient orderId={id} />;
}
