// ScriptPlanner - 샘플 씬 추출기
// 대표성 있는 5개 씬을 추출하여 AI가 파싱 규칙을 생성할 수 있도록 함

/**
 * 대본에서 5개의 대표 샘플 씬을 추출하는 함수
 * @param {string} scriptText - 전체 대본 텍스트
 * @returns {Array} 추출된 5개 샘플 씬의 정보
 */
function extractSampleScenes(scriptText) {
    const lines = scriptText.split('\n').filter(line => line.trim().length > 0);
    const scenes = [];
    let currentScene = null;
    let sceneStartIndex = 0;
    
    // 1단계: 전체 씬을 식별하고 분리
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 씬 헤더 패턴들 (다양한 작가 스타일 고려)
        const scenePatterns = [
            /^(S\s*\d+)/i,                              // S1, S 1
            /^(Scene\s*\d+)/i,                          // Scene 1, SCENE 1  
            /^(씬\s*\d+)/i,                             // 씬1, 씬 1
            /^(제?\s*\d+\s*장)/i,                       // 1장, 제1장
            /^(\d+\s*\.\s*(INT|EXT))/i,                 // 1. INT, 2. EXT
            /^(#\s*S?\s*\d+)/i,                         // #S1, # S1, #1
            /^\[.*씬.*\d+.*\]/i,                        // [씬1], [Scene 1]
            /^(INT\.|EXT\.)\s+.+\s+-\s+(DAY|NIGHT)/i,   // 표준 영화 스크립트 형식
            /^=+\s*S?\s*\d+/i,                          // ===S1===
            /^\*+\s*씬?\s*\d+/i                         // ***씬1***
        ];
        
        const isSceneHeader = scenePatterns.some(pattern => pattern.test(line));
        
        if (isSceneHeader) {
            // 이전 씬 저장
            if (currentScene && currentScene.lines.length > 0) {
                currentScene.endIndex = i - 1;
                scenes.push(currentScene);
            }
            
            // 새 씬 시작
            currentScene = {
                index: scenes.length,
                header: line,
                lines: [],
                startIndex: i,
                endIndex: -1,
                dialogueLines: 0,
                actionLines: 0,
                characters: new Set(),
                complexity: 0
            };
            sceneStartIndex = i;
        }
        
        if (currentScene) {
            currentScene.lines.push(line);
            
            // 대사 vs 지문 분류
            if (isDialogueLine(line)) {
                currentScene.dialogueLines++;
                extractCharactersFromLine(line, currentScene.characters);
            } else if (!isSceneHeader) {
                currentScene.actionLines++;
            }
        }
    }
    
    // 마지막 씬 처리
    if (currentScene && currentScene.lines.length > 0) {
        currentScene.endIndex = lines.length - 1;
        scenes.push(currentScene);
    }
    
    // 2단계: 각 씬의 복잡도 계산
    scenes.forEach(scene => {
        scene.complexity = calculateComplexity(scene);
    });
    
    // 3단계: 5개 대표 샘플 씬 선택
    const samples = selectRepresentativeScenes(scenes);
    
    // 4단계: 추출된 샘플 정보 반환
    return samples.map(scene => ({
        type: scene.sampleType,
        header: scene.header,
        content: scene.lines.join('\n'),
        stats: {
            totalLines: scene.lines.length,
            dialogueLines: scene.dialogueLines,
            actionLines: scene.actionLines,
            charactersCount: scene.characters.size,
            complexity: scene.complexity
        },
        analysis: {
            sceneNumber: extractSceneNumber(scene.header),
            location: extractLocation(scene.header),
            timeOfDay: extractTimeOfDay(scene.header),
            characters: Array.from(scene.characters)
        }
    }));
}

/**
 * 대사 라인인지 확인
 */
function isDialogueLine(line) {
    // 일반적인 대사 패턴들
    const dialoguePatterns = [
        /^[A-Z가-힣\s]+\s*:/,           // 캐릭터: 대사
        /^[A-Z가-힣\s]+\s*\(/,          // 캐릭터(감정)
        /^\s*".*"$/,                    // "대사"
        /^\s*'.*'$/,                    // '대사'
        /^[가-힣A-Z\s]+\s*\([^)]*\)\s*:/ // 캐릭터(나이): 대사
    ];
    
    return dialoguePatterns.some(pattern => pattern.test(line.trim()));
}

/**
 * 라인에서 캐릭터명 추출
 */
function extractCharactersFromLine(line, characterSet) {
    const patterns = [
        /^([A-Z가-힣\s]+)\s*:/,           // 캐릭터:
        /^([A-Z가-힣\s]+)\s*\(/,          // 캐릭터(
        /^([가-힣A-Z\s]+)\s*\([^)]*\)\s*:/ // 캐릭터(나이):
    ];
    
    for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
            const character = match[1].trim();
            if (character.length > 0 && character.length < 20) {
                characterSet.add(character);
            }
            break;
        }
    }
}

/**
 * 씬의 복잡도 계산
 */
function calculateComplexity(scene) {
    let complexity = 0;
    
    // 등장인물 수에 따른 가중치
    complexity += scene.characters.size * 2;
    
    // 대사와 지문의 균형
    const totalContent = scene.dialogueLines + scene.actionLines;
    if (totalContent > 0) {
        const dialogueRatio = scene.dialogueLines / totalContent;
        complexity += Math.abs(dialogueRatio - 0.5) * 10; // 균형잡힌 씬일수록 복잡
    }
    
    // 씬의 길이
    complexity += Math.log(scene.lines.length + 1) * 3;
    
    // 특수 구조나 키워드 감지
    const specialPatterns = [
        /몽타주|montage/i,
        /플래시백|flashback/i,
        /회상|과거/i,
        /동시에|meanwhile/i,
        /삽입|insert/i
    ];
    
    const sceneText = scene.lines.join(' ');
    specialPatterns.forEach(pattern => {
        if (pattern.test(sceneText)) {
            complexity += 5;
        }
    });
    
    return Math.round(complexity);
}

/**
 * 5개 대표 샘플 씬 선택
 */
function selectRepresentativeScenes(scenes) {
    if (scenes.length === 0) return [];
    
    const samples = [];
    
    // 1. 첫 번째 씬 (오프닝, 스타일 파악용)
    if (scenes.length > 0) {
        const firstScene = { ...scenes[0] };
        firstScene.sampleType = 'opening';
        samples.push(firstScene);
    }
    
    // 2. 중간 씬 (일반적인 구조 파악용)
    if (scenes.length > 2) {
        const middleIndex = Math.floor(scenes.length / 2);
        const middleScene = { ...scenes[middleIndex] };
        middleScene.sampleType = 'middle';
        samples.push(middleScene);
    }
    
    // 3. 대화가 많은 씬 (대사 구조 파악용)
    const dialogueHeavyScene = scenes
        .filter(scene => !samples.some(s => s.index === scene.index))
        .sort((a, b) => b.dialogueLines - a.dialogueLines)[0];
    if (dialogueHeavyScene) {
        const scene = { ...dialogueHeavyScene };
        scene.sampleType = 'dialogue-heavy';
        samples.push(scene);
    }
    
    // 4. 지문이 많은 씬 (액션 구조 파악용)  
    const actionHeavyScene = scenes
        .filter(scene => !samples.some(s => s.index === scene.index))
        .sort((a, b) => b.actionLines - a.actionLines)[0];
    if (actionHeavyScene) {
        const scene = { ...actionHeavyScene };
        scene.sampleType = 'action-heavy';
        samples.push(scene);
    }
    
    // 5. 복잡한 씬 (종합 구조 파악용)
    const complexScene = scenes
        .filter(scene => !samples.some(s => s.index === scene.index))
        .sort((a, b) => b.complexity - a.complexity)[0];
    if (complexScene) {
        const scene = { ...complexScene };
        scene.sampleType = 'complex';
        samples.push(scene);
    }
    
    // 부족한 샘플을 임의로 채우기 (5개 미만인 경우)
    while (samples.length < 5 && samples.length < scenes.length) {
        const remainingScenes = scenes.filter(scene => 
            !samples.some(s => s.index === scene.index)
        );
        if (remainingScenes.length > 0) {
            const randomScene = { ...remainingScenes[0] };
            randomScene.sampleType = 'additional';
            samples.push(randomScene);
        } else {
            break;
        }
    }
    
    return samples;
}

/**
 * 씬 헤더에서 씬 번호 추출
 */
function extractSceneNumber(header) {
    const patterns = [
        /S\s*(\d+)/i,
        /Scene\s*(\d+)/i,
        /씬\s*(\d+)/i,
        /(\d+)\s*장/i,
        /(\d+)\s*\./i,
        /#\s*S?\s*(\d+)/i
    ];
    
    for (const pattern of patterns) {
        const match = header.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

/**
 * 씬 헤더에서 장소 정보 추출  
 */
function extractLocation(header) {
    // 위치 추출 패턴들
    const locationPatterns = [
        /(?:INT\.|EXT\.)\s+([^-]+)/i,
        /(?:실내|실외)[,\s]+([^-,\n]+)/i,
        /(?:S\d+\.?)\s+([^-,\n]+)/i
    ];
    
    for (const pattern of locationPatterns) {
        const match = header.match(pattern);
        if (match) return match[1].trim();
    }
    
    return null;
}

/**
 * 씬 헤더에서 시간 정보 추출
 */
function extractTimeOfDay(header) {
    const timePatterns = [
        /(DAY|NIGHT|낮|밤|아침|저녁|새벽|오후|오전)/i
    ];
    
    for (const pattern of timePatterns) {
        const match = header.match(pattern);
        if (match) return match[1].toUpperCase();
    }
    
    return null;
}

module.exports = {
    extractSampleScenes
};