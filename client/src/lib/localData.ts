import { quizQuestions as defaultQuizQuestions, quizResults as defaultQuizResults } from "./quizData";

const QUESTIONS_KEY = "urbanwood_quiz_questions";
const RESULTS_KEY = "urbanwood_quiz_results";

/** 取得題目（優先 localStorage，否則用預設） */
export function getStoredQuizQuestions() {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (!raw) return defaultQuizQuestions;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading questions:", e);
    return defaultQuizQuestions;
  }
}

/** 儲存題目 */
export function saveQuizQuestions(questions: any[]) {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error("Error saving questions:", e);
  }
}

/** 重設為預設題目 */
export function resetQuizQuestionsToDefault() {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(defaultQuizQuestions));
    return defaultQuizQuestions;
  } catch (e) {
    console.error("Error resetting questions:", e);
    return defaultQuizQuestions;
  }
}

/** 取得結果（優先 localStorage） */
export function getStoredQuizResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (!raw) return defaultQuizResults;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading results:", e);
    return defaultQuizResults;
  }
}

/** 儲存結果 */
export function saveQuizResults(results: any) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.error("Error saving results:", e);
  }
}

/** 重設為預設結果 */
export function resetQuizResultsToDefault() {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(defaultQuizResults));
    return defaultQuizResults;
  } catch (e) {
    console.error("Error resetting results:", e);
    return defaultQuizResults;
  }
}

/** 一鍵清空（debug用） */
export function clearAllQuizStorage() {
  localStorage.removeItem(QUESTIONS_KEY);
  localStorage.removeItem(RESULTS_KEY);
}
