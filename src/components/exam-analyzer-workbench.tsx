"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ExamAnalysis, ExamQuestion, UploadPhase } from "@/types/exam";

type AnalyzePayload = {
  analysis: ExamAnalysis;
  fileName: string;
  fileSize: number;
};

const acceptMime = "application/pdf";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current stroke-[1.6]">
      <path d="M12 16V4m0 0-4 4m4-4 4 4M5 14.5V17a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="h-4 w-4 fill-none stroke-current stroke-[1.7]"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

function SkeletonBlock({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      className="border-b border-[--line] pb-5"
    >
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-20 bg-[--ink-soft]" />
        <div className="h-6 w-3/4 bg-[--ink-faint]" />
        <div className="h-3 w-full bg-[--ink-faint]" />
        <div className="h-3 w-10/12 bg-[--ink-faint]" />
      </div>
    </motion.div>
  );
}

function InfoSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-t border-[--line] pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--muted]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="border border-[--line] bg-[--paper] px-2.5 py-1.5 text-xs text-[--ink]">
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-[--muted]">无</span>
        )}
      </div>
    </section>
  );
}

function QuestionCard({
  question,
  index,
  isOpen,
  onToggle,
}: {
  question: ExamQuestion;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      className="border-b border-[--line]"
    >
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full gap-4 px-0 py-5 text-left hover:bg-black/[0.015] md:grid-cols-[88px_1fr_24px]"
      >
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[--muted] flex items-center flex-wrap gap-1.5">
              <span className={`confidence-dot confidence-dot--${question.confidence}`} />
              <span className="channel-tag">CH{index + 1}</span>
              {question.number}
            </p>
          {question.score ? <p className="mt-1 text-xs text-[--muted]">{question.score}</p> : null}
        </div>

        <div>
          <h3 className="font-serif text-2xl leading-tight tracking-[-0.02em] text-[--ink]">{question.coreTopic}</h3>
          <p className="mt-2 text-sm leading-7 text-[--ink-subtle]">{question.summary}</p>
        </div>

        <div className="pt-1 text-[--ink-subtle]">
          <Chevron open={isOpen} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="grid gap-8 border-t border-[--line] py-5 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--muted]">最终答案</p>
                  <p className="mt-3 text-base leading-8 text-[--ink]">{question.finalAnswer}</p>
                </div>

                <div className="relative isolate">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--muted]">推导步骤</p>
                  <div className="relative mt-5">
                    <div className="absolute bottom-4 left-[13px] top-1 w-[2px] bg-[--line-strong] opacity-40" />
                    <ol className="relative space-y-5">
                      {question.steps.map((step, stepIndex) => (
                        <li key={step} className="relative z-10 grid grid-cols-[28px_1fr] items-start gap-4 text-sm leading-7 text-[--ink-subtle]">
                          <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 border-[--line-strong] bg-[--paper] text-[11px] font-bold text-[--ink] shadow-[inset_0_0_8px_rgba(0,0,0,0.03)]">
                            {stepIndex + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-4 xl:border-l xl:border-[--line] xl:pl-6">
                <InfoSection title="公式" items={question.formulas} />
                <InfoSection title="术语" items={question.terminology} />
                <InfoSection title="图表" items={question.chartInsights} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function PdfViewer({ url }: { url: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let loadingTask: any = null;

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
           pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        
        loadingTask = pdfjsLib.getDocument({
          url,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        });
        const doc = await loadingTask.promise;
        
        if (isActive) {
          setPdfDoc(doc);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "获取 PDF 错误");
        }
      }
    }
    loadPdf();

    return () => {
      isActive = false;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [url]);

  if (error) {
    return <div className="flex h-full items-center justify-center p-8 text-[--accent] text-sm font-semibold tracking-wider">系统错误: {error}</div>;
  }
  
  if (!pdfDoc) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--muted] animate-pulse">
          正在挂载光学解析器...
        </span>
      </div>
    );
  }

  const pages = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

  return (
    <div className="absolute inset-0 overflow-y-auto pb-12 pt-8 px-4 md:px-8 flex flex-col items-center z-10 custom-scrollbar mix-blend-multiply">
      {pages.map((pageNum) => (
        <PdfPage key={pageNum} pdfDoc={pdfDoc} pageNumber={pageNum} />
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PdfPage({ pdfDoc, pageNumber }: { pdfDoc: any; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderTask: any = null;
    let isActive = true;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!isActive) return;

        // 适当缩放以保证在高分屏下的清晰度
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (err) {
        if (err instanceof Error && err.name !== "RenderingCancelledException" && isActive) {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isActive = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <canvas
      ref={canvasRef}
      className="block max-w-full h-auto mb-8 shadow-[0_0_20px_rgba(0,0,0,0.06)] bg-white"
    />
  );
}

export function ExamAnalyzerWorkbench() {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<AnalyzePayload | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const [showBrainConfig, setShowBrainConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4.1",
    animationDelay: 0,
    animationSpeed: 0.6,
  });

  const fetchHistory = async () => {
    try {
      const resp = await fetch("/api/storage");
      const data = await resp.json();
      setHistoryItems(data);
    } catch (e) {
      console.error("加载历史记录失败", e);
    }
  };

  const loadFromHistory = async (id: string) => {
    try {
      setPhase("uploading");
      const resp = await fetch(`/api/storage?id=${id}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      setPayload(data.payload);
      setPdfUrl(data.pdfDataUrl);
      pdfUrlRef.current = data.pdfDataUrl;
      setOpenQuestionId(null);
      setPhase("complete");
      setShowHistory(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "从历史记录加载失败");
      setPhase("error");
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("exam-analyzer-api-config");
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        if (typeof parsed === "object" && parsed !== null) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setApiConfig((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  async function analyzeFile(file: File) {
    if (file.type !== acceptMime) {
      setPhase("error");
      setError("仅支持 PDF 文件。");
      return;
    }

    setError(null);
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }

    const pdfBlob = new Blob([file], { type: "application/pdf" });
    const nextPdfUrl = URL.createObjectURL(pdfBlob);
    pdfUrlRef.current = nextPdfUrl;
    setSelectedFile(file);
    setPdfUrl(nextPdfUrl);
    setPayload(null);
    setPhase("uploading");

    const cacheKey = `exam-cache-${file.name}-${file.size}-${apiConfig.model}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as AnalyzePayload;
        setPayload(parsed);
        setOpenQuestionId(null);
        setPhase("complete");
        return;
      }
    } catch (e) {
      console.warn("读取缓存失败", e);
    }

    try {
      startTransition(() => {
        setPhase("analyzing");
      });

      const pdfjsLib = await import("pdfjs-dist");
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
         pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
      
      const loadingTask = pdfjsLib.getDocument({
        url: nextPdfUrl,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      });
      const pdfDoc = await loadingTask.promise;
      const images: string[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;
          images.push(canvas.toDataURL("image/jpeg", 0.8));
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("apiBaseUrl", apiConfig.baseUrl);
      if (apiConfig.apiKey) formData.append("apiKey", apiConfig.apiKey);
      formData.append("model", apiConfig.model);
      images.forEach((img) => formData.append("images", img));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as AnalyzePayload & { error?: string; detail?: string };

      if (!response.ok) {
        throw new Error(result.detail || result.error || "识别失败");
      }

      // 等待设置的延迟时间后再显示结果
      if (apiConfig.animationDelay > 0) {
        setPhase("complete"); // 先切换到完成状态的基础结构
        setIsWaiting(true);
        await new Promise(resolve => setTimeout(resolve, apiConfig.animationDelay * 1000));
        setIsWaiting(false);
      }

      setPayload(result);
      setOpenQuestionId(null);
      setPhase("complete");

      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.warn("写入缓存失败", e);
      }

      // 自动保存到本地文件夹
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const pdfBase64 = reader.result as string;
          await fetch("/api/storage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: result, pdfBase64 }),
          });
        };
        reader.readAsDataURL(file);
      } catch (e) {
        console.error("自动保存到本地文件夹失败", e);
      }
    } catch (caughtError) {
      setPhase("error");
      setError(caughtError instanceof Error ? caughtError.message : "未知错误");
    }
  }

  function handleDrop(fileList: FileList | null) {
    const file = fileList?.[0];

    if (!file) {
      return;
    }

    void analyzeFile(file);
  }

  return (
    <div className="min-h-screen bg-[--page] circuit-dot-bg text-[--ink]">
      <main className="mx-auto max-w-[1720px] px-4 py-6 sm:px-6 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[--line-strong]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 border border-[--line-strong] bg-white text-[--accent]">
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1 L15 5 L15 11 L8 15 L1 11 L1 5 Z" />
              </svg>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[--ink] flex flex-col pt-0.5">
              <span>电子信息试卷</span>
              <span className="text-[9px] text-[--muted] tracking-[0.4em] -mt-1 opacity-70">阅读分析器</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowBrainConfig(true)}
            className="group relative inline-flex items-center gap-2.5 border border-[--line-strong] bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[--ink] hover:border-[--accent] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" className="text-[--ink] group-hover:text-[--accent] transition-colors" />
              <rect x="9" y="9" width="6" height="6" className="text-[--ink] group-hover:text-[--accent] transition-colors" />
              <line x1="9" y1="1" x2="9" y2="4" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="15" y1="1" x2="15" y2="4" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="9" y1="20" x2="9" y2="23" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="15" y1="20" x2="15" y2="23" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="20" y1="9" x2="23" y2="9" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="20" y1="14" x2="23" y2="14" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="1" y1="9" x2="4" y2="9" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <line x1="1" y1="14" x2="4" y2="14" className="text-[--muted] group-hover:text-[--accent] transition-colors" opacity="0.7" />
              <path d="M9 9 L15 15 M15 9 L9 15" className="text-[--muted] group-hover:text-[--line-strong] transition-colors" strokeWidth="1" opacity="0.4" />
            </svg>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold tracking-[0.12em] group-hover:text-[--accent] transition-colors">AI 引擎</span>
              {apiConfig.apiKey && apiConfig.model ? (
                <span className="hidden sm:inline text-[--muted] group-hover:text-[--accent] tracking-[0.08em] transition-colors">&middot; <span className="font-mono text-[11px]">{apiConfig.model}</span></span>
              ) : null}
            </span>
            <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
              {apiConfig.apiKey ? (
                <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" style={{ animationDuration: '1.8s' }} />
              ) : null}
              <span className={`relative inline-block w-1.5 h-1.5 rounded-full ${apiConfig.apiKey ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-[--ink-faint]'}`} />
            </span>
          </button>
        </div>
        <section className="grid gap-6 md:grid-cols-[220px_minmax(0,0.9fr)_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,0.95fr)_minmax(0,1.05fr)] xl:grid-cols-[320px_minmax(0,0.96fr)_minmax(0,1.04fr)]">
          <section className="relative overflow-hidden border border-[--line-strong] bg-white p-5 sm:p-6 md:self-start">
            <span className="screw-corner" style={{ top: 6, left: 6 }} />
            <span className="screw-corner" style={{ top: 6, right: 6 }} />
            <span className="screw-corner" style={{ bottom: 6, left: 6 }} />
            <span className="screw-corner" style={{ bottom: 6, right: 6 }} />

            <div className="flex items-center gap-2 mb-5">
              <span className="inline-block w-2 h-2 rounded-full bg-[--accent] shadow-[0_0_6px_var(--accent)] led-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[--muted]">系统就绪</span>
            </div>

            <div>
              <h1 className="font-serif text-4xl tracking-[-0.04em] text-[--ink] sm:text-[2.8rem]">识别</h1>
              <p className="mt-3 text-sm leading-7 text-[--ink-subtle]">这是电子信息试卷阅读器，支持上传 PDF、预览原文并展示识别结果。</p>
            </div>

            <div className="mt-5 flex flex-col gap-2 text-xs text-[--muted] md:text-[11px]">
              <span>格式：PDF</span>
              <span>模式：上传后自动识别</span>
              {selectedFile ? <span>文件：{selectedFile.name}</span> : null}
              {selectedFile ? (
                <span className="flex items-center gap-2">
                  <span>大小：</span>
                  <span className="led-display">{formatFileSize(selectedFile.size)}</span>
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex gap-3" aria-hidden="true">
              <svg viewBox="0 0 24 16" className="h-4 w-6 opacity-20" fill="none" style={{ stroke: 'var(--ink-soft)' }}>
                <path d="M2 8 h3 v4 h2 v-6 h2 v8 h2 v-10 h2 v6 h2 v-4 h2 v2 h2" strokeWidth="1.2" />
              </svg>
              <svg viewBox="0 0 20 16" className="h-4 w-5 opacity-20" fill="none" style={{ stroke: 'var(--ink-soft)' }}>
                <rect x="2" y="2" width="4" height="12" rx="0.5" strokeWidth="1" />
                <rect x="8" y="4" width="4" height="10" rx="0.5" strokeWidth="1" />
                <rect x="14" y="2" width="4" height="12" rx="0.5" strokeWidth="1" />
                <line x1="4" y1="1" x2="4" y2="0" strokeWidth="0.8" />
                <line x1="10" y1="3" x2="10" y2="1" strokeWidth="0.8" />
                <line x1="16" y1="1" x2="16" y2="0" strokeWidth="0.8" />
              </svg>
              <svg viewBox="0 0 24 14" className="h-4 w-6 opacity-20" fill="none" style={{ stroke: 'var(--ink-soft)' }}>
                <path d="M12 2 v10 M8 4 v6 M16 4 v6 M4 6 v2 M20 6 v2" strokeWidth="1" strokeLinecap="round" />
                <path d="M2 7 h20" strokeWidth="0.5" strokeDasharray="2 2" />
              </svg>
            </div>

            <button
              onClick={() => {
                setShowHistory(true);
                void fetchHistory();
              }}
              className="mt-6 w-full flex items-center justify-between group border border-[--line-strong] bg-white p-3 hover:border-[--accent] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-[--page] border border-[--line] group-hover:bg-[--accent-faint] transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[--muted] group-hover:text-[--accent]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider">本地历史库</div>
                  <div className="text-[9px] text-[--muted] mt-0.5">查看已保存的分析记录</div>
                </div>
              </div>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[--muted] group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={`mt-6 border-2 p-6 upload-zone transition-colors duration-300 ${dragActive ? "border-transparent drag-active rounded-xl" : "border-dashed border-[--line-strong] bg-[--paper] hover:border-[--accent] rounded-lg"}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  return;
                }
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleDrop(event.dataTransfer.files);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center border border-[--line-strong] bg-white text-[--ink]">
                  <UploadIcon />
                </div>
                <div>
                  <p className="text-sm leading-7 text-[--ink-subtle]">拖拽 PDF 到这里，或点击选择文件</p>
                  <p className="mt-1 text-xs text-[--muted]">仅支持单个 PDF 文件</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 inline-flex w-full items-center justify-center border border-[--ink] bg-[--ink] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-[--accent] hover:bg-[--accent]"
              >
                选择文件
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={acceptMime}
                className="hidden"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={(event) => handleDrop(event.target.files)}
              />
            </motion.div>

            <div className="mt-6" aria-hidden="true">
              <svg viewBox="0 0 200 100" className="w-full h-24 opacity-[0.12]" fill="none" style={{ stroke: 'var(--ink-soft)' }}>
                <rect x="80" y="28" width="30" height="24" rx="2" strokeWidth="1.2" />
                <circle cx="84" cy="32" r="1.5" fill="var(--ink-soft)" />
                <line x1="88" y1="28" x2="88" y2="20" strokeWidth="1" />
                <line x1="96" y1="28" x2="96" y2="20" strokeWidth="1" />
                <line x1="104" y1="28" x2="104" y2="20" strokeWidth="1" />
                <path d="M88 20 v-6 h-35 v10 h-25" strokeWidth="1.2" />
                <path d="M96 20 v-10 h25 v-4 h35" strokeWidth="1.2" />
                <path d="M80 40 h-20 v15 h-35" strokeWidth="1.2" />
                <path d="M110 40 h20 v-10 h30" strokeWidth="1.2" />
                <path d="M80 48 h-15 v20 h-40" strokeWidth="1.2" />
                <path d="M110 48 h30 v15 h25" strokeWidth="1.2" />
                <path d="M0 85 h25 v6 h40 v-6 h35 v6 h25" strokeWidth="1.2" />
                <circle cx="28" cy="24" r="3" className="flow-dot" style={{ '--speed': '2.8s' } as React.CSSProperties} />
                <circle cx="125" cy="26" r="3" className="flow-dot" style={{ '--speed': '3.2s', animationDelay: '0.3s' } as React.CSSProperties} />
                <circle cx="160" cy="14" r="3" />
                <circle cx="25" cy="55" r="3" className="flow-dot" style={{ '--speed': '2.2s', animationDelay: '0.6s' } as React.CSSProperties} />
                <circle cx="160" cy="30" r="3" />
                <circle cx="195" cy="45" r="3" />
                <circle cx="25" cy="68" r="3" className="flow-dot" style={{ '--speed': '3s', animationDelay: '1.0s' } as React.CSSProperties} />
                <circle cx="170" cy="63" r="3" />
                <circle cx="25" cy="91" r="3" />
                <circle cx="65" cy="91" r="3" className="flow-dot" style={{ '--speed': '2.4s', animationDelay: '0.8s' } as React.CSSProperties} />
                <circle cx="100" cy="91" r="3" />
              </svg>
            </div>
          </section>

          <section className="relative overflow-hidden border border-[--line-strong] bg-white p-5 md:min-w-0">
            <span className="screw-corner" style={{ top: 6, left: 6 }} />
            <span className="screw-corner" style={{ top: 6, right: 6 }} />
            <span className="screw-corner" style={{ bottom: 6, left: 6 }} />
            <span className="screw-corner" style={{ bottom: 6, right: 6 }} />

            <div className="border-b border-[--line] pb-4">
              <h2 className="font-serif text-3xl tracking-[-0.03em] text-[--ink]">预览</h2>
            </div>

            <div className="mt-5 relative h-[70vh] min-h-[620px] overflow-hidden border border-[--line-strong] bg-[#fbfaf6] oscilloscope-grid crt-scanlines crt-glow md:h-[calc(100vh-140px)] md:min-h-[760px] shadow-[inset_0_0_30px_rgba(0,0,0,0.03)]">
              {(phase === 'uploading' || phase === 'analyzing') ? <div className="scanning-laser" /> : null}
              {pdfUrl ? (
                <PdfViewer url={pdfUrl} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <svg viewBox="0 0 220 50" className="w-full max-w-[180px] opacity-40" fill="none">
                    <path d="M0 25 C8 3, 17 3, 25 25 C33 47, 42 47, 50 25 C58 3, 67 3, 75 25 C83 47, 92 47, 100 25 C108 3, 117 3, 125 25 C133 47, 142 47, 150 25 C158 3, 167 3, 175 25 C183 47, 192 47, 200 25 C208 3, 217 3, 225 25" stroke="var(--accent)" strokeWidth="1.5" className="waveform-scroll" opacity="0.6" />
                    <path d="M0 25 C8 47, 17 47, 25 25 C33 3, 42 3, 50 25 C58 47, 67 47, 75 25 C83 3, 92 3, 100 25 C108 47, 117 47, 125 25 C133 3, 142 3, 150 25" stroke="var(--accent)" strokeWidth="1" className="waveform-scroll" opacity="0.3" style={{ animationDirection: "reverse", animationDuration: "3s" }} />
                  </svg>
                  <span className="mt-4 text-xs tracking-[0.15em] text-[--muted]">等待信号输入</span>
                </div>
              )}
            </div>
          </section>

          <section className="border border-[--line-strong] bg-white p-5 md:min-w-0 chassis-vents relative overflow-hidden">
            <span className="screw-corner" style={{ top: 6, left: 6 }} />
            <span className="screw-corner" style={{ top: 6, right: 6 }} />
            <span className="screw-corner" style={{ bottom: 6, left: 6 }} />
            <span className="screw-corner" style={{ bottom: 6, right: 6 }} />

            <div className="border-b border-[--line] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-3xl tracking-[-0.03em] text-[--ink]">识别结果</h2>
                  <div className="flex items-end gap-[2px] h-5" aria-hidden="true">
                    {[1.3, 0.9, 1.5, 1.1, 1.7].map((dur, i) => (
                      <div
                        key={i}
                        className="eq-bar"
                        style={{ '--dur': `${dur}s`, animationDelay: `${i * 0.12}s` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>

                {payload ? (
                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload.analysis, null, 2));
                      const downloadAnchorNode = document.createElement("a");
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `${payload.fileName.replace(/\.pdf$/i, "")}-识别结果.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="flex items-center gap-1.5 border border-[--line-strong] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[--ink] hover:border-[--accent] hover:text-[--accent] transition-colors"
                    title="导出分析结果为 JSON 文件"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="1.8">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    保存
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 px-0.5 py-2.5 border-b border-[--line]">
              <span className="led-indicator">
                <span className="led led--on" />
                POWER
              </span>
              <span className="led-indicator">
                <span className="led led--sync" />
                SYNC
              </span>
              <span className="led-indicator">
                <span className={`led ${phase === 'analyzing' || phase === 'uploading' ? 'led--warn led-pulse' : phase === 'complete' || payload ? 'led--sync' : 'led--off'}`} />
                DATA
              </span>

            </div>

            <div className="mt-3 h-[70vh] min-h-[620px] overflow-y-auto pr-1 md:h-[calc(100vh-140px)] md:min-h-[760px]">
              {phase === "analyzing" || isPending ? (
                <div className="space-y-5">
                  <div className="border-b border-[--line] pb-5">
                    <p className="text-sm leading-7 text-[--ink-subtle]">正在识别 PDF 内容...</p>
                    <div className="mt-4 flex items-end gap-[3px] h-8">
                      {[1.4, 1.1, 1.6, 0.9, 1.8, 1.3, 1.5, 1.0].map((dur, i) => (
                        <motion.div
                          key={i}
                          className="w-[4px] rounded-t bg-[--accent]"
                          animate={{ scaleY: [0.15, 0.85, 0.3, 0.95, 0.15] }}
                          transition={{
                            repeat: Infinity,
                            duration: dur,
                            ease: "easeInOut",
                            delay: i * 0.1,
                          }}
                          style={{ transformOrigin: "bottom" }}
                        />
                      ))}
                    </div>
                  </div>

                  {[0, 1, 2].map((index) => (
                    <SkeletonBlock key={index} index={index} />
                  ))}
                </div>
              ) : null}

              {phase === "error" ? (
                <div className="border border-[#d3b8b1] bg-[#fff8f7] p-5 text-sm leading-7 text-[#7c5246]">{error}</div>
              ) : null}

              {isWaiting ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[--line-strong] opacity-10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-2 border-[--accent] animate-spin"
                      style={{ animationDuration: '0.8s' }}
                    />
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[--accent] animate-pulse" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" style={{ animationDuration: '1.5s' }} />
                    </svg>
                  </div>
                  <div className="mt-8 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[--ink] mb-2">
                       Synchronizing Data
                    </div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="w-1 h-1 rounded-full bg-[--accent] animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1 h-1 rounded-full bg-[--accent] animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 h-1 rounded-full bg-[--accent] animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="text-[9px] font-mono text-[--muted] uppercase tracking-widest ml-1">Loading Assets...</span>
                    </div>
                  </div>
                  <div className="mt-6 w-32 h-[1px] bg-gradient-to-r from-transparent via-[--line-strong] to-transparent" />
                </div>
              ) : null}

              {payload && !isWaiting ? (
                <div>
                  <section className="border-b border-[--line] pb-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm leading-7 text-[--ink-subtle]">{payload.analysis.examTitle}</p>
                      <span className="text-[9px] font-mono tracking-[0.12em] text-[--muted] bg-[--line] px-2 py-0.5 rounded">
                        {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[--muted]">
                      {payload.analysis.course} · {payload.analysis.totalQuestions} 题
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[--muted] shrink-0">信号强度</span>
                      <div className="flex-1 h-[3px] bg-[--line] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(40, 100 - payload.analysis.questions.reduce((s, q) => s + (q.confidence === 'high' ? 0 : q.confidence === 'medium' ? 1 : 2), 0) * 15)}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="h-full rounded-full bg-[--accent]"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="mt-2">
                    {payload.analysis.questions.map((question, index) => (
                      <div 
                        key={question.id} 
                        className="waterfall-item"
                        style={{
                          animationDelay: `${index * apiConfig.animationSpeed}s`,
                          animationDuration: `${apiConfig.animationSpeed}s`
                        }}
                      >
                        <QuestionCard
                          question={question}
                          index={index}
                          isOpen={openQuestionId === question.id}
                          onToggle={() => setOpenQuestionId((currentId) => (currentId === question.id ? null : question.id))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {phase === "idle" && !payload ? <div className="text-sm text-[--muted]">暂无识别结果</div> : null}
            </div>
          </section>
        </section>
      </main>

      {showBrainConfig ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center brain-config-overlay" onClick={() => setShowBrainConfig(false)}>
          <div className="relative w-full max-w-md mx-4 brain-config-panel p-6" onClick={(e) => e.stopPropagation()}>
            <span className="screw-corner" style={{ top: 6, left: 6, background: '#2a2520', borderColor: '#4a4440' }} />
            <span className="screw-corner" style={{ top: 6, right: 6, background: '#2a2520', borderColor: '#4a4440' }} />
            <span className="screw-corner" style={{ bottom: 6, left: 6, background: '#2a2520', borderColor: '#4a4440' }} />
            <span className="screw-corner" style={{ bottom: 6, right: 6, background: '#2a2520', borderColor: '#4a4440' }} />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[--accent] shadow-[0_0_6px_var(--accent)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4cdc4]"><span className="font-mono">AI 引擎</span>配置</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBrainConfig(false)}
                className="text-[#6a625a] hover:text-[#d4cdc4] transition-colors"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="config-field-label mb-2">API 地址</label>
              <input
                type="text"
                value={apiConfig.baseUrl}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                className="config-input"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="mb-4">
              <label className="config-field-label mb-2">API Key</label>
              <input
                type="password"
                value={apiConfig.apiKey}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                className="config-input"
                placeholder="sk-..."
              />
            </div>

            <div className="mb-6">
              <label className="config-field-label mb-2">模型</label>
              <div className="flex gap-2 mb-2">
                {["gpt-4.1", "gpt-4o", "deepseek-chat", "deepseek-reasoner"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setApiConfig((prev) => ({ ...prev, model: preset }))}
                    className={`px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] border transition-colors ${
                      apiConfig.model === preset
                        ? "border-[--accent] bg-[--accent] text-white"
                        : "border-[#3a3430] text-[#8a8278] hover:text-[#d4cdc4] hover:border-[#5a5450]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={apiConfig.model}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, model: e.target.value }))}
                className="config-input"
                placeholder="gpt-4.1, deepseek-chat, ..."
              />
            </div>

            <div className="mb-6">
              <label className="config-field-label mb-2 flex justify-between">
                <span>动画延迟启动</span>
                <span className="text-[10px] font-mono text-[--accent]">{apiConfig.animationDelay}s</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={apiConfig.animationDelay}
                  onChange={(e) => setApiConfig((prev) => ({ ...prev, animationDelay: parseFloat(e.target.value) }))}
                  className="flex-1 accent-[--accent] h-1.5 bg-[#3a3430] rounded-full appearance-none cursor-pointer"
                />
                <span className="text-[9px] font-mono text-[#6a625a] w-6 shrink-0 text-right">0-10s</span>
              </div>
              <p className="mt-2 text-[8px] text-[#6a625a] font-serif italic">调整识别完成后，等待多少秒再开始播放瀑布流加载动画</p>
            </div>

            <div className="mb-6">
              <label className="config-field-label mb-2 flex justify-between">
                <span>动画播放速度</span>
                <span className="text-[10px] font-mono text-[--accent]">{apiConfig.animationSpeed}s</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={apiConfig.animationSpeed}
                  onChange={(e) => setApiConfig((prev) => ({ ...prev, animationSpeed: parseFloat(e.target.value) }))}
                  className="flex-1 accent-[--accent] h-1.5 bg-[#3a3430] rounded-full appearance-none cursor-pointer"
                />
                <span className="text-[9px] font-mono text-[#6a625a] w-6 shrink-0 text-right">0.1-10s</span>
              </div>
              <p className="mt-2 text-[8px] text-[#6a625a] font-serif italic">调整题目卡片滑入动画的持续时间（数值越小越快）</p>
            </div>

            <div className="flex items-center justify-between border-t border-[#3a3430] pt-4">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${apiConfig.apiKey ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-[#cf8d2a]'}`} />
                <span className="text-[8px] text-[#6a625a] font-mono tracking-[0.08em]">
                  {apiConfig.apiKey
                    ? `${apiConfig.baseUrl.replace(/^https?:\/\//, '').split('/')[0]} › ${apiConfig.model}`
                    : 'NO API KEY'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBrainConfig(false)}
                  className="border border-[#3a3430] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8a8278] hover:text-[#d4cdc4] hover:border-[#5a5450] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("exam-analyzer-api-config", JSON.stringify(apiConfig));
                    setShowBrainConfig(false);
                  }}
                  className="border border-[--accent] bg-[--accent] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white hover:opacity-90 transition-opacity"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showHistory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center brain-config-overlay" onClick={() => setShowHistory(false)}>
          <div className="relative w-full max-w-2xl mx-4 brain-config-panel p-6 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <span className="screw-corner" style={{ top: 6, left: 6, background: '#2a2520', borderColor: '#4a4440' }} />
            <span className="screw-corner" style={{ top: 6, right: 6, background: '#2a2520', borderColor: '#4a4440' }} />
            <span className="screw-corner" style={{ bottom: 6, left: 6, background: '#2a2520', borderColor: '#4a4440' }} />
            <span className="screw-corner" style={{ bottom: 6, right: 6, background: '#2a2520', borderColor: '#4a4440' }} />

            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[--accent] shadow-[0_0_6px_var(--accent)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4cdc4]">本地历史记录库</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-[#6a625a] hover:text-[#d4cdc4] transition-colors"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-2">
              {historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#6a625a]">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs uppercase tracking-widest font-mono">NO RECORDS FOUND</span>
                </div>
              ) : (
                <div className="grid gap-3">
                  {historyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item.id)}
                      className="group relative w-full border border-[#3a3430] bg-[#2a2520]/50 p-4 text-left transition-all hover:border-[--accent] hover:bg-[#2a2520]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#d4cdc4] text-xs font-bold uppercase tracking-wider truncate mb-1">
                            {item.payload.analysis.examTitle || item.fileName}
                          </h3>
                          <div className="flex items-center gap-3 text-[9px] font-mono text-[#6a625a]">
                            <span>{new Date(item.timestamp).toLocaleString('zh-CN', { hour12: false })}</span>
                            <span className="w-1 h-1 rounded-full bg-[#3a3430]" />
                            <span>{item.payload.analysis.course}</span>
                            <span className="w-1 h-1 rounded-full bg-[#3a3430]" />
                            <span>{item.payload.analysis.totalQuestions} 题</span>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[8px] font-mono text-[#6a625a] group-hover:text-[--accent] transition-colors">LOAD ENGINE</span>
                          <svg viewBox="0 0 24 24" className="w-3 h-3 text-[#3a3430] group-hover:text-[--accent] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#3a3430] text-[8px] font-mono text-[#6a625a] flex justify-between uppercase tracking-widest shrink-0">
              <span>Data Local Storage</span>
              <span>v1.0.4-stable</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
