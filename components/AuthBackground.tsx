import Image from "next/image";

export default function AuthBackground({
  children,
  image = "/login-bg.png",
}: {
  children: React.ReactNode;
  image?: string;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden text-neutral-100">
      {/* الخلفية (صورة حقيقية) */}
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover [object-position:center_25%]"
      />

      {/* تغميق + Blurry glow */}
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 520px at 20% 20%, rgba(255,180,90,.16), transparent 60%)," +
            "radial-gradient(900px 520px at 80% 20%, rgba(120,80,255,.10), transparent 60%)," +
            "radial-gradient(800px 420px at 50% 45%, rgba(255,120,60,.12), transparent 60%)",
        }}
      />

      {/* المحتوى */}
      <div className="relative z-10 min-h-screen grid place-items-center p-6">
        {children}
      </div>
    </div>
  );
}
