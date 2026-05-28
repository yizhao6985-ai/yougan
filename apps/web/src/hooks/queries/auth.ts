import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { queryKeys } from "@/hooks/queries/keys";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  confirmEmailChange,
  requestEmailChange,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "@/services/auth";
import { authTokenAtom, useAuthToken } from "@/store/auth";
import { activeWorkIdAtom } from "@/store/studio";

export function useMeQuery() {
  const token = useAuthToken();
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchMe,
    enabled: Boolean(token),
    select: (data) => data.user,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setToken = useSetAtom(authTokenAtom);

  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => loginRequest(email, password),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: data.user });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setToken = useSetAtom(authTokenAtom);

  return useMutation({
    mutationFn: (input: { email: string; password: string; name?: string }) =>
      registerRequest(input),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: data.user });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const setToken = useSetAtom(authTokenAtom);
  const setActiveWorkId = useSetAtom(activeWorkIdAtom);

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSettled: () => {
      setToken(null);
      setActiveWorkId(null);
      queryClient.clear();
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useRequestEmailChangeMutation() {
  return useMutation({
    mutationFn: requestEmailChange,
  });
}

export function useConfirmEmailMutation() {
  const queryClient = useQueryClient();
  const setToken = useSetAtom(authTokenAtom);

  return useMutation({
    mutationFn: (token: string) => confirmEmailChange(token),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: data.user });
    },
  });
}
