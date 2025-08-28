// 드라마 스크립트 파싱 엔진
// 핵심 규칙:
// 1. # 으로 시작하는 줄 → 씬헤더 (S1, S2... 자동 넘버링)
// 2. : 기호 포함된 줄 → 캐릭터:대사 분리
// 3. 나머지 모든 텍스트 → 지문/액션

import { ParsedScriptElement, SceneElement, ActionElement, DialogueElement } from '../app/types/script';
import { PARSING_RULES } from '../app/types/constants';

export function parseScript(text: string): ParsedScriptElement[] {
  if (!text || text.trim() === '') {
    return [];
  }

  const lines = text.split('\n');
  const result: ParsedScriptElement[] = [];
  let sceneNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 빈 줄은 건너뛰기
    if (line === '') {
      continue;
    }

    // 씬헤더 처리 (다양한 패턴 인식)
    let sceneMatch: RegExpMatchArray | null = null;
    for (const pattern of PARSING_RULES.SCENE_PATTERNS) {
      sceneMatch = line.match(pattern);
      if (sceneMatch) break;
    }
    
    if (sceneMatch) {
      const sceneTitle = sceneMatch[1].trim();
      const sceneElement: SceneElement = {
        type: 'scene',
        number: sceneNumber,
        title: sceneTitle,
        text: `S#${sceneNumber} ${sceneTitle}.`
      };
      result.push(sceneElement);
      sceneNumber++;
      continue;
    }

    // 캐릭터 대사 처리 (: 포함)
    if (line.includes(PARSING_RULES.DIALOGUE_SEPARATOR)) {
      const colonIndex = line.indexOf(PARSING_RULES.DIALOGUE_SEPARATOR);
      const character = line.substring(0, colonIndex).trim();
      const dialogue = line.substring(colonIndex + 1).trim();
      
      // 캐릭터 이름이 비어있지 않고, 대사가 있는 경우만 대사로 처리
      if (character !== '' && dialogue !== '') {
        const dialogueElement: DialogueElement = {
          type: 'dialogue',
          character: character,
          text: dialogue
        };
        result.push(dialogueElement);
        continue;
      }
    }

    // 나머지는 모두 지문/액션으로 처리 (문장 단위로 분리)
    const sentences = splitIntoSentences(line);
    for (const sentence of sentences) {
      if (sentence.trim() !== '') {
        const actionElement: ActionElement = {
          type: 'action',
          text: sentence.trim()
        };
        result.push(actionElement);
      }
    }
  }

  return result;
}

// 문장 단위로 분리하는 함수
function splitIntoSentences(text: string): string[] {
  // 한국어 문장 구분자를 포함해서 분리
  const sentences = text.split(PARSING_RULES.SENTENCE_SEPARATORS)
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