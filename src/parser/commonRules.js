// ScriptPlanner - 공통 파싱 규칙 라이브러리
// 대부분의 한국 드라마/영화 대본에서 공통적으로 사용되는 기본 패턴들

/**
 * 한국 대본 작성의 공통 패턴들
 * AI는 이 기본 패턴에서 벗어나는 특수한 부분만 학습하면 됨
 */
const COMMON_PARSING_RULES = {
    // 1. 씬 번호 패턴 (가장 일반적인 것들)
    sceneNumberPatterns: [
        {
            regex: /^S\s*(\d+)\.?\s*/i,
            description: "표준 S1, S2 형식",
            confidence: 0.9,
            examples: ["S1.", "S 1", "S1"]
        },
        {
            regex: /^씬\s*(\d+)\.?\s*/i,
            description: "한글 씬1, 씬2 형식", 
            confidence: 0.9,
            examples: ["씬1", "씬 1", "씬1."]
        },
        {
            regex: /^Scene\s*(\d+)\.?\s*/i,
            description: "영어 Scene 1 형식",
            confidence: 0.8,
            examples: ["Scene 1", "SCENE 1", "Scene1"]
        },
        {
            regex: /^(\d+)\.?\s*/,
            description: "숫자만 1., 2. 형식",
            confidence: 0.7,
            examples: ["1.", "2", "1 "]
        }
    ],

    // 2. 장소 패턴 (INT/EXT 기반)
    locationPatterns: [
        {
            regex: /(INT\.|EXT\.)\s*([^-\n]+?)(?:\s*-\s*(DAY|NIGHT|낮|밤))?/i,
            description: "표준 INT./EXT. 형식",
            confidence: 0.95,
            locationGroup: 2,
            timeGroup: 3,
            examples: ["INT. 카페 - DAY", "EXT. 거리 - NIGHT"]
        },
        {
            regex: /(실내|실외)\s*[:\s]\s*([^-\n,]+?)(?:\s*[-,]\s*(낮|밤|DAY|NIGHT))?/i,
            description: "한글 실내/실외 형식",
            confidence: 0.8,
            locationGroup: 2,
            timeGroup: 3,
            examples: ["실내: 카페 - 낮", "실외 거리, 밤"]
        },
        {
            regex: /(?:S\d+\.?|씬\s*\d+\.?|Scene\s*\d+\.?)\s+([^-,\n]+?)(?:\s*[-,]\s*(DAY|NIGHT|낮|밤))?/i,
            description: "씬 번호 다음 장소",
            confidence: 0.7,
            locationGroup: 1,
            timeGroup: 2,
            examples: ["S1 카페 - DAY", "씬1 회사 낮"]
        }
    ],

    // 3. 시간대 패턴
    timeOfDayPatterns: [
        {
            regex: /\b(DAY|NIGHT)\b/i,
            description: "영어 DAY/NIGHT",
            confidence: 0.9,
            normalize: { "DAY": "DAY", "NIGHT": "NIGHT" }
        },
        {
            regex: /\b(낮|밤|아침|저녁|새벽|오전|오후)\b/i,
            description: "한글 시간대",
            confidence: 0.9,
            normalize: { 
                "낮": "DAY", "아침": "DAY", "오전": "DAY", "오후": "DAY",
                "밤": "NIGHT", "저녁": "NIGHT", "새벽": "NIGHT"
            }
        },
        {
            regex: /\b(D|N)\b/i,
            description: "축약형 D/N",
            confidence: 0.7,
            normalize: { "D": "DAY", "N": "NIGHT" }
        }
    ],

    // 4. 캐릭터/대사 패턴
    characterDialoguePatterns: [
        {
            regex: /^([A-Z가-힣\s]{1,20})\s*:\s*(.*)$/,
            description: "표준 캐릭터: 대사",
            confidence: 0.9,
            characterGroup: 1,
            dialogueGroup: 2
        },
        {
            regex: /^([A-Z가-힣\s]{1,20})\s*\([^)]*\)\s*:\s*(.*)$/,
            description: "캐릭터(감정): 대사",
            confidence: 0.8,
            characterGroup: 1,
            dialogueGroup: 2
        },
        {
            regex: /^([A-Z가-힣\s]{1,20})\s*\([^)]*\)\s*(.+)$/,
            description: "캐릭터(감정) 대사 (콜론 없음)",
            confidence: 0.7,
            characterGroup: 1,
            dialogueGroup: 2
        }
    ],

    // 5. 특수 표기 패턴
    specialPatterns: [
        {
            type: "flashback",
            regex: /플래시백|flashback|회상|과거/i,
            description: "플래시백/회상 장면"
        },
        {
            type: "montage", 
            regex: /몽타주|montage|연속|시퀀스/i,
            description: "몽타주/연속 장면"
        },
        {
            type: "insert",
            regex: /삽입|insert|CU|클로즈업/i,
            description: "삽입/클로즈업"
        },
        {
            type: "voice_over",
            regex: /\(V\.O\.\)|\(voice over\)|\(내레이션\)|\(목소리\)/i,
            description: "보이스오버/내레이션"
        }
    ]
};

/**
 * 기본 공통 규칙을 사용해서 대본의 기본 구조 파악
 * @param {string} scriptText - 대본 텍스트
 * @returns {Object} 기본 파싱 결과 및 특수 패턴 분석
 */
function analyzeWithCommonRules(scriptText) {
    const lines = scriptText.split('\n').filter(line => line.trim().length > 0);
    const analysis = {
        detectedPatterns: {
            sceneNumber: null,
            location: null,
            timeOfDay: null,
            characterDialogue: null
        },
        specialFeatures: [],
        statistics: {
            totalLines: lines.length,
            sceneHeaders: 0,
            dialogueLines: 0,
            actionLines: 0
        },
        confidence: 0.5
    };

    // 첫 10줄로 패턴 분석 (대표성 확보)
    const sampleLines = lines.slice(0, Math.min(10, lines.length));
    
    // 1. 씬 번호 패턴 감지
    for (const line of sampleLines) {
        for (const pattern of COMMON_PARSING_RULES.sceneNumberPatterns) {
            if (pattern.regex.test(line)) {
                if (!analysis.detectedPatterns.sceneNumber || 
                    pattern.confidence > analysis.detectedPatterns.sceneNumber.confidence) {
                    analysis.detectedPatterns.sceneNumber = pattern;
                    analysis.statistics.sceneHeaders++;
                }
                break;
            }
        }
    }

    // 2. 장소 패턴 감지
    for (const line of sampleLines) {
        for (const pattern of COMMON_PARSING_RULES.locationPatterns) {
            if (pattern.regex.test(line)) {
                if (!analysis.detectedPatterns.location ||
                    pattern.confidence > analysis.detectedPatterns.location.confidence) {
                    analysis.detectedPatterns.location = pattern;
                }
                break;
            }
        }
    }

    // 3. 시간대 패턴 감지
    for (const line of sampleLines) {
        for (const pattern of COMMON_PARSING_RULES.timeOfDayPatterns) {
            if (pattern.regex.test(line)) {
                if (!analysis.detectedPatterns.timeOfDay ||
                    pattern.confidence > analysis.detectedPatterns.timeOfDay.confidence) {
                    analysis.detectedPatterns.timeOfDay = pattern;
                }
                break;
            }
        }
    }

    // 4. 캐릭터/대사 패턴 감지
    for (const line of lines) {
        for (const pattern of COMMON_PARSING_RULES.characterDialoguePatterns) {
            if (pattern.regex.test(line)) {
                if (!analysis.detectedPatterns.characterDialogue ||
                    pattern.confidence > analysis.detectedPatterns.characterDialogue.confidence) {
                    analysis.detectedPatterns.characterDialogue = pattern;
                }
                analysis.statistics.dialogueLines++;
                break;
            }
        }
    }

    // 5. 특수 패턴 감지
    const fullText = scriptText.toLowerCase();
    for (const pattern of COMMON_PARSING_RULES.specialPatterns) {
        if (pattern.regex.test(fullText)) {
            analysis.specialFeatures.push(pattern);
        }
    }

    // 6. 전체 신뢰도 계산
    let confidenceScore = 0.5;
    if (analysis.detectedPatterns.sceneNumber) confidenceScore += 0.2;
    if (analysis.detectedPatterns.location) confidenceScore += 0.2;
    if (analysis.detectedPatterns.timeOfDay) confidenceScore += 0.1;
    if (analysis.detectedPatterns.characterDialogue) confidenceScore += 0.1;
    
    analysis.confidence = Math.min(confidenceScore, 1.0);
    analysis.statistics.actionLines = analysis.statistics.totalLines - 
                                    analysis.statistics.dialogueLines - 
                                    analysis.statistics.sceneHeaders;

    return analysis;
}

/**
 * 공통 규칙 기반으로 하이브리드 파싱 규칙 생성
 * AI는 공통 규칙에서 벗어나는 특수한 부분만 분석하면 됨
 */
function generateHybridRules(commonAnalysis, sampleScenes) {
    const hybridRules = {
        // 기본 규칙 적용
        sceneNumberPattern: commonAnalysis.detectedPatterns.sceneNumber || 
                           COMMON_PARSING_RULES.sceneNumberPatterns[0],
        locationPattern: commonAnalysis.detectedPatterns.location ||
                        COMMON_PARSING_RULES.locationPatterns[0],
        timeOfDayPattern: commonAnalysis.detectedPatterns.timeOfDay ||
                         COMMON_PARSING_RULES.timeOfDayPatterns[0],
        characterPattern: commonAnalysis.detectedPatterns.characterDialogue ||
                         COMMON_PARSING_RULES.characterDialoguePatterns[0],
        
        // 특수 패턴
        specialPatterns: commonAnalysis.specialFeatures,
        
        // 신뢰도 및 메타데이터
        confidence: Math.max(commonAnalysis.confidence, 0.7), // 공통 규칙은 최소 70%
        source: 'hybrid-common-rules',
        needsAIAnalysis: commonAnalysis.confidence < 0.8, // 80% 미만시 AI 보강 필요
        
        // 통계
        statistics: commonAnalysis.statistics
    };

    return hybridRules;
}

/**
 * AI 분석이 필요한 특수 케이스 판단
 */
function needsAIAnalysis(commonAnalysis, sampleScenes) {
    // 1. 신뢰도가 낮은 경우
    if (commonAnalysis.confidence < 0.8) {
        return {
            needed: true,
            reason: '공통 패턴 매칭 신뢰도 부족',
            focus: ['sceneNumber', 'location', 'characterDialogue']
        };
    }

    // 2. 특수 패턴이 많은 경우
    if (commonAnalysis.specialFeatures.length > 2) {
        return {
            needed: true,
            reason: '복잡한 특수 표기법 감지',
            focus: ['specialPatterns']
        };
    }

    // 3. 표준 패턴과 차이가 큰 경우
    const hasNonStandardPattern = sampleScenes.some(scene => {
        return !COMMON_PARSING_RULES.sceneNumberPatterns[0].regex.test(scene.header);
    });

    if (hasNonStandardPattern) {
        return {
            needed: true,
            reason: '비표준 씬 헤더 형식 감지',
            focus: ['sceneNumber', 'location']
        };
    }

    return {
        needed: false,
        reason: '공통 규칙으로 충분히 처리 가능'
    };
}

module.exports = {
    COMMON_PARSING_RULES,
    analyzeWithCommonRules,
    generateHybridRules,
    needsAIAnalysis
};