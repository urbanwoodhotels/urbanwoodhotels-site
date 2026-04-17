import type { AnswerType, Chapter } from './quizData';
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
    return raw ? JSON.parse(raw) as T : fallback;
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

export function getSubmissions(): Submission[] {
  return readJson<Submission[]>(STORAGE_KEYS.submissions, []).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function submitQuiz(input: Omit<Submission, 'id' | 'createdAt' | 'marketingConsent'> & { marketingConsent?: boolean; openEndAnswers?: Record<string, string> }) {
  const submissions = getSubmissions();
  const item: Submission = {
    id: submissions.length ? Math.max(...submissions.map((s) => s.id)) + 1 : 1,
    platform: input.platform,
    socialHandle: input.socialHandle,
    name: input.name,
    phone: input.phone,
    email: input.email,
    resultType: input.resultType,
    resultName: input.resultName,
    marketingConsent: input.marketingConsent ? 1 : 0,
    openEndAnswers: input.openEndAnswers ? JSON.stringify(input.openEndAnswers) : null,
    createdAt: new Date().toISOString(),
  };
  submissions.unshift(item);
  writeJson(STORAGE_KEYS.submissions, submissions);
  return { success: true as const };
}

export function getStats() {
  const rows = getSubmissions();
  const total = rows.length;
  const byResult = { A: 0, B: 0, C: 0 };
  const byPlatform = { instagram: 0, facebook: 0 };
  rows.forEach((r) => {
    byResult[r.resultType] += 1;
    byPlatform[r.platform] += 1;
  });
  return { total, byResult, byPlatform };
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
  questionType: 'multiple-choice' | 'open-end';
  A?: string;
  B?: string;
  C?: string;
  sensoryType?: '視覺' | '聽覺' | '嗅覺' | '觸覺';
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
  return defaultChapters.map((chapter) => ({
    ...chapter,
    questions: [...chapter.questions],
  })).map((chapter) => {
    const extras = rows
      .filter((r) => r.configKey.startsWith('question_extra_'))
      .map((r) => {
        try { return JSON.parse(r.configValue); } catch { return null; }
      })
      .filter((q): q is { id: number; chapterId: number; text: string; questionType?: 'multiple-choice' | 'open-end'; A?: string; B?: string; C?: string; sensoryType?: '視覺' | '聽覺' | '嗅覺' | '觸覺' } => !!q && q.chapterId === chapter.id)
      .map((q) => ({
        id: q.id,
        text: q.text,
        questionType: q.questionType ?? 'multiple-choice',
        sensoryType: q.sensoryType ?? '視覺',
        options: {
          A: q.A ?? '',
          B: q.B ?? '',
          C: q.C ?? '',
        },
      }));
    return { ...chapter, questions: [...chapter.questions, ...extras] };
  });
}
