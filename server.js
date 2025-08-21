// ScriptPlanner MVP - Express Server

const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

// 사용량 추적 시스템
const usageTracker = {
    daily: {},
    monthly: {},
    
    // 예상 비용 계산 (토큰 기반)
    estimateCost: (inputTokens, outputTokens) => {
        const INPUT_COST_PER_MILLION = 3.0;  // $3 per million input tokens
        const OUTPUT_COST_PER_MILLION = 15.0; // $15 per million output tokens
        
        const inputCost = (inputTokens / 1000000) * INPUT_COST_PER_MILLION;
        const outputCost = (outputTokens / 1000000) * OUTPUT_COST_PER_MILLION;
        
        return inputCost + outputCost;
    },
    
    // 토큰 수 추정 (한국어 기준)
    estimateTokens: (text) => {
        // 한국어는 대략 글자당 1.5토큰 정도로 추정
        return Math.ceil(text.length * 1.5);
    },
    
    // 일일 사용량 추가
    addDailyUsage: (cost) => {
        const today = new Date().toISOString().split('T')[0];
        if (!usageTracker.daily[today]) {
            usageTracker.daily[today] = { cost: 0, requests: 0 };
        }
        usageTracker.daily[today].cost += cost;
        usageTracker.daily[today].requests += 1;
    },
    
    // 월간 사용량 추가
    addMonthlyUsage: (cost) => {
        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (!usageTracker.monthly[month]) {
            usageTracker.monthly[month] = { cost: 0, requests: 0 };
        }
        usageTracker.monthly[month].cost += cost;
        usageTracker.monthly[month].requests += 1;
    },
    
    // 현재 월 사용량 확인
    getCurrentMonthUsage: () => {
        const month = new Date().toISOString().slice(0, 7);
        return usageTracker.monthly[month] || { cost: 0, requests: 0 };
    },
    
    // 오늘 사용량 확인
    getTodayUsage: () => {
        const today = new Date().toISOString().split('T')[0];
        return usageTracker.daily[today] || { cost: 0, requests: 0 };
    }
};

// 사용량 제한 설정
const USAGE_LIMITS = {
    MONTHLY_COST_LIMIT: 100.0,     // $100 월 한도
    DAILY_COST_LIMIT: 10.0,       // $10 일일 한도  
    HOURLY_REQUEST_LIMIT: 10,      // 시간당 10회
    DAILY_REQUEST_LIMIT: 50,       // 일일 50회
    WARNING_THRESHOLD: 80.0        // $80 경고 임계값
};

// API 레이트 리미터들
const hourlyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: USAGE_LIMITS.HOURLY_REQUEST_LIMIT,
    message: {
        error: '시간당 분석 한도를 초과했습니다. 1시간 후 다시 시도해주세요.',
        limit: 'hourly',
        resetTime: new Date(Date.now() + 60 * 60 * 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const dailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24시간
    max: USAGE_LIMITS.DAILY_REQUEST_LIMIT,
    message: {
        error: '일일 분석 한도를 초과했습니다. 내일 다시 시도해주세요.',
        limit: 'daily',
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 비용 기반 제한 미들웨어
const costLimitMiddleware = (req, res, next) => {
    const monthlyUsage = usageTracker.getCurrentMonthUsage();
    const todayUsage = usageTracker.getTodayUsage();
    
    // 월간 한도 체크
    if (monthlyUsage.cost >= USAGE_LIMITS.MONTHLY_COST_LIMIT) {
        return res.status(429).json({
            error: '월간 사용량 한도($100)를 초과했습니다. 다음 달에 다시 이용해주세요.',
            limit: 'monthly',
            usage: {
                current: monthlyUsage.cost.toFixed(2),
                limit: USAGE_LIMITS.MONTHLY_COST_LIMIT
            }
        });
    }
    
    // 일일 한도 체크
    if (todayUsage.cost >= USAGE_LIMITS.DAILY_COST_LIMIT) {
        return res.status(429).json({
            error: '일일 사용량 한도($10)를 초과했습니다. 내일 다시 이용해주세요.',
            limit: 'daily',
            usage: {
                current: todayUsage.cost.toFixed(2),
                limit: USAGE_LIMITS.DAILY_COST_LIMIT
            }
        });
    }
    
    // 경고 임계값 체크
    if (monthlyUsage.cost >= USAGE_LIMITS.WARNING_THRESHOLD) {
        console.warn(`⚠️  월간 사용량 경고: $${monthlyUsage.cost.toFixed(2)} / $${USAGE_LIMITS.MONTHLY_COST_LIMIT}`);
    }
    
    next();
};

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Claude AI를 사용한 대본 분석 함수
async function analyzeScriptWithAI(text) {
    const SCRIPT_ANALYSIS_PROMPT = `
당신은 한국 영상 제작 전문가입니다. 업로드된 대본을 분석해서 촬영계획표 작성에 필요한 정보를 정확하게 추출해주세요.

대본:
${text}

다음 정보를 JSON 형식으로 추출해주세요:

{
  "scenes": [
    {
      "number": "씬 번호 (예: S1, S2)",
      "timeOfDay": "DAY 또는 NIGHT",
      "location": "촬영 장소",
      "content": "씬 내용 요약 (50자 이내)",
      "characters": ["등장인물 목록"],
      "confidence": 0.9
    }
  ],
  "characters": [
    {
      "name": "등장인물명",
      "appearances": 출연_횟수,
      "role": "주연/조연/단역"
    }
  ],
  "locations": ["장소1", "장소2"],
  "totalScenes": 총_씬_수
}

주의사항:
- 반드시 유효한 JSON만 응답하세요
- 씬 번호는 S1, S2 형식으로 통일
- 등장인물의 다양한 호칭을 통합해서 처리
- 확실하지 않은 정보는 confidence를 낮게 설정
- 장소명은 간결하게 정리

응답:`;

    try {
        console.log('Claude AI 분석 시작...');
        
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            messages: [{
                role: "user",
                content: SCRIPT_ANALYSIS_PROMPT
            }]
        });

        const aiResponse = response.content[0].text;
        console.log('Claude AI 응답 수신:', aiResponse.substring(0, 200) + '...');
        
        // 사용량 추적 (실제 토큰 사용량)
        const inputTokens = response.usage?.input_tokens || usageTracker.estimateTokens(text);
        const outputTokens = response.usage?.output_tokens || usageTracker.estimateTokens(aiResponse);
        const estimatedCost = usageTracker.estimateCost(inputTokens, outputTokens);
        
        // 사용량 기록
        usageTracker.addDailyUsage(estimatedCost);
        usageTracker.addMonthlyUsage(estimatedCost);
        
        console.log(`💰 API 사용량: $${estimatedCost.toFixed(4)} (입력: ${inputTokens}, 출력: ${outputTokens} 토큰)`);
        
        // JSON 응답 파싱
        let analysisResult;
        try {
            // JSON 코드 블록에서 실제 JSON 추출
            const jsonMatch = aiResponse.match(/```json\n(.*?)\n```/s) || aiResponse.match(/\{.*\}/s);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
            analysisResult = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON 파싱 실패, 규칙 기반 분석으로 대체:', parseError);
            return analyzeScript(text); // 파싱 실패시 기존 규칙 기반 분석 사용
        }

        // AI 결과를 기존 형식에 맞게 변환
        const formattedResult = {
            scenes: analysisResult.scenes.map(scene => ({
                number: scene.number,
                timeOfDay: scene.timeOfDay,
                location: scene.location,
                content: scene.content,
                characters: scene.characters || [],
                confidence: scene.confidence || 0.8
            })),
            locations: analysisResult.locations || [],
            characters: analysisResult.characters ? 
                analysisResult.characters.map(char => char.name) : [],
            characterFrequency: {},
            totalScenes: analysisResult.totalScenes || analysisResult.scenes.length
        };

        // 등장인물 빈도 계산
        if (analysisResult.characters) {
            analysisResult.characters.forEach(char => {
                formattedResult.characterFrequency[char.name] = char.appearances;
            });
        }

        console.log('AI 분석 완료:', formattedResult.totalScenes, '씬');
        return formattedResult;

    } catch (error) {
        console.error('Claude AI 분석 실패:', error.message);
        console.log('규칙 기반 분석으로 대체 실행...');
        
        // AI 분석 실패시 기존 규칙 기반 분석 사용
        return analyzeScript(text);
    }
}

// 향상된 대본 분석 함수 (규칙 기반 - 백업용)
function analyzeScript(text) {
    const scenes = [];
    const locations = new Set();
    const characters = new Set();
    const characterFrequency = new Map();
    
    // 텍스트를 줄별로 분리하고 전처리
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    let currentScene = null;
    let sceneContent = [];
    let sceneCharacters = new Set();
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        
        // 개선된 씬 번호 감지 패턴
        const scenePatterns = [
            /^(S\s*\d+)/i,                              // S1, S 1
            /^(Scene\s*\d+)/i,                          // Scene 1, SCENE 1
            /^(씬\s*\d+)/i,                             // 씬1, 씬 1
            /^(제?\s*\d+\s*장)/i,                       // 1장, 제1장
            /^(\d+\s*\.\s*(INT|EXT))/i,                 // 1. INT, 2. EXT
            /^(#\s*S\s*\d+)/i,                          // #S1, # S1
            /^\[.*씬.*\d+.*\]/i,                        // [씬1], [Scene 1]
            /^(INT\.|EXT\.)\s+.+\s+-\s+(DAY|NIGHT)/i    // 표준 영화 스크립트 형식
        ];
        
        const isSceneHeader = scenePatterns.some(pattern => pattern.test(line));
        
        if (isSceneHeader) {
            // 이전 씬 저장
            if (currentScene) {
                currentScene.content = sceneContent.join(' ');
                currentScene.characters = Array.from(sceneCharacters);
                scenes.push(currentScene);
            }
            
            // 새 씬 시작
            const sceneNumber = extractSceneNumber(line, scenes.length + 1);
            const timeOfDay = extractTimeOfDay(line, nextLine);
            const location = extractLocation(line, nextLine);
            
            if (location && location !== '미정') {
                locations.add(location);
            }
            
            currentScene = {
                number: `S${sceneNumber}`,
                timeOfDay: timeOfDay,
                location: location,
                content: '',
                characters: []
            };
            
            sceneContent = [];
            sceneCharacters = new Set();
            
        } else {
            // 씬 내용 처리
            if (currentScene) {
                sceneContent.push(line);
                
                // 향상된 등장인물 추출
                const extractedCharacters = extractCharacters(line);
                extractedCharacters.forEach(char => {
                    characters.add(char);
                    sceneCharacters.add(char);
                    characterFrequency.set(char, (characterFrequency.get(char) || 0) + 1);
                });
            }
        }
    }
    
    // 마지막 씬 저장
    if (currentScene) {
        currentScene.content = sceneContent.join(' ');
        currentScene.characters = Array.from(sceneCharacters);
        scenes.push(currentScene);
    }
    
    // 씬이 없는 경우 전체를 하나의 씬으로 처리
    if (scenes.length === 0) {
        const extractedCharacters = extractAllCharacters(text);
        extractedCharacters.forEach(char => {
            characters.add(char);
            characterFrequency.set(char, 1);
        });
        
        scenes.push({
            number: 'S1',
            timeOfDay: 'DAY',
            location: '미정',
            content: text,
            characters: extractedCharacters
        });
    }
    
    // 등장인물을 출연 빈도순으로 정렬하고 AI 분석과 동일한 형식으로 변환
    const sortedCharacters = Array.from(characters).sort((a, b) => {
        const freqA = characterFrequency.get(a) || 0;
        const freqB = characterFrequency.get(b) || 0;
        return freqB - freqA;
    }).map(name => ({
        name: name,
        appearances: characterFrequency.get(name) || 0,
        role: characterFrequency.get(name) >= 3 ? "주연" : characterFrequency.get(name) >= 2 ? "조연" : "단역"
    }));
    
    return {
        scenes: scenes,
        locations: Array.from(locations),
        characters: sortedCharacters,
        characterFrequency: Object.fromEntries(characterFrequency),
        totalScenes: scenes.length
    };
}

// 씬 번호 추출 헬퍼 함수
function extractSceneNumber(line, defaultNumber) {
    const numberMatch = line.match(/\d+/);
    return numberMatch ? numberMatch[0] : defaultNumber;
}

// 시간대 추출 헬퍼 함수
function extractTimeOfDay(line, nextLine = '') {
    const combinedLine = (line + ' ' + nextLine).toLowerCase();
    
    const nightPatterns = ['night', 'evening', '밤', '야간', '저녁', '새벽', '심야'];
    const dayPatterns = ['day', 'morning', 'afternoon', '낮', '오전', '오후', '아침', '점심'];
    
    if (nightPatterns.some(pattern => combinedLine.includes(pattern))) {
        return 'NIGHT';
    } else if (dayPatterns.some(pattern => combinedLine.includes(pattern))) {
        return 'DAY';
    }
    
    return 'DAY'; // 기본값
}

// 장소 추출 헬퍼 함수
function extractLocation(line, nextLine = '') {
    // 표준 스크립트 형식 처리
    const standardMatch = line.match(/^(INT\.|EXT\.)\s+(.+?)\s+-\s+(DAY|NIGHT)/i);
    if (standardMatch) {
        return standardMatch[2].trim();
    }
    
    // 한국식 형식 처리
    const koreanMatch = line.match(/(내부|외부|안|밖|INT|EXT)[.\s]*([^-\n(]+)/i);
    if (koreanMatch) {
        let location = koreanMatch[2].trim();
        // 시간대 정보 제거
        location = location.replace(/(DAY|NIGHT|낮|밤|야간|저녁|아침|오전|오후)/gi, '').trim();
        location = location.replace(/^[,\-.\s]+|[,\-.\s]+$/g, ''); // 앞뒤 구두점 제거
        if (location.length > 0) {
            return location;
        }
    }
    
    // #S1, #S2 패턴 처리 (대본_고잉홈.pdf 스타일)
    const hashSceneMatch = line.match(/^#S\d+\s+(.+)$/i);
    if (hashSceneMatch) {
        let location = hashSceneMatch[1].trim();
        // 시간대 정보 제거
        location = location.replace(/(DAY|NIGHT|낮|밤|야간|저녁|아침|오전|오후)/gi, '').trim();
        location = location.replace(/^[-,.\s]+|[-,.\s]+$/g, '');
        if (location.length > 0 && location.length < 100) { // 더 긴 장소명 허용
            return location;
        }
    }
    
    // 시간대가 포함된 씬 헤더 처리 (#S5 저녁, 아파트 (복도))
    const timeLocationMatch = line.match(/^#S\d+\s+(저녁|아침|낮|밤|새벽|오전|오후|심야),?\s*(.+)$/i);
    if (timeLocationMatch) {
        let location = timeLocationMatch[2].trim();
        location = location.replace(/^[-,.\s]+|[-,.\s]+$/g, '');
        if (location.length > 0 && location.length < 100) {
            return location;
        }
    }
    
    // 심플한 패턴 처리 (S1. 카페, 씬1 거실 등)
    const simpleMatch = line.match(/^[S씬Scene#\d\s.]+\s*(.+)$/i);
    if (simpleMatch) {
        let location = simpleMatch[1].trim();
        location = location.replace(/(DAY|NIGHT|낮|밤|야간|저녁|아침|오전|오후)/gi, '').trim();
        location = location.replace(/^[-,.\s]+|[-,.\s]+$/g, '');
        if (location.length > 0 && location.length < 50) {
            return location;
        }
    }
    
    return '미정';
}

// 등장인물 추출 헬퍼 함수
function extractCharacters(line) {
    const characters = [];
    
    // 기본 패턴: "이름:" 형태
    const basicMatch = line.match(/^([가-힣a-zA-Z0-9\s]+)\s*:/);
    if (basicMatch) {
        const name = basicMatch[1].trim();
        if (isValidCharacterName(name)) {
            characters.push(name);
        }
    }
    
    // 괄호 안 등장인물: (주인공), (to 친구) 등
    const parenthesesMatches = line.matchAll(/\(([^)]*)\)/g);
    for (const match of parenthesesMatches) {
        const content = match[1].trim().toLowerCase();
        if (!content.includes('to') && !content.includes('cont') && !content.includes('continued')) {
            const name = match[1].trim();
            if (isValidCharacterName(name) && !characters.includes(name)) {
                characters.push(name);
            }
        }
    }
    
    return characters;
}

// 전체 텍스트에서 등장인물 추출
function extractAllCharacters(text) {
    const characters = new Set();
    const lines = text.split('\n');
    
    lines.forEach(line => {
        const extracted = extractCharacters(line);
        extracted.forEach(char => characters.add(char));
    });
    
    return Array.from(characters);
}

// 유효한 등장인물 이름인지 판단
function isValidCharacterName(name) {
    if (!name || name.length === 0 || name.length > 20) return false;
    
    // 제외할 단어들
    const excludeWords = [
        'int', 'ext', 'fade', 'cut', 'scene', 'day', 'night',
        '내부', '외부', '낮', '밤', '씬', '장면', '페이드', '컷',
        'voice', 'over', 'narration', '내레이션', '해설',
        'continued', 'cont', '계속'
    ];
    
    const lowerName = name.toLowerCase();
    if (excludeWords.some(word => lowerName.includes(word))) {
        return false;
    }
    
    // 숫자만 있는 경우 제외
    if (/^\d+$/.test(name)) return false;
    
    // 나이나 수량 표현 제외 (17세, 3명, 5살 등)
    if (/\d+(세|살|명|개|번|회|년|월|일|시|분|초)$/.test(name)) return false;
    
    // 괄호로 둘러싸인 설명 제외
    if (/^\(.+\)$/.test(name.trim())) return false;
    
    // 특수문자가 많은 경우 제외
    if ((name.match(/[^가-힣a-zA-Z0-9\s]/g) || []).length > 2) return false;
    
    // 한글이나 영문 문자가 포함되어야 함
    if (!/[가-힣a-zA-Z]/.test(name)) return false;
    
    return true;
}

// 엑셀 파일 생성 함수 (전문 촬영계획표 템플릿)
async function createExcelFile(analysisData) {
    const workbook = new ExcelJS.Workbook();
    
    // 시트 1: 촬영계획표 (메인)
    const worksheet = workbook.addWorksheet('촬영계획표');
    
    // A. 헤더 섹션 설정 (실제 촬영계획표 형식)
    
    // 행1: 회차 (우상단)
    worksheet.mergeCells('M1:O1');
    const episodeCell = worksheet.getCell('M1');
    episodeCell.value = '1회차';
    episodeCell.font = { bold: true, size: 14 };
    episodeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 행2-3: 작품명 (중앙 대제목)
    worksheet.mergeCells('A2:O3');
    const titleCell = worksheet.getCell('A2');
    titleCell.value = '드라마 제목';
    titleCell.font = { bold: true, size: 20, name: 'Arial' };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;
    worksheet.getRow(3).height = 25;
    
    // 행4-6: 날짜 및 시간 정보
    const currentDate = new Date();
    const dateStr = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`;
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayStr = dayNames[currentDate.getDay()];
    
    // 날짜 (중앙)
    worksheet.mergeCells('F4:J4');
    const dateCell = worksheet.getCell('F4');
    dateCell.value = `${dateStr} ${dayStr}`;
    dateCell.font = { size: 12 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 일출/일몰 (중앙)
    worksheet.mergeCells('F5:J5');
    const sunCell = worksheet.getCell('F5');
    sunCell.value = '일출 05:40\n일몰 19:35';
    sunCell.font = { size: 11 };
    sunCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getRow(5).height = 30;
    
    // 집합시간/근로시간 (중앙)
    worksheet.mergeCells('F6:J6');
    const timeCell = worksheet.getCell('F6');
    timeCell.value = '집합시간 05:00\n근로시간 05:00~19:00';
    timeCell.font = { size: 11 };
    timeCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getRow(6).height = 30;
    
    // 행8-9: 스탭 정보 (실제 형식)
    const staffInfo = [
        ['조연출 : 조연출명', 'FD : FD명', 'SCR : SCR명'],
        ['섭외 : 섭외담당명', '극본 : 작가명', '연출 : 연출자명', '제작PD : PD명']
    ];
    
    staffInfo.forEach((info, rowIndex) => {
        const row = worksheet.getRow(8 + rowIndex);
        info.forEach((value, colIndex) => {
            let startCol, endCol;
            if (rowIndex === 0) {
                // 첫 번째 행: 3개 항목
                startCol = colIndex * 5 + 1; // A(1), F(6), K(11)
                endCol = startCol + 4;
            } else {
                // 두 번째 행: 4개 항목  
                startCol = colIndex * 3 + 2; // B(2), E(5), H(8), K(11)
                endCol = startCol + 2;
            }
            
            const startColLetter = String.fromCharCode(64 + startCol);
            const endColLetter = String.fromCharCode(64 + endCol);
            worksheet.mergeCells(`${startColLetter}${8 + rowIndex}:${endColLetter}${8 + rowIndex}`);
            
            const cell = worksheet.getCell(`${startColLetter}${8 + rowIndex}`);
            cell.value = value;
            cell.font = { size: 10 };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
        });
        row.height = 18;
    });
    
    // B. 메인 테이블 설정 (실제 촬영계획표 형식)
    
    // 컬럼 너비 설정 (실제 비율에 맞춰 조정)
    const columnWidths = [
        { col: 'A', width: 4 },   // Ep
        { col: 'B', width: 6 },   // S#
        { col: 'C', width: 5 },   // D/N
        { col: 'D', width: 5 },   // L/S
        { col: 'E', width: 8 },   // 시제
        { col: 'F', width: 25 },  // 장소 (더 넓게)
        { col: 'G', width: 35 },  // 내용 (더 넓게)
        { col: 'H', width: 10 },  // 등장인물
        { col: 'I', width: 8 },   // 등장인물
        { col: 'J', width: 8 },   // 등장인물
        { col: 'K', width: 12 },  // 보조출연자
        { col: 'L', width: 15 },  // 미술&소품
        { col: 'M', width: 15 },  // 분장,미용&의상
        { col: 'N', width: 12 },  // 특촬/비고
        { col: 'O', width: 1 }    // 여백
    ];
    
    columnWidths.forEach(({ col, width }) => {
        worksheet.getColumn(col).width = width;
    });
    
    // 테이블 헤더 (11행) - 실제 형식에 맞춰
    const headers = ['Ep', 'S#', 'D/N', 'L/S', '시제', '장소', '내용', 
                    '등장인물', '', '',  // 등장인물 컬럼 통합 표시
                    '보조출연자', '미술&소품', '분장,미용&의상', '특촬/비고'];
    
    const headerRow = worksheet.getRow(11);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E9ECEF' }
        };
        
        // 등장인물 헤더 특별 하이라이트
        if (index >= 7 && index <= 9) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEBCD' }
            };
        }
        
        cell.border = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            bottom: { style: 'thick' },
            right: { style: 'thick' }
        };
    });
    headerRow.height = 25;
    
    // 주요 등장인물 추출 (상위 3명)
    const mainCharacters = analysisData.characters
        .map(char => char.name || char) // 객체에서 name 추출 또는 문자열 그대로 사용
        .sort((a, b) => b.length - a.length)
        .slice(0, 3);
    
    // 헤더에 실제 인물 이름 표시
    mainCharacters.forEach((character, index) => {
        const cell = headerRow.getCell(8 + index); // H, I, J 열
        cell.value = character;
    });
    
    // 장소별로 씬 그룹핑
    const groupedScenes = {};
    analysisData.scenes.forEach((scene, index) => {
        // 장소 정보 처리 (괄호 안 세부사항 분리)
        let locationMain = scene.location;
        let locationDetail = '';
        const locationMatch = scene.location.match(/^([^(]+)\s*\(([^)]+)\)/);
        if (locationMatch) {
            locationMain = locationMatch[1].trim();
            locationDetail = locationMatch[2].trim();
        }
        
        const location = locationMain || '미정';
        if (!groupedScenes[location]) {
            groupedScenes[location] = [];
        }
        groupedScenes[location].push({ 
            ...scene, 
            originalIndex: index,
            locationMain,
            locationDetail
        });
    });
    
    // 데이터 행 추가 (장소별 그룹핑)
    let currentRow = 12;
    Object.keys(groupedScenes).forEach(location => {
        // 장소 구분자 행 추가
        const separatorRow = worksheet.getRow(currentRow);
        worksheet.mergeCells(`A${currentRow}:N${currentRow}`);
        const separatorCell = separatorRow.getCell(1);
        separatorCell.value = `─── ${location} ───`;
        separatorCell.font = { bold: true, size: 11, color: { argb: 'FF1976D2' } };
        separatorCell.alignment = { horizontal: 'center', vertical: 'middle' };
        separatorCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE3F2FD' }
        };
        separatorCell.border = {
            top: { style: 'thin', color: { argb: 'FF1976D2' } },
            bottom: { style: 'thin', color: { argb: 'FF1976D2' } }
        };
        separatorRow.height = 22;
        currentRow++;
        
        // 해당 장소의 씬들 추가
        groupedScenes[location].forEach((scene, sceneIndex) => {
            const row = worksheet.getRow(currentRow);
            const index = scene.originalIndex;
            
            // 시제 계산 (첫 번째 씬부터 순차적으로)
            const dayNum = Math.floor(index / 8) + 1; // 하루에 8씬 기준
            const sceneNumInDay = (index % 8) + 1;
            
            // 내용 요약 (더 의미있게)
            let contentSummary = scene.content;
            if (contentSummary.length > 35) {
                // 문장 단위로 자르기
                const sentences = contentSummary.split(/[.!?。]/);
                contentSummary = sentences[0];
                if (contentSummary.length > 35) {
                    contentSummary = contentSummary.substring(0, 32) + '...';
                }
            }
            
            // 씬 데이터 입력
            const rowData = [
                '1', // Ep
                scene.number.replace('S', ''), // S# 
                scene.timeOfDay === 'DAY' ? 'D' : 'N', // D/N
                index < analysisData.scenes.length / 2 ? 'L' : 'S', // L/S (앞부분은 L, 뒷부분은 S)
                `DAY${dayNum}`, // 시제
                scene.locationDetail ? `${scene.locationMain}\n(${scene.locationDetail})` : scene.locationMain, // 장소
                contentSummary, // 내용
                '', // 등장인물1 마커
                '', // 등장인물2 마커
                '', // 등장인물3 마커
                '', // 보조출연자
                '', // 미술&소품
                '', // 분장,미용&의상
                '' // 특촬/비고
            ];
            
            rowData.forEach((data, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = data;
                cell.font = { size: 10 };
                
                // 정렬 및 줄바꿈 설정
                if (colIndex === 6) { // 내용 컬럼
                    cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                } else if (colIndex === 5) { // 장소 컬럼
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                } else {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                
                // 배경색 설정
                if (colIndex === 5) { // 장소 컬럼
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E8F4FD' }
                    };
                } else if (colIndex >= 7 && colIndex <= 9) { // 등장인물 컬럼
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF9E6' }
                    };
                }
                
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            
            // 등장인물 마커 추가 (●)
            mainCharacters.forEach((character, charIndex) => {
                if (scene.characters && scene.characters.includes(character)) {
                    const cell = row.getCell(8 + charIndex); // H, I, J 열
                    cell.value = '●';
                    cell.font = { size: 14, bold: true };
                }
            });
            
            // 행 높이 조정 (내용에 따라)
            row.height = contentSummary.length > 25 || scene.locationDetail ? 25 : 20;
            currentRow++;
        });
    });
    
    // C. Call Time 섹션 (실제 형식에 맞춰)
    const callTimeStartRow = currentRow + 3;
    
    // Call Time 제목
    worksheet.mergeCells(`A${callTimeStartRow}:F${callTimeStartRow}`);
    const callTimeTitle = worksheet.getCell(`A${callTimeStartRow}`);
    callTimeTitle.value = 'Call Time 분장 / 미용 / 의상';
    callTimeTitle.font = { bold: true, size: 12 };
    callTimeTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    
    // Call Time 데이터 (3열 그리드로 조정)
    const callTimeData = [];
    mainCharacters.slice(0, 3).forEach((character, index) => {
        const baseTime = 4 + index;
        const completionTime = baseTime + 1;
        callTimeData.push({
            name: character,
            time: `${baseTime.toString().padStart(2, '0')}:00 / ${completionTime.toString().padStart(2, '0')}:00(완)`
        });
    });
    
    // 보조출연자 추가
    if (callTimeData.length < 4) {
        callTimeData.push({
            name: '보조출연자',
            time: '07:00 / 08:00(완)'
        });
    }
    
    callTimeData.forEach((item, index) => {
        const nameRow = worksheet.getRow(callTimeStartRow + 1 + index * 2);
        const timeRow = worksheet.getRow(callTimeStartRow + 2 + index * 2);
        
        const nameCell = nameRow.getCell(1);
        nameCell.value = `■ ${item.name}`;
        nameCell.font = { bold: true, size: 10 };
        
        const timeCell = timeRow.getCell(1);
        timeCell.value = item.time;
        timeCell.font = { size: 10 };
    });
    
    // D. 촬영장소 섹션 (실제 형식에 맞춰)
    const locationStartRow = callTimeStartRow + 10;
    
    worksheet.mergeCells(`A${locationStartRow}:F${locationStartRow}`);
    const locationTitle = worksheet.getCell(`A${locationStartRow}`);
    locationTitle.value = '촬영장소';
    locationTitle.font = { bold: true, size: 12 };
    locationTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    
    // 장소 리스트 (더 자세하게)
    const uniqueLocations = [...new Set(analysisData.locations)].slice(0, 4);
    uniqueLocations.forEach((location, index) => {
        const locationCell = worksheet.getCell(`A${locationStartRow + 1 + index}`);
        locationCell.value = `<${location}> 촬영지 주소 및 연락처 정보`;
        locationCell.font = { size: 10 };
        locationCell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    
    // E. 연락처 섹션 (실제 형식에 맞춰)
    const contactStartRow = locationStartRow + Math.max(uniqueLocations.length, 4) + 3;
    
    worksheet.mergeCells(`A${contactStartRow}:F${contactStartRow}`);
    const contactTitle = worksheet.getCell(`A${contactStartRow}`);
    contactTitle.value = '연락처';
    contactTitle.font = { bold: true, size: 12 };
    contactTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    
    // 연락처 정보
    const contactInfo = [
        '조연출: 010-0000-0000',
        'FD: 010-0000-0000', 
        'SCR: 010-0000-0000',
        '섭외: 010-0000-0000',
        '미술: 010-0000-0000',
        '분장: 010-0000-0000'
    ];
    
    contactInfo.forEach((contact, index) => {
        const row = Math.floor(index / 2);
        const col = (index % 2) * 4 + 1; // A열 또는 E열
        
        const contactCell = worksheet.getCell(`${String.fromCharCode(64 + col)}${contactStartRow + 1 + row}`);
        contactCell.value = contact;
        contactCell.font = { size: 10 };
        contactCell.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    
    // 인쇄 설정 (실제 형식에 맞춰)
    worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape', // 가로
        margins: {
            left: 0.3, top: 0.3, right: 0.3, bottom: 0.3,
            header: 0, footer: 0
        },
        printArea: `A1:O${contactStartRow + 4}`,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        scale: 90 // 90% 스케일로 더 많은 내용 표시
    };
    
    // 시트 2: 씬리스트 (참고용)
    const sceneListSheet = workbook.addWorksheet('씬리스트');
    
    // 제목 및 설명
    const listTitle = sceneListSheet.getCell('A1');
    listTitle.value = '📋 전체 씬 리스트 (참고용)';
    listTitle.font = { bold: true, size: 16, color: { argb: '2563eb' } };
    listTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    sceneListSheet.getRow(1).height = 25;
    
    const listSubtitle = sceneListSheet.getCell('A2');
    listSubtitle.value = '정렬/필터링이 가능한 전체 씬 데이터 - 상단 필터 버튼을 활용하세요';
    listSubtitle.font = { size: 11, color: { argb: '666666' } };
    listSubtitle.alignment = { horizontal: 'left', vertical: 'middle' };
    sceneListSheet.getRow(2).height = 20;
    
    // 씬 리스트 헤더 (확장된 정보)
    const sceneHeaders = [
        '씬 번호', '시간대', '장소', '등장인물', '내용', '특이사항'
    ];
    const sceneHeaderRow = sceneListSheet.getRow(4);
    
    sceneHeaders.forEach((header, index) => {
        const cell = sceneHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E9ECEF' }
        };
        cell.border = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            bottom: { style: 'thick' },
            right: { style: 'thick' }
        };
    });
    sceneHeaderRow.height = 25;
    
    // 컬럼 너비 설정 (더 자세한 정보 표시용)
    sceneListSheet.getColumn('A').width = 10; // 씬 번호
    sceneListSheet.getColumn('B').width = 8;  // 시간대
    sceneListSheet.getColumn('C').width = 20; // 장소
    sceneListSheet.getColumn('D').width = 15; // 등장인물
    sceneListSheet.getColumn('E').width = 40; // 내용
    sceneListSheet.getColumn('F').width = 20; // 특이사항
    
    // 씬 데이터 입력 (확장된 정보)
    analysisData.scenes.forEach((scene, index) => {
        const row = sceneListSheet.getRow(index + 5);
        
        // 특이사항 판단
        const specialNotes = [];
        if (scene.timeOfDay === 'NIGHT') specialNotes.push('야간촬영');
        if (scene.location.includes('실외') || scene.location.includes('거리') || scene.location.includes('공원')) {
            specialNotes.push('실외촬영');
        }
        if (scene.characters && scene.characters.length > 3) specialNotes.push('다수등장');
        
        const sceneData = [
            scene.number,
            scene.timeOfDay === 'DAY' ? '낮' : '밤',
            scene.location,
            scene.characters ? scene.characters.slice(0, 3).join(', ') + 
                (scene.characters.length > 3 ? ` 외 ${scene.characters.length - 3}명` : '') : '',
            scene.content,
            specialNotes.join(', ') || '일반'
        ];
        
        sceneData.forEach((data, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = data;
            cell.font = { size: 10 };
            
            // 컬럼별 정렬 설정
            if (colIndex === 4) { // 내용
                cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
            } else if (colIndex === 3) { // 등장인물
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            
            // 우선순위별 색상
            if (colIndex === 7) { // 우선순위 컬럼
                if (data === '높음') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6' } };
                    cell.font = { size: 10, color: { argb: 'CC0000' }, bold: true };
                } else if (data === '보통') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2E6' } };
                    cell.font = { size: 10, color: { argb: 'CC6600' } };
                }
            }
            
            // 시간대별 색상
            if (colIndex === 1) { // 시간대 컬럼
                if (data === '밤') {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6FF' } };
                    cell.font = { size: 10, color: { argb: '000066' }, bold: true };
                }
            }
            
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        row.height = Math.max(25, Math.min(60, scene.content.length / 3));
    });
    
    // 자동 필터 설정 (정렬/필터링 가능하게)
    const dataRange = `A4:H${4 + analysisData.scenes.length}`;
    sceneListSheet.autoFilter = dataRange;
    
    // 시트 3: 제작노트 (간단 가이드)
    const productionNotesSheet = workbook.addWorksheet('제작노트');
    
    // 제작노트 제목
    const notesTitle = productionNotesSheet.getCell('A1');
    notesTitle.value = '📋 제작 참고사항';
    notesTitle.font = { bold: true, size: 18, color: { argb: '2563eb' } };
    notesTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    productionNotesSheet.getRow(1).height = 30;
    
    // 부제목
    const notesSubtitle = productionNotesSheet.getCell('A2');
    notesSubtitle.value = '효율적인 촬영을 위한 가이드와 장소별 그룹핑 정보';
    notesSubtitle.font = { size: 12, color: { argb: '666666' } };
    notesSubtitle.alignment = { horizontal: 'left', vertical: 'middle' };
    productionNotesSheet.getRow(2).height = 25;
    
    // 장소별 그룹핑 섹션
    let currentNotesRow = 4;
    
    // 장소별 씬 그룹핑
    const locationGroups = {};
    analysisData.scenes.forEach((scene, index) => {
        const location = scene.location;
        if (!locationGroups[location]) {
            locationGroups[location] = [];
        }
        locationGroups[location].push(scene.number);
    });
    
    // 장소별 그룹핑 제목
    const groupingTitle = productionNotesSheet.getCell(`A${currentNotesRow}`);
    groupingTitle.value = '📍 장소별 그룹핑';
    groupingTitle.font = { bold: true, size: 14, color: { argb: '2563eb' } };
    groupingTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    productionNotesSheet.getRow(currentNotesRow).height = 25;
    currentNotesRow++;
    
    // 장소별 그룹 정보
    Object.entries(locationGroups).forEach(([location, scenes]) => {
        const groupRow = productionNotesSheet.getRow(currentNotesRow);
        
        // 장소명
        const locationCell = groupRow.getCell(1);
        locationCell.value = `• ${location}:`;
        locationCell.font = { bold: true, size: 11, color: { argb: '1a1a1a' } };
        locationCell.alignment = { horizontal: 'left', vertical: 'middle' };
        
        // 씬 번호들
        const scenesCell = groupRow.getCell(2);
        scenesCell.value = scenes.join(', ');
        scenesCell.font = { size: 11, color: { argb: '333333' } };
        scenesCell.alignment = { horizontal: 'left', vertical: 'middle' };
        
        groupRow.height = 20;
        currentNotesRow++;
    });
    
    currentNotesRow += 2;
    
    // 권장사항 섹션
    const recommendationTitle = productionNotesSheet.getCell(`A${currentNotesRow}`);
    recommendationTitle.value = '💡 권장사항';
    recommendationTitle.font = { bold: true, size: 14, color: { argb: '27ae60' } };
    recommendationTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    productionNotesSheet.getRow(currentNotesRow).height = 25;
    currentNotesRow++;
    
    // 권장사항 리스트
    const recommendations = [
        '• 같은 장소 씬들을 연속 촬영하세요 (이동 시간 단축)',
        '• 실외 씬은 날씨를 고려하여 백업 계획을 세우세요',
        '• 배우 스케줄을 미리 확인하고 조율하세요',
        '• 특수 장비가 필요한 씬은 사전에 점검하세요',
        '• 허가가 필요한 장소는 미리 섭외를 완료하세요',
        '• 일출/일몰 씬은 골든아워 시간을 정확히 계산하세요',
        '• 음향 녹음이 중요한 씬은 주변 소음을 체크하세요',
        '• 보조출연자가 많은 씬은 별도 관리 계획을 세우세요'
    ];
    
    recommendations.forEach(recommendation => {
        const recRow = productionNotesSheet.getRow(currentNotesRow);
        const recCell = recRow.getCell(1);
        recCell.value = recommendation;
        recCell.font = { size: 11, color: { argb: '333333' } };
        recCell.alignment = { horizontal: 'left', vertical: 'middle' };
        recRow.height = 18;
        currentNotesRow++;
    });
    
    currentNotesRow += 2;
    
    // 효율성 팁 섹션
    const efficiencyTitle = productionNotesSheet.getCell(`A${currentNotesRow}`);
    efficiencyTitle.value = '⚡ 효율성 팁';
    efficiencyTitle.font = { bold: true, size: 14, color: { argb: 'f39c12' } };
    efficiencyTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    productionNotesSheet.getRow(currentNotesRow).height = 25;
    currentNotesRow++;
    
    // 효율성 팁
    const efficiencyTips = [
        '시간대별 촬영 순서:',
        '  → 오전: 밝은 실내/대화 씬',
        '  → 오후: 실외/액션 씬',
        '  → 저녁: 분위기/감정 씬',
        '',
        '장소 이동 최적화:',
        '  → 가까운 장소끼리 묶어서 촬영',
        '  → 이동 시간 15분 이상은 점심시간 고려',
        '',
        '배우 스케줄링:',
        '  → 주연배우: 연속 촬영일 배치',
        '  → 조연배우: 해당 씬만 집중 촬영',
        '  → 아역배우: 근로기준법 준수 필수'
    ];
    
    efficiencyTips.forEach(tip => {
        const tipRow = productionNotesSheet.getRow(currentNotesRow);
        const tipCell = tipRow.getCell(1);
        tipCell.value = tip;
        
        if (tip.includes(':') && !tip.startsWith('  →')) {
            tipCell.font = { bold: true, size: 11, color: { argb: '1a1a1a' } };
        } else if (tip.startsWith('  →')) {
            tipCell.font = { size: 10, color: { argb: '666666' } };
        } else {
            tipCell.font = { size: 10, color: { argb: '333333' } };
        }
        
        tipCell.alignment = { horizontal: 'left', vertical: 'middle' };
        tipRow.height = tip === '' ? 10 : 16;
        currentNotesRow++;
    });
    
    currentNotesRow += 2;
    
    // 체크리스트 섹션
    const checklistTitle = productionNotesSheet.getCell(`A${currentNotesRow}`);
    checklistTitle.value = '✅ 촬영 전 체크리스트';
    checklistTitle.font = { bold: true, size: 14, color: { argb: 'e74c3c' } };
    checklistTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    productionNotesSheet.getRow(currentNotesRow).height = 25;
    currentNotesRow++;
    
    const checklist = [
        '□ 촬영 장소 섭외 완료',
        '□ 배우 스케줄 확정',
        '□ 장비 점검 완료',
        '□ 날씨 예보 확인',
        '□ 보험 가입 확인',
        '□ 안전 관리 계획 수립',
        '□ 비상 연락망 공유',
        '□ 예산 집행 계획 확인'
    ];
    
    checklist.forEach(item => {
        const checkRow = productionNotesSheet.getRow(currentNotesRow);
        const checkCell = checkRow.getCell(1);
        checkCell.value = item;
        checkCell.font = { size: 11, color: { argb: '333333' } };
        checkCell.alignment = { horizontal: 'left', vertical: 'middle' };
        checkRow.height = 18;
        currentNotesRow++;
    });
    
    // 컬럼 너비 설정
    productionNotesSheet.getColumn('A').width = 50;
    productionNotesSheet.getColumn('B').width = 30;
    
    // 시트 4: 분석 정보
    const analysisInfoSheet = workbook.addWorksheet('분석 정보');
    
    // 분석 정보 제목
    const infoTitle = analysisInfoSheet.getCell('A1');
    infoTitle.value = 'ScriptPlanner AI 분석 결과 정보';
    infoTitle.font = { bold: true, size: 16 };
    infoTitle.alignment = { horizontal: 'center' };
    analysisInfoSheet.mergeCells('A1:D1');
    analysisInfoSheet.getRow(1).height = 30;
    
    // 분석 통계
    const statsData = [
        ['분석 항목', '결과', '설명', ''],
        ['총 씬 수', analysisData.totalScenes, '대본에서 감지된 씬의 총 개수', ''],
        ['촬영 장소 수', analysisData.locations.length, '서로 다른 촬영 장소의 수', ''],
        ['등장인물 수', analysisData.characters.length, '대사가 있는 등장인물의 수', ''],
        ['', '', '', ''],
        ['등장인물별 출연 정보', '', '', ''],
    ];
    
    // 등장인물 정보 추가 (characterFrequency 사용)
    if (analysisData.characterFrequency) {
        analysisData.characters.forEach(character => {
            const name = character.name || character;
            const count = analysisData.characterFrequency[name] || 0;
            statsData.push([`- ${name}`, `${count}씬 출연`, '해당 인물이 등장하는 씬 수', '']);
        });
    } else {
        // characterFrequency가 없는 경우 대안 로직
        const characterCounts = {};
        analysisData.scenes.forEach(scene => {
            if (scene.characters) {
                scene.characters.forEach(char => {
                    characterCounts[char] = (characterCounts[char] || 0) + 1;
                });
            }
        });
        
        analysisData.characters.forEach(character => {
            const name = character.name || character;
            const count = characterCounts[name] || 0;
            statsData.push([`- ${name}`, `${count}씬 출연`, '해당 인물이 등장하는 씬 수', '']);
        });
    }
    
    statsData.push(['', '', '', '']);
    statsData.push(['분석 알고리즘 정보', '', '', '']);
    statsData.push(['씬 감지 방식', 'S1, S2, Scene 1 등 패턴 매칭', 'AI가 씬을 구분하는 방법', '']);
    statsData.push(['인물 감지 방식', '이름: 형태의 대사 패턴', '등장인물을 찾는 방법', '']);
    statsData.push(['장소 추출 방식', 'INT./EXT. 및 장소명 분석', '촬영 장소를 찾는 방법', '']);
    
    // 통계 데이터 입력
    statsData.forEach((rowData, rowIndex) => {
        const row = analysisInfoSheet.getRow(rowIndex + 3);
        rowData.forEach((data, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = data;
            
            if (rowIndex === 0) {
                // 헤더 행
                cell.font = { bold: true, size: 11 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'E9ECEF' }
                };
            } else {
                cell.font = { size: 10 };
            }
            
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        row.height = 20;
    });
    
    // 컬럼 너비 설정
    analysisInfoSheet.getColumn('A').width = 25;
    analysisInfoSheet.getColumn('B').width = 20;
    analysisInfoSheet.getColumn('C').width = 35;
    analysisInfoSheet.getColumn('D').width = 10;
    
    // 피드백 섹션
    const feedbackStartRow = statsData.length + 6;
    
    const feedbackTitle = analysisInfoSheet.getCell(`A${feedbackStartRow}`);
    feedbackTitle.value = '📧 피드백 및 문의';
    feedbackTitle.font = { bold: true, size: 14, color: { argb: '2563eb' } };
    analysisInfoSheet.mergeCells(`A${feedbackStartRow}:D${feedbackStartRow}`);
    
    const feedbackContent = [
        ['', '', '', ''],
        ['이 분석 결과가 완벽하지 않을 수 있습니다.', '', '', ''],
        ['AI는 80% 정확도를 목표로 하며, 나머지 20%는 사용자의 검토가 필요합니다.', '', '', ''],
        ['', '', '', ''],
        ['개선 제안이나 오류 발견 시 연락 주세요:', '', '', ''],
        ['📧 이메일: showdam@gmail.com', '', '', ''],
        ['💬 제목: [ScriptPlanner 피드백] 내용 작성', '', '', ''],
        ['', '', '', ''],
        ['여러분의 소중한 피드백이 서비스 개선에 큰 도움이 됩니다.', '', '', ''],
        ['감사합니다! 😊', '', '', '']
    ];
    
    feedbackContent.forEach((rowData, rowIndex) => {
        const row = analysisInfoSheet.getRow(feedbackStartRow + 1 + rowIndex);
        const cell = row.getCell(1);
        cell.value = rowData[0];
        
        if (rowData[0].includes('showdam@gmail.com')) {
            cell.font = { size: 11, bold: true, color: { argb: '2563eb' } };
        } else if (rowData[0].includes('제목:')) {
            cell.font = { size: 10, italic: true, color: { argb: '666666' } };
        } else {
            cell.font = { size: 10 };
        }
        
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        analysisInfoSheet.mergeCells(`A${feedbackStartRow + 1 + rowIndex}:D${feedbackStartRow + 1 + rowIndex}`);
        row.height = 18;
    });
    
    return workbook;
}

// API 엔드포인트

// 대본 분석 (AI 우선, 규칙 기반 백업) - 모든 제한 적용
app.post('/api/analyze', hourlyLimiter, dailyLimiter, costLimitMiddleware, async (req, res) => {
    try {
        const { text, useAI = true } = req.body;
        
        if (!text || text.trim().length < 10) {
            return res.status(400).json({ 
                error: '분석할 대본 텍스트가 너무 짧습니다.' 
            });
        }
        
        console.log('분석 시작:', text.length, '글자', useAI ? '(AI 분석)' : '(규칙 기반)');
        
        let analysis;
        if (useAI) {
            // AI 분석 우선 시도
            analysis = await analyzeScriptWithAI(text);
        } else {
            // 규칙 기반 분석
            analysis = analyzeScript(text);
        }
        
        console.log('분석 완료:', analysis.totalScenes, '씬');
        
        res.json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: '대본 분석 중 오류가 발생했습니다.' 
        });
    }
});

// 엑셀 다운로드
app.post('/api/download', async (req, res) => {
    try {
        const analysisData = req.body;
        
        if (!analysisData || !analysisData.scenes) {
            return res.status(400).json({ 
                error: '분석 데이터가 없습니다.' 
            });
        }
        
        console.log('엑셀 생성 시작');
        const workbook = await createExcelFile(analysisData);
        
        // 응답 헤더 설정
        const filename = `촬영계획표_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        
        // 엑셀 파일 전송
        await workbook.xlsx.write(res);
        console.log('엑셀 다운로드 완료');
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: '엑셀 파일 생성 중 오류가 발생했습니다.' 
        });
    }
});

// 사용량 조회 엔드포인트
app.get('/api/usage', (req, res) => {
    const monthlyUsage = usageTracker.getCurrentMonthUsage();
    const todayUsage = usageTracker.getTodayUsage();
    
    res.json({
        monthly: {
            cost: monthlyUsage.cost.toFixed(2),
            requests: monthlyUsage.requests,
            limit: USAGE_LIMITS.MONTHLY_COST_LIMIT,
            remaining: (USAGE_LIMITS.MONTHLY_COST_LIMIT - monthlyUsage.cost).toFixed(2),
            percentage: ((monthlyUsage.cost / USAGE_LIMITS.MONTHLY_COST_LIMIT) * 100).toFixed(1)
        },
        daily: {
            cost: todayUsage.cost.toFixed(2),
            requests: todayUsage.requests,
            limit: USAGE_LIMITS.DAILY_COST_LIMIT,
            remaining: (USAGE_LIMITS.DAILY_COST_LIMIT - todayUsage.cost).toFixed(2),
            percentage: ((todayUsage.cost / USAGE_LIMITS.DAILY_COST_LIMIT) * 100).toFixed(1)
        },
        limits: {
            monthlyLimit: USAGE_LIMITS.MONTHLY_COST_LIMIT,
            dailyLimit: USAGE_LIMITS.DAILY_COST_LIMIT,
            hourlyRequestLimit: USAGE_LIMITS.HOURLY_REQUEST_LIMIT,
            dailyRequestLimit: USAGE_LIMITS.DAILY_REQUEST_LIMIT,
            warningThreshold: USAGE_LIMITS.WARNING_THRESHOLD
        },
        timestamp: new Date().toISOString()
    });
});

// 루트 경로 핸들러 (index.html 제공)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CSS 파일 제공
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

// JavaScript 파일 제공
app.get('/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'script.js'));
});

// 헬스체크
app.get('/api/health', (req, res) => {
    const monthlyUsage = usageTracker.getCurrentMonthUsage();
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        usage: {
            monthly: `$${monthlyUsage.cost.toFixed(2)} / $${USAGE_LIMITS.MONTHLY_COST_LIMIT}`,
            requests: monthlyUsage.requests
        }
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 ScriptPlanner MVP 서버가 포트 ${PORT}에서 실행중입니다`);
    console.log(`📱 브라우저에서 http://localhost:${PORT} 접속하세요`);
});