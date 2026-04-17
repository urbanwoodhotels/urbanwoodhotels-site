import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addQuestion,
  checkAdmin,
  getConfigRows,
  getStats,
  getSubmissions,
  loginAdmin,
  logoutAdmin,
  removeQuestion,
  saveConfigRow,
  submitQuiz,
} from './localData';

const queryKeys = {
  quizConfig: ['quiz', 'getConfig'] as const,
  adminSubmissions: ['admin', 'getSubmissions'] as const,
  adminStats: ['admin', 'getStats'] as const,
  adminAuthCheck: ['adminAuth', 'check'] as const,
};

function useInvalidate(key: readonly string[]) {
  const queryClient = useQueryClient();
  return {
    invalidate: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  };
}

export const trpc = {
  useUtils() {
    return {
      quiz: {
        getConfig: useInvalidate(queryKeys.quizConfig),
      },
      admin: {
        getSubmissions: useInvalidate(queryKeys.adminSubmissions),
        getStats: useInvalidate(queryKeys.adminStats),
      },
      adminAuth: {
        check: useInvalidate(queryKeys.adminAuthCheck),
      },
    };
  },
  quiz: {
    getConfig: {
      useQuery() {
        return useQuery({ queryKey: queryKeys.quizConfig, queryFn: async () => getConfigRows(), initialData: [] });
      },
    },
    submit: {
      useMutation(options?: { onSuccess?: (data: { success: true }) => void; onError?: (err: Error) => void }) {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: async (input: Parameters<typeof submitQuiz>[0]) => submitQuiz(input),
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminSubmissions });
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
            options?.onSuccess?.(data);
          },
          onError: (err) => options?.onError?.(err as Error),
        });
      },
    },
  },
  adminAuth: {
    login: {
      useMutation(options?: { onSuccess?: (data: { success: true; token: string }) => void; onError?: (err: Error) => void }) {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: async ({ password }: { password: string }) => loginAdmin(password),
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminAuthCheck });
            options?.onSuccess?.(data);
          },
          onError: (err) => options?.onError?.(err as Error),
        });
      },
    },
    logout: {
      useMutation(options?: { onSuccess?: (data: { success: true }) => void; onError?: (err: Error) => void }) {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: async () => logoutAdmin(),
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.adminAuthCheck });
            options?.onSuccess?.(data);
          },
          onError: (err) => options?.onError?.(err as Error),
        });
      },
    },
    check: {
      useQuery() {
        return useQuery({ queryKey: queryKeys.adminAuthCheck, queryFn: async () => checkAdmin(), initialData: { isAdmin: false } });
      },
    },
  },
  admin: {
    getSubmissions: {
      useQuery() {
        return useQuery({ queryKey: queryKeys.adminSubmissions, queryFn: async () => getSubmissions(), initialData: [] });
      },
    },
    getStats: {
      useQuery() {
        return useQuery({ queryKey: queryKeys.adminStats, queryFn: async () => getStats(), initialData: { total: 0, byResult: { A: 0, B: 0, C: 0 }, byPlatform: { instagram: 0, facebook: 0 } } });
      },
    },
    setConfig: {
      useMutation(options?: { onSuccess?: (data: { success: true }) => void; onError?: (err: Error) => void }) {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: async ({ key, value }: { key: string; value: string }) => saveConfigRow(key, value),
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.quizConfig });
            options?.onSuccess?.(data);
          },
          onError: (err) => options?.onError?.(err as Error),
        });
      },
    },
    addQuestion: {
      useMutation(options?: { onSuccess?: (data: { success: true; id: number }) => void; onError?: (err: Error) => void }) {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: async (input: Parameters<typeof addQuestion>[0]) => addQuestion(input),
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.quizConfig });
            options?.onSuccess?.(data);
          },
          onError: (err) => options?.onError?.(err as Error),
        });
      },
    },
    removeQuestion: {
      useMutation(options?: { onSuccess?: (data: { success: true }) => void; onError?: (err: Error) => void }) {
        const queryClient = useQueryClient();
        return useMutation({
          mutationFn: async ({ id }: { id: number }) => removeQuestion(id),
          onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.quizConfig });
            options?.onSuccess?.(data);
          },
          onError: (err) => options?.onError?.(err as Error),
        });
      },
    },
  },
};
