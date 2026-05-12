/*
 * DESIGN: 復古航空 × 登機證美學
 * Full-screen immersive quiz experience
 * Screens: Landing → Chapter Intro → Questions → Result (Boarding Pass)
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { chapters as staticChapters, results, calculateResult, type AnswerType, type Chapter } from '@/lib/quizData';
import { chapterCopyEn, landingCopy, optionsEn, questionTextEn, resultCopyEn, sensoryLabel, uiCopyEn, type Lang } from '@/lib/i18n';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

// ─── Apply admin config overrides to static data ─────────────────────────────
function extractColors(configRows: { configKey: string; configValue: string }[]) {
  const configMap = Object.fromEntries(configRows.map((r) => [r.configKey, r.configValue]));
  return {
    overlayColor: configMap['color_overlay'] ?? 'rgba(13,27,46,0.65)',
    questionCardBg: configMap['color_question_card'] ?? 'rgba(13,27,46,0.75)',
  };
}

function applyConfig(configRows: { configKey: string; configValue: string }[]): Chapter[] {
  if (!configRows.length) return staticChapters;
  const configMap = Object.fromEntries(configRows.map((r) => [r.configKey, r.configValue]));

  const extraByChapter: Record<number, import('@/lib/quizData').Question[]> = {};
  configRows.forEach((row) => {
    if (row.configKey.startsWith('question_extra_')) {
      try {
        const parsed = JSON.parse(row.configValue) as {
          id: number;
          chapterId: number;
          text: string;
          A: string;
          B: string;
          C: string;
          D?: string;
          E?: string;
          F?: string;
          sensoryType: '視覺' | '聽覺' | '嗅覺' | '觸覺';
        };

        const q: import('@/lib/quizData').Question = {
          id: parsed.id,
          text: parsed.text,
          sensoryType: parsed.sensoryType,
          options: {
            A: parsed.A,
            B: parsed.B,
            C: parsed.C,
            D: parsed.D ?? '',
            E: parsed.E ?? '',
            F: parsed.F ?? '',
          },
        };

        if (!extraByChapter[parsed.chapterId]) extraByChapter[parsed.chapterId] = [];
        extraByChapter[parsed.chapterId].push(q);
      } catch {
        // skip malformed
      }
    }
  });

  return staticChapters.map((chapter) => {
    const bgKey = `chapter_${chapter.id}_bg`;
    const updatedBg = configMap[bgKey] ?? chapter.bgImage;

    const updatedQuestions = chapter.questions.map((q) => {
      const qKey = `question_${q.id}`;
      if (configMap[qKey]) {
        try {
          const parsed = JSON.parse(configMap[qKey]) as {
            text: string;
            A: string;
            B: string;
            C: string;
            D?: string;
            E?: string;
            F?: string;
          };

          return {
            ...q,
            text: parsed.text,
            options: {
              A: parsed.A,
              B: parsed.B,
              C: parsed.C,
              D: parsed.D ?? q.options.D ?? '',
              E: parsed.E ?? q.options.E ?? '',
              F: parsed.F ?? q.options.F ?? '',
            },
          };
        } catch {
          return q;
        }
      }
      return q;
    });

    const extras = extraByChapter[chapter.id] ?? [];
    return { ...chapter, bgImage: updatedBg, questions: [...updatedQuestions, ...extras] };
  });
}

type Screen = 'language' | 'landing' | 'chapter-intro' | 'question' | 'giveaway-form' | 'result';

const HERO_BG =
  'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634;

// ─── Geometric Art Deco Corner Decoration ────────────────────────────────────
function DecoCorners() {
  return (
    <>
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-[#D4A843]/50 pointer-events-none" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-[#D4A843]/50 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-[#D4A843]/50 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-[#D4A843]/50 pointer-events-none" />
    </>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({
  current,
  total,
  lang,
}: {
  current: number;
  total: number;
  lang: 'zh' | 'en';
}) {
  const remaining = total - current;

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between text-[11px] text-white/70 mb-1 font-['DM_Sans']">
        <span>
          {lang === 'en'
            ? `Question ${current} / ${total}`
            : `第 ${current} 題 / 共 ${total} 題`}
        </span>

        <span>
          {remaining > 0
            ? lang === 'en'
              ? `${remaining} left`
              : `尚餘 ${remaining} 題`
            : lang === 'en'
            ? 'Final question'
            : '最後一題'}
        </span>
      </div>

      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#D4A843] transition-all duration-500"
          style={{
            width: `${(current / total) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
// ─── Language Screen ─────────────────────────────────────────────────────────
function LanguageScreen({
  onSelect,
  heroBg,
}: {
  onSelect: (lang: Lang) => void;
  heroBg: string;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2E]/45 via-[#0D1B2E]/35 to-[#0D1B2E]/65" />
      <DecoCorners />

      <motion.div
        className="relative z-10 text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p className="text-[#D4A843] text-xs tracking-[0.3em] uppercase mb-4 font-['DM_Sans']">
          Urbanwood Hotel · Hung Hom
        </p>

        <h1
          className="text-4xl font-bold text-white mb-3 leading-tight"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          城木漫遊之旅
        </h1>

        <p
          className="text-white/70 text-sm mb-8 leading-relaxed"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
        >
          請先選擇語言<br />
          Please select your language
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onSelect('zh')}
            className="w-full py-3.5 rounded-sm text-sm tracking-[0.2em] font-semibold"
            style={{
              background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
              color: '#0D1B2E',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            中文
          </button>

          <button
            onClick={() => onSelect('en')}
            className="w-full py-3.5 rounded-sm text-sm tracking-[0.2em] font-semibold border"
            style={{
              borderColor: 'rgba(212,168,67,0.7)',
              color: '#D4A843',
              background: 'rgba(13,27,46,0.55)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            English
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────
function LandingScreen({
  onStart,
  heroBg,
  configRows,
  lang,
}: {
  onStart: () => void;
  heroBg: string;
  configRows?: { configKey: string; configValue: string }[];
  lang: Lang;
}) {
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const btnStart = lang === 'en' ? landingCopy.startEn : cfg['btn_start'] ?? landingCopy.startZh;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2E]/60 via-[#0D1B2E]/50 to-[#0D1B2E]/80" />

      <DecoCorners />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px w-12 bg-[#D4A843]/60" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">
            Urbanwood Hotel · Hung Hom
          </span>
          <div className="h-px w-12 bg-[#D4A843]/60" />
        </div>

        <motion.div
          className="mb-6 w-20 h-20 rounded-full border-2 border-[#D4A843] flex flex-col items-center justify-center"
          style={{ background: 'oklch(0.72 0.12 75 / 0.15)' }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 200 }}
        >
          <span className="text-[#D4A843] text-2xl font-bold font-['Playfair_Display'] leading-none">2</span>
          <span className="text-[#D4A843] text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase">{lang === 'en' ? landingCopy.anniversaryEn : landingCopy.anniversaryZh}</span>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white mb-3 leading-tight"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          {lang === 'en' ? landingCopy.titleEnLine1 : landingCopy.titleZhLine1}
          <br />
          <span className="text-[#D4A843]">{lang === 'en' ? landingCopy.titleEnHighlight : landingCopy.titleZhHighlight}</span>{lang === 'en' ? landingCopy.titleEnSuffix : landingCopy.titleZhSuffix}
        </motion.h1>

        <motion.p
          className="text-white/70 text-sm md:text-base mb-2 max-w-sm leading-relaxed"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {lang === 'en' ? landingCopy.subtitleEn : landingCopy.subtitleZh}
        </motion.p>

        <motion.p
          className="text-white/50 text-xs md:text-sm mb-10 max-w-sm leading-relaxed"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {lang === 'en' ? landingCopy.descriptionEnLine1 : landingCopy.descriptionZhLine1}
          <br />
          {lang === 'en' ? landingCopy.descriptionEnLine2 : landingCopy.descriptionZhLine2}
        </motion.p>

        <motion.button
          onClick={onStart}
          className="relative group px-10 py-4 text-[#0D1B2E] font-semibold text-sm tracking-[0.2em] uppercase overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
            fontFamily: "'DM Sans', sans-serif",
            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {btnStart}
          <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
        </motion.button>

        <motion.div
          className="mt-10 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#D4A843]/40" />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Chapter Intro Screen ────────────────────────────────────────────────────
function ChapterIntroScreen({
  chapterIndex,
  onContinue,
  chapters,
  overlayColor,
}: {
  chapterIndex: number;
  onContinue: () => void;
  chapters: Chapter[];
  overlayColor?: string;
}) {
  const overlay = overlayColor ?? 'rgba(13,27,46,0.65)';
  const chapter = chapters[chapterIndex];

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${chapter.bgImage})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${overlay.replace(')', ', 0.7)').replace('rgba', 'rgba')}, ${overlay}, ${overlay
            .replace(')', ', 0.9)')
            .replace('rgba', 'rgba')})`,
        }}
      />
      <DecoCorners />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px w-8 bg-[#D4A843]/60" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">{chapter.title}</span>
          <div className="h-px w-8 bg-[#D4A843]/60" />
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: "'Noto Serif TC', serif" }}>
          {chapter.subtitle}
        </h2>

        <p className="text-[#D4A843]/80 text-sm tracking-widest mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          ✦ {chapter.scene} ✦
        </p>

        <button
          onClick={onContinue}
          className="px-8 py-3 border border-[#D4A843]/60 text-[#D4A843] text-sm tracking-[0.2em] uppercase hover:bg-[#D4A843]/10 transition-all duration-300"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          進入場景 →
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Question Screen ─────────────────────────────────────────────────────────
function QuestionScreen({
  questionIndex,
  selectedAnswer,
  openEndAnswer,
  onAnswer,
  onOpenEndAnswer,
  onNext,
  onBack,
  chapters,
  allQuestions,
  totalQuestions,
  overlayColor,
  questionCardBg,
  configRows,
  lang,
}: {
  questionIndex: number;
  selectedAnswer: AnswerType | null;
  openEndAnswer?: string;
  onAnswer: (a: AnswerType) => void;
  onOpenEndAnswer?: (text: string) => void;
  onNext: (directAnswer?: AnswerType) => void;
  onBack: () => void;
  chapters: Chapter[];
  allQuestions: import('@/lib/quizData').Question[];
  totalQuestions: number;
  overlayColor?: string;
  questionCardBg?: string;
  configRows?: { configKey: string; configValue: string }[];
  lang: Lang;
}) {
  const overlay = overlayColor ?? 'rgba(13,27,46,0.48)';
  const cardBg = questionCardBg ?? 'rgba(13,27,46,0.72)';
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const btnNext = cfg['btn_next'] ?? '下一題 →';
  const btnLastQuestion = cfg['btn_last_question'] ?? '查看結果 ✶';
  const question = allQuestions[questionIndex];
  const currentChapter = chapters.find((c) => c.questions.some((q) => q.id === question.id))!;
  const displayQuestionText = lang === 'en' ? questionTextEn[question.id] ?? question.text : question.text;
  const displayChapterSubtitle = lang === 'en' ? chapterCopyEn[currentChapter.id]?.subtitle ?? currentChapter.subtitle : currentChapter.subtitle;
  const displaySensoryType = lang === 'en' ? sensoryLabel[question.sensoryType] ?? question.sensoryType : question.sensoryType;

  const sensoryColors: Record<string, string> = {
    視覺: '#E8654A',
    聽覺: '#3ECFCF',
    嗅覺: '#7A9E8E',
    觸覺: '#D4A843',
  };

  const shuffledAnswers = useMemo(() => {
    if (question.questionType === 'open-end') return [] as [AnswerType, string][];
    const entries = Object.entries(question.options) as [AnswerType, string][];
    return shuffleArray(entries.filter(([, text]) => String(text ?? '').trim() !== ''));
  }, [questionIndex, question.questionType, question.options]);

  return (
    <motion.div
      key={questionIndex}
      className="relative min-h-screen flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentChapter.bgImage})` }}
      />
      <div
        className="absolute inset-0 backdrop-blur-[1px]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(13,27,46,0.38), rgba(13,27,46,0.45), rgba(13,27,46,0.58))',
        }}
      />
      <DecoCorners />

      <div className="relative z-10 px-6 pt-8 pb-4">
        <ProgressBar
          current={questionIndex + 1}
          total={totalQuestions}
          lang={lang}
        />

        {questionIndex > 0 && (
          <button
            onClick={onBack}
            className="mt-3 text-white/70 text-xs tracking-[0.15em] uppercase hover:text-[#D4A843] transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            ← {lang === 'en' ? 'Back' : '上一題'}
          </button>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-sm tracking-widest uppercase"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: sensoryColors[question.sensoryType],
              border: `1px solid ${sensoryColors[question.sensoryType]}50`,
              background: `${sensoryColors[question.sensoryType]}15`,
            }}
          >
            {displaySensoryType}
          </span>
          <span className="text-white/40 text-xs font-['DM_Sans']">
            {currentChapter.title} · {displayChapterSubtitle}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-8 max-w-2xl mx-auto w-full">
        <motion.h2
          className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {displayQuestionText}
        </motion.h2>

        {question.questionType === 'open-end' ? (
          <div className="space-y-3">
            <textarea
              value={openEndAnswer ?? ''}
              onChange={(e) => onOpenEndAnswer?.(e.target.value)}
              rows={4}
              placeholder={lang === 'en' ? uiCopyEn.textareaPlaceholder : '請輸入您的回答...'}
              className="w-full px-5 py-4 rounded-sm text-sm leading-relaxed resize-none focus:outline-none"
              style={{
                background: cardBg,
                border: '1px solid rgba(212,168,67,0.3)',
                color: 'rgba(255,255,255,0.85)',
                fontFamily: "'Noto Sans TC', sans-serif",
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {shuffledAnswers.map(([opt, text], i) => (
              <motion.button
                key={`${question.id}-${opt}-${i}`}
                onClick={() => {
                  onAnswer(opt);
                  setTimeout(() => {
                    onNext(opt);
                  }, 180);
                }}
                className={`option-card w-full text-left px-5 py-4 rounded-sm flex items-start gap-4 ${
                  selectedAnswer === opt ? 'selected' : ''
                }`}
                style={{ background: selectedAnswer === opt ? undefined : cardBg }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                whileTap={{ scale: 0.99 }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-sm border flex items-center justify-center text-xs font-bold font-['DM_Sans'] transition-all duration-200"
                  style={{
                    borderColor: selectedAnswer === opt ? '#D4A843' : 'rgba(212,168,67,0.3)',
                    color: selectedAnswer === opt ? '#D4A843' : 'rgba(212,168,67,0.6)',
                    background: selectedAnswer === opt ? 'rgba(212,168,67,0.15)' : 'transparent',
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span
                  className="text-sm md:text-base leading-relaxed"
                  style={{
                    fontFamily: "'Noto Sans TC', sans-serif",
                    color: selectedAnswer === opt ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                  }}
                >
                  {lang === 'en' ? optionsEn[question.id]?.[opt] ?? text : text}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {question.questionType === 'open-end' && (openEndAnswer ?? '').trim().length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => onNext()}
              className="px-8 py-3 text-[#0D1B2E] font-semibold text-sm tracking-[0.15em] uppercase transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
                fontFamily: "'DM Sans', sans-serif",
                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
              }}
            >
              {questionIndex === totalQuestions - 1
                ? lang === 'en'
                  ? uiCopyEn.result
                  : btnLastQuestion
                : lang === 'en'
                ? uiCopyEn.next
                : btnNext}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Giveaway Form Screen ────────────────────────────────────────────────────
function GiveawayFormScreen({
  resultType,
  onComplete,
  configRows,
  openEndAnswers,
  lang,
}: {
  resultType: AnswerType;
  onComplete: () => void;
  configRows?: { configKey: string; configValue: string }[];
  openEndAnswers?: Record<number, string>;
  lang: Lang;
}) {
  const result = results[resultType];
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const introZh =
    cfg['form_intro_zh'] ??
    '感謝您參加本次心理測驗！請根據以下要求提交您的相關資料以作參加抽獎。閣下必須細閱及遵守條款及細則，而閣下的參與及遞交該表格將代表已閱讀及同意各項條款及細則。';
  const introEn =
    cfg['form_intro_en'] ??
    'Thank you for participating in this psychological test! Please provide the relevant information as per the requirements below to register the giveaway. You must carefully read and comply with the Terms and Conditions. Your participation and submission of this form will signify that you have read, understood, and agreed to all the stated terms and conditions.';
  const termsLabel = cfg['form_terms_label'] ?? '條款及細則 Terms and Conditions';
  const termsUrl = cfg['form_terms_url'] ?? 'https://southnesthk.com/south-nest-3rd-anniversary-celebration2026/';
  const consentZh =
    cfg['form_consent_zh'] ??
    '本人願意提供上述個人資料，並同意使用我的電郵地址，用於發送直接促銷訊息，包括產品推廣、折扣活動及相關資訊。本人明白可隨時取消訂閱。';
  const consentEn =
    cfg['form_consent_en'] ??
    'I consent to the collection and use of my contact information for direct marketing purposes, including promotions and news. I understand that I can withdraw my consent at any time.';
  const successMsg =
    cfg['form_success_msg'] ?? '記得分享你的登機證至 IG Story，Tag @urbanwoodhotels ＋ #城木2周年 増加中獎機會！';
  const btnSubmitForm = cfg['btn_submit_form'] ?? '登記抽獎，查看結果';
  const almostThereLabel = cfg['form_almost_there_label'] ?? 'Almost There';
  const travelerTypeLabel = cfg['form_traveler_type_label'] ?? 'Your Traveller Type';
  const successTitleLabel = cfg['form_success_title_label'] ?? '✶ 已成功登記抽獎！';
  const platformFieldLabel =
    cfg['form_platform_field_label'] ?? '1. 從哪個途徑報名參加活動  Which platform did you use to register for the event';
  const socialHandleFieldLabel = cfg['form_social_handle_field_label'] ?? '2. 社交平台用戶名稱 Social Media Username';
  const nameFieldLabel = cfg['form_name_field_label'] ?? '3. 姓名 Name';
  const emailFieldLabel = cfg['form_email_field_label'] ?? '4. 電郵地址 Email Address';

  const [platform, setPlatform] = useState<'instagram' | 'facebook' | ''>('');
  const [socialHandle, setSocialHandle] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.quiz.submit.useMutation({
    onSuccess: () => {
      onComplete();
    },
    onError: (err) => {
      toast.error('提交失敗，請再試一次：' + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) {
      toast.error('請選擇參加平台');
      return;
    }
    if (!socialHandle.trim()) {
      toast.error('請填寫帳戶名稱');
      return;
    }
    if (!name.trim()) {
      toast.error('請填寫姓名');
      return;
    }
    if (!email.trim()) {
      toast.error('請填寫電郵地址');
      return;
    }

    submitMutation.mutate({
      platform,
      socialHandle: socialHandle.trim(),
      name: name.trim(),
      email: email.trim(),
      resultType,
      resultName: result.name,
      marketingConsent,
      openEndAnswers:
        openEndAnswers && Object.keys(openEndAnswers).length > 0
          ? Object.fromEntries(Object.entries(openEndAnswers).map(([k, v]) => [String(k), v]))
          : undefined,
    });
  };

  const inputClass =
    "w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4A843]/50 transition-colors";
  const labelClass = "block text-[#D4A843]/60 text-[10px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']";

  const bgMap: Record<AnswerType, string> = {
    A: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter3-waterfront-iPfdaUQUxczMzsT66zKagV.webp',
    B: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter2-street-6xHx8sb6kevxdCPb3sZazz.webp',
    C: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter4-night-JNRpkyYue4XpnfcaXbRsqz.webp',
    D: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter2-street-6xHx8sb6kevxdCPb3sZazz.webp',
    E: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/chapter4-night-JNRpkyYue4XpnfcaXbRsqz.webp',
    F: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/hero-bg-XS9H5NH3aLyjCXKGtNcwKc.webp',
  };

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-[#0D1B2E]" />
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${bgMap[result.id] ?? bgMap.A})` }} />
      <DecoCorners />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="text-center mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-[#D4A843]/40" />
            <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">{almostThereLabel}</span>
            <div className="h-px flex-1 bg-[#D4A843]/40" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">{result.icon}</span>
            <div>
              <p className="text-[#D4A843]/60 text-[10px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-0.5">{travelerTypeLabel}</p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {lang === 'en' ? result.nameEn : result.name}
              </h2>
            </div>
          </div>
        </div>

        <div
          className="rounded-sm p-6"
          style={{
            background: 'linear-gradient(160deg, oklch(0.18 0.05 240) 0%, oklch(0.14 0.04 240) 100%)',
            border: '1.5px solid rgba(212,168,67,0.35)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎫</div>
              <p className="text-[#D4A843] text-base font-semibold mb-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {successTitleLabel}
              </p>
              <p className="text-white/60 text-xs mb-6" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                {successMsg}
              </p>
              <button
                onClick={onComplete}
                className="w-full py-3 text-[#0D1B2E] font-semibold text-sm tracking-[0.2em] uppercase"
                style={{
                  background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
                  fontFamily: "'DM Sans', sans-serif",
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}
              >
                查看我的登機證 →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className="rounded-sm p-4 mb-2"
                style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}
              >
                <p className="text-white/80 text-xs leading-relaxed mb-3" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  {lang === 'en' ? introEn : introZh}
                </p>
                <p className="text-white/50 text-xs leading-relaxed mb-3" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  {introEn}
                </p>
                <a
                  href={termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4A843] text-xs underline underline-offset-2 hover:text-[#E8C56A] transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {termsLabel} ↗
                </a>
              </div>

              <div>
                <label className={labelClass}>{platformFieldLabel}</label>
                <div className="flex gap-3">
                  {(['instagram', 'facebook'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className="flex-1 py-2.5 text-xs tracking-wider uppercase transition-all rounded-sm"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        border: platform === p ? '1px solid #D4A843' : '1px solid rgba(212,168,67,0.2)',
                        color: platform === p ? '#D4A843' : 'rgba(255,255,255,0.4)',
                        background: platform === p ? 'rgba(212,168,67,0.1)' : 'transparent',
                      }}
                    >
                      {p === 'instagram' ? 'Instagram' : 'Facebook'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{socialHandleFieldLabel}</label>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  placeholder={platform === 'facebook' ? (lang === 'en' ? uiCopyEn.facebookPlaceholder : 'Facebook 帳戶名稱') : uiCopyEn.instagramPlaceholder}
                  className={inputClass}
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                />
              </div>

              <div>
                <label className={labelClass}>{nameFieldLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className={inputClass}
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                />
              </div>

              <div>
                <label className={labelClass}>{emailFieldLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                />
              </div>

              <div
                className="rounded-sm p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded-sm border flex items-center justify-center transition-all"
                      style={{
                        borderColor: marketingConsent ? '#D4A843' : 'rgba(212,168,67,0.3)',
                        background: marketingConsent ? 'rgba(212,168,67,0.2)' : 'transparent',
                      }}
                    >
                      {marketingConsent && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/70 text-[11px] leading-relaxed" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      {lang === 'en' ? consentEn : consentZh}
                    </p>
                    <p className="text-white/40 text-[10px] leading-relaxed mt-1" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      {consentEn}
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full py-3 text-[#0D1B2E] font-semibold text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
                  fontFamily: "'DM Sans', sans-serif",
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}
              >
                {submitMutation.isPending ? (lang === 'en' ? uiCopyEn.submitting : '提交中...') : `✶ ${btnSubmitForm}`}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function ResultScreen({
  resultType,
  onRestart,
  configRows,
  lang,
}: {
  resultType: AnswerType;
  onRestart: () => void;
  configRows?: { configKey: string; configValue: string }[];
  lang: Lang;
}) {
  const baseResult = results[resultType];
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const resultEnCopy = resultCopyEn[resultType];
  const result = {
    ...baseResult,
    name: lang === 'en' ? baseResult.nameEn : cfg[`result_${resultType}_name`] ?? baseResult.name,
    nameEn: cfg[`result_${resultType}_nameEn`] ?? baseResult.nameEn,
    tagline: lang === 'en' ? resultEnCopy.tagline : cfg[`result_${resultType}_tagline`] ?? baseResult.tagline,
    sensoryProfile: lang === 'en' ? resultEnCopy.sensoryProfile : cfg[`result_${resultType}_sensoryProfile`] ?? baseResult.sensoryProfile,
    urbanwoodMatch: lang === 'en' ? resultEnCopy.urbanwoodMatch : cfg[`result_${resultType}_urbanwoodMatch`] ?? baseResult.urbanwoodMatch,
    resultImage: lang === 'en'
      ? cfg[`result_${resultType}_resultImageEn`] ?? baseResult.resultImageEn ?? cfg[`result_${resultType}_resultImage`] ?? baseResult.resultImage ?? ''
      : cfg[`result_${resultType}_resultImage`] ?? baseResult.resultImage ?? '',
  };
  const boardingPassImage = cfg[`result_${resultType}_boardingPassImage`] ?? '';
  const btnShare = cfg['btn_share'] ?? '📤 分享我的登機證';
  const btnSaveBoardingPass = cfg['btn_save_boarding_pass'] ?? '📸 儲存登機證圖片';
  const btnBookHotel = cfg['btn_book_hotel'] ?? '🏨 立即預訂城木紅磡';
  const btnBookHotelUrl = cfg['btn_book_hotel_url'] ?? 'https://urbanwoodhotels.com/hk/global_hotels/hung-hom-hk/';
  const btnRestart = cfg['btn_restart'] ?? '重新測驗';
  const resultShareHint = cfg['result_share_hint'] ?? '分享至 IG Story，Tag @urbanwoodhotels ＋ #城木2周年 即可參加抽獎！';
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveImage = async () => {
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('boarding-pass-card');
      if (!el) {
        setSaving(false);
        return;
      }
      const canvas = await html2canvas(el, {
        backgroundColor: '#0D1B2E',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `urbanwood-boarding-pass-${result.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const text = lang === 'en'
      ? `I am a "${result.name}"! ${result.tagline}\n\nUrbanwood Hotel Hung Hom 2nd Anniversary Sensory Quiz 🎫\n#Urbanwood2ndAnniversary #HungHomTraveller @urbanwoodhotels`
      : `我係「${result.name}」(${result.nameEn})！${result.tagline}\n\n城木酒店紅磡 2 周年感官測驗 🎫\n#城木2周年 #紅磡旅人 @urbanwoodhotels`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const resultBgMap: Record<AnswerType, string> = {
    A: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634,
    B: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634,
    C: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634,
    D: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634,
    E: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634,
    F: 'https://res.cloudinary.com/defqvpbk4/image/upload/v1778554553/urbanwood-quiz/zjwqxyw5jzsu13oe9xeq.jpg?v=1778554553634,
  };

  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resultBgMap[resultType]})` }} />
      <div className="absolute inset-0 bg-[#0D1B2E]/80 backdrop-blur-sm" />
      <DecoCorners />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 100 }}
      >
        <div
          className="mb-4 rounded-sm px-4 py-3 text-center"
          style={{
            background: 'rgba(212,168,67,0.12)',
            border: '1px solid rgba(212,168,67,0.35)',
          }}
        >
          <p
            className="text-[#D4A843] text-sm font-semibold mb-1"
            style={{ fontFamily: "'Noto Serif TC', serif" }}
          >
            {lang === 'en' ? 'Giveaway registration successful!' : '已成功登記抽獎！'}
          </p>
          <p
            className="text-white/60 text-xs leading-relaxed"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {lang === 'en' ? 'Here is your exclusive boarding pass.' : '以下是你的專屬登機證。'}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-[#D4A843]/40" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">{lang === 'en' ? uiCopyEn.boardingPassLabel : 'Boarding Pass · 登機證'}</span>
          <div className="h-px flex-1 bg-[#D4A843]/40" />
        </div>

        <div
          id="boarding-pass-card"
          className="rounded-sm overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, oklch(0.18 0.05 240) 0%, oklch(0.14 0.04 240) 100%)',
            border: '1.5px solid rgba(212,168,67,0.35)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.2)',
          }}
        >
          {boardingPassImage && (
            <div className="w-full">
              <img
                src={boardingPassImage}
                alt="登機證"
                className="w-full h-auto block"
                style={{ display: 'block' }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const defaultContent = target.closest('#boarding-pass-card')?.querySelector('[data-default-content]') as HTMLElement | null;
                  if (defaultContent) defaultContent.style.display = 'block';
                }}
              />
            </div>
          )}

          <div data-default-content style={{ display: boardingPassImage ? 'none' : 'block' }}>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#D4A843]/60 text-[10px] tracking-[0.25em] font-['DM_Sans'] uppercase mb-1">{lang === 'en' ? uiCopyEn.passengerType : 'Passenger Type'}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{result.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                        {result.name}
                      </h2>
                      <p className="text-[#D4A843]/70 text-xs font-['DM_Sans'] italic">{result.nameEn}</p>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center stamp-animate"
                  style={{ borderColor: result.color, background: `${result.color}15` }}
                  initial={{ scale: 0, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5, type: 'spring', stiffness: 300 }}
                >
                  <span className="text-[8px] font-bold tracking-wider font-['DM_Sans'] uppercase" style={{ color: result.color }}>
                    2ND
                  </span>
                  <span className="text-[8px] font-bold tracking-wider font-['DM_Sans'] uppercase" style={{ color: result.color }}>
                    ANNIV
                  </span>
                </motion.div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {result.frequency.split(' · ').map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 tracking-wider font-['DM_Sans'] uppercase rounded-sm"
                    style={{
                      color: result.color,
                      border: `1px solid ${result.color}50`,
                      background: `${result.color}10`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {result.resultImage && (
                <div className="mb-4 rounded-sm overflow-hidden">
                  <img src={result.resultImage} alt={result.name} className="w-full h-32 object-cover" crossOrigin="anonymous" />
                </div>
              )}

              <p
                className="text-white/80 text-sm italic leading-relaxed border-l-2 pl-3"
                style={{
                  fontFamily: "'Noto Serif TC', serif",
                  borderColor: result.color,
                }}
              >
                "{result.tagline}"
              </p>
            </div>

            <div className="relative flex items-center">
              <div className="w-4 h-8 rounded-r-full" style={{ background: 'oklch(0.15 0.04 240)' }} />
              <div className="flex-1 border-t-2 border-dashed border-[#D4A843]/25 mx-1" />
              <div className="w-4 h-8 rounded-l-full" style={{ background: 'oklch(0.15 0.04 240)' }} />
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[#D4A843]/50 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-0.5">From</p>
                  <p className="text-white text-sm font-semibold font-['DM_Sans']">URBANWOOD HH</p>
                </div>
                <div className="text-[#D4A843]/60 text-lg">✈</div>
                <div className="text-right">
                  <p className="text-[#D4A843]/50 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-0.5">Destination</p>
                  <p className="text-white text-xs font-semibold font-['DM_Sans'] leading-tight">{result.boardingPassDestination}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[#D4A843]/50 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-1.5">{lang === 'en' ? uiCopyEn.sensoryProfileLabel : 'Sensory Profile · 感官特質'}</p>
                <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  {result.sensoryProfile}
                </p>
              </div>

              <div
                className="rounded-sm px-3 py-2.5"
                style={{ background: `${result.color}12`, border: `1px solid ${result.color}30` }}
              >
                <p className="text-[#D4A843]/60 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-1">✦ Urbanwood Match</p>
                <p className="text-white/80 text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  {result.urbanwoodMatch}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1 opacity-30">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#D4A843]"
                    style={{
                      width: i % 3 === 0 ? '3px' : '1.5px',
                      height: i % 5 === 0 ? '20px' : '14px',
                    }}
                  />
                ))}
              </div>
              <p className="text-[#D4A843]/30 text-[8px] font-['DM_Sans'] tracking-widest mt-1 text-center">
                URBANWOOD · HUNG HOM · 2ND ANNIVERSARY · 2026
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-3.5 text-[#0D1B2E] font-semibold text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
              fontFamily: "'DM Sans', sans-serif",
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
            }}
          >
            {copied ? (lang === 'en' ? uiCopyEn.copied : '✓ 已複製！') : btnShare}
          </button>

          <button
            onClick={handleSaveImage}
            disabled={saving}
            className="w-full py-3.5 font-semibold text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(212,168,67,0.6)',
              color: '#D4A843',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {saving ? (lang === 'en' ? uiCopyEn.saving : '正在儲存...') : btnSaveBoardingPass}
          </button>

          <div className="text-center">
            <p className="text-white/40 text-xs mb-2" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              {resultShareHint}
            </p>
          </div>

          <a
            href={btnBookHotelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 text-center font-semibold text-sm tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'transparent',
              border: '1.5px solid #D4A843',
              color: '#D4A843',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {btnBookHotel}
          </a>

          <button
            onClick={onRestart}
            className="w-full py-3 border border-white/10 text-white/40 text-sm tracking-[0.15em] uppercase hover:border-white/20 hover:text-white/60 transition-all"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {btnRestart}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState<Screen>('language');
  const [lang, setLang] = useState<Lang>('zh');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerType[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerType | null>(null);
  const [openEndAnswers, setOpenEndAnswers] = useState<Record<number, string>>({});
  const [chapterIndex, setChapterIndex] = useState(0);
  const [resultType, setResultType] = useState<AnswerType | null>(null);

  const { data: configRows } = trpc.quiz.getConfig.useQuery();
  const chapters = useMemo(() => applyConfig(configRows ?? []), [configRows]);
  const allQuestions = useMemo(() => chapters.flatMap((c) => c.questions), [chapters]);
  const totalQuestions = allQuestions.length;

  const heroBg = useMemo(() => {
    const row = configRows?.find((r) => r.configKey === 'hero_bg');
    return row?.configValue ?? HERO_BG;
  }, [configRows]);

  const handleLanguageSelect = useCallback((selectedLang: Lang) => {
    setLang(selectedLang);
    setScreen('landing');
  }, []);

  const handleStart = useCallback(() => {
    setScreen('chapter-intro');
    setChapterIndex(0);
  }, []);

  const handleChapterContinue = useCallback(() => {
    setScreen('question');
  }, []);

  const handleAnswer = useCallback((answer: AnswerType) => {
    setSelectedAnswer(answer);
  }, []);

  const handleNext = useCallback((directAnswer?: AnswerType) => {
    const currentQuestion = allQuestions[questionIndex];
    const isOpenEnd = currentQuestion?.questionType === 'open-end';
    const finalAnswer = directAnswer ?? selectedAnswer;

    if (!isOpenEnd && !finalAnswer) return;
    if (isOpenEnd && !(openEndAnswers[questionIndex] ?? '').trim()) return;

    const answerForScoring: AnswerType = isOpenEnd ? 'A' : finalAnswer!;
    const newAnswers = [...answers, answerForScoring];

    setAnswers(newAnswers);
    setSelectedAnswer(null);

    const nextIndex = questionIndex + 1;

    if (nextIndex >= totalQuestions) {
      const result = calculateResult(newAnswers);
      setResultType(result);
      setScreen('giveaway-form');
      return;
    }

    const currentChapter = chapters[chapterIndex];
    const currentChapterQCount = currentChapter.questions.length;
    const questionsAnsweredInChapter = newAnswers.filter((_, i) => {
      const q = allQuestions[i];
      return currentChapter.questions.some((cq) => cq.id === q.id);
    }).length;

    if (questionsAnsweredInChapter >= currentChapterQCount && chapterIndex < chapters.length - 1) {
      setChapterIndex(chapterIndex + 1);
      setQuestionIndex(nextIndex);
      setScreen('chapter-intro');
    } else {
      setQuestionIndex(nextIndex);
    }
  }, [selectedAnswer, openEndAnswers, answers, questionIndex, chapterIndex, allQuestions, totalQuestions, chapters]);

  const handleBack = useCallback(() => {
    if (questionIndex <= 0) return;

    const previousIndex = questionIndex - 1;
    const previousAnswers = answers.slice(0, -1);

    setAnswers(previousAnswers);
    setQuestionIndex(previousIndex);
    setSelectedAnswer(null);

    const previousQuestion = allQuestions[previousIndex];
    const previousChapterIndex = chapters.findIndex((chapter) =>
      chapter.questions.some((q) => q.id === previousQuestion.id)
    );

    if (previousChapterIndex >= 0) {
      setChapterIndex(previousChapterIndex);
    }

    setScreen('question');
  }, [questionIndex, answers, allQuestions, chapters]);

  const handleRestart = useCallback(() => {
    setScreen('language');
    setQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setOpenEndAnswers({});
    setChapterIndex(0);
    setResultType(null);
  }, []);

  const handleGiveawayComplete = useCallback(() => {
    setScreen('result');
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1B2E]">
      <AnimatePresence mode="wait">
        {screen === 'language' && (
          <motion.div key="language" className="min-h-screen">
            <LanguageScreen onSelect={handleLanguageSelect} heroBg={heroBg} />
          </motion.div>
        )}

        {screen === 'landing' && (
          <motion.div key="landing" className="min-h-screen">
            <LandingScreen onStart={handleStart} heroBg={heroBg} configRows={configRows ?? []} lang={lang} />
          </motion.div>
        )}

        {screen === 'chapter-intro' && (
          <motion.div key={`chapter-intro-${chapterIndex}`} className="min-h-screen">
            <ChapterIntroScreen
              chapterIndex={chapterIndex}
              chapters={chapters}
              onContinue={handleChapterContinue}
              overlayColor="rgba(13,27,46,0.48)"
            />
          </motion.div>
        )}

        {screen === 'question' && (
          <motion.div key={`question-${questionIndex}`} className="min-h-screen">
            <QuestionScreen
              questionIndex={questionIndex}
              selectedAnswer={selectedAnswer}
              openEndAnswer={openEndAnswers[questionIndex]}
              onAnswer={handleAnswer}
              onOpenEndAnswer={(text) => setOpenEndAnswers((prev) => ({ ...prev, [questionIndex]: text }))}
              onNext={handleNext}
              onBack={handleBack}
              chapters={chapters}
              allQuestions={allQuestions}
              totalQuestions={totalQuestions}
              overlayColor="rgba(13,27,46,0.48)"
              questionCardBg="rgba(13,27,46,0.72)"
              configRows={configRows ?? []}
              lang={lang}
            />
          </motion.div>
        )}

        {screen === 'giveaway-form' && resultType && (
          <motion.div key="giveaway-form" className="min-h-screen">
            <GiveawayFormScreen
              resultType={resultType}
              onComplete={handleGiveawayComplete}
              configRows={configRows ?? []}
              openEndAnswers={openEndAnswers}
              lang={lang}
            />
          </motion.div>
        )}

        {screen === 'result' && resultType && (
          <motion.div key="result" className="min-h-screen">
            <ResultScreen
              resultType={resultType}
              onRestart={handleRestart}
              configRows={configRows ?? []}
              lang={lang}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
