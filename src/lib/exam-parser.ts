import { ELECTRONICS_EXAM_SYSTEM_PROMPT, buildExamUserPrompt } from "@/lib/prompt";
import type { ExamAnalysis } from "@/types/exam";

export type ApiConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

const fallbackAnalysis: ExamAnalysis = {
  examTitle: "电子信息综合试卷示例",
  course: "电子信息工程",
  totalQuestions: 3,
  extractedTextPreview:
    "一、已知共射放大电路工作于放大区，求电压增益与输出波形。二、某 ASK 系统载波频率为 100kHz，码元速率为 10kbps，分析带宽与误码影响。三、根据给定状态转移图设计同步时序电路并写出激励方程。",
  overallInsights: [
    "试卷覆盖模电放大电路、数字通信调制分析与时序逻辑设计，属于典型电子信息综合能力考核。",
    "解题重点在于参数提取、公式选型与图表语义理解，需要模型同时处理公式与工程术语。",
    "建议在生产环境接入版面分析和 OCR 结果融合，以提升图表与公式识别精度。",
  ],
  questions: [
    {
      id: "q-1",
      number: "第1题",
      score: "20 分",
      coreTopic: "模拟电子技术 / 共射极放大电路",
      finalAnswer: "电压增益为负值且输出相位反转，近似 Av = -Rc / re。",
      confidence: "high",
      summary: "核心在于先判断晶体管静态工作点，再利用小信号模型计算增益。",
      steps: [
        "先由偏置网络判断三极管处于放大区，确认可以使用小信号等效模型。",
        "根据发射结小信号电阻 re 约等于 26mV / IE，建立输入到集电极电流的线性关系。",
        "输出电压变化量满足 vo = -ic * Rc，因此电压增益 Av = vo / vi 近似为 -Rc / re。",
        "负号表示输出与输入反相，若波形图中输入上升，则输出对应下降。",
      ],
      formulas: ["re = 26mV / IE", "Av = -Rc / re"],
      terminology: ["静态工作点", "小信号模型", "共射极", "相位反转"],
      chartInsights: ["若原题给出输入输出波形，需确认输出过零点与输入相位差约为 180 度。"],
    },
    {
      id: "q-2",
      number: "第2题",
      score: "18 分",
      coreTopic: "通信原理 / ASK 调制",
      finalAnswer: "ASK 信号带宽近似为 2Rb，系统抗噪性能弱于相干 PSK，误码率对信噪比更敏感。",
      confidence: "medium",
      summary: "题目重点在于由码元速率估算带宽，并结合调制特性解释误码来源。",
      steps: [
        "根据题设识别为振幅键控 ASK，码元速率 Rb 决定主瓣频谱宽度。",
        "理想二进制 ASK 的传输带宽通常按 2Rb 量级估算，因此当 Rb = 10kbps 时带宽约为 20kHz。",
        "ASK 依赖幅度判决，对加性噪声和衰落更敏感，因此在同等条件下误码性能通常弱于 PSK。",
        "如果题中提供频谱图，应进一步核验主瓣宽度与载频两侧边带分布。",
      ],
      formulas: ["B_ASK ≈ 2Rb"],
      terminology: ["振幅键控", "码元速率", "带宽", "误码率"],
      chartInsights: ["频谱图分析应关注载频 fc 两侧的对称边带和主瓣扩展范围。"],
    },
    {
      id: "q-3",
      number: "第3题",
      score: "22 分",
      coreTopic: "数字电子技术 / 同步时序电路设计",
      finalAnswer: "先完成状态编码与化简，再由状态转移表推导触发器激励方程和输出逻辑表达式。",
      confidence: "high",
      summary: "此题关键是把状态图转换为状态表与卡诺图，最后得到可实现逻辑。",
      steps: [
        "根据状态转移图列出当前状态、输入、次态和输出，建立完整状态表。",
        "为各状态分配二进制编码，若题目指定 JK 或 D 触发器，需要按对应激励表求每一位次态方程。",
        "使用卡诺图或布尔代数化简激励方程，得到最简逻辑表达式。",
        "最后结合输出方程判断该设计属于 Moore 还是 Mealy 结构，并校验时序一致性。",
      ],
      formulas: ["Q(t+1) = D", "J = Q'(t)Q(t+1)", "K = Q(t)Q'(t+1)"],
      terminology: ["状态编码", "激励方程", "卡诺图", "Moore", "Mealy"],
      chartInsights: ["若题目含状态图或时序图，必须核对边沿触发时刻与输出更新时序。"],
    },
  ],
};

function buildFallbackResult(extractedText: string, reason?: string): ExamAnalysis {
  const fallbackReason =
    reason && reason.trim().length > 0 ? `当前已启用本地兜底分析：${reason}` : "当前已启用本地兜底分析。";

  return {
    ...fallbackAnalysis,
    extractedTextPreview: extractedText.slice(0, 800) || fallbackAnalysis.extractedTextPreview,
    overallInsights: [fallbackReason, ...fallbackAnalysis.overallInsights],
  } satisfies ExamAnalysis;
}

export async function extractPdfText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const text = buffer.toString("utf-8").replace(/\u0000/g, " ").trim();

  return text || "PDF 文本解析占位输出：生产环境建议接入 pdfjs-dist + OCR + 版面分析服务。";
}

export async function analyzeExamDocument(
  input: { fileName: string; extractedText: string; images?: string[] },
  apiConfig?: ApiConfig,
) {
  const { extractedText, images } = input;
  const apiKey = apiConfig?.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackResult(extractedText, "未配置 API Key，请在右上角 AI 引擎中填写可用配置。");
  }

  const baseUrl = (apiConfig?.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const model = apiConfig?.model || process.env.OPENAI_MODEL || "gpt-4.1";

  // 为外部 AI 请求增加超时与兜底，避免前端出现“fetch failed”后整体不可用。
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    console.log(`[Exam Parser] 发起 AI 分析请求`);
    console.log(` - URL: ${baseUrl}/chat/completions`);
    console.log(` - Model: ${model}`);
    console.log(` - 附加图片数量: ${images?.length || 0}`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ELECTRONICS_EXAM_SYSTEM_PROMPT },
          { 
            role: "user", 
            content: images && images.length > 0
              ? [
                  { type: "text", text: buildExamUserPrompt(extractedText.slice(0, 24000)) },
                  ...images.map(img => ({ type: "image_url", image_url: { url: img } }))
                ]
              : buildExamUserPrompt(extractedText.slice(0, 24000))
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let remoteError = "";
      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          remoteError = JSON.stringify(await response.json()).slice(0, 260);
        } else {
          remoteError = (await response.text()).slice(0, 260);
        }
      } catch {
        remoteError = "";
      }

      throw new Error(
        `AI analysis failed with status ${response.status}${remoteError ? `: ${remoteError}` : ""}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI response did not include structured content.");
    }

    const parsed = JSON.parse(content) as ExamAnalysis;

    return {
      ...parsed,
      extractedTextPreview: extractedText.slice(0, 800),
    } satisfies ExamAnalysis;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || "未知错误";
    
    console.error("[Exam Parser] AI 分析发生异常:", errorObj);
    
    if (errorObj.name === 'AbortError' || message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')) {
      console.error(
        "[Exam Parser] 诊断建议：\n" +
        "1. 检查本地网络或代理/翻墙软件设置，可能无法直连目标 API。\n" +
        "2. 文件或附加的图片可能过大，导致请求超长时被中断。\n" +
        "3. 目标模型服务器负载过高或无响应。\n" +
        "建议排查网络，或者在设置中更换稳定的代理节点与缩小突破大小。"
      );
    } else {
      console.error("[Exam Parser] 诊断建议：请检查请求体配置（如 API Key, Model）是否正确。");
    }

    return buildFallbackResult(extractedText, `外部 AI 服务不可用（${message}）`);
  } finally {
    clearTimeout(timeoutId);
  }
}
