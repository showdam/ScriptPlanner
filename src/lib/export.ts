// Word, HWP(RTF) 내보내기 모듈
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ParsedScriptElement } from '../app/types/script';

// 문장 단위로 분리하는 함수
function splitIntoSentences(text: string): string[] {
  // 한국어 문장 구분자를 포함해서 분리
  const sentences = text.split(/([.!?。！？])/)
    .reduce((acc: string[], part: string, index: number, array: string[]) => {
      if (index % 2 === 0) {
        // 텍스트 부분
        const sentence = part.trim();
        if (sentence.length > 0) {
          // 다음 요소가 구분자면 함께 결합
          const punctuation = array[index + 1] || '';
          acc.push(sentence + punctuation);
        }
      }
      return acc;
    }, []);
  
  return sentences.filter(s => s.trim().length > 0);
}

// HWP(RTF) 생성 - 한글과컴퓨터 호환
export function generateHWP(parsedData: ParsedScriptElement[]): Buffer {
  // 한글과컴퓨터 호환 RTF 헤더 (간소화)
  let rtf = '{\\rtf1\\ansi\\ansicpg949\\deff0\\deflang1042';
  // 굴림체를 시스템 인식명 "Gulim"과 한글명 "굴림" 모두 포함해서 정의
  rtf += '{\\fonttbl{\\f0\\fnil\\fcharset129 Gulim;}{\\f1\\fnil\\fcharset129 굴림;}{\\f2\\fnil\\fcharset129 바탕;}}';
  rtf += '\\paperw11906\\paperh16838\\margl1440\\margr1440\\margt1440\\margb1440';
  rtf += '\\f0\\fs22'; // Gulim(굴림) 폰트, 11pt
  
  for (let i = 0; i < parsedData.length; i++) {
    const element = parsedData[i];
    const prevElement = i > 0 ? parsedData[i - 1] : null;
    
    // 씬 제목 위에 빈 줄 (첫 번째 요소가 아닌 경우)
    if (element.type === 'scene' && prevElement) {
      rtf += '\\par'; // 씬 제목 위 빈 줄
    }
    
    // 지문과 대사 사이에 빈 줄 추가 규칙 (씬 제목 제외)
    const needsLineBreak = (
      (prevElement?.type === 'action' && element.type === 'dialogue') ||
      (prevElement?.type === 'dialogue' && element.type === 'action')
    );

    if (needsLineBreak) {
      rtf += '\\par'; // 빈 줄 추가
    }

    switch (element.type) {
      case 'scene':
        // 씬헤더 (굴림, 굵게, 11pt, 160% 줄간격)
        // 160% of 11pt = 17.6pt = 352 twips (11pt * 1.6 * 20 = 352)
        rtf += `\\par\\pard\\sl352\\slmult1\\b\\f0\\fs22 ${escapeRtfKorean(element.text)}\\b0\\par`;
        break;
      case 'action':
        // 지문을 문장 단위로 분리해서 처리
        const sentences = splitIntoSentences(element.text);
        const validSentences = sentences.filter(s => s.trim() !== '');
        for (let j = 0; j < validSentences.length; j++) {
          const sentence = validSentences[j].trim();
          if (j === 0) {
            // 첫 번째 문장 - 새 문단 시작 (굴림, 160% 줄간격)
            rtf += `\\par\\pard\\sl352\\slmult1\\li720\\f0\\fs22 ${escapeRtfKorean(sentence)}`;
          } else {
            // 나머지 문장들 - 줄바꿈만 (줄간격 유지)
            rtf += `\\line ${escapeRtfKorean(sentence)}`;
          }
        }
        break;
      case 'dialogue':
        // 캐릭터명(5글자 이내) + 대사의 hanging indent 방식
        // 첫 줄: 캐릭터명 + 탭 + 대사 첫 부분
        // 둘째 줄부터: 탭 2번(1440 twips) 위치에서 정렬
        // 160% 줄간격 적용 (352 twips)
        rtf += `\\par\\pard\\tx1440\\fi-1440\\li1440\\sl352\\slmult1\\f0\\fs22\\b ${escapeRtfKorean(element.character)}:\\b0\\tab ${escapeRtfKorean(element.text)}`;
        break;
    }
  }
  
  rtf += '}';
  
  // EUC-KR 인코딩으로 Buffer 생성 시도, 실패하면 UTF-8로 폴백
  try {
    // Node.js에서 EUC-KR은 직접 지원하지 않으므로 UTF-8로 생성
    return Buffer.from(rtf, 'utf-8');
  } catch (error) {
    console.error('RTF 인코딩 오류:', error);
    return Buffer.from(rtf, 'utf-8');
  }
}

// 한글 RTF 인코딩 함수 - 더 안전한 유니코드 처리
function escapeRtfKorean(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const code = text.charCodeAt(i);
    
    // 기본 ASCII 문자는 그대로
    if (code < 128) {
      // RTF 특수문자 이스케이프
      if (char === '\\') result += '\\\\';
      else if (char === '{') result += '\\{';
      else if (char === '}') result += '\\}';
      else result += char;
    } 
    // 모든 비ASCII 문자를 유니코드 이스케이프로 처리
    else {
      // 음수 값 처리를 위해 부호 있는 16비트로 변환
      const signedCode = code > 32767 ? code - 65536 : code;
      result += `\\u${signedCode}?`;
    }
  }
  return result;
}

// Word 문서 생성 (비동기)
export async function generateWord(parsedData: ParsedScriptElement[]): Promise<Buffer> {
  const children: Paragraph[] = [];
  
  for (let i = 0; i < parsedData.length; i++) {
    const element = parsedData[i];
    const prevElement = i > 0 ? parsedData[i - 1] : null;
    
    // 씬 제목 위에 빈 줄 (첫 번째 요소가 아닌 경우)
    if (element.type === 'scene' && prevElement) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 120 }
        })
      );
    }
    
    // 지문과 대사 사이에 빈 줄 추가 규칙 (씬 제목 제외)
    const needsLineBreak = (
      (prevElement?.type === 'action' && element.type === 'dialogue') ||
      (prevElement?.type === 'dialogue' && element.type === 'action')
    );

    if (needsLineBreak) {
      // 빈 문단 추가
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 120 }
        })
      );
    }
    switch (element.type) {
      case 'scene':
        // 씬헤더 (11pt, 160% 줄간격)
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: element.text,
                bold: true,
                size: 22, // 11pt = 22 half-points
                font: "Gulim"
              })
            ],
            spacing: {
              line: 320, // 160% 줄간격
              lineRule: "atLeast",
              after: 240 // 씬헤더 후 간격
            }
          })
        );
        break;
        
      case 'action':
        // 지문을 문장 단위로 분리해서 처리
        const sentences = splitIntoSentences(element.text);
        for (const sentence of sentences) {
          if (sentence.trim() !== '') {
            // 지문 (1.27cm 들여쓰기, 11pt, 160% 줄간격)
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: sentence.trim(),
                    size: 22, // 11pt = 22 half-points
                    font: "Gulim"
                  })
                ],
                indent: {
                  left: 720 // 1.27cm = 720 twips
                },
                spacing: {
                  line: 320, // 160% 줄간격
                  lineRule: "atLeast",
                  after: 120
                }
              })
            );
          }
        }
        break;
        
      case 'dialogue':
        // Word 강제 hanging indent: firstLine 음수값과 left 양수값 조합
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: element.character + ':',
                bold: true,
                size: 22, // 11pt = 22 half-points
                font: "Gulim"
              }),
              new TextRun({
                text: '\t' + element.text,
                size: 22, // 11pt = 22 half-points
                font: "Gulim"
              })
            ],
            indent: {
              left: 1440,     // 전체 문단을 1440 twips 들여쓰기
              hanging: 1440   // hanging indent (docx에서는 hanging 속성 사용)
            },
            spacing: {
              line: 320, // 160% 줄간격
              lineRule: "atLeast",
              after: 120
            },
            tabStops: [
              {
                type: "left",
                position: 1440 // 1440 twips에 탭 스톱
              }
            ]
          })
        );
        break;
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 2.54cm
            right: 1440,  // 2.54cm
            bottom: 1440, // 2.54cm
            left: 1440    // 2.54cm
          }
        }
      },
      children: children
    }]
  });
  
  try {
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error: any) {
    throw new Error(`Word 문서 생성 오류: ${error.message}`);
  }
}