"use client";

import { useState, useEffect } from "react";
import { useMe, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { data: user, isLoading } = useMe();
  const logout = useLogout();

  useEffect(() => {
    const handle = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(handle);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🖊️ Inkwell</h1>
              <div className="h-4 w-32 bg-gray-200 rounded mt-1 animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="space-y-3">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🖊️ Inkwell</h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, {user?.name}
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">
            Dashboard coming soon — Issue 22
          </p>
        </div>
      </div>
    </div>
  );
}
