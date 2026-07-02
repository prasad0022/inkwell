import apiClient from "../axios";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/api/auth/register", input);
    return data.data;
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/api/auth/login", input);
    return data.data;
  },

  me: async () => {
    const { data } = await apiClient.get("/api/auth/me");
    return data.data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  },
};
