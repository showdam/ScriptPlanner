// ScriptPlanner - 로컬 파싱 엔진
// AI가 생성한 규칙을 사용하여 로컬에서 빠르게 대본을 파싱

/**
 * AI 생성 규칙을 사용하여 전체 대본을 로컬에서 파싱
 * @param {string} scriptText - 전체 대본 텍스트
 * @param {Object} parsingRules - AI가 생성한 파싱 규칙
 * @returns {Object} 파싱된 대본 데이터
 */
function parseScriptLocally(scriptText, parsingRules) {
    console.log('🔧 로컬 파싱 시작...');
    
    const startTime = Date.now();
    const lines = scriptText.split('\n').filter(line => line.trim().length > 0);
    
    const result = {
        scenes: [],
        characters: new Set(),
        locations: new Set(),
        characterFrequency: new Map(),
        totalScenes: 0,
        parsingStats: {
            totalLines: lines.length,
            processedLines: 0,
            sceneHeadersFound: 0,
            dialogueLinesFound: 0,
            actionLinesFound: 0,
            confidence: parsingRules.confidence || 0.7
        }
    };
    
    let currentScene = null;
    let currentSceneDialogues = [];
    let currentSceneActions = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        result.parsingStats.processedLines++;
        
        // 1. 씬 헤더 감지
        if (isSceneHeader(line, parsingRules)) {
            // 이전 씬 저장
            if (currentScene) {
                currentScene.dialogues = [...currentSceneDialogues];
                currentScene.actions = [...currentSceneActions];
                currentScene.content = currentScene.content.trim();
                result.scenes.push(currentScene);
            }
            
            // 새 씬 시작
            currentScene = createNewScene(line, parsingRules, i);
            currentSceneDialogues = [];
            currentSceneActions = [];
            
            result.parsingStats.sceneHeadersFound++;
            
            // 장소 정보 수집
            if (currentScene.location) {
                result.locations.add(currentScene.location);
            }
            
            continue;
        }
        
        if (currentScene) {
            currentScene.content += line + '\n';
            
            // 2. 대사 감지
            const dialogueInfo = parseDialogue(line, parsingRules);
            if (dialogueInfo) {
                currentSceneDialogues.push(dialogueInfo);
                
                // 캐릭터 정보 수집
                result.characters.add(dialogueInfo.character);
                result.characterFrequency.set(
                    dialogueInfo.character,
                    (result.characterFrequency.get(dialogueInfo.character) || 0) + 1
                );
                
                // 씬 캐릭터 목록에 추가
                if (!currentScene.characters.includes(dialogueInfo.character)) {
                    currentScene.characters.push(dialogueInfo.character);
                }
                
                result.parsingStats.dialogueLinesFound++;
            } else {
                // 3. 지문으로 처리
                if (line.length > 0) {
                    currentSceneActions.push(line);
                    result.parsingStats.actionLinesFound++;
                }
            }
        }
    }
    
    // 마지막 씬 저장
    if (currentScene) {
        currentScene.dialogues = [...currentSceneDialogues];
        currentScene.actions = [...currentSceneActions];
        currentScene.content = currentScene.content.trim();
        result.scenes.push(currentScene);
    }
    
    // 결과 정리
    result.totalScenes = result.scenes.length;
    result.characters = Array.from(result.characters);
    result.locations = Array.from(result.locations);
    result.characterFrequency = Object.fromEntries(result.characterFrequency);
    
    // 파싱 통계
    const endTime = Date.now();
    result.parsingStats.processingTime = endTime - startTime;
    result.parsingStats.averageTimePerLine = result.parsingStats.processingTime / result.parsingStats.totalLines;
    
    console.log(`✅ 로컬 파싱 완료: ${result.totalScenes}개 씬, ${result.parsingStats.processingTime}ms`);
    
    return result;
}

/**
 * 씬 헤더인지 확인
 */
function isSceneHeader(line, rules) {
    try {
        const regex = rules.sceneNumberPattern.regex;
        return regex.test(line);
    } catch (error) {
        // 기본 패턴으로 폴백
        const defaultPattern = /^(S\s*\d+|씬\s*\d+|Scene\s*\d+)/i;
        return defaultPattern.test(line);
    }
}

/**
 * 새로운 씬 객체 생성
 */
function createNewScene(headerLine, rules, lineIndex) {
    const sceneNumber = extractSceneNumber(headerLine, rules);
    const location = extractLocation(headerLine, rules);
    const timeOfDay = extractTimeOfDay(headerLine, rules);
    
    return {
        number: sceneNumber,
        location: location,
        timeOfDay: timeOfDay,
        content: headerLine + '\n',
        characters: [],
        dialogues: [],
        actions: [],
        lineIndex: lineIndex,
        confidence: calculateSceneConfidence(headerLine, rules)
    };
}

/**
 * 씬 번호 추출
 */
function extractSceneNumber(line, rules) {
    try {
        const match = line.match(rules.sceneNumberPattern.regex);
        if (match) {
            // 숫자 부분만 추출
            const numberMatch = match[0].match(/\d+/);
            return numberMatch ? numberMatch[0] : null;
        }
    } catch (error) {
        console.warn('씬 번호 추출 실패:', error.message);
    }
    
    // 기본 추출 방식
    const fallbackMatch = line.match(/\d+/);
    return fallbackMatch ? fallbackMatch[0] : null;
}

/**
 * 장소 정보 추출 - 시간과 장소 분리 개선 버전 + 씬 특성 필터링
 */
function extractLocation(line, rules) {
    // 시간 키워드 리스트 (더 포괄적)
    const timeKeywords = /^(DAY|NIGHT|낮|밤|아침|저녁|새벽|오전|오후|이른아침|늦은저녁|심야|자정|정오|D|N)$/i;
    
    // 씬 특성 키워드 (장소가 아닌 씬의 특성/기법)
    const sceneCharacteristics = /^(과거|회상|플래시백|FLASHBACK|몽타주|MONTAGE|슬로모션|SLOW|빨리감기|FAST|삽입|INSERT|INS\.|CUT|CUT TO|Cut to|FADE|DISSOLVE|클로즈업|CLOSE|미디엄|MEDIUM|풀샷|FULL|항공|AERIAL|POV|주관적|객관적)$/i;
    
    // 1차: "S1. 시간, 장소" 패턴 특별 처리 (고잉홈 스타일)
    const specialMatch = line.match(/^S\d+\.\s*([가-힣]+),\s*(.+)$/i);
    if (specialMatch && specialMatch[2]) {
        const timeCandidate = specialMatch[1].trim();
        const locationCandidate = specialMatch[2].trim();
        
        // 첫 번째가 시간이면 두 번째가 장소
        if (timeKeywords.test(timeCandidate)) {
            // 장소에서 추가 시간 정보 제거
            const cleanLocation = locationCandidate.replace(/\s*[-,]\s*(DAY|NIGHT|낮|밤|아침|저녁|새벽|오전|오후).*$/i, '');
            return cleanLocation.trim();
        }
        
        // 첫 번째가 씬 특성이면 두 번째가 장소
        if (sceneCharacteristics.test(timeCandidate)) {
            return locationCandidate.trim();
        }
    }
    
    // 2차: AI 생성 규칙 시도 (하지만 시간 필터링 강화)
    try {
        const match = line.match(rules.locationPattern.regex);
        if (match) {
            // 모든 그룹을 확인해서 가장 적절한 장소 정보 선택
            for (let i = 1; i < match.length; i++) {
                if (match[i] && match[i].trim().length > 0) {
                    const location = match[i].trim();
                    // 시간 키워드나 씬 특성이 아닌 경우만 장소로 인정
                    if (!timeKeywords.test(location) && !sceneCharacteristics.test(location)) {
                        // 혹시 시간이나 특성 정보가 섞여있으면 제거
                        const cleanLocation = location.replace(/\s*[-,]\s*(DAY|NIGHT|낮|밤|아침|저녁|새벽|오전|오후|과거|회상|플래시백|몽타주|CUT TO|Cut to|INS\.).*$/i, '');
                        if (cleanLocation.length > 0) {
                            return cleanLocation;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.warn('AI 규칙 장소 추출 실패:', error.message);
    }
    
    // 2차: 표준 INT./EXT. 패턴
    const standardPatterns = [
        /(INT\.|EXT\.)\s+([^-\n]+?)(?:\s*-\s*(DAY|NIGHT|낮|밤))?/i,
        /(실내|실외)\s*[:\s]\s*([^-\n,]+)/i
    ];
    
    for (const pattern of standardPatterns) {
        const match = line.match(pattern);
        if (match && match[2]) {
            return match[2].trim();
        }
    }
    
    // 3차: 씬 번호 다음의 장소
    const sceneLocationPatterns = [
        /S\d+\.?\s+([^-,\n]+?)(?:\s*-\s*(DAY|NIGHT|낮|밤))?/i,
        /씬\s*\d+\.?\s+([^-,\n]+?)(?:\s*-\s*(DAY|NIGHT|낮|밤))?/i,
        /Scene\s*\d+\s*[-:]?\s*([^-,\n]+?)(?:\s*-\s*(DAY|NIGHT|낮|밤))?/i,
        /\d+\.?\s+([^-,\n]+?)(?:\s*-\s*(DAY|NIGHT|낮|밤))?/i
    ];
    
    for (const pattern of sceneLocationPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
            const location = match[1].trim();
            // INT./EXT. 접두사 제거
            const cleaned = location.replace(/^(INT\.|EXT\.)\s*/i, '');
            if (cleaned.length > 0) {
                return cleaned;
            }
        }
    }
    
    // 4차: 괄호나 특수 기호 안의 장소
    const specialPatterns = [
        /\[([^\]]+)\]/,  // [카페]
        /\(([^)]+)\)/,   // (카페)
        /【([^】]+)】/,    // 【카페】
    ];
    
    for (const pattern of specialPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
            const location = match[1].trim();
            // 시간 정보나 씬 특성이 아닌 경우만
            if (!timeKeywords.test(location) && !sceneCharacteristics.test(location)) {
                return location;
            }
        }
    }
    
    return null;
}

/**
 * 시간대 정보 추출 - 고잉홈 스타일 대응 + 씬 특성 필터링
 */
function extractTimeOfDay(line, rules) {
    // 시간 키워드와 씬 특성 키워드 정의
    const timeKeywords = /^(DAY|NIGHT|낮|밤|아침|저녁|새벽|오전|오후|이른아침|늦은저녁|심야|자정|정오)$/i;
    const sceneCharacteristics = /^(과거|회상|플래시백|FLASHBACK|몽타주|MONTAGE|슬로모션|SLOW|빨리감기|FAST|삽입|INSERT|INS\.|CUT|CUT TO|Cut to|FADE|DISSOLVE|클로즈업|CLOSE|미디엄|MEDIUM|풀샷|FULL|항공|AERIAL|POV|주관적|객관적)$/i;
    
    // 1차: "S1. 시간, 장소" 패턴 특별 처리 (고잉홈 스타일)
    const specialMatch = line.match(/^S\d+\.\s*([가-힣]+),/i);
    if (specialMatch && specialMatch[1]) {
        const timeCandidate = specialMatch[1].trim();
        
        // 시간 키워드인 경우만 시간으로 인정 (씬 특성은 제외)
        if (timeKeywords.test(timeCandidate) && !sceneCharacteristics.test(timeCandidate)) {
            return normalizeTimeOfDay(timeCandidate);
        }
    }
    
    // 2차: AI 생성 규칙 시도
    try {
        const match = line.match(rules.timeOfDayPattern.regex);
        if (match) {
            // 첫 번째 그룹부터 확인 - 씬 특성 제외
            for (let i = 1; i < match.length; i++) {
                if (match[i] && match[i].trim().length > 0) {
                    const timeCandidate = match[i].trim();
                    // 씬 특성이 아닌 경우만 시간으로 인정
                    if (!sceneCharacteristics.test(timeCandidate)) {
                        return normalizeTimeOfDay(timeCandidate);
                    }
                }
            }
        }
    } catch (error) {
        console.warn('시간대 추출 실패:', error.message);
    }
    
    // 3차: 기본 패턴
    const fallbackMatch = line.match(/(DAY|NIGHT|낮|밤|아침|저녁|새벽|오후|오전|이른아침|늦은저녁|심야|자정|정오)/i);
    if (fallbackMatch) {
        return normalizeTimeOfDay(fallbackMatch[1]);
    }
    
    return null;
}

/**
 * 시간대 정규화
 */
function normalizeTimeOfDay(timeString) {
    const normalized = timeString.toUpperCase();
    
    const dayTerms = ['DAY', '낮', '아침', '오전', '오후'];
    const nightTerms = ['NIGHT', '밤', '저녁', '새벽'];
    
    if (dayTerms.some(term => normalized.includes(term.toUpperCase()))) {
        return 'DAY';
    } else if (nightTerms.some(term => normalized.includes(term.toUpperCase()))) {
        return 'NIGHT';
    }
    
    return normalized;
}

/**
 * 대사 파싱
 */
function parseDialogue(line, rules) {
    try {
        const match = line.match(rules.dialoguePattern.regex);
        if (match && match[1]) {
            return {
                character: match[1].trim(),
                text: match[2] ? match[2].trim() : '',
                originalLine: line
            };
        }
    } catch (error) {
        console.warn('대사 파싱 실패:', error.message);
    }
    
    // 기본 대사 패턴들
    const fallbackPatterns = [
        /^([A-Z가-힣\s]+)\s*:\s*(.+)/,
        /^([A-Z가-힣\s]+)\s*\(\s*[^)]*\s*\)\s*:\s*(.+)/,
        /^([A-Z가-힣\s]+)\s*\(\s*[^)]*\s*\)\s*(.+)/
    ];
    
    for (const pattern of fallbackPatterns) {
        const match = line.match(pattern);
        if (match) {
            return {
                character: match[1].trim(),
                text: match[2] ? match[2].trim() : '',
                originalLine: line
            };
        }
    }
    
    return null;
}

/**
 * 씬의 신뢰도 계산
 */
function calculateSceneConfidence(headerLine, rules) {
    let confidence = 0.5; // 기본 신뢰도
    
    // 씬 번호가 명확한지 확인
    if (extractSceneNumber(headerLine, rules)) {
        confidence += 0.2;
    }
    
    // 장소가 명확한지 확인
    if (extractLocation(headerLine, rules)) {
        confidence += 0.2;
    }
    
    // 시간대가 명확한지 확인
    if (extractTimeOfDay(headerLine, rules)) {
        confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
}

/**
 * 파싱 결과를 기존 형식에 맞게 변환 + 등장인물 필터링 및 정렬
 */
function convertToStandardFormat(localParsingResult) {
    // 등장인물 필터링 및 정렬 개선
    const cleanCharacters = filterAndSortCharacters(
        localParsingResult.characters, 
        localParsingResult.characterFrequency
    );
    
    return {
        scenes: localParsingResult.scenes.map(scene => ({
            number: scene.number || `S${localParsingResult.scenes.indexOf(scene) + 1}`,
            timeOfDay: scene.timeOfDay || 'DAY',
            location: scene.location || '미상',
            content: generateSceneContent(scene),
            characters: scene.characters || [],
            confidence: scene.confidence || 0.7
        })),
        locations: localParsingResult.locations,
        characters: cleanCharacters.names,
        characterFrequency: cleanCharacters.frequency,
        totalScenes: localParsingResult.totalScenes,
        parsingMethod: 'local-ai-rules',
        parsingStats: localParsingResult.parsingStats
    };
}

/**
 * 등장인물 필터링 및 언급 횟수 순 정렬
 */
function filterAndSortCharacters(characters, characterFrequency) {
    const validCharacters = [];
    const cleanFrequency = {};
    
    // 잘못된 캐릭터 필터링
    const invalidPatterns = [
        /^(무전|효과음|E|V\.O|나레이션|자막|타이틀|CUT|FADE|화면|장면)$/i, // 기술 용어
        /^(그|그녀|그들|사람들|군중|목소리|소리)$/i, // 일반 명사
        /^[0-9\s\-]+$/, // 숫자만
        /^[a-zA-Z\s\-]{1,2}$/, // 너무 짧은 영어
        /^.{1}$/, // 한 글자
        /소리$|음$|^배경/, // 소리/음향 효과
        /^(INT\.|EXT\.|S\d+)/, // 씬 헤더 요소
    ];
    
    characters.forEach(character => {
        const name = typeof character === 'string' ? character : character.name || character;
        if (!name || name.trim().length === 0) return;
        
        const trimmedName = name.trim();
        
        // 잘못된 패턴 검사
        const isInvalid = invalidPatterns.some(pattern => pattern.test(trimmedName));
        if (isInvalid) return;
        
        // 빈도가 있는 경우만 (실제로 언급된 캐릭터)
        const frequency = characterFrequency[trimmedName] || 0;
        if (frequency > 0) {
            validCharacters.push({
                name: trimmedName,
                frequency: frequency
            });
            cleanFrequency[trimmedName] = frequency;
        }
    });
    
    // 언급 횟수 순으로 정렬 (많이 언급된 순)
    validCharacters.sort((a, b) => b.frequency - a.frequency);
    
    return {
        names: validCharacters.map(char => char.name),
        frequency: cleanFrequency
    };
}

/**
 * 씬 내용 요약 생성
 */
function generateSceneContent(scene) {
    let content = '';
    
    // 주요 액션 추가 (최대 2개)
    if (scene.actions && scene.actions.length > 0) {
        const mainActions = scene.actions.slice(0, 2);
        content += mainActions.join(' ') + ' ';
    }
    
    // 주요 캐릭터 대사 추가
    if (scene.characters && scene.characters.length > 0) {
        content += `등장: ${scene.characters.join(', ')}`;
    }
    
    return content.trim().substring(0, 100) + (content.length > 100 ? '...' : '');
}

module.exports = {
    parseScriptLocally,
    convertToStandardFormat
};