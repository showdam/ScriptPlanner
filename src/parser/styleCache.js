// ScriptPlanner - 스타일 캐싱 시스템
// 학습된 패턴을 저장하고 재사용하여 AI 비용 최적화

/**
 * 알려진 대본 스타일 패턴들 (사전 정의)
 */
const KNOWN_STYLE_PATTERNS = {
    // SBS/KBS 드라마 스타일
    'broadcast_drama': {
        scene: /^S\d+\.\s*/i,
        location: /^S\d+\.\s*INT\.|EXT\.\s*([^-\n]+)/i,
        time: /\s*-\s*(DAY|NIGHT|낮|밤)$/i,
        character: /^([A-Z가-힣\s]+)\s*:/,
        confidence: 0.9,
        description: '방송사 드라마 표준 형식'
    },
    
    // 영화 시나리오 스타일
    'movie_script': {
        scene: /^씬\s*\d+/i,
        location: /^씬\s*\d+\s*[.\s]*([^-\n]+)/i,
        time: /(낮|밤|아침|저녁|새벽)$/i,
        character: /^([가-힣\s]+)\s*:/,
        confidence: 0.85,
        description: '영화 시나리오 형식'
    },
    
    // 고잉홈 스타일 (시간, 장소)
    'time_location_comma': {
        scene: /^S\d+\./i,
        location: /^S\d+\.\s*[가-힣]+,\s*(.+)$/i,
        time: /^S\d+\.\s*([가-힣]+),/i,
        character: /^([가-힣]+)(?:\(V\.O\))?:/,
        confidence: 0.95,
        description: 'S1. 시간, 장소 형식'
    },
    
    // 웹드라마/웹툰 스타일
    'web_drama': {
        scene: /^EP\.\d+\s*SCENE\s*\d+|^#\s*S?\s*\d+/i,
        location: /🏢\s*([^(]+)/i,
        character: /^@([가-힣\s]+):/,
        confidence: 0.8,
        description: '웹드라마/웹툰 형식'
    }
};

/**
 * 동적으로 학습된 스타일들 (런타임에 추가됨)
 */
let LEARNED_PATTERNS = {};

/**
 * 대본에서 스타일을 자동 감지
 * @param {string} scriptText - 대본 텍스트
 * @returns {string|null} 감지된 스타일 키
 */
function detectScriptStyle(scriptText) {
    const sampleLines = scriptText.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 20); // 첫 20줄로 스타일 판단
    
    let bestMatch = null;
    let bestScore = 0;
    
    // 알려진 패턴들과 매칭
    const allPatterns = { ...KNOWN_STYLE_PATTERNS, ...LEARNED_PATTERNS };
    
    for (const [styleName, patterns] of Object.entries(allPatterns)) {
        let score = 0;
        let tests = 0;
        
        sampleLines.forEach(line => {
            // 씬 헤더 패턴 테스트
            if (patterns.scene && patterns.scene.test(line)) {
                score += 3; // 씬 패턴 가중치 높음
            }
            
            // 캐릭터 패턴 테스트  
            if (patterns.character && patterns.character.test(line)) {
                score += 2;
            }
            
            tests++;
        });
        
        // 정규화된 점수 계산
        const normalizedScore = tests > 0 ? score / tests : 0;
        const finalScore = normalizedScore * (patterns.confidence || 0.5);
        
        if (finalScore > bestScore && finalScore > 0.3) { // 최소 임계값
            bestMatch = styleName;
            bestScore = finalScore;
        }
    }
    
    return bestMatch;
}

/**
 * 캐시된 패턴으로 빠르게 파싱
 * @param {string} scriptText - 대본 텍스트  
 * @param {string} styleKey - 스타일 키
 * @returns {Object} 파싱 결과
 */
function parseWithCachedStyle(scriptText, styleKey) {
    const patterns = { ...KNOWN_STYLE_PATTERNS, ...LEARNED_PATTERNS }[styleKey];
    
    if (!patterns) {
        throw new Error(`알 수 없는 스타일: ${styleKey}`);
    }
    
    console.log(`🏃‍♂️ 캐시된 스타일로 빠른 파싱: ${styleKey} (${patterns.description})`);
    
    // 로컬 파싱 로직 (기존 localParser.js 활용)
    const mockRules = {
        sceneNumberPattern: { regex: patterns.scene },
        locationPattern: { regex: patterns.location },
        timeOfDayPattern: { regex: patterns.time },
        dialoguePattern: { regex: patterns.character },
        confidence: patterns.confidence
    };
    
    const { parseScriptLocally, convertToStandardFormat } = require('./localParser');
    const localResult = parseScriptLocally(scriptText, mockRules);
    
    return {
        ...convertToStandardFormat(localResult),
        parsingMethod: 'cached-style',
        styleUsed: styleKey,
        aiCost: 0, // AI 비용 없음!
        processingTime: Date.now() // 빠른 처리
    };
}

/**
 * 새로운 스타일 학습 및 캐시 저장
 * @param {Object} aiGeneratedRules - AI가 생성한 규칙
 * @param {string} scriptText - 원본 대본
 */
function learnNewStyle(aiGeneratedRules, scriptText) {
    const styleKey = `learned_${Date.now()}`;
    
    // AI 규칙을 캐시 가능한 형태로 변환
    const cachedPattern = {
        scene: aiGeneratedRules.sceneNumberPattern?.regex,
        location: aiGeneratedRules.locationPattern?.regex, 
        time: aiGeneratedRules.timeOfDayPattern?.regex,
        character: aiGeneratedRules.dialoguePattern?.regex,
        confidence: aiGeneratedRules.confidence || 0.8,
        description: `학습된 스타일 (${new Date().toLocaleDateString()})`,
        createdAt: Date.now(),
        sampleHash: generateTextHash(scriptText.substring(0, 500)) // 대본 식별용
    };
    
    LEARNED_PATTERNS[styleKey] = cachedPattern;
    
    console.log(`🧠 새로운 스타일 학습 완료: ${styleKey}`);
    
    // TODO: 로컬 스토리지나 DB에 저장하여 영구 보존
    savePatternsToStorage(LEARNED_PATTERNS);
    
    return styleKey;
}

/**
 * 하이브리드 파싱 결정 로직
 * @param {string} scriptText - 대본 텍스트
 * @returns {Object} 파싱 전략 정보
 */
function decideParsiningStrategy(scriptText) {
    const detectedStyle = detectScriptStyle(scriptText);
    
    if (detectedStyle) {
        return {
            strategy: 'cached',
            styleKey: detectedStyle,
            reason: `알려진 스타일 감지: ${KNOWN_STYLE_PATTERNS[detectedStyle]?.description || LEARNED_PATTERNS[detectedStyle]?.description}`,
            estimatedCost: 0,
            estimatedTime: 1000 // 1초
        };
    }
    
    return {
        strategy: 'ai-learning',
        reason: '새로운 스타일, AI 분석 필요',
        estimatedCost: 0.02, // $0.02 정도
        estimatedTime: 15000 // 15초
    };
}

/**
 * 텍스트 해시 생성 (대본 식별용)
 */
function generateTextHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수 변환
    }
    return hash.toString();
}

/**
 * 패턴을 로컬 스토리지에 저장 (영구 보존)
 */
function savePatternsToStorage(patterns) {
    try {
        // TODO: 실제 구현시 파일시스템이나 DB에 저장
        console.log(`💾 ${Object.keys(patterns).length}개 패턴 저장됨`);
    } catch (error) {
        console.warn('패턴 저장 실패:', error.message);
    }
}

/**
 * 저장된 패턴들 로드
 */
function loadPatternsFromStorage() {
    try {
        // TODO: 실제 구현시 파일시스템이나 DB에서 로드
        return {};
    } catch (error) {
        console.warn('패턴 로드 실패:', error.message);
        return {};
    }
}

// 초기화시 저장된 패턴들 로드
LEARNED_PATTERNS = loadPatternsFromStorage();

module.exports = {
    KNOWN_STYLE_PATTERNS,
    detectScriptStyle,
    parseWithCachedStyle,
    learnNewStyle,
    decideParsiningStrategy,
    LEARNED_PATTERNS
};