import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { chapters } from "@/lib/quizData";

type AnswerType = "A" | "B" | "C" | "D" | "E" | "F";

function shuffleArray<T>(array: T[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Home() {
  const allQuestions = chapters.flatMap((c) => c.questions);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerType | null>(null);

  const question = allQuestions[currentIndex];

  // ✅ shuffle 6 answers
  const shuffledAnswers = useMemo(() => {
    return shuffleArray(
      Object.entries(question.options).filter(([_, v]) => v)
    ) as [AnswerType, string][];
  }, [currentIndex]);

  const handleAnswer = (opt: AnswerType) => {
    setSelectedAnswer(opt);

    setTimeout(() => {
      setSelectedAnswer(null);
      setCurrentIndex((prev) => prev + 1);
    }, 400);
  };

  if (!question) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        完成測驗 🎉
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center bg-black">
      <div className="w-full max-w-xl">

        {/* 問題 */}
        <motion.h2
          className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {question.text}
        </motion.h2>

        {/* 答案 */}
        <div className="space-y-3">
          {shuffledAnswers.map(([opt, text], i) => (
            <motion.button
              key={`${question.id}-${opt}-${i}`}
              onClick={() => handleAnswer(opt)}
              className={`w-full text-left px-5 py-4 rounded border ${
                selectedAnswer === opt
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-white/20"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex gap-4 items-start">
                <span className="font-bold text-yellow-400">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-white/90">{text}</span>
              </div>
            </motion.button>
          ))}
        </div>

      </div>
    </div>
  );
}
