import { chapters as defaultQuizQuestions, results as defaultQuizResults } from "./quizData";

const QUESTIONS_KEY = "urbanwood_quiz_questions";
const RESULTS_KEY = "urbanwood_quiz_results";

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

export function saveQuizQuestions(questions: any) {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error("Error saving questions:", e);
  }
}

export function resetQuizQuestionsToDefault() {
  try {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(defaultQuizQuestions));
    return defaultQuizQuestions;
  } catch (e) {
    console.error("Error resetting questions:", e);
    return defaultQuizQuestions;
  }
}

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

export function saveQuizResults(results: any) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.error("Error saving results:", e);
  }
}

export function resetQuizResultsToDefault() {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(defaultQuizResults));
    return defaultQuizResults;
  } catch (e) {
    console.error("Error resetting results:", e);
    return defaultQuizResults;
  }
}

export function clearAllQuizStorage() {
  localStorage.removeItem(QUESTIONS_KEY);
  localStorage.removeItem(RESULTS_KEY);
}
