import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/" className="block">
          <span className="text-lg font-black tracking-widest text-gold leading-none">
            {APP_NAME}
          </span>
          <span className="block text-[9px] font-semibold tracking-widest text-text-muted uppercase mt-0.5">
            by JO:LA LABS
          </span>
        </Link>
      </div>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Bottom */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} ROSTER by JO:LA LABS
        </p>
      </div>
    </div>
  );
}
