# 구글 시트 피드백 시스템 설정 가이드

## 1. 구글 시트 생성

1. Google Sheets에서 새 시트 생성
2. 첫 번째 행에 헤더 추가:
   - A1: `타임스탬프`
   - B1: `피드백 타입`
   - C1: `내용`
   - D1: `User Agent`
   - E1: `IP 주소`

## 2. 구글 앱스 스크립트 생성

1. Google Apps Script (script.google.com) 접속
2. 새 프로젝트 생성
3. 다음 코드 입력:

```javascript
function doPost(e) {
  try {
    // 요청 데이터 파싱
    const data = JSON.parse(e.postData.contents);
    
    // 스프레드시트 ID 설정 (자신의 시트 ID로 변경)
    const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // 데이터를 새 행에 추가
    sheet.appendRow([
      new Date(data.timestamp), // 타임스탬프
      data.type,                // 피드백 타입 (positive/negative/improvement)
      data.content || '',       // 내용 (개선 제안인 경우)
      data.userAgent || '',     // User Agent
      data.ip || ''             // IP 주소
    ]);
    
    // 성공 응답
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // 오류 응답
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. 배포 설정

1. 스크립트 편집기에서 **배포 > 새 배포** 클릭
2. 유형: **웹 앱** 선택
3. 설정:
   - **실행 대상**: 나
   - **액세스 권한**: 모든 사용자 (익명 사용자 포함)
4. **배포** 클릭
5. 생성된 **웹 앱 URL** 복사

## 4. 환경 변수 설정

`.env.local` 파일에 다음 추가:

```bash
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 5. 권한 설정

1. 스크립트 첫 실행 시 권한 요청
2. Google 계정 선택 후 권한 허용
3. "고급" > "안전하지 않은 페이지로 이동" 선택 (필요시)

## 6. 테스트

1. 웹 앱에서 피드백 버튼 클릭
2. 구글 시트에 데이터가 추가되는지 확인

## 주의사항

- 스프레드시트 ID는 URL에서 확인 가능: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
- 스크립트 수정 후 재배포 필요
- 개발 중에는 환경변수가 없어도 정상 작동 (로컬에서만)

## 데이터 형태

- **positive**: "도움됐어요!" 클릭
- **negative**: "아쉬워요" 클릭  
- **improvement**: "개선 제안" 모달에서 텍스트 입력