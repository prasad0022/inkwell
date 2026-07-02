"use client";

import { useState, SubmitEvent } from "react";
import Link from "next/link";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AxiosError } from "axios";
import type { ApiError } from "@/types/api";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { mutate: login, isPending } = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }

    login(
      { email: form.email, password: form.password },
      {
        onError: (error) => {
          const err = error as AxiosError<ApiError>;
          toast.error(err.response?.data?.message || "Login failed");
        },
      },
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to your Inkwell account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="prasad@example.com"
            value={form.email}
            onChange={handleChange}
            disabled={isPending}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            disabled={isPending}
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account ?{" "}
        <Link
          href="/register"
          className="text-gray-900 font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
