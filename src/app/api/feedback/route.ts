import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, content, name, email } = await request.json();

    // 구글 앱스 스크립트 웹앱 URL
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';
    
    if (!GOOGLE_SCRIPT_URL) {
      console.log('구글 스크립트 URL이 설정되지 않음 - 개발 모드');
      return NextResponse.json({ success: true }); // 개발 중에는 성공으로 처리
    }

    let requestData;

    if (type === 'positive' || type === 'negative') {
      // 피드백 데이터 (도움됐어요/아쉬워요)
      requestData = {
        type: 'feedback',
        feedbackType: type,
        clientIP: request.ip || 'Unknown',
        userAgent: request.headers.get('user-agent') || '',
        page: request.headers.get('referer') || 'https://drama-formatter-next.vercel.app'
      };
    } else {
      // 개선 제안 데이터
      requestData = {
        name: name || '',
        email: email || '',
        suggestion: content || '',
        clientIP: request.ip || 'Unknown',
        userAgent: request.headers.get('user-agent') || ''
      };
    }

    // 구글 시트로 데이터 전송
    console.log('구글 스크립트 URL:', GOOGLE_SCRIPT_URL);
    console.log('전송할 데이터:', requestData);
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('구글 스크립트 응답 상태:', response.status);
    const responseText = await response.text();
    console.log('구글 스크립트 응답 내용:', responseText);

    if (!response.ok) {
      throw new Error(`구글 시트 연동 실패: ${response.status} - ${responseText}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: '피드백이 성공적으로 전송되었습니다.' 
    });

  } catch (error: any) {
    console.error('피드백 전송 오류:', error);
    return NextResponse.json(
      { success: false, error: '피드백 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}