import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { AuthContext, type AuthContextValue } from "./auth";

const REQ = { credentials: "include" as const };

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const meQuery = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      queryKey: getGetCurrentUserQueryKey(),
    },
    request: REQ,
  });

  const loginM = useLogin({ request: REQ });
  const registerM = useRegister({ request: REQ });
  const logoutM = useLogout({ request: REQ });

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    login: async (data) => {
      const res = await loginM.mutateAsync({ data });
      await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      return res.user;
    },
    register: async (data) => {
      const res = await registerM.mutateAsync({ data });
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
