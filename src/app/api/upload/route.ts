import { NextRequest, NextResponse } from 'next/server';
import { FILE_CONFIG } from '../../types/constants';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 업로드되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 검증
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: '지원되지 않는 파일 형식입니다. .txt, .hwp, .doc, .docx 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 내용 읽기 (현재는 텍스트 파일만 지원)
    if (fileExtension === '.txt') {
      const content = await file.text();
      return NextResponse.json({
        success: true,
        content: content,
        filename: file.name
      });
    } else {
      // TODO: HWP, DOC, DOCX 파일 파싱 구현
      return NextResponse.json(
        { success: false, error: '현재 텍스트 파일만 지원됩니다.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}