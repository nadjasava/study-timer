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
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-ink-muted">Učitavanje…</p>
      </div>
    );
  }

  if ((!user && !isAuthPage) || (user && isAuthPage)) {
    return null;
  }

  return children;
}
