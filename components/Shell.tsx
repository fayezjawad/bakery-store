import TopNav from "@/components/TopNav";

export default function Shell({
  title,
  subtitle,
  max = "max-w-6xl",
  children,
}: {
  title?: string;
  subtitle?: string;
  max?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1">
        <div className={`mx-auto w-full px-6 ${max} py-8`}>
          {(title || subtitle) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  {title} <span className="align-middle">🍫</span>
                </h1>
              )}
              {subtitle && <p className="muted mt-2">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}
