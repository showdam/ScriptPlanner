// AI 파싱 규칙 테스트 스크립트
const { extractSampleScenes } = require('./src/parser/sampleExtractor');
const { generateParsingRules } = require('./src/parser/ruleGenerator');
const fs = require('fs');

async function testParsingRules() {
    console.log('🧪 AI 파싱 규칙 생성 테스트 시작\n');
    
    // 샘플 대본 읽기
    const scriptText = fs.readFileSync('./test-sample-goinghome.txt', 'utf8');
    console.log(`📝 대본 길이: ${scriptText.length}자\n`);
    
    // 1단계: 샘플 씬 추출
    console.log('🔍 1단계: 샘플 씬 추출...');
    const sampleScenes = extractSampleScenes(scriptText);
    console.log(`추출된 샘플: ${sampleScenes.length}개\n`);
    
    sampleScenes.forEach((scene, index) => {
        console.log(`📋 샘플 ${index + 1} (${scene.type}):`);
        console.log(`헤더: ${scene.header}`);
        console.log(`통계: ${scene.stats.totalLines}줄, 대사 ${scene.stats.dialogueLines}줄, 캐릭터 ${scene.stats.charactersCount}명`);
        console.log('---');
    });
    
    // 2단계: AI 파싱 규칙 생성
    console.log('\n🤖 2단계: AI 파싱 규칙 생성...');
    try {
        const ruleGenResult = await generateParsingRules(sampleScenes);
        
        console.log('\n📊 생성된 파싱 규칙:');
        console.log('='.repeat(50));
        
        console.log('\n1️⃣ 씬 번호 패턴:');
        console.log(`   정규식: ${ruleGenResult.rules.sceneNumberPattern.regex}`);
        console.log(`   설명: ${ruleGenResult.rules.sceneNumberPattern.description}`);
        console.log(`   예시: ${ruleGenResult.rules.sceneNumberPattern.examples.join(', ')}`);
        
        console.log('\n2️⃣ 장소 패턴:');
        console.log(`   정규식: ${ruleGenResult.rules.locationPattern.regex}`);
        console.log(`   설명: ${ruleGenResult.rules.locationPattern.description}`);
        console.log(`   예시: ${ruleGenResult.rules.locationPattern.examples.join(', ')}`);
        
        console.log('\n3️⃣ 시간대 패턴:');
        console.log(`   정규식: ${ruleGenResult.rules.timeOfDayPattern.regex}`);
        console.log(`   설명: ${ruleGenResult.rules.timeOfDayPattern.description}`);
        console.log(`   예시: ${ruleGenResult.rules.timeOfDayPattern.examples.join(', ')}`);
        
        console.log('\n4️⃣ 캐릭터/대사 패턴:');
        console.log(`   정규식: ${ruleGenResult.rules.dialoguePattern.regex}`);
        console.log(`   설명: ${ruleGenResult.rules.dialoguePattern.description}`);
        console.log(`   예시: ${ruleGenResult.rules.dialoguePattern.examples.join(', ')}`);
        
        console.log('\n5️⃣ 지문 패턴:');
        console.log(`   설명: ${ruleGenResult.rules.actionPattern.description}`);
        console.log(`   예시: ${ruleGenResult.rules.actionPattern.examples.join(', ')}`);
        
        if (ruleGenResult.rules.specialPatterns && ruleGenResult.rules.specialPatterns.length > 0) {
            console.log('\n6️⃣ 특수 패턴:');
            ruleGenResult.rules.specialPatterns.forEach(pattern => {
                console.log(`   ${pattern.type}: ${pattern.description}`);
                console.log(`   정규식: ${pattern.regex}`);
            });
        }
        
        console.log('\n📈 전체 신뢰도:', `${Math.round(ruleGenResult.rules.confidence * 100)}%`);
        console.log('📝 추가 노트:', ruleGenResult.rules.notes || '없음');
        
    } catch (error) {
        console.error('❌ AI 규칙 생성 실패:', error.message);
    }
}

// 실행
testParsingRules().catch(console.error);