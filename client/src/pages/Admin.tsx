/*
 * Admin Dashboard - Urbanwood Hung Hom 2nd Anniversary Quiz
 * Features: View submissions, download CSV, edit questions, change images
 * Access: Admin role only
 */

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { chapters, results, type AnswerType } from '@/lib/quizData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) { toast.error('沒有數據可下載'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = String(r[h] ?? '').replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
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

// ─── Image Uploader ──────────────────────────────────────────────────────────
async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: 'image/jpeg' | 'image/webp';
  }
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.72,
    outputType = 'image/jpeg',
  } = options || {};

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('讀取圖片失敗'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('圖片載入失敗'));
    image.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('無法處理圖片');

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(outputType, quality);
}

function ImageUploader({ onUploaded, currentUrl }: { onUploaded: (url: string) => void; currentUrl?: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [urlInput, setUrlInput] = useState(currentUrl ?? '');

  useEffect(() => {
    setPreview(currentUrl ?? '');
    setUrlInput(currentUrl ?? '');
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('請選擇圖片檔案'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('圖片不能超過 10MB'); return; }

    setUploading(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.72,
        outputType: 'image/jpeg',
      });
      setPreview(compressed);
      setUrlInput(compressed);
      onUploaded(compressed);
      toast.success('圖片已自動壓縮並保存！');
    } catch (err) {
      toast.error('上傳失敗：' + String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = () => {
    const value = urlInput.trim();
    if (!value) { toast.error('請輸入圖片 URL'); return; }
    setPreview(value);
    onUploaded(value);
    toast.success('圖片 URL 已更新！');
  };

  return (
    <div className="space-y-3">
      <label
        className="flex flex-col items-center justify-center w-full h-28 rounded-sm cursor-pointer transition-all hover:border-[#D4A843]/50"
        style={{ border: '2px dashed rgba(212,168,67,0.25)', background: 'rgba(255,255,255,0.02)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {uploading ? (
          <span className="text-[#D4A843]/60 text-xs font-['DM_Sans']">壓縮及保存中...</span>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-2 opacity-40"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 8 12 3 7 8" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round"/></svg>
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

      <p className="text-white/35 text-[10px] leading-relaxed" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
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
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard label="總提交數" value={stats.total} />
          <StatsCard label="慢活旅人" value={stats.byResult.A} sub={`${stats.total ? Math.round(stats.byResult.A / stats.total * 100) : 0}%`} />
          <StatsCard label="街坊美食家" value={stats.byResult.B} sub={`${stats.total ? Math.round(stats.byResult.B / stats.total * 100) : 0}%`} />
          <StatsCard label="鏡頭探索家" value={stats.byResult.C} sub={`${stats.total ? Math.round(stats.byResult.C / stats.total * 100) : 0}%`} />
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatsCard label="Instagram 參加者" value={stats.byPlatform.instagram} />
          <StatsCard label="Facebook 參加者" value={stats.byPlatform.facebook} />
        </div>
      )}

      {/* Download button */}
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

      {/* Table */}
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
                  <th key={h} className="text-left py-2 px-3 text-[#D4A843]/60 text-[10px] tracking-[0.15em] uppercase font-['DM_Sans'] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/[0.02] transition-colors">
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
    { key: 'hero_bg', label: '首頁背景圖', defaultUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409108373/2KCqDLHQeHBQMW8Q6pJeXC/hero-bg-XS9H5NH3aLyjCXKGtNcwKc.webp' },
    ...chapters.map((c) => ({
      key: `chapter_${c.id}_bg`,
      label: `${c.title}：${c.subtitle} 背景圖`,
      defaultUrl: c.bgImage,
    })),
  ];

  const [urls, setUrls] = useState<Record<string, string>>(() =>
    Object.fromEntries(imageKeys.map((k) => [k.key, k.defaultUrl]))
  );

  const handleSave = (key: string) => {
    const url = urls[key];
    if (!url.trim()) { toast.error('請輸入圖片連結'); return; }
    setConfigMutation.mutate({ key, value: url.trim() });
  };

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        點擊或拖放圖片直接上傳，上傳後自動儲存。也可手動輸入圖片 URL 再點「儲存」。
      </p>
      {imageKeys.map((item) => (
        <div key={item.key} className="space-y-2">
          <label className="block text-[#D4A843]/70 text-[10px] tracking-[0.2em] uppercase font-['DM_Sans']">
            {item.label}
          </label>
          <ImageUploader
            currentUrl={urls[item.key]}
            onUploaded={(url) => {
              setUrls((prev) => ({ ...prev, [item.key]: url }));
              setConfigMutation.mutate({ key: item.key, value: url });
            }}
          />
          <div className="flex gap-2 mt-1">
            <input
              type="url"
              value={urls[item.key]}
              onChange={(e) => setUrls((prev) => ({ ...prev, [item.key]: e.target.value }))}
              placeholder="或手動輸入圖片 URL..."
              className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={() => handleSave(item.key)}
              disabled={setConfigMutation.isPending}
              className="px-4 py-2 text-[#0D1B2E] text-xs font-semibold tracking-wider uppercase disabled:opacity-50"
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

// ───// ─── Colors Tab ───────────────────────────────────────────────────────────
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

  // Load saved values from DB, fall back to defaults
  const savedMap = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(colorSettings.map((s) => [s.key, s.defaultValue]))
  );

  // Sync values from DB once loaded
  const [synced, setSynced] = useState(false);
  if (!synced && configRows) {
    const loaded = Object.fromEntries(
      colorSettings.map((s) => [s.key, savedMap[s.key] ?? s.defaultValue])
    );
    setValues(loaded);
    setSynced(true);
  }

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
          <p className="text-white/30 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>{setting.desc}</p>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={values[setting.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
              placeholder={setting.defaultValue}
              className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm placeholder:text-white/20 focus:outline-none focus:border-[#D4A843]/40 transition-colors font-['DM_Sans']"
            />
            {/* Color preview swatch */}
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

      {/* Reset to default */}
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

// ─── Form Copy Tab ──────────────────────────────────────────────────────────
function FormCopyTab() {
  const utils = trpc.useUtils();
  const { data: configRows } = trpc.quiz.getConfig.useQuery();
  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => { utils.quiz.getConfig.invalidate(); toast.success('已儲存！'); },
    onError: (err) => toast.error('儲存失敗：' + err.message),
  });

  const fields = [
    {
      key: 'form_intro_zh',
      label: '表單說明（中文）',
      defaultValue: '感謝您參加本次心理測驗！請根據以下要求提交您的相關資料以作參加抽獎。閣下必須細閱及遵守條款及細則，而閣下的參與及遞交該表格將代表已閱讀及同意各項條款及細則。',
      multiline: true,
    },
    {
      key: 'form_intro_en',
      label: '表單說明（英文）',
      defaultValue: 'Thank you for participating in this psychological test! Please provide the relevant information as per the requirements below to register the giveaway. You must carefully read and comply with the Terms and Conditions. Your participation and submission of this form will signify that you have read, understood, and agreed to all the stated terms and conditions.',
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
      defaultValue: '本人願意提供上述個人資料，並同意使用我的電郵地址，用於發送直接促銷訊息，包括產品推廣、折扣活動及相關資訊。本人明白可隨時取消訂閱。',
      multiline: true,
    },
    {
      key: 'form_consent_en',
      label: '個人資料同意聲明（英文）',
      defaultValue: 'I consent to the collection and use of my contact information for direct marketing purposes, including promotions and news. I understand that I can withdraw my consent at any time.',
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

  const savedMap = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue]))
  );
  const [synced, setSynced] = useState(false);
  if (!synced && configRows) {
    setValues(Object.fromEntries(fields.map((f) => [f.key, savedMap[f.key] ?? f.defaultValue])));
    setSynced(true);
  }

  const handleSync = () => {
    setValues(Object.fromEntries(fields.map((f) => [f.key, savedMap[f.key] ?? f.defaultValue])));
  };

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
    onSuccess: () => { utils.quiz.getConfig.invalidate(); toast.success('已儲存！'); },
    onError: (err) => toast.error('儲存失敗：' + err.message),
  });

  type ResultId = 'A' | 'B' | 'C';
  const resultIds: ResultId[] = ['A', 'B', 'C'];
  const resultLabels: Record<ResultId, string> = { A: '慢活旅人', B: '街坊美食家', C: '鏡頭探索家' };

  const resultFields = [
    { suffix: 'name', label: '名稱（中文）' },
    { suffix: 'nameEn', label: '名稱（英文）' },
    { suffix: 'tagline', label: 'Tagline' },
    { suffix: 'sensoryProfile', label: '感官描述', multiline: true },
    { suffix: 'urbanwoodMatch', label: '城木配對說明', multiline: true },
    { suffix: 'resultImage', label: '結果圖片（顯示於登機證上方）' },
    { suffix: 'boardingPassImage', label: '登機證自訂圖片（上傳後直接覆蓋現有登機證設計）' },
  ];

  const savedMap = Object.fromEntries((configRows ?? []).map((r) => [r.configKey, r.configValue]));
  const defaultValues: Record<ResultId, Record<string, string>> = {
    A: { name: '慢活旅人', nameEn: 'Slow Life Wanderer', tagline: '走得慢，感受得最深。', sensoryProfile: '你對聲音與氣味極度敏感。你不喜歡走馬看花，反而享受在觀音廟聞著檀香沉思，或在海濱聽著海浪聲發呆。每一個細節，都是你與城市對話的方式。', urbanwoodMatch: '城木酒店的木系簡約設計，正是你洗滌心靈的最佳避風港。在這裡，你能找到城市中最珍貴的寧靜。', resultImage: '', boardingPassImage: '' },
    B: { name: '街坊美食家', nameEn: 'Neighbourhood Gourmet', tagline: '最好的餐廳，從來沒有招牌。', sensoryProfile: '你的旅行是由味蕾主導的！從冰室的奶茶香到街邊的雞蛋仔，紅磡的「煙火氣」是你最愛的城市味道。哪裡有美食，哪裡就有你的身影。', urbanwoodMatch: '住在城木，你就像擁有了紅磡美食的「任意門」。帶著滿足的胃回到舒適的房間，是你最完美的旅行節奏。', resultImage: '', boardingPassImage: '' },
    C: { name: '鏡頭探索家', nameEn: 'Lens Explorer', tagline: '用鏡頭捕捉光影，用影像記錄相遇。', sensoryProfile: '你擁有一雙發現美的眼睛。斑駁的唐樓、黃昏的海濱、充滿設計感的酒店角落，都是你鏡頭下的主角。你喜歡用影像說故事，讓每個瞬間永恆。', urbanwoodMatch: '城木酒店每個充滿美學細節的角落，都是你的專屬攝影棚。在這裡，你能捕捉到最具質感的旅行瞬間。', resultImage: '', boardingPassImage: '' },
  };

  const [values, setValues] = useState<Record<ResultId, Record<string, string>>>(() =>
    JSON.parse(JSON.stringify(defaultValues))
  );
  const [synced, setSynced] = useState(false);
  if (!synced && configRows) {
    const loaded: typeof values = JSON.parse(JSON.stringify(defaultValues));
    resultIds.forEach((id) => {
      resultFields.forEach((f) => {
        const key = `result_${id}_${f.suffix}`;
        if (savedMap[key]) loaded[id][f.suffix] = savedMap[key];
      });
    });
    setValues(loaded);
    setSynced(true);
  }

  return (
    <div className="space-y-8">
      <p className="text-white/50 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
        修改三種旅人類型的名稱、描述及結果圖片。結果圖片可填入圖床 URL，將顯示於登機證上方。
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
              {field.suffix !== 'resultImage' && field.suffix !== 'boardingPassImage' && (
                <div className="flex gap-2 items-start">
                  {field.multiline ? (
                    <textarea
                      value={values[id][field.suffix]}
                      onChange={(e) => setValues((prev) => ({ ...prev, [id]: { ...prev[id], [field.suffix]: e.target.value } }))}
                      rows={3}
                      className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 resize-none"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[id][field.suffix]}
                      onChange={(e) => setValues((prev) => ({ ...prev, [id]: { ...prev[id], [field.suffix]: e.target.value } }))}
                      className="flex-1 bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    />
                  )}
                  <button
                    onClick={() => setConfigMutation.mutate({ key: `result_${id}_${field.suffix}`, value: values[id][field.suffix] })}
                    disabled={setConfigMutation.isPending}
                    className="px-3 py-2 text-[#0D1B2E] text-[10px] font-semibold tracking-wider uppercase disabled:opacity-50 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D4A843, #E8C56A)', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    儲存
                  </button>
                </div>
              )}
              {/* Image upload for resultImage and boardingPassImage */}
              {(field.suffix === 'resultImage' || field.suffix === 'boardingPassImage') && (
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

// ─── Questions Tab ────────────────────────────────────────────
function QuestionsTab() {
  const utils = trpc.useUtils();
  const setConfigMutation = trpc.admin.setConfig.useMutation({
    onSuccess: () => { utils.quiz.getConfig.invalidate(); toast.success('題目已更新！'); },
    onError: (err) => toast.error('更新失敗：' + err.message),
  });
  const addQuestionMutation = trpc.admin.addQuestion.useMutation({
    onSuccess: () => { utils.quiz.getConfig.invalidate(); toast.success('題目已新增！'); setShowAddForm(false); setNewQ({ chapterId: 1, text: '', A: '', B: '', C: '', sensoryType: '視覺', questionType: 'multiple-choice' }); },
    onError: (err) => toast.error('新增失敗：' + err.message),
  });
  const removeQuestionMutation = trpc.admin.removeQuestion.useMutation({
    onSuccess: () => { utils.quiz.getConfig.invalidate(); toast.success('題目已刪除'); },
    onError: (err) => toast.error('刪除失敗：' + err.message),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { text: string; A: string; B: string; C: string }>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState<{ chapterId: number; text: string; A: string; B: string; C: string; sensoryType: '視覺' | '聽覺' | '嗅覺' | '觸覺'; questionType: 'multiple-choice' | 'open-end' }>({
    chapterId: 1, text: '', A: '', B: '', C: '', sensoryType: '視覺', questionType: 'multiple-choice',
  });

  const allQuestions = chapters.flatMap((c) => c.questions);

  const handleEdit = (qId: number) => {
    const q = allQuestions.find((q) => q.id === qId)!;
    setDrafts((prev) => ({ ...prev, [qId]: { text: q.text, A: q.options.A, B: q.options.B, C: q.options.C } }));
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
      <div className="flex items-center justify-between">
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

      {/* Add Question Form */}
      {showAddForm && (
        <div className="rounded-sm p-4 space-y-3 border border-[#D4A843]/30" style={{ background: 'rgba(212,168,67,0.05)' }}>
          <p className="text-[#D4A843] text-xs tracking-wider uppercase font-['DM_Sans']">+ 新增題目</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">章節</label>
              <select
                value={newQ.chapterId}
                onChange={(e) => setNewQ((p) => ({ ...p, chapterId: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0D1B2E' }}>{c.title}：{c.subtitle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">感官類型</label>
              <select
                value={newQ.sensoryType}
                onChange={(e) => setNewQ((p) => ({ ...p, sensoryType: e.target.value as '視覺' | '聽覺' | '嗅覺' | '觸覺' }))}
                className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {['視覺', '聽覺', '嗅覺', '觸覺'].map((t) => (
                  <option key={t} value={t} style={{ background: '#0D1B2E' }}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">題型</label>
              <select
                value={newQ.questionType}
                onChange={(e) => setNewQ((p) => ({ ...p, questionType: e.target.value as 'multiple-choice' | 'open-end' }))}
                className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-xs px-3 py-2 rounded-sm focus:outline-none"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                <option value="multiple-choice" style={{ background: '#0D1B2E' }}>選擇題 (A/B/C)</option>
                <option value="open-end" style={{ background: '#0D1B2E' }}>開放式問題</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">題目文字</label>
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
            (['A', 'B', 'C'] as const).map((opt) => (
              <div key={opt}>
                <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">選項 {opt}</label>
                <input
                  type="text"
                  value={newQ[opt]}
                  onChange={(e) => setNewQ((p) => ({ ...p, [opt]: e.target.value }))}
                  placeholder={`選項 ${opt}...`}
                  className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 placeholder:text-white/20"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                />
              </div>
            ))
          ) : (
            <p className="text-white/30 text-xs italic" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              開放式問題：用戶可自由輸入文字回答，答案會記錄在後台數據中。
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => addQuestionMutation.mutate(newQ)}
              disabled={addQuestionMutation.isPending || !newQ.text || (newQ.questionType === 'multiple-choice' && (!newQ.A || !newQ.B || !newQ.C))}
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

      {chapters.map((chapter) => (
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
                    <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">題目</label>
                    <textarea
                      value={drafts[q.id]?.text ?? q.text}
                      onChange={(e) => setDrafts((p) => ({ ...p, [q.id]: { ...p[q.id], text: e.target.value } }))}
                      rows={2}
                      className="w-full bg-white/5 border border-[#D4A843]/20 text-white text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4A843]/40 resize-none"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                    />
                  </div>
                  {(['A', 'B', 'C'] as const).map((opt) => (
                    <div key={opt}>
                      <label className="block text-[#D4A843]/50 text-[9px] tracking-[0.2em] uppercase mb-1 font-['DM_Sans']">選項 {opt}</label>
                      <input
                        type="text"
                        value={drafts[q.id]?.[opt] ?? q.options[opt]}
                        onChange={(e) => setDrafts((p) => ({ ...p, [q.id]: { ...p[q.id], [opt]: e.target.value } }))}
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
                      {q.id >= 100 ? '[額外] ' : `Q${q.id}. `}{q.text}
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
                          onClick={() => { if (confirm('確定刪除這個題目？')) removeQuestionMutation.mutate({ id: q.id }); }}
                          disabled={removeQuestionMutation.isPending}
                          className="px-3 py-1 text-red-400/60 text-[10px] tracking-wider uppercase border border-red-400/20 hover:border-red-400/50 hover:text-red-400 transition-colors rounded-sm disabled:opacity-40"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(['A', 'B', 'C'] as const).map((opt) => (
                      <p key={opt} className="text-white/40 text-xs" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                        <span className="text-[#D4A843]/40 mr-2 font-['DM_Sans']">{opt}.</span>{q.options[opt]}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Password Login Screen ─────────────────────────────────────────────────────────────────
function AdminLoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      // Store token in localStorage so Authorization header can be set
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
          <a href="/" className="text-[#D4A843]/40 text-xs tracking-widest uppercase font-['DM_Sans'] hover:text-[#D4A843]/70 transition-colors">
            ← 返回測驗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────────────
type Tab = 'submissions' | 'questions' | 'images' | 'colors' | 'formcopy' | 'results';

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
    { id: 'images', label: '圖片管理' },
    { id: 'colors', label: '顏色設定' },
    { id: 'formcopy', label: '表單文案' },
    { id: 'results', label: '結果管理' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1B2E] py-8 px-4">
      {/* Header */}
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
          <a href="/" className="text-[#D4A843]/50 text-xs tracking-wider uppercase font-['DM_Sans'] hover:text-[#D4A843] transition-colors">
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

      {/* Tabs */}
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-1 mb-6 border-b border-[#D4A843]/15">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase transition-all"
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

        {/* Tab content */}
        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'images' && <ImagesTab />}
        {activeTab === 'colors' && <ColorsTab />}
        {activeTab === 'formcopy' && <FormCopyTab />}
        {activeTab === 'results' && <ResultsTab />}
      </div>
    </div>
  );
}
