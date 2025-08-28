// HTML 포맷팅 모듈
// 한국 드라마 표준 포맷으로 변환

import { ParsedScriptElement } from '../app/types/script';

export function formatToHTML(parsedData: ParsedScriptElement[]): string {
  if (!parsedData || parsedData.length === 0) {
    return '<div class="empty-script">텍스트를 입력해주세요.</div>';
  }

  let html = '<div class="script-content">';

  for (let i = 0; i < parsedData.length; i++) {
    const element = parsedData[i];
    const prevElement = i > 0 ? parsedData[i - 1] : null;
    const nextElement = i < parsedData.length - 1 ? parsedData[i + 1] : null;

    // 씬 제목 위에 빈 줄 (첫 번째 요소가 아닌 경우)
    if (element.type === 'scene' && prevElement) {
      html += '<div class="scene-break"></div>';
    }

    // 지문과 대사 사이에 빈 줄 추가 규칙 (씬 제목 제외)
    const needsLineBreak = (
      (prevElement?.type === 'action' && element.type === 'dialogue') ||
      (prevElement?.type === 'dialogue' && element.type === 'action')
    );

    if (needsLineBreak) {
      html += '<div class="scene-break"></div>';
    }

    switch (element.type) {
      case 'scene':
        // 씬헤더: 굵게 표시, 아래 한 줄 비우기
        html += `<div class="scene-header">${element.text}</div>`;
        html += '<div class="scene-break"></div>';
        break;

      case 'action':
        // 지문: 2.54cm 들여쓰기 (tab 2번에 해당)
        html += `<div class="action">${escapeHtml(element.text)}</div>`;
        break;

      case 'dialogue':
        // 캐릭터: 대사를 한 줄로 표시 (탭 간격 적용)
        html += `<div class="dialogue-line"><span class="character">${escapeHtml(element.character)}:</span><span class="dialogue">${escapeHtml(element.text)}</span></div>`;
        break;
    }
  }

  html += '</div>';
  return html;
}

// HTML 특수문자 이스케이프
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}