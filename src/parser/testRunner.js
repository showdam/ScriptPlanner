// ScriptPlanner - AI 파싱 규칙 테스트 러너
// 10가지 다른 스타일의 대본으로 파싱 규칙 생성 및 테스트

const fs = require('fs');
const path = require('path');
const { extractSampleScenes } = require('./sampleExtractor');
const { generateParsingRules } = require('./ruleGenerator');
const { parseScriptLocally, convertToStandardFormat } = require('./localParser');

/**
 * 모든 테스트 스크립트를 실행하는 메인 함수
 */
async function runAllTests() {
    console.log('🧪 AI 파싱 규칙 테스트 시작\n');
    
    const testScriptsDir = path.join(__dirname, '../../test-scripts');
    const testFiles = [
        'style1-standard.txt',
        'style2-scene-format.txt', 
        'style3-korean-scene.txt',
        'style4-numbered.txt',
        'style5-brackets.txt',
        'style6-chapter.txt',
        'style7-minimal.txt',
        'style8-detailed.txt',
        'style9-english-mixed.txt',
        'style10-webdrama.txt'
    ];
    
    const results = [];
    
    for (let i = 0; i < testFiles.length; i++) {
        const testFile = testFiles[i];
        console.log(`\n📋 테스트 ${i + 1}/10: ${testFile}`);
        console.log('=' .repeat(50));
        
        try {
            const result = await testSingleScript(testScriptsDir, testFile);
            results.push({
                filename: testFile,
                success: true,
                ...result
            });
            
            console.log(`✅ 성공: 신뢰도 ${result.confidence}%, ${result.scenes}개 씬 파싱`);
            
        } catch (error) {
            console.error(`❌ 실패: ${error.message}`);
            results.push({
                filename: testFile,
                success: false,
                error: error.message
            });
        }
    }
    
    // 전체 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 전체 테스트 결과 요약');
    console.log('='.repeat(60));
    
    printTestSummary(results);
    
    return results;
}

/**
 * 개별 스크립트 테스트
 */
async function testSingleScript(testDir, filename) {
    const scriptPath = path.join(testDir, filename);
    const scriptText = fs.readFileSync(scriptPath, 'utf8');
    
    console.log(`📝 대본 읽기 완료: ${scriptText.length}자`);
    
    // 1단계: 샘플 씬 추출
    console.log('🔍 1단계: 샘플 씬 추출...');
    const sampleScenes = extractSampleScenes(scriptText);
    console.log(`   추출된 샘플: ${sampleScenes.length}개`);
    
    sampleScenes.forEach((scene, index) => {
        console.log(`   ${index + 1}. ${scene.type}: ${scene.stats.totalLines}줄`);
    });
    
    // 2단계: AI 파싱 규칙 생성
    console.log('🤖 2단계: AI 파싱 규칙 생성...');
    const ruleGenResult = await generateParsingRules(sampleScenes);
    console.log(`   규칙 생성 완료: 신뢰도 ${ruleGenResult.rules.confidence}`);
    
    // 3단계: 로컬 파싱 실행
    console.log('⚡ 3단계: 로컬 파싱 실행...');
    const localResult = parseScriptLocally(scriptText, ruleGenResult.rules);
    
    // 4단계: 표준 형식 변환
    console.log('📋 4단계: 표준 형식 변환...');
    const standardResult = convertToStandardFormat(localResult);
    
    // 결과 분석
    const analysis = analyzeParsingResult(standardResult, filename);
    
    return {
        sampleScenes: sampleScenes.length,
        scenes: standardResult.totalScenes,
        characters: standardResult.characters.length,
        locations: standardResult.locations.length,
        confidence: Math.round(ruleGenResult.rules.confidence * 100),
        processingTime: localResult.parsingStats.processingTime,
        analysis: analysis,
        rules: ruleGenResult.rules,
        parsedData: standardResult
    };
}

/**
 * 파싱 결과 분석
 */
function analyzeParsingResult(result, filename) {
    const analysis = {
        style: filename.replace('.txt', '').replace('style', 'Style '),
        quality: 'Good',
        issues: [],
        strengths: []
    };
    
    // 씬 개수 검증
    if (result.totalScenes === 0) {
        analysis.quality = 'Poor';
        analysis.issues.push('씬이 전혀 감지되지 않음');
    } else if (result.totalScenes < 3) {
        analysis.quality = 'Fair';
        analysis.issues.push('씬 감지 부족');
    } else {
        analysis.strengths.push('씬 구조 정상 감지');
    }
    
    // 캐릭터 감지 검증
    if (result.characters.length === 0) {
        analysis.issues.push('등장인물 감지 실패');
    } else if (result.characters.length > 0) {
        analysis.strengths.push(`등장인물 ${result.characters.length}명 감지`);
    }
    
    // 장소 감지 검증
    if (result.locations.length === 0) {
        analysis.issues.push('장소 정보 감지 실패');
    } else {
        analysis.strengths.push(`장소 ${result.locations.length}곳 감지`);
    }
    
    // 전체 품질 평가
    if (analysis.issues.length > 2) {
        analysis.quality = 'Poor';
    } else if (analysis.issues.length === 0) {
        analysis.quality = 'Excellent';
    }
    
    return analysis;
}

/**
 * 테스트 결과 요약 출력
 */
function printTestSummary(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`총 테스트: ${results.length}개`);
    console.log(`성공: ${successful.length}개 (${Math.round(successful.length/results.length*100)}%)`);
    console.log(`실패: ${failed.length}개`);
    
    if (successful.length > 0) {
        const avgConfidence = Math.round(
            successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length
        );
        const avgScenes = Math.round(
            successful.reduce((sum, r) => sum + r.scenes, 0) / successful.length
        );
        const avgProcessingTime = Math.round(
            successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length
        );
        
        console.log(`\n📈 성공 테스트 평균:`);
        console.log(`   신뢰도: ${avgConfidence}%`);
        console.log(`   씬 개수: ${avgScenes}개`);
        console.log(`   처리 시간: ${avgProcessingTime}ms`);
    }
    
    console.log(`\n🏆 품질별 분포:`);
    const qualityCounts = {};
    successful.forEach(r => {
        const quality = r.analysis?.quality || 'Unknown';
        qualityCounts[quality] = (qualityCounts[quality] || 0) + 1;
    });
    
    Object.entries(qualityCounts).forEach(([quality, count]) => {
        console.log(`   ${quality}: ${count}개`);
    });
    
    if (failed.length > 0) {
        console.log(`\n❌ 실패한 테스트:`);
        failed.forEach(r => {
            console.log(`   ${r.filename}: ${r.error}`);
        });
    }
}

/**
 * 특정 스타일만 테스트
 */
async function testSpecificStyle(styleNumber) {
    const filename = `style${styleNumber}-*.txt`;
    console.log(`🎯 특정 스타일 테스트: ${filename}`);
    
    // 구현 필요...
}

/**
 * 파싱 규칙 비교 분석
 */
function compareParsingRules(results) {
    console.log(`\n🔬 파싱 규칙 비교 분석`);
    console.log('='.repeat(50));
    
    results.filter(r => r.success).forEach(result => {
        const rules = result.rules;
        console.log(`\n📋 ${result.filename}:`);
        console.log(`   씬 번호 패턴: ${rules.sceneNumberPattern.description}`);
        console.log(`   장소 패턴: ${rules.locationPattern.description}`);
        console.log(`   시간 패턴: ${rules.timeOfDayPattern.description}`);
        console.log(`   신뢰도: ${result.confidence}%`);
    });
}

module.exports = {
    runAllTests,
    testSingleScript,
    testSpecificStyle,
    compareParsingRules
};