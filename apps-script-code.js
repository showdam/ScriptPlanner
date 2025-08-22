// Google Apps Script 코드
// 이 코드를 Google Apps Script에 복사해서 웹앱으로 배포하세요

function doPost(e) {
  try {
    // 요청 데이터 파싱
    const data = JSON.parse(e.postData.contents);
    console.log('받은 데이터:', data);
    
    // 스프레드시트 열기
    const SPREADSHEET_ID = '1NSHC_VQiPQ3IJROg6CouGBbG4S6tCImw2VqEfRVYWWI';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 'Suggestions' 시트 가져오기 (없으면 생성)
    let sheet = spreadsheet.getSheetByName('Suggestions');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Suggestions');
      // 헤더 추가
      sheet.getRange(1, 1, 1, 6).setValues([
        ['타임스탬프', '이름', '이메일', '제안내용', '페이지', '제출시간']
      ]);
    }
    
    // 새 행에 데이터 추가
    const timestamp = new Date();
    const newRow = [
      timestamp,
      data.name || '',
      data.email || '',
      data.suggestion || '',
      data.page || '',
      data.timestamp || timestamp.toISOString()
    ];
    
    sheet.appendRow(newRow);
    
    // 성공 응답
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '제안이 성공적으로 저장되었습니다.'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('오류 발생:', error);
    
    // 오류 응답
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '저장 중 오류가 발생했습니다: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('ScriptPlanner 피드백 시스템이 작동 중입니다.')
    .setMimeType(ContentService.MimeType.TEXT);
}