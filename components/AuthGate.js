"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthPage) router.replace("/login");
    if (user && isAuthPage) router.replace("/");
  }, [loading, user, isAuthPage, router]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tomato.png"
          alt=""
          aria-hidden
          className="h-20 w-20 animate-tomato-breathe drop-shadow-[0_0_24px_rgba(192,57,43,0.35)]"
        />
        <div className="flex items-center gap-2.5 text-sm text-ink-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
          Učitavanje…
        </div>
      </div>
    );
  }

  if ((!user && !isAuthPage) || (user && isAuthPage)) {
    return null;
  }

  return children;
}
