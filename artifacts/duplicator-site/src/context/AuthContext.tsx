import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  getGetCurrentUserQueryKey,
} from "@/lib/api-stub";
import { AuthContext, type AuthContextValue } from "./auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const meQuery = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  });

  const loginM = useLogin({});
  const registerM = useRegister({});
  const logoutM = useLogout({});

  const value: AuthContextValue = {
    user: meQuery.data?.user ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    login: async (data) => {
      const res = await loginM.mutateAsync(data);
      await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      return res.user;
    },
    register: async (data) => {
      const res = await registerM.mutateAsync(data);
      await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      return res.user;
    },
    logout: async () => {
      await logoutM.mutateAsync();
      qc.setQueryData(getGetCurrentUserQueryKey(), null);
      await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
