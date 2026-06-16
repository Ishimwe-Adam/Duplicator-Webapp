import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  getGetCurrentUserQueryKey,
} from "@/lib/api-stub";
import type { AuthUser } from "@/lib/api-stub";
import { AuthContext, type AuthContextValue } from "./auth";

type CurrentUserResult = AuthUser | { user: AuthUser } | null | undefined;

function getAuthUser(data: CurrentUserResult): AuthUser | null {
  if (!data) return null;
  return "user" in data ? data.user : data;
}

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
  const currentUser = getAuthUser(meQuery.data as CurrentUserResult);

  const value: AuthContextValue = {
    user: currentUser,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!currentUser,
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
