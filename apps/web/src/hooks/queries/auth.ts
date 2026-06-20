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
  loginWithSms as loginWithSmsRequest,
  logout as logoutRequest,
  register as registerRequest,
  sendSmsCode as sendSmsCodeRequest,
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
      login,
      password,
    }: {
      login: string;
      password: string;
    }) => loginRequest(login, password),
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
    mutationFn: (input: { login: string; password: string; name?: string }) =>
      registerRequest(input),
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: data.user });
    },
  });
}

export function useSendSmsCodeMutation() {
  return useMutation({
    mutationFn: (phone: string) => sendSmsCodeRequest(phone),
  });
}

export function useSmsLoginMutation() {
  const queryClient = useQueryClient();
  const setToken = useSetAtom(authTokenAtom);

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      loginWithSmsRequest(phone, code),
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
    mutationFn: (login: string) => requestPasswordReset(login),
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

export function useConfirmEmailQuery(token: string) {
  const queryClient = useQueryClient();
  const setToken = useSetAtom(authTokenAtom);

  return useQuery({
    queryKey: queryKeys.auth.confirmEmail(token),
    queryFn: async () => {
      const data = await confirmEmailChange(token);
      setToken(data.token);
      queryClient.setQueryData(queryKeys.auth.me, { user: data.user });
      return data;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
