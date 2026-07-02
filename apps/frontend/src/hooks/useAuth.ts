import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, LoginInput, RegisterInput } from "@/lib/api/auth.api";
import { useRouter } from "next/navigation";

// Helper to set cookie
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    retry: false,
    enabled:
      typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  });
};

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      // Storing in both localStorage (for axios) and cookie (for middleware)
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setCookie("accessToken", data.accessToken, 1); // 1 day cookie
      queryClient.setQueryData(["me"], data.user);
      router.push("/dashboard");
    },
  });
};

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setCookie("accessToken", data.accessToken, 1);
      router.push("/dashboard");
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    deleteCookie("accessToken");
    queryClient.clear();
    window.location.href = "/login";
  };
};
