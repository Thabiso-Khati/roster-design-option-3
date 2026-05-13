import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <Link href="/" className="mb-12">
        <span className="text-xl font-black tracking-widest text-gold">{APP_NAME}</span>
      </Link>

      {/* 404 */}
      <div className="relative mb-8">
        <p className="text-[120px] sm:text-[160px] font-black leading-none text-surface-2 select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🎤</span>
        </div>
      </div>

      <h1 className="text-2xl font-black text-text-primary mb-3">
        This page isn&apos;t on the setlist.
      </h1>
      <p className="text-text-muted text-sm max-w-xs mb-10">
        The page you&apos;re looking for doesn&apos;t exist, has moved, or was never booked.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="bg-gold-gradient text-background font-bold text-sm px-6 py-3 rounded-lg hover:brightness-110 transition-all"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="border border-border text-text-muted font-semibold text-sm px-6 py-3 rounded-lg hover:text-text-primary hover:border-brand/40 transition-all"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
