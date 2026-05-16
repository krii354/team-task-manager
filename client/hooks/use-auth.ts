"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, getErrorMessage } from "@/lib/api";
import { tokenStorage } from "@/lib/storage";
import { useAuthStore } from "@/store/auth.store";
import type { AuthResponse, User } from "@/lib/types";

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiPost<AuthResponse>("/auth/login", payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      qc.invalidateQueries();
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]} 👋`);
      router.push("/dashboard");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Login failed")),
  });
}

export function useSignup() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      apiPost<AuthResponse>("/auth/signup", payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      qc.invalidateQueries();
      toast.success("Account created successfully");
      router.push("/dashboard");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Signup failed")),
  });
}

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<null>("/auth/logout"),
    onSettled: () => {
      clear();
      qc.clear();
      toast.success("Logged out");
      router.push("/login");
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (payload: { name?: string; bio?: string; avatar?: string }) => {
      await apiPut<User>("/users/profile", payload);
      const me = await apiGet<User>("/users/me");
      setUser(me);
      return me;
    },
    onSuccess: () => toast.success("Profile updated"),
    onError: (err) => toast.error(getErrorMessage(err, "Profile update failed")),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiPost<null>("/users/change-password", payload),
    onSuccess: () => toast.success("Password changed. Please log in again."),
    onError: (err) => toast.error(getErrorMessage(err, "Password change failed")),
  });
}
