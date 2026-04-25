import { NextRequest, NextResponse } from 'next/server';
import { saveToLocal, listSavedItems, getSavedItem } from '@/lib/storage';

/**
 * GET /api/storage - 获取列表
 * POST /api/storage - 保存新结果
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const item = getSavedItem(id);
      if (!item) {
        return NextResponse.json({ error: '记录不存在' }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const items = listSavedItems();
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('获取本地存储失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, pdfBase64 } = body;

    if (!payload) {
      return NextResponse.json({ error: '缺少 payload 数据' }, { status: 400 });
    }

    const result = await saveToLocal(payload, pdfBase64);
    
    return NextResponse.json({ 
      success: true, 
      message: '已保存到本地文件夹 (outputs/)',
      ...result 
    });
  } catch (error: any) {
    console.error('保存到本地失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
