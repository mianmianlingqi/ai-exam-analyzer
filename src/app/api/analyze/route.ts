import { analyzeExamDocument, extractPdfText } from "@/lib/exam-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing PDF file." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const apiBaseUrl = formData.get("apiBaseUrl") as string | null;
    const apiKey = formData.get("apiKey") as string | null;
    const model = formData.get("model") as string | null;
    const images = formData.getAll("images") as string[];

    const extractedText = images.length > 0 
      ? "已附带试卷图片序列。请忽略任何可能的乱码，直接从图片中提取题干、公式、电路图进行硬核解答。" 
      : await extractPdfText(file);

    const analysis = await analyzeExamDocument(
      { fileName: file.name, extractedText, images },
      {
        baseUrl: apiBaseUrl || undefined,
        apiKey: apiKey || undefined,
        model: model || undefined,
      },
    );

    return Response.json({
      fileName: file.name,
      fileSize: file.size,
      analysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: "Failed to analyze PDF exam.",
        detail: message,
      },
      { status: 500 }
    );
  }
}
