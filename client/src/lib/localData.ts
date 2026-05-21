import { supabase } from './supabase';
import type { AnswerType, Chapter, SensoryType, QuestionType } from './quizData';
import { chapters as defaultChapters } from './quizData';

export type ConfigRow = { configKey: string; configValue: string };
export type Submission = {
  id: number;
  platform: 'instagram' | 'facebook';
  socialHandle: string;
  name: string;
  phone?: string;
  email: string;
  resultType: AnswerType;
  resultName: string;
  marketingConsent: number;
  openEndAnswers?: string | null;
  createdAt: string;
};

const STORAGE_KEYS = {
  config: 'urbanwood_quiz_config',
  submissions: 'urbanwood_quiz_submissions',
  adminSession: 'urbanwood_admin_logged_in',
  adminPassword: 'urbanwood_admin_password',
} as const;

const DEFAULT_ADMIN_PASSWORD = 'urbanwood2026';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getConfigRows(): ConfigRow[] {
  return readJson<ConfigRow[]>(STORAGE_KEYS.config, []);
}

export function saveConfigRow(key: string, value: string) {
  const rows = getConfigRows();
  const idx = rows.findIndex((r) => r.configKey === key);
  if (idx >= 0) rows[idx] = { configKey: key, configValue: value };
  else rows.push({ configKey: key, configValue: value });
  writeJson(STORAGE_KEYS.config, rows);
  return { success: true as const };
}

export async function getSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    platform: r.platform,
    socialHandle: r.social_handle,
    name: r.name,
    phone: r.phone,
    email: r.email,
    resultType: r.result_type,
    resultName: r.result_name,
    marketingConsent: r.marketing_consent ? 1 : 0,
    openEndAnswers: r.open_end_answers
      ? JSON.stringify(r.open_end_answers)
      : null,
    createdAt: r.created_at,
  }));
}

export async function submitQuiz(
  input: Omit<Submission, 'id' | 'createdAt' | 'marketingConsent' | 'openEndAnswers'> & {
    marketingConsent?: boolean;
    openEndAnswers?: Record<string, string>;
  }
) {
  const { error } = await supabase.from('submissions').insert([
    {
      platform: input.platform,
      social_handle: input.socialHandle,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email,
      result_type: input.resultType,
      result_name: input.resultName,
      marketing_consent: input.marketingConsent ?? false,
      open_end_answers: input.openEndAnswers ?? null,
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error('提交失敗');
  }

  return { success: true as const };
} 

export async function getStats() {
  const rows = await getSubmissions();

  const total = rows.length;
  const byResult: Record<AnswerType, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };
  const byPlatform = {
    instagram: 0,
    facebook: 0,
  };

  rows.forEach((r: Submission) => {
    byResult[r.resultType] += 1;
    byPlatform[r.platform] += 1;
  });

  return {
    total,
    byResult,
    byPlatform,
  };
}

export function loginAdmin(password: string) {
  const savedPassword = window.localStorage.getItem(STORAGE_KEYS.adminPassword) || DEFAULT_ADMIN_PASSWORD;
  if (password !== savedPassword) {
    throw new Error('密碼錯誤');
  }
  window.localStorage.setItem(STORAGE_KEYS.adminSession, 'true');
  window.localStorage.setItem('admin_token', 'local-admin');
  return { success: true as const, token: 'local-admin' };
}

export function logoutAdmin() {
  window.localStorage.removeItem(STORAGE_KEYS.adminSession);
  window.localStorage.removeItem('admin_token');
  return { success: true as const };
}

export function checkAdmin() {
  return { isAdmin: window.localStorage.getItem(STORAGE_KEYS.adminSession) === 'true' };
}

export function addQuestion(input: {
  chapterId: number;
  text: string;
  questionType: QuestionType;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  F?: string;
  sensoryType?: SensoryType;
}) {
  const rows = getConfigRows();
  const extraKeys = rows.filter((r) => r.configKey.startsWith('question_extra_'));
  const nextId = 100 + extraKeys.length + 1;

  rows.push({
    configKey: `question_extra_${nextId}`,
    configValue: JSON.stringify({
      id: nextId,
      chapterId: input.chapterId,
      text: input.text,
      questionType: input.questionType,
      A: input.A ?? '',
      B: input.B ?? '',
      C: input.C ?? '',
      D: input.D ?? '',
      E: input.E ?? '',
      F: input.F ?? '',
      sensoryType: input.sensoryType ?? '視覺',
    }),
  });

  writeJson(STORAGE_KEYS.config, rows);
  return { success: true as const, id: nextId };
}

export function removeQuestion(id: number) {
  if (id < 100) throw new Error('原有題目不能刪除，只能編輯');
  const rows = getConfigRows().filter((r) => r.configKey !== `question_extra_${id}`);
  writeJson(STORAGE_KEYS.config, rows);
  return { success: true as const };
}

export function getMergedChaptersPreview(): Chapter[] {
  const rows = getConfigRows();

  return defaultChapters
    .map((chapter) => ({
      ...chapter,
      questions: [...chapter.questions],
    }))
    .map((chapter) => {
      const extras = rows
        .filter((r) => r.configKey.startsWith('question_extra_'))
        .map((r) => {
          try {
            return JSON.parse(r.configValue);
          } catch {
            return null;
          }
        })
        .filter(
          (
            q
          ): q is {
            id: number;
            chapterId: number;
            text: string;
            questionType?: QuestionType;
            A?: string;
            B?: string;
            C?: string;
            D?: string;
            E?: string;
            F?: string;
            sensoryType?: SensoryType;
          } => !!q && q.chapterId === chapter.id
        )
        .map((q) => ({
          id: q.id,
          text: q.text,
          questionType: q.questionType ?? 'multiple-choice',
          sensoryType: q.sensoryType ?? '視覺',
          options: {
            A: q.A ?? '',
            B: q.B ?? '',
            C: q.C ?? '',
            D: q.D ?? '',
            E: q.E ?? '',
            F: q.F ?? '',
          },
        }));

      return { ...chapter, questions: [...chapter.questions, ...extras] };
    });
}
