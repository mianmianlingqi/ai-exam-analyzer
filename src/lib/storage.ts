import fs from 'fs';
import path from 'path';

// 定义存储根目录（位于项目根目录下的 outputs 文件夹）
const STORAGE_DIR = path.join(process.cwd(), 'outputs');
const DATA_DIR = path.join(STORAGE_DIR, 'data'); // 存储分析结果 JSON
const PDF_DIR = path.join(STORAGE_DIR, 'pdfs'); // 存储原始 PDF 文件

/**
 * 确保存储目录存在
 */
export function ensureDirs() {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR);
}

/**
 * 保存分析结果到本地
 * @param payload 分析数据
 * @param pdfBase64 原始 PDF 的 base64 字符串（可选）
 */
export async function saveToLocal(payload: any, pdfBase64?: string) {
  ensureDirs();
  
  // 使用文件名+大小的哈希或者直接用文件名（需处理冲突/特殊字符）
  const safeFileName = payload.fileName.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_');
  const fileId = `${safeFileName}_${payload.fileSize}`;
  
  // 保存 JSON
  const jsonPath = path.join(DATA_DIR, `${fileId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  
  // 保存 PDF（如果提供）
  if (pdfBase64) {
    const pdfPath = path.join(PDF_DIR, `${fileId}.pdf`);
    // 去掉 base64 前缀
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    fs.writeFileSync(pdfPath, base64Data, 'base64');
  }
  
  return { id: fileId, jsonPath, hasPdf: !!pdfBase64 };
}

/**
 * 获取所有本地保存的记录
 */
export function listSavedItems() {
  ensureDirs();
  const files = fs.readdirSync(DATA_DIR);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
        const data = JSON.parse(content);
        return {
          id: f.replace('.json', ''),
          fileName: data.fileName,
          fileSize: data.fileSize,
          examTitle: data.analysis?.examTitle || '未命名试卷',
          course: data.analysis?.course || '未知科目',
          saveTime: fs.statSync(path.join(DATA_DIR, f)).mtime
        };
      } catch (e) {
        return null;
      }
    })
    .filter(item => item !== null)
    .sort((a, b) => (b?.saveTime.getTime() || 0) - (a?.saveTime.getTime() || 0));
}

/**
 * 读取具体的一条记录
 */
export function getSavedItem(id: string) {
  const jsonPath = path.join(DATA_DIR, `${id}.json`);
  const pdfPath = path.join(PDF_DIR, `${id}.pdf`);
  
  if (!fs.existsSync(jsonPath)) return null;
  
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  let pdfDataUrl = null;
  
  if (fs.existsSync(pdfPath)) {
    const pdfBuffer = fs.readFileSync(pdfPath);
    pdfDataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  }
  
  return { payload, pdfDataUrl };
}
