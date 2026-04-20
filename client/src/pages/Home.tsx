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

// ─── Apply admin config overrides to static data ─────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}
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

  // Parse extra questions added via admin
  const extraQuestions: import('@/lib/quizData').Question[] = [];
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
        extraQuestions.push(q);
      } catch { /* skip malformed */ }
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
    // Append extra questions for this chapter
    const extras = extraByChapter[chapter.id] ?? [];
    return { ...chapter, bgImage: updatedBg, questions: [...updatedQuestions, ...extras] };
  });
}

type Screen = 'landing' | 'chapter-intro' | 'question' | 'giveaway-form' | 'result';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/hero-bg-XS9H5NH3aLyjCXKGtNcwKc.webp';

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
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[#D4A843]/70 text-xs tracking-[0.15em] font-['DM_Sans']">
          QUESTION {current} / {total}
        </span>
        <span className="text-[#D4A843]/70 text-xs tracking-[0.15em] font-['DM_Sans']">{pct}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #D4A843, #E8654A)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────
function LandingScreen({ onStart, heroBg, configRows }: { onStart: () => void; heroBg: string; configRows?: { configKey: string; configValue: string }[] }) {
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const btnStart = cfg['btn_start'] ?? '開始測驗';
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2E]/60 via-[#0D1B2E]/50 to-[#0D1B2E]/80" />

      <DecoCorners />

      {/* Top badge */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Hotel badge */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px w-12 bg-[#D4A843]/60" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">
            Urbanwood Hotel · Hung Hom
          </span>
          <div className="h-px w-12 bg-[#D4A843]/60" />
        </div>

        {/* Anniversary badge */}
        <motion.div
          className="mb-6 w-20 h-20 rounded-full border-2 border-[#D4A843] flex flex-col items-center justify-center"
          style={{ background: 'oklch(0.72 0.12 75 / 0.15)' }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 200 }}
        >
          <span className="text-[#D4A843] text-2xl font-bold font-['Playfair_Display'] leading-none">2</span>
          <span className="text-[#D4A843] text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase">周年</span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white mb-3 leading-tight"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          你是哪種
          <br />
          <span className="text-[#D4A843]">紅磡旅人</span>？
        </motion.h1>

        <motion.p
          className="text-white/70 text-sm md:text-base mb-2 max-w-sm leading-relaxed"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          跟隨第一身視角，從城木酒店出發
        </motion.p>
        <motion.p
          className="text-white/50 text-xs md:text-sm mb-10 max-w-sm leading-relaxed"
          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          穿梭紅磡舊街、海濱與隱世角落
          <br />
          回答 13 條感官問題，領取你的專屬登機證
        </motion.p>

        {/* CTA Button */}
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

        {/* Decorative dots */}
        <motion.div
          className="mt-10 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-[#D4A843]/40"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Chapter Intro Screen ─────────────────────────────────────────────────────────────────
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
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${chapter.bgImage})` }}
      />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${overlay.replace(')', ', 0.7)').replace('rgba', 'rgba')}, ${overlay}, ${overlay.replace(')', ', 0.9)').replace('rgba', 'rgba')})` }} />
      <DecoCorners />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px w-8 bg-[#D4A843]/60" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">
            {chapter.title}
          </span>
          <div className="h-px w-8 bg-[#D4A843]/60" />
        </div>

        <h2
          className="text-3xl md:text-5xl font-bold text-white mb-3"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          {chapter.subtitle}
        </h2>

        <p
          className="text-[#D4A843]/80 text-sm tracking-widest mb-8"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
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

// ─── Question Screen ─────────────────────────────────────────────────────────────────
function QuestionScreen({
  questionIndex,
  selectedAnswer,
  openEndAnswer,
  onAnswer,
  onOpenEndAnswer,
  onNext,
  chapters,
  allQuestions,
  totalQuestions,
  overlayColor,
  questionCardBg,
  configRows,
}: {
  questionIndex: number;
  selectedAnswer: AnswerType | null;
  openEndAnswer?: string;
  onAnswer: (a: AnswerType) => void;
  onOpenEndAnswer?: (text: string) => void;
  onNext: () => void;
  chapters: Chapter[];
  allQuestions: import('@/lib/quizData').Question[];
  totalQuestions: number;
  overlayColor?: string;
  questionCardBg?: string;
  configRows?: { configKey: string; configValue: string }[];
}) {
  const overlay = overlayColor ?? 'rgba(13,27,46,0.75)';
  const cardBg = questionCardBg ?? 'rgba(13,27,46,0.75)';
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const btnNext = cfg['btn_next'] ?? '下一題 →';
  const btnLastQuestion = cfg['btn_last_question'] ?? '查看結果 ✶';
  const question = allQuestions[questionIndex];
  const currentChapter = chapters.find((c) =>
    c.questions.some((q) => q.id === question.id)
  )!;

  const sensoryColors: Record<string, string> = {
    視覺: '#E8654A',
    聽覺: '#3ECFCF',
    嗅覺: '#7A9E8E',
    觸覺: '#D4A843',
  };
const shuffledAnswers = useMemo(() => {
  if (question.questionType === 'open-end') return [];

  const entries = (Object.entries(question.options) as [AnswerType, string][])
    .filter(([, text]) => String(text ?? '').trim() !== '');

  return shuffleArray(entries);
}, [questionIndex]);
  return (
    <motion.div
      key={questionIndex}
      className="relative min-h-screen flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentChapter.bgImage})` }}
      />
      <div className="absolute inset-0" style={{ background: overlay }} />
      <DecoCorners />

      {/* Top bar */}
      <div className="relative z-10 px-6 pt-8 pb-4">
        <ProgressBar current={questionIndex + 1} total={totalQuestions} />
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
            {question.sensoryType}
          </span>
          <span className="text-white/40 text-xs font-['DM_Sans']">
            {currentChapter.title} · {currentChapter.subtitle}
          </span>
        </div>
      </div>

      {/* Question content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-8 max-w-2xl mx-auto w-full">
        <motion.h2
          className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {question.text}
        </motion.h2>

             {question.questionType === 'open-end' ? (
          <div className="space-y-3">
            <textarea
              value={openEndAnswer ?? ''}
              onChange={(e) => onOpenEndAnswer?.(e.target.value)}
              rows={4}
              placeholder="請輸入您的回答..."
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
                onClick={() => onAnswer(opt)}
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
                  {text}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {(question.questionType === 'open-end' ? (openEndAnswer ?? '').trim().length > 0 : !!selectedAnswer) && (
            <motion.div
              className="mt-8 flex justify-end"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={onNext}
                className="px-8 py-3 text-[#0D1B2E] font-semibold text-sm tracking-[0.15em] uppercase transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
                  fontFamily: "'DM Sans', sans-serif",
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}
              >
                {questionIndex === totalQuestions - 1 ? btnLastQuestion : btnNext}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Giveaway Form Screen (shown before result) ──────────────────────────────────────
function GiveawayFormScreen({
  resultType,
  onComplete,
  configRows,
  openEndAnswers,
}: {
  resultType: AnswerType;
  onComplete: () => void;
  configRows?: { configKey: string; configValue: string }[];
  openEndAnswers?: Record<number, string>;
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
    cfg['form_platform_field_label'] ??
    '1. 從哪個途徑報名參加活動  Which platform did you use to register for the event';
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
      setSubmitted(true);
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

  const bgMap: Record<string, string> = {
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
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${bgMap[result.id] ?? bgMap.A})` }}
      />
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
            <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">
              {almostThereLabel}
            </span>
            <div className="h-px flex-1 bg-[#D4A843]/40" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">{result.icon}</span>
            <div>
              <p className="text-[#D4A843]/60 text-[10px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-0.5">
                {travelerTypeLabel}
              </p>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {result.name}
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
                  {introZh}
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
                  placeholder={platform === 'facebook' ? 'Facebook 帳戶名稱' : '@yourhandle'}
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
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="#D4A843"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-white/70 text-[11px] leading-relaxed" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      {consentZh}
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
                {submitMutation.isPending ? '提交中...' : `✶ ${btnSubmitForm}`}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Result Screen (Boarding Pass) ────────────────────────────────────────────
function ResultScreen({
  resultType,
  onRestart,
  configRows,
}: {
  resultType: AnswerType;
  onRestart: () => void;
  configRows?: { configKey: string; configValue: string }[];
}) {
  const baseResult = results[resultType];
  // Apply config overrides to result
  const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const result = {
    ...baseResult,
    name: cfg[`result_${resultType}_name`] ?? baseResult.name,
    nameEn: cfg[`result_${resultType}_nameEn`] ?? baseResult.nameEn,
    tagline: cfg[`result_${resultType}_tagline`] ?? baseResult.tagline,
    sensoryProfile: cfg[`result_${resultType}_sensoryProfile`] ?? baseResult.sensoryProfile,
    urbanwoodMatch: cfg[`result_${resultType}_urbanwoodMatch`] ?? baseResult.urbanwoodMatch,
    resultImage: cfg[`result_${resultType}_resultImage`] ?? baseResult.resultImage ?? '',
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
  const boardingPassRef = useState<HTMLDivElement | null>(null);
  const setBoardingPassRef = boardingPassRef[1];

  const handleSaveImage = async () => {
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      // Find the boarding pass card element
      const el = document.getElementById('boarding-pass-card');
      if (!el) { setSaving(false); return; }
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
      // fallback: show toast
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const text = `我係「${result.name}」(${result.nameEn})！${result.tagline}\n\n城木酒店紅磡 2 周年感官測驗 🎫\n#城木2周年 #紅磡旅人 @urbanwoodhotels`;
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
      transition={{ duration: 0.8 }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${resultBgMap[resultType]})` }}
      />
      <div className="absolute inset-0 bg-[#0D1B2E]/80 backdrop-blur-sm" />
      <DecoCorners />

      {/* Boarding Pass Card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 100 }}
      >
        {/* Header label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-[#D4A843]/40" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">
            Boarding Pass · 登機證
          </span>
          <div className="h-px flex-1 bg-[#D4A843]/40" />
        </div>

        {/* Main boarding pass */}
        <div
          id="boarding-pass-card"
          className="rounded-sm overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, oklch(0.18 0.05 240) 0%, oklch(0.14 0.04 240) 100%)',
            border: '1.5px solid rgba(212,168,67,0.35)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.2)',
          }}
        >
          {/* Custom boarding pass image override */}
          {boardingPassImage && (
            <div className="w-full">
              <img
                src={boardingPassImage}
                alt="登機證"
                className="w-full h-auto block"
                style={{ display: 'block' }}
                onError={(e) => {
                  // If custom image fails to load, hide it and show default design
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const defaultContent = target.closest('#boarding-pass-card')?.querySelector('[data-default-content]') as HTMLElement | null;
                  if (defaultContent) defaultContent.style.display = 'block';
                }}
              />
            </div>
          )}
          {/* Default boarding pass content (hidden if custom image exists) */}
          <div data-default-content style={{ display: boardingPassImage ? 'none' : 'block' }}>
          {/* Top section */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#D4A843]/60 text-[10px] tracking-[0.25em] font-['DM_Sans'] uppercase mb-1">
                  Passenger Type
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{result.icon}</span>
                  <div>
                    <h2
                      className="text-xl font-bold text-white leading-tight"
                      style={{ fontFamily: "'Noto Serif TC', serif" }}
                    >
                      {result.name}
                    </h2>
                    <p className="text-[#D4A843]/70 text-xs font-['DM_Sans'] italic">
                      {result.nameEn}
                    </p>
                  </div>
                </div>
              </div>
              {/* Stamp */}
              <motion.div
                className="w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center stamp-animate"
                style={{
                  borderColor: result.color,
                  background: `${result.color}15`,
                }}
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

            {/* Frequency tags */}
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

            {/* Result Image (if set in admin) */}
            {result.resultImage && (
              <div className="mb-4 rounded-sm overflow-hidden">
                <img
                  src={result.resultImage}
                  alt={result.name}
                  className="w-full h-32 object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Tagline */}
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

          {/* Dashed divider with circles */}
          <div className="relative flex items-center">
            <div className="w-4 h-8 rounded-r-full" style={{ background: 'oklch(0.15 0.04 240)' }} />
            <div className="flex-1 border-t-2 border-dashed border-[#D4A843]/25 mx-1" />
            <div className="w-4 h-8 rounded-l-full" style={{ background: 'oklch(0.15 0.04 240)' }} />
          </div>

          {/* Bottom section */}
          <div className="px-6 py-4">
            {/* Flight info row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#D4A843]/50 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-0.5">From</p>
                <p className="text-white text-sm font-semibold font-['DM_Sans']">URBANWOOD HH</p>
              </div>
              <div className="text-[#D4A843]/60 text-lg">✈</div>
              <div className="text-right">
                <p className="text-[#D4A843]/50 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-0.5">Destination</p>
                <p className="text-white text-xs font-semibold font-['DM_Sans'] leading-tight">
                  {result.boardingPassDestination}
                </p>
              </div>
            </div>

            {/* Sensory profile */}
            <div className="mb-4">
              <p className="text-[#D4A843]/50 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-1.5">
                Sensory Profile · 感官特質
              </p>
              <p
                className="text-white/70 text-xs leading-relaxed"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {result.sensoryProfile}
              </p>
            </div>

            {/* Urbanwood match */}
            <div
              className="rounded-sm px-3 py-2.5"
              style={{ background: `${result.color}12`, border: `1px solid ${result.color}30` }}
            >
              <p className="text-[#D4A843]/60 text-[9px] tracking-[0.2em] font-['DM_Sans'] uppercase mb-1">
                ✦ Urbanwood Match
              </p>
              <p
                className="text-white/80 text-xs leading-relaxed"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {result.urbanwoodMatch}
              </p>
            </div>

            {/* Barcode-style decoration */}
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
          </div>{/* end default boarding pass content */}
        </div>

        {/* Action buttons */}
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
            {copied ? '✓ 已複製！' : btnShare}
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
            {saving ? '正在儲存...' : btnSaveBoardingPass}
          </button>

          <div className="text-center">
            <p
              className="text-white/40 text-xs mb-2"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              {resultShareHint}
            </p>
          </div>

          {/* Book Now Button */}
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
  const [screen, setScreen] = useState<Screen>('landing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerType[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerType | null>(null);
  const [openEndAnswers, setOpenEndAnswers] = useState<Record<number, string>>({});
  const [chapterIndex, setChapterIndex] = useState(0);
  const [resultType, setResultType] = useState<AnswerType | null>(null);

  // Load admin config overrides
  const { data: configRows } = trpc.quiz.getConfig.useQuery();
  const chapters = useMemo(() => applyConfig(configRows ?? []), [configRows]);
  const allQuestions = useMemo(() => chapters.flatMap((c) => c.questions), [chapters]);
  const totalQuestions = allQuestions.length;
  const heroBg = useMemo(() => {
    const row = configRows?.find((r) => r.configKey === 'hero_bg');
    return row?.configValue ?? HERO_BG;
  }, [configRows]);

  const colors = useMemo(() => extractColors(configRows ?? []), [configRows]);

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

  const handleNext = useCallback(() => {
    const currentQuestion = allQuestions[questionIndex];
    const isOpenEnd = currentQuestion?.questionType === 'open-end';
    if (!isOpenEnd && !selectedAnswer) return;
    if (isOpenEnd && !(openEndAnswers[questionIndex] ?? '').trim()) return;
    // For open-end questions, use a placeholder answer 'A' for scoring (doesn't affect result)
    const answerForScoring: AnswerType = isOpenEnd ? 'A' : selectedAnswer!;
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

    // Check if entering a new chapter
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

  const handleRestart = useCallback(() => {
    setScreen('landing');
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
        {screen === 'landing' && (
          <motion.div key="landing" className="min-h-screen">
            <LandingScreen onStart={handleStart} heroBg={heroBg} configRows={configRows ?? []} />
          </motion.div>
        )}
        {screen === 'chapter-intro' && (
          <motion.div key={`chapter-intro-${chapterIndex}`} className="min-h-screen">
            <ChapterIntroScreen
              chapterIndex={chapterIndex}
              chapters={chapters}
              onContinue={handleChapterContinue}
              overlayColor={colors.overlayColor}
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
              chapters={chapters}
              allQuestions={allQuestions}
              totalQuestions={totalQuestions}
              overlayColor={colors.overlayColor}
              questionCardBg={colors.questionCardBg}
              configRows={configRows ?? []}
            />
          </motion.div>
        )}
        {screen === 'giveaway-form' && resultType && (
          <motion.div key="giveaway-form" className="min-h-screen">
            <GiveawayFormScreen resultType={resultType} onComplete={handleGiveawayComplete} configRows={configRows ?? []} openEndAnswers={openEndAnswers} />
          </motion.div>
        )}
        {screen === 'result' && resultType && (
          <motion.div key="result" className="min-h-screen">
            <ResultScreen resultType={resultType} onRestart={handleRestart} configRows={configRows ?? []} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
