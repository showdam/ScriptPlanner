// ScriptPlanner - AI 파싱 규칙 생성기
// 샘플 씬들을 분석하여 작가별 대본 작성 규칙을 파악하고 JavaScript 파싱 함수를 생성

const Anthropic = require('@anthropic-ai/sdk');

// Claude API 클라이언트 초기화 (환경변수에서 가져옴)
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * 샘플 씬들을 분석하여 파싱 규칙을 생성하는 메인 함수
 * @param {Array} sampleScenes - 추출된 5개 샘플 씬
 * @returns {Object} 생성된 파싱 규칙과 JavaScript 함수
 */
async function generateParsingRules(sampleScenes) {
    console.log('🤖 AI 파싱 규칙 생성 시작...');
    
    // 샘플 씬 분석을 위한 프롬프트 생성
    const analysisPrompt = createAnalysisPrompt(sampleScenes);
    
    try {
        // Claude API로 규칙 분석 요청
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 3000,
            messages: [{
                role: "user",
                content: analysisPrompt
            }]
        });

        const aiResponse = response.content[0].text;
        console.log('📋 AI 분석 완료, 규칙 생성 중...');
        
        // AI 응답에서 규칙 추출
        const parsingRules = extractRulesFromResponse(aiResponse);
        
        // JavaScript 파싱 함수 생성
        const parsingFunction = generateParsingFunction(parsingRules);
        
        console.log('✅ 파싱 규칙 생성 완료');
        
        return {
            rules: parsingRules,
            parsingFunction: parsingFunction,
            aiAnalysis: aiResponse
        };

    } catch (error) {
        console.error('❌ AI 규칙 생성 실패:', error.message);
        
        // 실패시 기본 규칙 반환
        return generateDefaultRules();
    }
}

/**
 * 샘플 씬 분석을 위한 Claude 프롬프트 생성
 */
function createAnalysisPrompt(sampleScenes) {
    const samplesText = sampleScenes.map((scene, index) => 
        `=== 샘플 ${index + 1}: ${scene.type} ===\n${scene.content}\n`
    ).join('\n');

    return `당신은 한국 영상 제작 전문가입니다. 제공된 대본 샘플들을 분석하여 이 작가의 대본 작성 규칙을 파악해주세요.

샘플 씬들:
${samplesText}

다음 항목들에 대한 **정확한 패턴**을 분석해주세요:

1. **씬 번호 표기 규칙**
   - 어떤 형식으로 씬 번호를 표기하는가? (S1, 씬1, Scene 1, 1장 등)
   - 씬 번호 앞뒤에 어떤 기호나 구분자가 있는가?

2. **장소 표기 규칙**  
   - 장소를 어떻게 표기하는가? (INT./EXT., 실내/실외, 직접 장소명 등)
   - 장소와 다른 정보를 어떻게 구분하는가? (하이픈, 쉼표, 괄호 등)

3. **시간/낮밤 표기 규칙**
   - 시간대를 어떻게 표기하는가? (DAY/NIGHT, 낮/밤, D/N 등)
   - 시간 정보의 위치는 어디인가? (끝, 중간, 괄호 안 등)

4. **등장인물 표기 규칙**
   - 캐릭터명을 어떻게 표기하는가? (대문자, 소문자, 혼합)
   - 대사 구분자는 무엇인가? (콜론:, 괄호(), 줄바꿈 등)

5. **지문과 대사 구분 규칙**
   - 지문(액션)과 대사를 어떻게 구분하는가?
   - 들여쓰기나 특별한 포매팅이 있는가?

6. **특수 표기법**
   - 플래시백, 몽타주, 삽입 등의 특수 상황 표기법
   - 감정이나 액션 지시 표기법

**분석 결과를 다음 JSON 형식으로 정리해주세요:**

{
  "sceneNumberPattern": {
    "regex": "정규표현식",
    "description": "패턴 설명",
    "examples": ["예시1", "예시2"]
  },
  "locationPattern": {
    "regex": "정규표현식", 
    "description": "패턴 설명",
    "examples": ["예시1", "예시2"]
  },
  "timeOfDayPattern": {
    "regex": "정규표현식",
    "description": "패턴 설명", 
    "examples": ["예시1", "예시2"]
  },
  "characterPattern": {
    "regex": "정규표현식",
    "description": "패턴 설명",
    "examples": ["예시1", "예시2"]
  },
  "dialoguePattern": {
    "regex": "정규표현식",
    "description": "패턴 설명",
    "examples": ["예시1", "예시2"]
  },
  "actionPattern": {
    "description": "지문 식별 방법",
    "examples": ["예시1", "예시2"]
  },
  "specialPatterns": [
    {
      "type": "특수표기종류",
      "regex": "정규표현식",
      "description": "설명"
    }
  ],
  "confidence": 0.9,
  "notes": "추가 분석 노트"
}

**중요:** 반드시 유효한 JSON만 응답해주세요. 코드블럭이나 추가 설명은 포함하지 마세요.`;
}

/**
 * AI 응답에서 규칙 추출
 */
function extractRulesFromResponse(aiResponse) {
    try {
        // JSON 추출 시도
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
        const rules = JSON.parse(jsonString);
        
        // 규칙 검증 및 정제
        return validateAndRefineRules(rules);
        
    } catch (error) {
        console.error('규칙 추출 실패:', error.message);
        return generateDefaultRules().rules;
    }
}

/**
 * 규칙 검증 및 정제
 */
function validateAndRefineRules(rules) {
    // 필수 필드 확인 및 기본값 설정
    const validatedRules = {
        sceneNumberPattern: rules.sceneNumberPattern || {
            regex: /^(S\s*\d+|씬\s*\d+|Scene\s*\d+)/i,
            description: "기본 씬 번호 패턴",
            examples: ["S1", "씬1", "Scene 1"]
        },
        locationPattern: rules.locationPattern || {
            regex: /(INT\.|EXT\.)\s*([^-\n]+)/i,
            description: "기본 장소 패턴",
            examples: ["INT. 거실", "EXT. 거리"]
        },
        timeOfDayPattern: rules.timeOfDayPattern || {
            regex: /(DAY|NIGHT|낮|밤)/i,
            description: "기본 시간 패턴", 
            examples: ["DAY", "NIGHT", "낮", "밤"]
        },
        characterPattern: rules.characterPattern || {
            regex: /^([A-Z가-힣\s]+)\s*:/,
            description: "기본 캐릭터 패턴",
            examples: ["주인공:", "JOHN:"]
        },
        dialoguePattern: rules.dialoguePattern || {
            regex: /^([A-Z가-힣\s]+)\s*:\s*(.+)/,
            description: "기본 대사 패턴",
            examples: ["주인공: 안녕하세요"]
        },
        actionPattern: rules.actionPattern || {
            description: "대사가 아닌 모든 내용을 지문으로 처리",
            examples: ["주인공이 방에 들어온다."]
        },
        specialPatterns: rules.specialPatterns || [],
        confidence: rules.confidence || 0.7,
        notes: rules.notes || ""
    };

    // 정규표현식 문자열을 RegExp 객체로 변환
    Object.keys(validatedRules).forEach(key => {
        if (validatedRules[key].regex && typeof validatedRules[key].regex === 'string') {
            try {
                validatedRules[key].regex = new RegExp(validatedRules[key].regex, 'i');
            } catch (e) {
                console.warn(`정규표현식 변환 실패 (${key}):`, e.message);
            }
        }
    });

    return validatedRules;
}

/**
 * 생성된 규칙으로 JavaScript 파싱 함수 생성
 */
function generateParsingFunction(rules) {
    return `
// AI 생성 파싱 함수 (신뢰도: ${rules.confidence})
function parseScriptWithGeneratedRules(scriptText) {
    const lines = scriptText.split('\\n').filter(line => line.trim().length > 0);
    const scenes = [];
    const characters = new Set();
    const locations = new Set();
    
    let currentScene = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 씬 헤더 감지: ${rules.sceneNumberPattern.description}
        const sceneMatch = line.match(${rules.sceneNumberPattern.regex});
        if (sceneMatch) {
            // 이전 씬 저장
            if (currentScene) {
                scenes.push(currentScene);
            }
            
            // 새 씬 시작
            const sceneNumber = extractSceneNumber(line);
            const location = extractLocation(line);
            const timeOfDay = extractTimeOfDay(line);
            
            currentScene = {
                number: sceneNumber,
                location: location,
                timeOfDay: timeOfDay,
                content: '',
                characters: [],
                dialogues: [],
                actions: []
            };
            
            if (location) locations.add(location);
            continue;
        }
        
        if (currentScene) {
            // 대사 감지: ${rules.dialoguePattern.description}
            const dialogueMatch = line.match(${rules.dialoguePattern.regex});
            if (dialogueMatch) {
                const character = dialogueMatch[1].trim();
                const dialogue = dialogueMatch[2] ? dialogueMatch[2].trim() : '';
                
                characters.add(character);
                currentScene.characters.push(character);
                currentScene.dialogues.push({
                    character: character,
                    text: dialogue
                });
            } else {
                // 지문으로 처리
                currentScene.actions.push(line);
            }
            
            currentScene.content += line + '\\n';
        }
    }
    
    // 마지막 씬 저장
    if (currentScene) {
        scenes.push(currentScene);
    }
    
    return {
        scenes: scenes,
        characters: Array.from(characters),
        locations: Array.from(locations),
        totalScenes: scenes.length,
        parsingRules: ${JSON.stringify(rules, null, 2)}
    };
    
    // 헬퍼 함수들
    function extractSceneNumber(line) {
        const match = line.match(${rules.sceneNumberPattern.regex});
        if (match) {
            const numberMatch = match[0].match(/\\d+/);
            return numberMatch ? numberMatch[0] : null;
        }
        return null;
    }
    
    function extractLocation(line) {
        const match = line.match(${rules.locationPattern.regex});
        return match ? match[2] ? match[2].trim() : match[1].trim() : null;
    }
    
    function extractTimeOfDay(line) {
        const match = line.match(${rules.timeOfDayPattern.regex});
        return match ? match[1].toUpperCase() : null;
    }
}`;
}

/**
 * 기본 규칙 생성 (AI 실패시 대체용)
 */
function generateDefaultRules() {
    return {
        rules: {
            sceneNumberPattern: {
                regex: /^(S\s*\d+|씬\s*\d+|Scene\s*\d+)/i,
                description: "기본 씬 번호 패턴 (S1, 씬1, Scene 1)",
                examples: ["S1", "씬1", "Scene 1"]
            },
            locationPattern: {
                regex: /(INT\.|EXT\.)\s*([^-\n]+)/i,
                description: "기본 장소 패턴 (INT./EXT. 장소명)",
                examples: ["INT. 거실", "EXT. 거리"]
            },
            timeOfDayPattern: {
                regex: /(DAY|NIGHT|낮|밤)/i,
                description: "기본 시간 패턴",
                examples: ["DAY", "NIGHT", "낮", "밤"]
            },
            characterPattern: {
                regex: /^([A-Z가-힣\s]+)\s*:/,
                description: "기본 캐릭터 패턴 (이름:)",
                examples: ["주인공:", "JOHN:"]
            },
            dialoguePattern: {
                regex: /^([A-Z가-힣\s]+)\s*:\s*(.+)/,
                description: "기본 대사 패턴",
                examples: ["주인공: 안녕하세요"]
            },
            actionPattern: {
                description: "대사가 아닌 모든 내용을 지문으로 처리",
                examples: ["주인공이 방에 들어온다."]
            },
            specialPatterns: [],
            confidence: 0.6,
            notes: "기본 규칙 (AI 분석 실패)"
        },
        parsingFunction: generateParsingFunction({
            sceneNumberPattern: { regex: /^(S\s*\d+|씬\s*\d+|Scene\s*\d+)/i },
            locationPattern: { regex: /(INT\.|EXT\.)\s*([^-\n]+)/i },
            timeOfDayPattern: { regex: /(DAY|NIGHT|낮|밤)/i },
            dialoguePattern: { regex: /^([A-Z가-힣\s]+)\s*:\s*(.+)/ },
            confidence: 0.6
        })
    };
}

module.exports = {
    generateParsingRules
};