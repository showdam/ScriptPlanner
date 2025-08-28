import { NextRequest, NextResponse } from 'next/server';
import { parseScript } from '../../../../lib/parser';
import { generateWord } from '../../../../lib/export';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { success: false, error: '텍스트가 비어있습니다.' },
        { status: 400 }
      );
    }

    // 스크립트 파싱
    const parsed = parseScript(text);
    
    // Word 문서 생성
    const wordBuffer = await generateWord(parsed);

    // 파일명 생성
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `drama-script-${timestamp}.docx`;

    return new NextResponse(wordBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': wordBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Word 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Word 파일 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}