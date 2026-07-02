import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, LoginInput, RegisterInput } from "@/lib/api/auth.api";
import { useRouter } from "next/navigation";

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
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
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
      router.push("/dashboard");
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.clear();
    authApi.logout();
  };
};
