/*
 * Admin Dashboard - Urbanwood Hung Hom 2nd Anniversary Quiz
 * Features: View submissions, download CSV, edit questions, change images
 * Access: Admin role only
 */

import { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { chapters, results, type AnswerType } from '@/lib/quizData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) {
    toast.error('沒有數據可下載');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function withCacheBust(url: string) {
  const value = url.trim();
  if (!value) return '';
  if (value.startsWith('data:')) return value;

  try {
    const parsed = new URL(value);
    parsed.searchParams.set('v', String(Date.now()));
    return parsed.toString();
  } catch {
    const separator = value.includes('?') ? '&' : '?';
    return `${value}${separator}v=${Date.now()}`;
  }
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary 尚未設定。請在 Vercel 加 VITE_CLOUDINARY_CLOUD_NAME 及 VITE_CLOUDINARY_UPLOAD_PRESET。');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'urbanwood-quiz');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Cloudinary 上傳失敗');
  }

  const data = await res.json();
  return data.secure_url;
}
// ─── Image Uploader ──────────────────────────────────────────────────────────
  return canvas.toDataURL(outputType, quality);
}

function ImageUploader({
  onUploaded,
  currentUrl,
}: {
  onUploaded: (url: string) => void;
  currentUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [urlInput, setUrlInput] = useState(currentUrl ?? '');

  useEffect(() => {
    setPreview(currentUrl ?? '');
    setUrlInput(currentUrl ?? '');
  }, [currentUrl]);

 const handleFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.error('請選擇圖片檔案');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('圖片不能超過 10MB');
    return;
  }

  setUploading(true);

  try {
    // 🔥 上傳到 Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(file);

    // 🔥 cache-safe（重要）
    const stamped = withCacheBust(cloudinaryUrl);

    setPreview(stamped);
    setUrlInput(stamped);
    onUploaded(stamped);

    toast.success('圖片已上傳至 Cloudinary！');
  } catch (err) {
    toast.error('上傳失敗：' + String(err));
  } finally {
    setUploading(false);
  }
};

const handleApplyUrl = () => {
  const value = urlInput.trim();

  if (!value) {
    toast.error('請輸入圖片 URL');
    return;
  }

  const stamped = withCacheBust(value);

  setPreview(stamped);
  setUrlInput(stamped);
  onUploaded(stamped);

  toast.success('圖片 URL 已更新！');
};

  return (
    <div className="space-y-3">
      <label
        className="flex flex-col items-center justify-center w-full h-28 rounded-sm cursor-pointer transition-all hover:border-[#D4A843]/50"
        style={{ border: '2px dashed rgba(212,168,67,0.25)', background: 'rgba(255,255,255,0.02)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {uploading ? (
          <span className="text-[#D4A843]/60 text-xs font-['DM_Sans']">壓縮及保存中...</span>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-2 opacity-40">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="#D4A843"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke="#D4A843"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="12" y1="3" x2="12" y2="15" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-white/30 text-[10px] font-['DM_Sans']">點擊或拖放圖片（系統會自動壓縮）</span>
          </>
        )}
      </label>

      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="或手動輸入圖片 URL..."
          className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        />
        <button
          type="button"
          onClick={handleApplyUrl}
          className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase"
          style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
        >
          套用 URL
        </button>
      </div>

      <p
        className="text-white/35 text-[10px] leading-relaxed"
        style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
      >
        建議：保留 upload 方便快速測試；正式活動用圖可貼公開 URL，會更穩定，亦較少出現 quota exceeded。
      </p>

      {preview && (
        <div className="w-full h-24 rounded-sm overflow-hidden">
          <img src={preview} alt="preview" className="w-full h-full object-cover opacity-70" />
        </div>
      )}
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-1"
      style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}
    >
      <p className="text-[#D4A843]/60 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">{label}</p>
      <p className="text-white text-2xl font-bold font-['DM_Sans']">{value}</p>
      {sub && <p className="text-white/40 text-xs font-['DM_Sans']">{sub}</p>}
    </div>
  );
}

// ─── Submissions Tab ──────────────────────────────────────────────────────────
function SubmissionsTab() {
  const { data: submissions, isLoading } = trpc.admin.getSubmissions.useQuery();
  const { data: stats } = trpc.admin.getStats.useQuery();

  const resultNames: Record<AnswerType, string> = {
    A: results.A.name,
    B: results.B.name,
    C: results.C.name,
    D: results.D.name,
    E: results.E.name,
    F: results.F.name,
  };

  const handleDownload = () => {
    if (!submissions) return;
    const rows = submissions.map((s) => ({
      ID: s.id,
      平台: s.platform === 'instagram' ? 'Instagram' : 'Facebook',
      帳戶名稱: s.socialHandle,
      姓名: s.name,
      電話: s.phone || '',
      電郵: s.email,
      旅人屬性: s.resultName,
      屬性代號: s.resultType,
      提交時間: new Date(s.createdAt).toLocaleString('zh-HK'),
    }));
    downloadCSV(rows, `城木紅磡2周年抽獎名單_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV 下載成功！');
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatsCard label="總提交數" value={stats.total} />
          {(['A', 'B', 'C', 'D', 'E', 'F'] as AnswerType[]).map((id) => (
            <StatsCard
              key={id}
              label={resultNames[id]}
              value={stats.byResult[id]}
              sub={`${stats.total ? Math.round((stats.byResult[id] / stats.total) * 100) : 0}%`}
            />
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatsCard label="Instagram 參加者" value={stats.byPlatform.instagram} />
          <StatsCard label="Facebook 參加者" value={stats.byPlatform.facebook} />
        </div>
      )}

      <button
        onClick={handleDownload}
        className="px-6 py-2.5 text-[#0D1B2E] font-semibold text-sm tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
          fontFamily: "'DM Sans', sans-serif",
          clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
        }}
      >
        ↓ 下載 CSV 抽獎名單
      </button>

      {isLoading ? (
        <p className="text-white/40 text-sm font-['DM_Sans']">載入中...</p>
      ) : !submissions?.length ? (
        <p className="text-white/40 text-sm font-['DM_Sans']">暫無提交記錄</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212,168,67,0.2)' }}>
                {['#', '平台', '帳戶名稱', '姓名', '電話', '電郵', '旅人屬性', '提交時間'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 px-3 text-[#D4A843]/60 text-[10px] tracking-[0.15em] uppercase font-['DM_Sans'] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2 px-3 text-white/40">{s.id}</td>
                  <td className="py-2 px-3 text-white/80 capitalize">{s.platform}</td>
                  <td className="py-2 px-3 text-white/80">{s.socialHandle}</td>
                  <td className="py-2 px-3 text-white/80">{s.name}</td>
                  <td className="py-2 px-3 text-white/80">{s.phone || ''}</td>
                  <td className="py-2 px-3 text-white/80">{s.email}</td>
                  <td className="py-2 px-3">
                    <span
                      className="px-2 py-0.5 rounded-sm text-[10px] tracking-wider"
                      style={{
                        color: results[s.resultType as AnswerType].color,
                        background: `${results[s.resultType as AnswerType].color}15`,
                        border: `1px solid ${results[s.resultType as AnswerType].color}40`,
                      }}
                    >
                      {s.resultName}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-white/40 whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleString('zh-HK')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Chapters Tab ─────────────────────────────────────────────────────────────
function ChaptersTab() {
  const utils = trpc.useUtils();
  const { data: configRows } = trpc.quiz.getConfig.useQuery();

  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('章節內容已更新！');
    },
    onError: (err) => toast.error('更新失敗：' + err.message),
  });

  const savedMap = useMemo(
    () => Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue])),
    [configRows]
  );

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    chapters.forEach((chapter) => {
      next[`chapter_${chapter.id}_title`] = savedMap[`chapter_${chapter.id}_title`] ?? chapter.title;
      next[`chapter_${chapter.id}_subtitle`] = savedMap[`chapter_${chapter.id}_subtitle`] ?? chapter.subtitle;
      next[`chapter_${chapter.id}_scene`] = savedMap[`chapter_${chapter.id}_scene`] ?? chapter.scene;
      next[`chapter_${chapter.id}_introTitle`] = savedMap[`chapter_${chapter.id}_introTitle`] ?? '';
      next[`chapter_${chapter.id}_introText`] = savedMap[`chapter_${chapter.id}_introText`] ?? '';
      next[`chapter_${chapter.id}_buttonText`] = savedMap[`chapter_${chapter.id}_buttonText`] ?? '進入場景 →';
      next[`chapter_${chapter.id}_bg`] = savedMap[`chapter_${chapter.id}_bg`] ?? chapter.bgImage;
    });
    setValues(next);
  }, [savedMap]);

  const saveField = (key: string) => {
    setConfigMutation.mutate({ key, value: values[key] ?? '' });
  };

  return (
    <div className="space-y-8">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        可修改每個 Chapter 的 topic、subtitle、scene、介紹文案、按鈕文字及背景圖。
      </p>

      {chapters.map((chapter) => (
        <div key={chapter.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D4A843]/15" />
            <span className="text-[#D4A843]/60 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
              Chapter {chapter.id}
            </span>
            <div className="h-px flex-1 bg-[#D4A843]/15" />
          </div>

          {[
            [`chapter_${chapter.id}_title`, 'Title'],
            [`chapter_${chapter.id}_subtitle`, 'Subtitle'],
            [`chapter_${chapter.id}_scene`, 'Scene'],
            [`chapter_${chapter.id}_introTitle`, 'Intro Topic'],
            [`chapter_${chapter.id}_buttonText`, 'Button Text'],
          ].map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase font-['DM_Sans']">
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={values[key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                />
                <button
                  onClick={() => saveField(key)}
                  className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
                >
                  儲存
                </button>
              </div>
            </div>
          ))}

          <div className="space-y-1">
            <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase font-['DM_Sans']">
              Intro Text
            </label>
            <div className="flex gap-2 items-start">
              <textarea
                rows={3}
                value={values[`chapter_${chapter.id}_introText`] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [`chapter_${chapter.id}_introText`]: e.target.value }))
                }
                className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 resize-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              />
              <button
                onClick={() => saveField(`chapter_${chapter.id}_introText`)}
                className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase"
                style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
              >
                儲存
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase font-['DM_Sans']">
              Background Image
            </label>
            <ImageUploader
              currentUrl={values[`chapter_${chapter.id}_bg`] ?? ''}
              onUploaded={(url) => {
                setValues((prev) => ({ ...prev, [`chapter_${chapter.id}_bg`]: url }));
                setConfigMutation.mutate({ key: `chapter_${chapter.id}_bg`, value: url });
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Images Tab ───────────────────────────────────────────────────────────────
function ImagesTab() {
  const utils = trpc.useUtils();
  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('圖片連結已更新！');
    },
    onError: (err) => toast.error('更新失敗：' + err.message),
  });

  const imageKeys = [
    {
      key: 'hero_bg',
      label: '首頁背景圖（電腦版）',
      defaultUrl:
        'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/hero-bg-XS9H5NH3aLyjCXKGtNcwKc.webp',
    },
    {
      key: 'hero_bg_mobile',
      label: '首頁背景圖（手機版）',
      defaultUrl: '',
    },
    ...chapters.flatMap((c) => [
      {
        key: `chapter_${c.id}_bg`,
        label: `${c.title}：${c.subtitle} 背景圖（電腦版）`,
        defaultUrl: c.bgImage,
      },
      {
        key: `chapter_${c.id}_bg_mobile`,
        label: `${c.title}：${c.subtitle} 背景圖（手機版）`,
        defaultUrl: '',
      },
    ]),
  ];

  const { data: configRows } = trpc.quiz.getConfig.useQuery();

  const savedMap = useMemo(
    () => Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue])),
    [configRows]
  );

  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const next = Object.fromEntries(
      imageKeys.map((item) => [item.key, savedMap[item.key] ?? item.defaultUrl])
    );
    setUrls(next);
  }, [configRows]);

  const handleSave = (key: string) => {
    const url = (urls[key] ?? '').trim();
    if (!url) {
      toast.error('請輸入圖片連結');
      return;
    }
  const stamped = withCacheBust(url);
setUrls((prev) => ({ ...prev, [key]: stamped }));
setConfigMutation.mutate({ key, value: stamped });

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        點擊或拖放圖片直接上傳，上傳後自動壓縮並儲存。也可手動輸入圖片 URL 再點「儲存」。
      </p>

      <p className="text-white/35 text-[10px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        如未上傳手機版圖片，前台會自動使用電腦版圖片，不會出錯。
      </p>

      {imageKeys.map((item) => {
        const isMobileVersion = item.key.endsWith('_mobile');
        const desktopFallbackKey =
          item.key === 'hero_bg_mobile' ? 'hero_bg' : item.key.replace('_bg_mobile', '_bg');

        const desktopFallbackUrl = urls[desktopFallbackKey] ?? '';
        const currentUrl = urls[item.key] ?? '';

        return (
          <div key={item.key} className="space-y-2">
            <label className="block text-[#D4A843]/70 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
              {item.label}
            </label>

            {isMobileVersion && !currentUrl && (
              <p className="text-white/30 text-[10px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                未設定手機版圖片，前台將自動使用電腦版圖片。
              </p>
            )}

            <ImageUploader
              currentUrl={currentUrl}
              onUploaded={(url) => {
                setUrls((prev) => ({ ...prev, [item.key]: url }));
                setConfigMutation.mutate({ key: item.key, value: url });
              }}
            />

            <div className="flex gap-2 mt-1">
              <input
                type="url"
                value={urls[item.key] ?? ''}
                onChange={(e) => setUrls((prev) => ({ ...prev, [item.key]: e.target.value }))}
                placeholder={
                  isMobileVersion
                    ? '可留空，留空會沿用電腦版圖片'
                    : '或手動輸入圖片 URL...'
                }
                className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />

              <button
                onClick={() => handleSave(item.key)}
                disabled={setConfigMutation.isPending || !(urls[item.key] ?? '').trim()}
                className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
              >
                儲存
              </button>

              {isMobileVersion && (
                <button
                  onClick={() => {
                    setUrls((prev) => ({ ...prev, [item.key]: '' }));
                    setConfigMutation.mutate({ key: item.key, value: '' });
                  }}
                  disabled={setConfigMutation.isPending}
                  className="px-4 py-2 text-white/50 text-xs tracking-wider uppercase border border-white/10 hover:border-white/20 hover:text-white/70 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  清空
                </button>
              )}
            </div>

            {isMobileVersion && !currentUrl && desktopFallbackUrl && (
              <div className="w-full h-24 rounded-sm overflow-hidden border border-white/5">
                <img src={desktopFallbackUrl} alt="desktop fallback preview" className="w-full h-full object-cover opacity-60" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Colors Tab ───────────────────────────────────────────────────────────────
function ColorsTab() {
  const utils = trpc.useUtils();
  const { data: configRows } = trpc.quiz.getConfig.useQuery();
  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('顏色已更新！');
    },
    onError: (err) => toast.error('更新失敗：' + err.message),
  });

  const colorSettings = [
    {
      key: 'color_overlay',
      label: '測驗背景底色（Overlay）',
      desc: '覆蓋在背景圖上的半透明底色，影響整個答題頁的氛圍。請使用 rgba 格式，如 rgba(13,27,46,0.75)',
      defaultValue: 'rgba(13,27,46,0.65)',
    },
    {
      key: 'color_question_card',
      label: '問題框底色',
      desc: '每個選項按鈕的底色。請使用 rgba 格式，如 rgba(13,27,46,0.75)',
      defaultValue: 'rgba(13,27,46,0.75)',
    },
  ];

  const savedMap = useMemo(
    () => Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue])),
    [configRows]
  );

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(colorSettings.map((s) => [s.key, s.defaultValue]))
  );

  useEffect(() => {
    setValues(Object.fromEntries(colorSettings.map((s) => [s.key, savedMap[s.key] ?? s.defaultValue])));
  }, [savedMap]);

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        使用 rgba 格式設定顏色，第四個數字為透明度（0=全透明，1=全不透明）。例： rgba(13,27,46,0.75)
      </p>

      {colorSettings.map((setting) => (
        <div key={setting.key} className="space-y-2">
          <label className="block text-[#D4A843]/70 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
            {setting.label}
          </label>
          <p className="text-white/30 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
            {setting.desc}
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={values[setting.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
              placeholder={setting.defaultValue}
              className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors font-['DM_Sans']"
            />
            <div
              className="w-8 h-8 rounded-sm border border-white/10 flex-shrink-0"
              style={{ background: values[setting.key] || setting.defaultValue }}
            />
            <button
              onClick={() => setConfigMutation.mutate({ key: setting.key, value: values[setting.key] })}
              disabled={setConfigMutation.isPending}
              className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
            >
              儲存
            </button>
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-white/5">
        <button
          onClick={() => {
            colorSettings.forEach((s) => {
              setConfigMutation.mutate({ key: s.key, value: s.defaultValue });
            });
            setValues(Object.fromEntries(colorSettings.map((s) => [s.key, s.defaultValue])));
          }}
          className="text-white/25 text-xs tracking-wider uppercase hover:text-white/40 transition-colors font-['DM_Sans']"
        >
          重置為預設顏色
        </button>
      </div>
    </div>
  );
}

// ─── Form Copy Tab ────────────────────────────────────────────────────────────
function FormCopyTab() {
  const utils = trpc.useUtils();
  const { data: configRows } = trpc.quiz.getConfig.useQuery();
  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('已儲存！');
    },
    onError: (err) => toast.error('儲存失敗：' + err.message),
  });

  const fields = [
    {
      key: 'form_intro_zh',
      label: '表單說明（中文）',
      defaultValue:
        '感謝您參加本次心理測驗！請根據以下要求提交您的相關資料以作參加抽獎。閣下必須細閱及遵守條款及細則，而閣下的參與及遞交該表格將代表已閱讀及同意各項條款及細則。',
      multiline: true,
    },
    {
      key: 'form_intro_en',
      label: '表單說明（英文）',
      defaultValue:
        'Thank you for participating in this psychological test! Please provide the relevant information as per the requirements below to register the giveaway. You must carefully read and comply with the Terms and Conditions. Your participation and submission of this form will signify that you have read, understood, and agreed to all the stated terms and conditions.',
      multiline: true,
    },
    {
      key: 'form_terms_label',
      label: '條款連結文字',
      defaultValue: '條款及細則 Terms and Conditions',
      multiline: false,
    },
    {
      key: 'form_terms_url',
      label: '條款連結 URL',
      defaultValue: 'https://southnesthk.com/south-nest-3rd-anniversary-celebration2026/',
      multiline: false,
    },
    {
      key: 'form_consent_zh',
      label: '個人資料同意聲明（中文）',
      defaultValue:
        '本人願意提供上述個人資料，並同意使用我的電郵地址，用於發送直接促銷訊息，包括產品推廣、折扣活動及相關資訊。本人明白可隨時取消訂閱。',
      multiline: true,
    },
    {
      key: 'form_consent_en',
      label: '個人資料同意聲明（英文）',
      defaultValue:
        'I consent to the collection and use of my contact information for direct marketing purposes, including promotions and news. I understand that I can withdraw my consent at any time.',
      multiline: true,
    },
    {
      key: 'form_success_msg',
      label: '提交成功訊息',
      defaultValue: '記得分享你的登機證至 IG Story，Tag @urbanwoodhotels ＋ #城木2周年 増加中獎機會！',
      multiline: true,
    },
    {
      key: 'form_almost_there_label',
      label: '"Almost There" 標簽文字',
      defaultValue: 'Almost There',
      multiline: false,
    },
    {
      key: 'form_traveler_type_label',
      label: '"Your Traveller Type" 標簽文字',
      defaultValue: 'Your Traveller Type',
      multiline: false,
    },
    {
      key: 'form_success_title_label',
      label: '成功登記標題',
      defaultValue: '✶ 已成功登記抽獎！',
      multiline: false,
    },
    {
      key: 'form_platform_field_label',
      label: '第一項欄位標簽（參加平台）',
      defaultValue: '1. 從哪個途徑報名參加活動  Which platform did you use to register for the event',
      multiline: false,
    },
    {
      key: 'form_social_handle_field_label',
      label: '第二項欄位標簽（社交平台用戶名稱）',
      defaultValue: '2. 社交平台用戶名稱 Social Media Username',
      multiline: false,
    },
    {
      key: 'form_name_field_label',
      label: '第三項欄位標簽（姓名）',
      defaultValue: '3. 姓名 Name',
      multiline: false,
    },
    {
      key: 'form_email_field_label',
      label: '第四項欄位標簽（電郵地址）',
      defaultValue: '4. 電郵地址 Email Address',
      multiline: false,
    },
    {
      key: 'btn_start',
      label: '「開始測驗」按鈕文字',
      defaultValue: '開始測驗',
      multiline: false,
    },
    {
      key: 'btn_next',
      label: '「下一題」按鈕文字',
      defaultValue: '下一題 →',
      multiline: false,
    },
    {
      key: 'btn_last_question',
      label: '最後一題的「查看結果」按鈕文字',
      defaultValue: '查看結果 ✶',
      multiline: false,
    },
    {
      key: 'btn_submit_form',
      label: '「登記抽獎，查看結果」按鈕文字',
      defaultValue: '登記抽獎，查看結果',
      multiline: false,
    },
    {
      key: 'btn_save_boarding_pass',
      label: '「儲存登機證圖片」按鈕文字',
      defaultValue: '📸 儲存登機證圖片',
      multiline: false,
    },
    {
      key: 'btn_book_hotel',
      label: '「立即預訂城木紅磡」按鈕文字',
      defaultValue: '🏨 立即預訂城木紅磡',
      multiline: false,
    },
    {
      key: 'btn_book_hotel_url',
      label: '「立即預訂」按鈕連結 URL',
      defaultValue: 'https://urbanwoodhotels.com/hk/global_hotels/hung-hom-hk/',
      multiline: false,
    },
    {
      key: 'btn_share',
      label: '「分享登機證」按鈕文字',
      defaultValue: '📤 分享我的登機證',
      multiline: false,
    },
    {
      key: 'btn_restart',
      label: '「重新測驗」按鈕文字',
      defaultValue: '重新測驗',
      multiline: false,
    },
    {
      key: 'result_share_hint',
      label: '結果頁分享提示文字',
      defaultValue: '分享至 IG Story，Tag @urbanwoodhotels ＋ #城木2周年 即可參加抽獎！',
      multiline: true,
    },
  ];

  const savedMap = useMemo(
    () => Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue])),
    [configRows]
  );

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue]))
  );

  useEffect(() => {
    setValues(Object.fromEntries(fields.map((f) => [f.key, savedMap[f.key] ?? f.defaultValue])));
  }, [savedMap]);

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        修改抽獎登記頁面的所有文字、欄位標簽、條款連結及同意聲明。修改後即時生效。
      </p>

      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label className="block text-[#D4A843]/70 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
            {field.label}
          </label>
          <div className="flex gap-2 items-start">
            {field.multiline ? (
              <textarea
                value={values[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                rows={3}
                className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors resize-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              />
            ) : (
              <input
                type="text"
                value={values[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            )}
            <button
              onClick={() => setConfigMutation.mutate({ key: field.key, value: values[field.key] })}
              disabled={setConfigMutation.isPending}
              className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
            >
              儲存
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────────────────────
function ResultsTab() {
  const utils = trpc.useUtils();
  const { data: configRows } = trpc.quiz.getConfig.useQuery();
  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('已儲存！');
    },
    onError: (err) => toast.error('儲存失敗：' + err.message),
  });

  type ResultId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  const resultIds: ResultId[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  const resultLabels: Record<ResultId, string> = {
    A: '慢活療癒者',
    B: '街坊美食家',
    C: '影像捕捉者',
    D: '城市探索者',
    E: '夜行感知者',
    F: '城市連結者',
  };

  const resultFields = [
    { suffix: 'name', label: '名稱（中文）' },
    { suffix: 'nameEn', label: '名稱（英文）' },
    { suffix: 'tagline', label: 'Tagline' },
    { suffix: 'sensoryProfile', label: '感官描述', multiline: true },
    { suffix: 'urbanwoodMatch', label: '城木配對說明', multiline: true },
    { suffix: 'resultImage', label: '結果圖片（顯示於登機證上方）' },
    { suffix: 'boardingPassImage', label: '登機證自訂圖片（上傳後直接覆蓋現有登機證設計）' },
  ];

  const savedMap = useMemo(
    () => Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue])),
    [configRows]
  );

  const defaultValues: Record<ResultId, Record<string, string>> = {
    A: {
      name: results.A.name,
      nameEn: results.A.nameEn,
      tagline: results.A.tagline,
      sensoryProfile: results.A.sensoryProfile,
      urbanwoodMatch: results.A.urbanwoodMatch,
      resultImage: results.A.resultImage ?? '',
      boardingPassImage: '',
    },
    B: {
      name: results.B.name,
      nameEn: results.B.nameEn,
      tagline: results.B.tagline,
      sensoryProfile: results.B.sensoryProfile,
      urbanwoodMatch: results.B.urbanwoodMatch,
      resultImage: results.B.resultImage ?? '',
      boardingPassImage: '',
    },
    C: {
      name: results.C.name,
      nameEn: results.C.nameEn,
      tagline: results.C.tagline,
      sensoryProfile: results.C.sensoryProfile,
      urbanwoodMatch: results.C.urbanwoodMatch,
      resultImage: results.C.resultImage ?? '',
      boardingPassImage: '',
    },
    D: {
      name: results.D.name,
      nameEn: results.D.nameEn,
      tagline: results.D.tagline,
      sensoryProfile: results.D.sensoryProfile,
      urbanwoodMatch: results.D.urbanwoodMatch,
      resultImage: results.D.resultImage ?? '',
      boardingPassImage: '',
    },
    E: {
      name: results.E.name,
      nameEn: results.E.nameEn,
      tagline: results.E.tagline,
      sensoryProfile: results.E.sensoryProfile,
      urbanwoodMatch: results.E.urbanwoodMatch,
      resultImage: results.E.resultImage ?? '',
      boardingPassImage: '',
    },
    F: {
      name: results.F.name,
      nameEn: results.F.nameEn,
      tagline: results.F.tagline,
      sensoryProfile: results.F.sensoryProfile,
      urbanwoodMatch: results.F.urbanwoodMatch,
      resultImage: results.F.resultImage ?? '',
      boardingPassImage: '',
    },
  };

  const [values, setValues] = useState<Record<ResultId, Record<string, string>>>(defaultValues);

  useEffect(() => {
    const loaded: Record<ResultId, Record<string, string>> = JSON.parse(JSON.stringify(defaultValues));
    resultIds.forEach((id) => {
      resultFields.forEach((f) => {
        const key = `result_${id}_${f.suffix}`;
        if (savedMap[key]) loaded[id][f.suffix] = savedMap[key];
      });
    });
    setValues(loaded);
  }, [savedMap]);

  return (
    <div className="space-y-8">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        修改六種旅人類型的名稱、描述及結果圖片。結果圖片可填入圖床 URL，將顯示於登機證上方。
      </p>

      {resultIds.map((id) => (
        <div key={id} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D4A843]/15" />
            <span className="text-[#D4A843]/60 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
              {id} · {resultLabels[id]}
            </span>
            <div className="h-px flex-1 bg-[#D4A843]/15" />
          </div>

          {resultFields.map((field) => (
            <div key={field.suffix} className="space-y-1">
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase font-['DM_Sans']">
                {field.label}
              </label>

              {field.suffix !== 'resultImage' && field.suffix !== 'boardingPassImage' ? (
                <div className="flex gap-2 items-start">
                  {field.multiline ? (
                    <textarea
                      value={values[id][field.suffix]}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [id]: { ...prev[id], [field.suffix]: e.target.value } }))
                      }
                      rows={3}
                      className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 resize-none"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[id][field.suffix]}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [id]: { ...prev[id], [field.suffix]: e.target.value } }))
                      }
                      className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    />
                  )}
                  <button
                    onClick={() =>
                      setConfigMutation.mutate({ key: `result_${id}_${field.suffix}`, value: values[id][field.suffix] })
                    }
                    disabled={setConfigMutation.isPending}
                    className="px-3 py-2 text-[#0D1B2E] text-[10px] font-semibold tracking-wider uppercase disabled:opacity-50 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    儲存
                  </button>
                </div>
              ) : (
                <ImageUploader
                  currentUrl={values[id][field.suffix]}
                  onUploaded={(url) => {
                    setValues((prev) => ({ ...prev, [id]: { ...prev[id], [field.suffix]: url } }));
                    setConfigMutation.mutate({ key: `result_${id}_${field.suffix}`, value: url });
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Questions Tab ────────────────────────────────────────────────────────────
function QuestionsTab() {
  const utils = trpc.useUtils();
  const { data: configRows } = trpc.quiz.getConfig.useQuery();

  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('題目已更新！');
    },
    onError: (err) => toast.error('更新失敗：' + err.message),
  });

  const addQuestionMutation = trpc.admin.addQuestion.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('題目已新增！');
      setShowAddForm(false);
      setNewQ({
        chapterId: 1,
        text: '',
        A: '',
        B: '',
        C: '',
        D: '',
        E: '',
        F: '',
        sensoryType: '視覺',
        questionType: 'multiple-choice',
      });
    },
    onError: (err) => toast.error('新增失敗：' + err.message),
  });

  const removeQuestionMutation = trpc.admin.removeQuestion.useMutation({
    onSuccess: () => {
      utils.quiz.getConfig.invalidate();
      toast.success('題目已刪除');
    },
    onError: (err) => toast.error('刪除失敗：' + err.message),
  });

  const savedMap = useMemo(
    () => Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue])),
    [configRows]
  );

  const mergedQuestions = useMemo(() => {
    const base = chapters.map((chapter) => ({
      ...chapter,
      questions: chapter.questions.map((q) => {
        const overrideRaw = savedMap[`question_${q.id}`];
        if (!overrideRaw) return q;

        try {
          const parsed = JSON.parse(overrideRaw) as {
            text: string;
            A?: string;
            B?: string;
            C?: string;
            D?: string;
            E?: string;
            F?: string;
          };
          return {
            ...q,
            text: parsed.text ?? q.text,
            options: {
              A: parsed.A ?? q.options.A ?? '',
              B: parsed.B ?? q.options.B ?? '',
              C: parsed.C ?? q.options.C ?? '',
              D: parsed.D ?? q.options.D ?? '',
              E: parsed.E ?? q.options.E ?? '',
              F: parsed.F ?? q.options.F ?? '',
            },
          };
        } catch {
          return q;
        }
      }),
    }));

    const extras = (configRows ?? [])
      .filter((r) => r.configKey.startsWith('question_extra_'))
      .map((r) => {
        try {
          return JSON.parse(r.configValue) as {
            id: number;
            chapterId: number;
            text: string;
            questionType?: 'multiple-choice' | 'open-end';
            A?: string;
            B?: string;
            C?: string;
            D?: string;
            E?: string;
            F?: string;
            sensoryType?: '視覺' | '聽覺' | '嗅覺' | '觸覺';
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{
      id: number;
      chapterId: number;
      text: string;
      questionType?: 'multiple-choice' | 'open-end';
      A?: string;
      B?: string;
      C?: string;
      D?: string;
      E?: string;
      F?: string;
      sensoryType?: '視覺' | '聽覺' | '嗅覺' | '觸覺';
    }>;

    return base.map((chapter) => ({
      ...chapter,
      questions: [
        ...chapter.questions,
        ...extras
          .filter((q) => q.chapterId === chapter.id)
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
          })),
      ],
    }));
  }, [configRows, savedMap]);

  const allQuestions = mergedQuestions.flatMap((c) => c.questions);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<
    Record<number, { text: string; A: string; B: string; C: string; D: string; E: string; F: string }>
  >({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState<{
    chapterId: number;
    text: string;
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
    F: string;
    sensoryType: '視覺' | '聽覺' | '嗅覺' | '觸覺';
    questionType: 'multiple-choice' | 'open-end';
  }>({
    chapterId: 1,
    text: '',
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
    F: '',
    sensoryType: '視覺',
    questionType: 'multiple-choice',
  });

  const handleEdit = (qId: number) => {
    const q = allQuestions.find((item) => item.id === qId);
    if (!q) return;

    setDrafts((prev) => ({
      ...prev,
      [qId]: {
        text: q.text,
        A: q.options.A ?? '',
        B: q.options.B ?? '',
        C: q.options.C ?? '',
        D: q.options.D ?? '',
        E: q.options.E ?? '',
        F: q.options.F ?? '',
      },
    }));
    setEditingId(qId);
  };

  const handleSave = (qId: number) => {
    const draft = drafts[qId];
    if (!draft) return;
    setConfigMutation.mutate({ key: `question_${qId}`, value: JSON.stringify(draft) });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
          點擊「編輯」修改題目，或點擊「+ 新增題目」加入題目。額外新增的題目可以刪除。
        </p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-shrink-0 px-4 py-1.5 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase"
          style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
        >
          + 新增題目
        </button>
      </div>

      {showAddForm && (
        <div
          className="rounded-sm p-4 space-y-3 border border-[#D4A843]/30"
          style={{ background: 'rgba(212,168,67,0.05)' }}
        >
          <p className="text-[#D4A843] text-xs tracking-wider uppercase font-['DM_Sans']">+ 新增題目</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
                章節
              </label>
              <select
                value={newQ.chapterId}
                onChange={(e) => setNewQ((p) => ({ ...p, chapterId: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0D1B2E' }}>
                    {c.title}：{c.subtitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
                感官類型
              </label>
              <select
                value={newQ.sensoryType}
                onChange={(e) =>
                  setNewQ((p) => ({ ...p, sensoryType: e.target.value as '視覺' | '聽覺' | '嗅覺' | '觸覺' }))
                }
                className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {['視覺', '聽覺', '嗅覺', '觸覺'].map((t) => (
                  <option key={t} value={t} style={{ background: '#0D1B2E' }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
                題型
              </label>
              <select
                value={newQ.questionType}
                onChange={(e) =>
                  setNewQ((p) => ({ ...p, questionType: e.target.value as 'multiple-choice' | 'open-end' }))
                }
                className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                <option value="multiple-choice" style={{ background: '#0D1B2E' }}>
                  選擇題 (A–F)
                </option>
                <option value="open-end" style={{ background: '#0D1B2E' }}>
                  開放式問題
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
              題目文字
            </label>
            <textarea
              value={newQ.text}
              onChange={(e) => setNewQ((p) => ({ ...p, text: e.target.value }))}
              rows={2}
              placeholder="請輸入題目..."
              className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 resize-none placeholder:text-white/20"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            />
          </div>

          {newQ.questionType === 'multiple-choice' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((opt) => (
                <div key={opt}>
                  <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
                    選項 {opt}
                  </label>
                  <input
                    type="text"
                    value={newQ[opt]}
                    onChange={(e) => setNewQ((p) => ({ ...p, [opt]: e.target.value }))}
                    placeholder={`選項 ${opt}...`}
                    className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 placeholder:text-white/20"
                    style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-xs italic" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              開放式問題：用戶可自由輸入文字回答，答案會記錄在後台數據中。
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => addQuestionMutation.mutate(newQ)}
              disabled={
                addQuestionMutation.isPending ||
                !newQ.text ||
                (newQ.questionType === 'multiple-choice' &&
                  (!newQ.A || !newQ.B || !newQ.C || !newQ.D || !newQ.E || !newQ.F))
              }
              className="px-4 py-1.5 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
            >
              新增
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-white/40 text-xs tracking-wider uppercase border border-white/10 hover:border-white/20 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {mergedQuestions.map((chapter) => (
        <div key={chapter.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D4A843]/15" />
            <span className="text-[#D4A843]/50 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
              {chapter.title}：{chapter.subtitle}
            </span>
            <div className="h-px flex-1 bg-[#D4A843]/15" />
          </div>

          {chapter.questions.map((q) => (
            <div
              key={q.id}
              className="rounded-sm p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {editingId === q.id ? (
                <>
                  <div>
                    <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
                      題目
                    </label>
                    <textarea
                      value={drafts[q.id]?.text ?? q.text}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [q.id]: { ...p[q.id], text: e.target.value } }))
                      }
                      rows={2}
                      className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 resize-none"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    />
                  </div>

                  {q.questionType !== 'open-end' &&
                    (['A', 'B', 'C', 'D', 'E', 'F'] as const).map((opt) => (
                      <div key={opt}>
                        <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">
                          選項 {opt}
                        </label>
                        <input
                          type="text"
                          value={drafts[q.id]?.[opt] ?? q.options[opt] ?? ''}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [q.id]: { ...p[q.id], [opt]: e.target.value } }))
                          }
                          className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40"
                          style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                        />
                      </div>
                    ))}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(q.id)}
                      disabled={setConfigMutation.isPending}
                      className="px-4 py-1.5 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      儲存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 text-white/40 text-xs tracking-wider uppercase border border-white/10 hover:border-white/20 transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-white/80 text-sm leading-relaxed" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                      {q.id >= 100 ? '[額外] ' : `Q${q.id}. `}
                      {q.text}
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(q.id)}
                        className="px-3 py-1 text-[#D4A843]/60 text-[10px] tracking-wider uppercase border border-[#D4A843]/20 hover:border-[#D4A843]/50 hover:text-[#D4A843] transition-colors rounded-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        編輯
                      </button>
                      {q.id >= 100 && (
                        <button
                          onClick={() => {
                            if (confirm('確定刪除這個題目？')) removeQuestionMutation.mutate({ id: q.id });
                          }}
                          disabled={removeQuestionMutation.isPending}
                          className="px-3 py-1 text-red-400/60 text-[10px] tracking-wider uppercase border border-red-400/20 hover:border-red-400/50 hover:text-red-400 transition-colors rounded-sm disabled:opacity-40"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  </div>

                  {q.questionType === 'open-end' ? (
                    <p className="text-white/35 text-xs italic" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      開放式問題
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((opt) => (
                        <p key={opt} className="text-white/40 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                          <span className="text-[#D4A843]/40 mr-2 font-['DM_Sans']">{opt}.</span>
                          {q.options[opt] ?? ''}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Password Login Screen ───────────────────────────────────────────────────
function AdminLoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
      }
      toast.success('登入成功');
      onSuccess();
    },
    onError: (err) => toast.error(err.message || '密碼錯誤'),
  });

  return (
    <div className="min-h-screen bg-[#0D1B2E] flex flex-col items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-sm p-8"
        style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.2)' }}
      >
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="h-px w-8 bg-[#D4A843]/40" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">Admin</span>
          <div className="h-px w-8 bg-[#D4A843]/40" />
        </div>

        <h1 className="text-xl font-bold text-white text-center mb-1" style={{ fontFamily: "'Noto Serif TC', serif" }}>
          城木紅磡 2 周年
        </h1>
        <p className="text-white/40 text-xs text-center mb-8 font-['DM_Sans'] tracking-widest uppercase">後台管理系統</p>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="請輸入管理員密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loginMutation.mutate({ password })}
              className="w-full bg-white/5 border border-[#D4A843]/20 text-white placeholder-white/30 px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-[#D4A843]/50 pr-12"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
            >
              {showPw ? '隱藏' : '顯示'}
            </button>
          </div>

          <button
            onClick={() => loginMutation.mutate({ password })}
            disabled={loginMutation.isPending || !password}
            className="w-full py-3 text-[#0D1B2E] font-semibold text-sm tracking-[0.2em] uppercase transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A843, #E8C56A)',
              fontFamily: "'DM Sans', sans-serif",
              clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
            }}
          >
            {loginMutation.isPending ? '驗證中...' : '登入後台'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-[#D4A843]/40 text-xs tracking-widest uppercase font-['DM_Sans'] hover:text-[#D4A843]/70 transition-colors"
          >
            ← 返回測驗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
type Tab = 'submissions' | 'questions' | 'chapters' | 'images' | 'colors' | 'formcopy' | 'results';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('submissions');
  const { data: authCheck, isLoading, refetch } = trpc.adminAuth.check.useQuery();

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem('admin_token');
      refetch();
      toast.success('已登出');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center">
        <p className="text-[#D4A843]/60 text-sm font-['DM_Sans'] tracking-widest">LOADING...</p>
      </div>
    );
  }

  if (!authCheck?.isAdmin) {
    return <AdminLoginScreen onSuccess={() => refetch()} />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'submissions', label: '抽獎數據' },
    { id: 'questions', label: '題目管理' },
    { id: 'chapters', label: '章節文案' },
    { id: 'images', label: '圖片管理' },
    { id: 'colors', label: '顏色設定' },
    { id: 'formcopy', label: '表單文案' },
    { id: 'results', label: '結果管理' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1B2E] py-8 px-4">
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-[#D4A843]/40" />
          <span className="text-[#D4A843] text-xs tracking-[0.3em] font-['DM_Sans'] uppercase">Admin Dashboard</span>
          <div className="h-px w-8 bg-[#D4A843]/40" />
        </div>

        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Noto Serif TC', serif" }}>
          城木紅磡 2 周年 · 後台管理
        </h1>

        <div className="mt-1 flex items-center gap-3">
          <a
            href="/"
            className="text-[#D4A843]/50 text-xs tracking-wider uppercase font-['DM_Sans'] hover:text-[#D4A843] transition-colors"
          >
            返回測驗 →
          </a>
          <span className="text-white/20 text-xs">·</span>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-white/30 text-xs tracking-wider uppercase font-['DM_Sans'] hover:text-white/60 transition-colors"
          >
            登出
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex gap-1 mb-6 border-b border-[#D4A843]/15 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase transition-all whitespace-nowrap"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: activeTab === tab.id ? '#D4A843' : 'rgba(255,255,255,0.35)',
                borderBottom: activeTab === tab.id ? '2px solid #D4A843' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'chapters' && <ChaptersTab />}
        {activeTab === 'images' && <ImagesTab />}
        {activeTab === 'colors' && <ColorsTab />}
        {activeTab === 'formcopy' && <FormCopyTab />}
        {activeTab === 'results' && <ResultsTab />}
      </div>
    </div>
  );
}
