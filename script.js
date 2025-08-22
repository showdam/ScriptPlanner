// ScriptPlanner MVP - 클라이언트 사이드 JavaScript

let analysisResult = null;
let originalAnalysisResult = null;
let isEditMode = false;
let isQuickReviewMode = false;
let currentQuickStep = 1;
let selectedMainCharacters = [];
let mockErrorScenes = [];
let currentAnalysisMode = 'rule'; // 'rule' 또는 'ai'

document.addEventListener('DOMContentLoaded', function() {
    // 네비게이션 초기화
    initNavigation();
    
    // 기본적으로 촬영계획표 마법사 페이지 표시
    showPage('planner');
    
    // 샘플 다운로드 섹션 표시 (페이지 로딩 시)
    setTimeout(() => {
        showSampleSection();
    }, 1000); // 1초 후에 표시
    
    const scriptInput = document.getElementById('scriptInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const charCount = document.getElementById('charCount');
    const previewSection = document.getElementById('previewSection');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // 글자수 카운터
    if (scriptInput) {
        scriptInput.addEventListener('input', function() {
            const length = scriptInput.value.length;
            charCount.textContent = `${length.toLocaleString()}자`;
            
            // 분석 버튼 활성화/비활성화
            analyzeBtn.disabled = length < 10;
        });
    }

    // 분석 버튼 클릭
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeScript);
    
    // 다운로드 버튼 클릭
    if (downloadBtn) downloadBtn.addEventListener('click', downloadExcel);
    
    // 샘플 버튼 클릭
    if (sampleBtn) sampleBtn.addEventListener('click', loadSampleText);
    
    // 수정 관련 버튼 이벤트
    document.addEventListener('click', function(e) {
        if (e.target.id === 'quickReviewBtn' || e.target.id === 'startQuickReviewBtn') {
            startQuickReview();
        } else if (e.target.id === 'editModeBtn' || e.target.id === 'detailedEditBtn') {
            startDetailedEdit();
        } else if (e.target.id === 'saveModeBtn') {
            saveChanges();
        } else if (e.target.id === 'cancelModeBtn') {
            cancelChanges();
        } else if (e.target.id === 'addCharacterBtn') {
            addNewCharacter();
        } else if (e.target.classList.contains('delete-character')) {
            deleteCharacter(e.target);
        } else if (e.target.id === 'step1NextBtn') {
            goToQuickStep(2);
        } else if (e.target.id === 'step2PrevBtn') {
            goToQuickStep(1);
        } else if (e.target.id === 'step2NextBtn') {
            goToQuickStep(3);
        } else if (e.target.id === 'step3PrevBtn') {
            goToQuickStep(2);
        } else if (e.target.id === 'step3NextBtn') {
            goToQuickStep(4);
        } else if (e.target.id === 'step4PrevBtn') {
            goToQuickStep(3);
        } else if (e.target.id === 'generateFinalBtn') {
            if (currentQuickStep === 4) {
                downloadExcel();
            } else {
                generateFinalSchedule();
            }
        } else if (e.target.classList.contains('preview-tab')) {
            switchPreviewTab(e.target.dataset.tab);
        } else if (e.target.classList.contains('character-option')) {
            toggleCharacterSelection(e.target);
        }
    });
});

// 네비게이션 초기화
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            
            // 활성화된 링크 변경
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 페이지 전환
            showPage(targetPage);
        });
    });
}

// 페이지 표시/숨김
function showPage(pageName) {
    const pages = document.querySelectorAll('.page-content');
    
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }
}

// 서비스 소개에서 촬영계획표로 이동
function showPlanner() {
    // 네비게이션 활성화 상태 변경
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === 'planner') {
            link.classList.add('active');
        }
    });
    
    // 페이지 전환
    showPage('planner');
}

// 대본 분석 함수
async function analyzeScript() {
    const scriptText = document.getElementById('scriptInput').value.trim();
    
    if (!scriptText) {
        showStatus('대본 텍스트를 입력해주세요.', 'error');
        return;
    }

    // 선택된 분석 모드 감지
    const analysisMode = document.querySelector('input[name="analysisMode"]:checked').value;
    const useAI = analysisMode === 'ai';
    
    // AI 분석 준비 완료!
    
    currentAnalysisMode = analysisMode; // 전역 변수에 저장
    
    const loadingMessage = useAI ? 
        '🤖 Claude AI가 대본을 정밀 분석중입니다...' : 
        '⚙️ 규칙 기반으로 빠르게 분석중입니다...';
    
    showLoading(true, loadingMessage);
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text: scriptText,
                useAI: useAI
            })
        });

        if (!response.ok) {
            throw new Error('분석 중 오류가 발생했습니다.');
        }

        const data = await response.json();
        analysisResult = data;
        
        showPreview(data);
        showStatus('대본 분석이 완료되었습니다!', 'success');
        
        // AI 모드인 경우 파싱 규칙 검토 UI 표시
        if (data.parsingMethod === 'pure-ai-rules' && data.parsingRules) {
            showParsingRulesReview(data.parsingRules);
        }
        
        // 다운로드 버튼 활성화
        document.getElementById('downloadBtn').disabled = false;
        
    } catch (error) {
        console.error('Analysis error:', error);
        showStatus('분석 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 결과 미리보기 표시
function showPreview(data) {
    // 원본 데이터 백업
    if (!originalAnalysisResult) {
        originalAnalysisResult = JSON.parse(JSON.stringify(data));
    }
    
    
    const previewSection = document.getElementById('previewSection');
    const statsInfo = document.getElementById('statsInfo');
    const nextStepGuide = document.getElementById('nextStepGuide');
    const previewActions = document.getElementById('previewActions');

    // 다음 단계 가이드 표시 (우선 순위 높음)
    nextStepGuide.style.display = 'block';
    
    // 기존 액션 버튼들 숨김
    previewActions.style.display = 'none';
    
    // 기존 섹션들 숨김
    const editableSections = document.querySelectorAll('.editable-scene-section, .character-management');
    editableSections.forEach(section => {
        section.style.display = 'none';
    });

    // 통계 정보 표시
    statsInfo.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${data.scenes.length}</span>
            <div class="stat-label">총 씬 수</div>
        </div>
        <div class="stat-item">
            <span class="stat-value">${data.locations.length}</span>
            <div class="stat-label">촬영 장소</div>
        </div>
        <div class="stat-item">
            <span class="stat-value">${data.characters.length}</span>
            <div class="stat-label">등장인물</div>
        </div>
    `;

    // 수정 가능한 씬 리스트 생성 (백그라운드에서 준비)
    renderEditableSceneList(data);
    
    // 등장인물 관리 섹션 생성 (백그라운드에서 준비)
    renderCharacterManagement(data);

    // 전체 진행률 업데이트
    updateOverallProgress(25); // 분석 완료: 25%

    previewSection.style.display = 'block';
    
    // 미리보기로 스크롤
    previewSection.scrollIntoView({ behavior: 'smooth' });
}


// 수정 가능한 씬 리스트 렌더링
function renderEditableSceneList(data) {
    const container = document.getElementById('sceneListEditable');
    
    let tableHTML = `
        <table class="editable-scene-table">
            <thead>
                <tr>
                    <th>씬 번호</th>
                    <th>시간대</th>
                    <th>장소</th>
                    <th>내용</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.scenes.forEach((scene, index) => {
        const sceneContent = scene.content.length > 100 ? 
            scene.content.substring(0, 100) + '...' : scene.content;
            
        tableHTML += `
            <tr data-scene-index="${index}">
                <td class="editable-cell" data-field="number">${scene.number}</td>
                <td class="editable-cell" data-field="timeOfDay">
                    ${scene.timeOfDay}
                </td>
                <td class="editable-cell" data-field="location">${scene.location}</td>
                <td class="editable-cell" data-field="content">${sceneContent}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
    
    // 수정 이벤트 추가
    if (isEditMode) {
        enableSceneEditing();
    }
}

// 등장인물 관리 섹션 렌더링
function renderCharacterManagement(data) {
    const container = document.getElementById('characterList');
    
    let charactersHTML = '';
    data.characters.forEach(character => {
        // character는 이제 {name, appearances, role} 객체
        const name = character.name || character;
        const frequency = character.appearances || data.characterFrequency[name] || 0;
        charactersHTML += `
            <div class="character-item" data-character="${name}">
                <input type="text" class="character-name" value="${name}" ${!isEditMode ? 'readonly' : ''}>
                <span class="character-frequency">${frequency}회</span>
                <button class="delete-character" ${!isEditMode ? 'style="display:none"' : ''}>×</button>
            </div>
        `;
    });
    
    container.innerHTML = charactersHTML;
}

// 엑셀 다운로드
async function downloadExcel() {
    if (!analysisResult) {
        showStatus('먼저 대본을 분석해주세요.', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analysisResult)
        });

        if (!response.ok) {
            throw new Error('다운로드 중 오류가 발생했습니다.');
        }

        // 파일 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `촬영계획표_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showStatus('촬영계획표가 다운로드되었습니다!', 'success');

    } catch (error) {
        console.error('Download error:', error);
        showStatus('다운로드 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 로딩 상태 표시/숨김
function showLoading(show, message = '대본을 분석중입니다...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = loadingOverlay.querySelector('p');
    
    if (loadingText) {
        loadingText.textContent = message;
    }
    
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 샘플 텍스트 로드 함수
function loadSampleText() {
    const sampleText = `S1. INT. 카페 - DAY
주인공이 친구와 대화를 나눈다.
주인공: 오늘 정말 힘든 하루였어.
친구: 무슨 일이야?
주인공: 회사에서 큰 프로젝트를 맡게 됐는데, 너무 부담스러워.

S2. EXT. 거리 - NIGHT  
주인공이 혼자 걸어간다. 비가 내리기 시작한다.
주인공: (독백) 이제 어떻게 해야 하지?
갑자기 휴대폰이 울린다.

S3. INT. 집 거실 - NIGHT
주인공이 집에 도착한다.
어머니: 늦었네, 밥은 먹었니?
주인공: 네, 먹었어요.
어머니: 얼굴이 안 좋아 보이는데 괜찮니?

S4. INT. 주인공 방 - NIGHT
주인공이 책상 앞에 앉아 노트북을 연다.
화면에는 새로운 프로젝트 자료가 가득하다.
주인공: (한숨) 내일부터 시작이군.`;

    const scriptInput = document.getElementById('scriptInput');
    scriptInput.value = sampleText;
    
    // 글자수 카운터 업데이트
    const length = sampleText.length;
    document.getElementById('charCount').textContent = `${length.toLocaleString()}자`;
    
    // 분석 버튼 활성화
    document.getElementById('analyzeBtn').disabled = false;
    
    showStatus('샘플 텍스트를 로드했습니다.', 'success');
}

// 수정 모드 토글
function toggleEditMode(enable) {
    isEditMode = enable;
    const previewSection = document.getElementById('previewSection');
    const editModeBtn = document.getElementById('editModeBtn');
    const saveModeBtn = document.getElementById('saveModeBtn');
    const cancelModeBtn = document.getElementById('cancelModeBtn');
    const newCharacterInput = document.getElementById('newCharacterInput');
    const addCharacterBtn = document.getElementById('addCharacterBtn');

    if (enable) {
        previewSection.classList.add('edit-mode-active');
        editModeBtn.style.display = 'none';
        saveModeBtn.style.display = 'inline-block';
        cancelModeBtn.style.display = 'inline-block';
        newCharacterInput.style.display = 'block';
        addCharacterBtn.style.display = 'inline-block';
        
        enableSceneEditing();
        enableCharacterEditing();
        showStatus('수정 모드가 활성화되었습니다. 항목을 클릭하여 수정하세요.', 'success');
    } else {
        previewSection.classList.remove('edit-mode-active');
        editModeBtn.style.display = 'inline-block';
        saveModeBtn.style.display = 'none';
        cancelModeBtn.style.display = 'none';
        newCharacterInput.style.display = 'none';
        addCharacterBtn.style.display = 'none';
        
        disableEditing();
    }
}

// 씬 편집 활성화
function enableSceneEditing() {
    const editableCells = document.querySelectorAll('.editable-cell');
    
    editableCells.forEach(cell => {
        cell.addEventListener('click', function() {
            if (!isEditMode || this.classList.contains('editing')) return;
            
            const field = this.getAttribute('data-field');
            const currentValue = this.textContent.trim();
            
            this.classList.add('editing');
            
            if (field === 'timeOfDay') {
                // 시간대는 드롭다운으로
                this.innerHTML = `
                    <select>
                        <option value="DAY" ${currentValue === 'DAY' ? 'selected' : ''}>DAY</option>
                        <option value="NIGHT" ${currentValue === 'NIGHT' ? 'selected' : ''}>NIGHT</option>
                    </select>
                `;
            } else if (field === 'content') {
                // 내용은 텍스트에리어로
                this.innerHTML = `<textarea>${currentValue}</textarea>`;
            } else {
                // 나머지는 텍스트 입력
                this.innerHTML = `<input type="text" value="${currentValue}">`;
            }
            
            const input = this.querySelector('input, select, textarea');
            input.focus();
            
            // 포커스 아웃 시 저장
            input.addEventListener('blur', () => {
                saveCell(this, input.value);
            });
            
            // 엔터키로 저장
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveCell(this, input.value);
                }
            });
        });
    });
}

// 셀 저장
function saveCell(cell, newValue) {
    const field = cell.getAttribute('data-field');
    const sceneIndex = parseInt(cell.closest('tr').getAttribute('data-scene-index'));
    
    // 데이터 업데이트
    if (analysisResult.scenes[sceneIndex]) {
        analysisResult.scenes[sceneIndex][field] = newValue;
        cell.classList.add('modified');
    }
    
    // UI 업데이트
    cell.classList.remove('editing');
    cell.textContent = newValue;
}

// 등장인물 편집 활성화
function enableCharacterEditing() {
    const characterInputs = document.querySelectorAll('.character-name');
    const deleteButtons = document.querySelectorAll('.delete-character');
    
    characterInputs.forEach(input => {
        input.removeAttribute('readonly');
        input.addEventListener('blur', updateCharacterName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
    });
    
    deleteButtons.forEach(btn => {
        btn.style.display = 'flex';
    });
}

// 등장인물 이름 업데이트
function updateCharacterName(e) {
    const input = e.target;
    const characterItem = input.closest('.character-item');
    const oldName = characterItem.getAttribute('data-character');
    const newName = input.value.trim();
    
    if (newName === '' || newName === oldName) {
        input.value = oldName;
        return;
    }
    
    // 데이터 업데이트
    const characterIndex = analysisResult.characters.indexOf(oldName);
    if (characterIndex !== -1) {
        analysisResult.characters[characterIndex] = newName;
        
        // 빈도 데이터 업데이트
        if (analysisResult.characterFrequency[oldName]) {
            analysisResult.characterFrequency[newName] = analysisResult.characterFrequency[oldName];
            delete analysisResult.characterFrequency[oldName];
        }
        
        characterItem.setAttribute('data-character', newName);
        characterItem.classList.add('modified');
    }
}

// 새 등장인물 추가
function addNewCharacter() {
    const input = document.getElementById('newCharacterInput');
    const newName = input.value.trim();
    
    if (newName === '') {
        showStatus('등장인물 이름을 입력해주세요.', 'error');
        return;
    }
    
    if (analysisResult.characters.includes(newName)) {
        showStatus('이미 존재하는 등장인물입니다.', 'error');
        return;
    }
    
    // 데이터 추가
    analysisResult.characters.push(newName);
    analysisResult.characterFrequency[newName] = 0;
    
    // UI 업데이트
    renderCharacterManagement(analysisResult);
    if (isEditMode) {
        enableCharacterEditing();
    }
    
    input.value = '';
    showStatus(`등장인물 '${newName}'이 추가되었습니다.`, 'success');
}

// 등장인물 삭제
function deleteCharacter(button) {
    const characterItem = button.closest('.character-item');
    const characterName = characterItem.getAttribute('data-character');
    
    if (confirm(`'${characterName}' 등장인물을 삭제하시겠습니까?`)) {
        // 데이터에서 제거
        const index = analysisResult.characters.indexOf(characterName);
        if (index !== -1) {
            analysisResult.characters.splice(index, 1);
            delete analysisResult.characterFrequency[characterName];
        }
        
        // UI에서 제거
        characterItem.remove();
        showStatus(`등장인물 '${characterName}'이 삭제되었습니다.`, 'success');
    }
}

// 편집 비활성화
function disableEditing() {
    const characterInputs = document.querySelectorAll('.character-name');
    const deleteButtons = document.querySelectorAll('.delete-character');
    
    characterInputs.forEach(input => {
        input.setAttribute('readonly', 'true');
    });
    
    deleteButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}

// 변경사항 저장
function saveChanges() {
    // 통계 업데이트
    const statsInfo = document.getElementById('statsInfo');
    statsInfo.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${analysisResult.scenes.length}</span>
            <div class="stat-label">총 씬 수</div>
        </div>
        <div class="stat-item">
            <span class="stat-value">${[...new Set(analysisResult.scenes.map(s => s.location))].length}</span>
            <div class="stat-label">촬영 장소</div>
        </div>
        <div class="stat-item">
            <span class="stat-value">${analysisResult.characters.length}</span>
            <div class="stat-label">등장인물</div>
        </div>
    `;
    
    // 수정 마커 제거
    document.querySelectorAll('.modified').forEach(el => {
        el.classList.remove('modified');
    });
    
    toggleEditMode(false);
    showStatus('변경사항이 저장되었습니다.', 'success');
}

// 변경사항 취소
function cancelChanges() {
    if (confirm('변경사항을 취소하시겠습니까? 수정된 내용이 모두 사라집니다.')) {
        // 원본 데이터로 복원
        analysisResult = JSON.parse(JSON.stringify(originalAnalysisResult));
        
        // UI 다시 렌더링
        renderEditableSceneList(analysisResult);
        renderCharacterManagement(analysisResult);
        
        toggleEditMode(false);
        showStatus('변경사항이 취소되었습니다.', 'success');
    }
}

// ======================
// 진행률 및 UI 관리 기능들
// ======================

// 전체 진행률 업데이트
function updateOverallProgress(percentage) {
    const progressFill = document.getElementById('overallProgressFill');
    const progressText = document.getElementById('overallProgressText');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${percentage}% 완료`;
    }
    
    // 진행률에 따른 단계 상태 업데이트
    const stepsMini = document.querySelectorAll('.step-mini');
    stepsMini.forEach((step, index) => {
        step.classList.remove('completed', 'current');
        
        if (percentage >= 25 && index === 0) {
            step.classList.add('completed');
        } else if (percentage >= 25 && percentage < 90 && index === 1) {
            step.classList.add('current');
        } else if (percentage >= 90 && index === 1) {
            step.classList.add('completed');
        } else if (percentage >= 90 && index === 2) {
            step.classList.add('current');
        }
    });
}

// 상세 수정 모드 시작
function startDetailedEdit() {
    const nextStepGuide = document.getElementById('nextStepGuide');
    const previewActions = document.getElementById('previewActions');
    const editableSections = document.querySelectorAll('.editable-scene-section, .character-management');
    
    // 가이드 숨김
    nextStepGuide.style.display = 'none';
    
    // 액션 버튼들 표시
    previewActions.style.display = 'flex';
    
    // 편집 섹션들 표시
    editableSections.forEach(section => {
        section.style.display = 'block';
    });
    
    // 수정 모드 활성화
    toggleEditMode(true);
    
    // 진행률 업데이트 (검토 시작: 50%)
    updateOverallProgress(50);
    
    showStatus('상세 수정 모드가 활성화되었습니다.', 'success');
}

// ======================
// 빠른 검토 모드 기능들
// ======================

// 빠른 검토 모드 시작
function startQuickReview() {
    if (!analysisResult) {
        showStatus('먼저 대본을 분석해주세요.', 'error');
        return;
    }

    isQuickReviewMode = true;
    currentQuickStep = 1;
    selectedMainCharacters = [];
    
    // 분석 리포트 준비
    // generateAnalysisReport는 실시간으로 호출되므로 별도 준비 불필요
    
    // UI 전환
    const nextStepGuide = document.getElementById('nextStepGuide');
    const previewActions = document.getElementById('previewActions');
    const quickReviewMode = document.getElementById('quickReviewMode');
    
    nextStepGuide.style.display = 'none';
    previewActions.style.display = 'none';
    quickReviewMode.style.display = 'block';
    
    // 기존 섹션 숨김
    const editableSections = document.querySelectorAll('.editable-scene-section, .character-management');
    editableSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 진행률 업데이트 (검토 시작: 50%)
    updateOverallProgress(50);
    updateQuickReviewProgress(1);
    
    // 1단계 시작
    renderStep1MainCharacters();
    updateProgressIndicator();
    
    showStatus('빠른 검토 모드가 시작되었습니다. 3단계로 빠르게 완료하세요!', 'success');
}

// 빠른 검토 단계 이동
function goToQuickStep(step) {
    // 현재 단계 숨김
    document.getElementById(`quickStep${currentQuickStep}`).style.display = 'none';
    
    // 새 단계 표시
    currentQuickStep = step;
    document.getElementById(`quickStep${currentQuickStep}`).style.display = 'block';
    
    // 2단계 진입시 분석 모드에 따라 텍스트 변경
    if (step === 2) {
        updateStep2TextByAnalysisMode();
    }
    
    // 3단계 진입시 새로운 촬영 순서 확인 UI 렌더링
    if (step === 3 && analysisResult && analysisResult.scenes) {
        renderShootingOrderStep(analysisResult.scenes);
    }
    
    // 4단계 진입시 미리보기 렌더링
    if (step === 4 && analysisResult) {
        renderPreviewStep();
    }
    
    // 진행 상황 업데이트
    updateProgressIndicator();
    updateQuickReviewProgress(step);
    
    // 전체 진행률 업데이트
    const overallProgress = 50 + (step * 15); // 50% + 각 단계마다 15%씩
    updateOverallProgress(overallProgress);
    
    // 단계별 렌더링
    switch(step) {
        case 1:
            renderStep1MainCharacters();
            break;
        case 2:
            renderStep2AnalysisReport();
            break;
        case 3:
            renderStep3ShootingOrder();
            break;
    }
    
    // 스크롤 이동
    document.getElementById('quickReviewMode').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// 빠른 검토 모드 진행률 업데이트
function updateQuickReviewProgress(step) {
    const reviewProgressFill = document.getElementById('reviewProgressFill');
    const reviewProgressText = document.getElementById('reviewProgressText');
    const stepProgressFill = document.getElementById('stepProgressFill');
    const stepProgressText = document.getElementById('stepProgressText');
    
    // 전체 진행률 (50% + 단계별 추가)
    const overallProgress = step === 4 ? 100 : 50 + (step * 12.5);
    if (reviewProgressFill) {
        reviewProgressFill.style.width = `${overallProgress}%`;
    }
    if (reviewProgressText) {
        reviewProgressText.textContent = `${overallProgress}% 완료`;
    }
    
    // 검토 단계 진행률
    const stepProgress = (step / 4) * 100;
    if (stepProgressFill) {
        stepProgressFill.style.width = `${stepProgress}%`;
    }
    if (stepProgressText) {
        stepProgressText.textContent = `${step}/4 단계`;
    }
}

// 진행 상황 인디케이터 업데이트
function updateProgressIndicator() {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    progressSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        
        step.classList.remove('active', 'completed');
        
        if (stepNumber < currentQuickStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentQuickStep) {
            step.classList.add('active');
        }
    });
}

// 1단계: 주요 등장인물 선택 렌더링
function renderStep1MainCharacters() {
    const container = document.getElementById('mainCharactersSelection');
    
    // 등장인물을 언급 횟수 순으로 정렬 (많이 언급된 순서)
    const sortedCharacters = [...analysisResult.characters].sort((a, b) => {
        const nameA = a.name || a;
        const nameB = b.name || b;
        const freqA = a.appearances || analysisResult.characterFrequency[nameA] || 0;
        const freqB = b.appearances || analysisResult.characterFrequency[nameB] || 0;
        return freqB - freqA; // 내림차순 정렬 (많이 언급된 것부터)
    });
    
    let charactersHTML = '';
    sortedCharacters.forEach(character => {
        // character는 이제 {name, appearances, role} 객체
        const name = character.name || character;
        const frequency = character.appearances || analysisResult.characterFrequency[name] || 0;
        const isSelected = selectedMainCharacters.includes(name);
        
        charactersHTML += `
            <div class="character-option ${isSelected ? 'selected' : ''}" data-character="${name}">
                <div class="character-checkbox"></div>
                <div class="character-info">
                    <div class="character-option-name">${name}</div>
                    <div class="character-option-frequency">${frequency}회 언급</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = charactersHTML;
    
    // 다음 버튼 상태 업데이트
    updateStep1NextButton();
}

// 등장인물 선택 토글
function toggleCharacterSelection(element) {
    const character = element.getAttribute('data-character');
    const isSelected = element.classList.contains('selected');
    
    if (isSelected) {
        // 선택 해제
        element.classList.remove('selected');
        const index = selectedMainCharacters.indexOf(character);
        if (index > -1) {
            selectedMainCharacters.splice(index, 1);
        }
    } else {
        // 선택 (최대 3명)
        if (selectedMainCharacters.length < 3) {
            element.classList.add('selected');
            selectedMainCharacters.push(character);
        } else {
            showStatus('주요 등장인물은 최대 3명까지 선택할 수 있습니다.', 'error');
            return;
        }
    }
    
    updateStep1NextButton();
}

// 1단계 다음 버튼 상태 업데이트
function updateStep1NextButton() {
    const nextBtn = document.getElementById('step1NextBtn');
    nextBtn.disabled = selectedMainCharacters.length === 0;
    
    if (selectedMainCharacters.length > 0) {
        nextBtn.textContent = `다음 단계 → (${selectedMainCharacters.length}/3명 선택됨)`;
    } else {
        nextBtn.textContent = '다음 단계 →';
    }
}

// 분석 결과 리포트 생성
function generateAnalysisReport() {
    const report = {
        summary: {
            totalScenes: analysisResult.scenes.length,
            totalLocations: analysisResult.locations.length,
            totalCharacters: analysisResult.characters.length,
            dayScenes: analysisResult.scenes.filter(s => s.timeOfDay === 'DAY').length,
            nightScenes: analysisResult.scenes.filter(s => s.timeOfDay === 'NIGHT').length
        },
        locationBreakdown: {},
        characterBreakdown: analysisResult.characters.slice(0, 5) // 상위 5명만
    };
    
    // 장소별 씬 분석
    analysisResult.scenes.forEach(scene => {
        const location = scene.location || '미정';
        if (!report.locationBreakdown[location]) {
            report.locationBreakdown[location] = {
                count: 0,
                dayCount: 0,
                nightCount: 0
            };
        }
        report.locationBreakdown[location].count++;
        if (scene.timeOfDay === 'DAY') {
            report.locationBreakdown[location].dayCount++;
        } else {
            report.locationBreakdown[location].nightCount++;
        }
    });
    
    return report;
}

// AI 추천값 생성 (모의)
function getSuggestedValue(field, currentValue) {
    switch(field) {
        case 'location':
            return currentValue.includes('카페') ? '○○ 카페 (강남구 소재)' : 
                   currentValue.includes('집') ? '주인공 자택 (거실)' : 
                   `${currentValue} (상세 위치 추가 필요)`;
        case 'timeOfDay':
            return currentValue === 'DAY' ? 'NIGHT' : 'DAY';
        case 'content':
            return currentValue + ' (세부 액션 추가 필요)';
        default:
            return currentValue;
    }
}

// 괄호 정리 전용 함수 (서버와 동일한 로직)
function cleanBrackets(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    // 1. 여러번 반복하여 모든 괄호 문제 해결
    for (let i = 0; i < 5; i++) { // 최대 5번 반복
        const before = cleaned;
        
        // 빈 괄호 제거
        cleaned = cleaned.replace(/\(\s*\)/g, '');
        
        // 중복 괄호 제거 (((내용))) -> (내용)
        cleaned = cleaned.replace(/\(\(+([^)]+)\)+\)/g, '($1)');
        
        // 시작 괄호만 있는 경우: "보육원(" -> "보육원"
        cleaned = cleaned.replace(/\(\s*$/g, '');
        
        // 끝 괄호만 있는 경우: ")보육원" -> "보육원"
        cleaned = cleaned.replace(/^\s*\)/g, '');
        
        // 짝이 맞지 않는 괄호 수정
        // 예: "연우집(컨테이너" -> "연우집 컨테이너"
        const openCount = (cleaned.match(/\(/g) || []).length;
        const closeCount = (cleaned.match(/\)/g) || []).length;
        
        if (openCount > closeCount) {
            // 열린 괄호가 더 많음 - 끝에서 초과된 열린 괄호 제거
            cleaned = cleaned.replace(/\([^)]*$/, function(match) {
                // 괄호 내용을 일반 텍스트로 변환
                return ' ' + match.substring(1);
            });
        } else if (closeCount > openCount) {
            // 닫힌 괄호가 더 많음 - 앞에서 초과된 닫힌 괄호 제거
            cleaned = cleaned.replace(/^[^(]*\)/, function(match) {
                return match.replace(/\)/, ' ');
            });
        }
        
        // 변화가 없으면 종료
        if (before === cleaned) break;
    }
    
    // 2. 최종 정리
    cleaned = cleaned
        .replace(/\s+/g, ' ') // 여러 공백을 하나로
        .replace(/^[\s()]+|[\s()]+$/g, '') // 앞뒤 공백과 괄호 제거
        .trim();
    
    return cleaned;
}

// 2단계: 분석 결과 리포트 렌더링
/**
 * 비슷한 장소들을 그룹핑하는 함수
 */
function groupSimilarLocations(locationBreakdown) {
    const groups = {};
    
    // 장소명에서 씬 번호 수집 함수
    function getScenesForLocation(locationName) {
        return analysisResult.scenes
            .filter(scene => scene.location === locationName)
            .map(scene => scene.number)
            .sort((a, b) => parseInt(a.replace('S', '')) - parseInt(b.replace('S', '')));
    }
    
    Object.entries(locationBreakdown).forEach(([location, data]) => {
        // 기본 장소명 추출 (괄호, 공백 등 제거 개선)
        let baseLocation = location;
        
        // 1. 괄호 정리 - 새로운 전용 함수 사용
        baseLocation = cleanBrackets(baseLocation);
        
        // 2. 괄호 안 내용 제거 및 기본 정리
        baseLocation = baseLocation
            .replace(/\s*\([^)]*\)\s*/g, '') // 괄호 안 내용 제거
            .replace(/\s*[-–—].*$/g, '') // 대시 뒤 내용 제거
            .replace(/\s*(안|밖|내부|외부|앞|뒤|옆|근처)\s*$/g, '') // 끝에 오는 위치 수식어 제거
            .replace(/\s+/g, ' ') // 여러 공백을 하나로
            .trim();
        
        // 2. 특별한 경우들 처리 (더 정밀하게)
        if (baseLocation.includes('준법지원센터') || baseLocation.includes('준법센터')) {
            baseLocation = '경기 남부 준법지원센터';
        } else if (baseLocation.includes('아파트')) {
            // 아파트는 구체적인 이름이 있으면 유지
            if (baseLocation.length > 3 && !baseLocation.match(/^아파트$/)) {
                baseLocation = baseLocation.replace(/아파트.*$/, '아파트');
            }
        } else if (baseLocation.includes('대학') || baseLocation.includes('학교')) {
            // 구체적인 학교명이 있으면 유지
            const schoolMatch = baseLocation.match(/(.+?)(대학|학교)/);
            if (schoolMatch && schoolMatch[1].length > 1) {
                baseLocation = schoolMatch[1] + schoolMatch[2];
            }
        } else if (baseLocation.includes('회사') || baseLocation.includes('사무실')) {
            // 구체적인 회사명이 있으면 유지
            const companyMatch = baseLocation.match(/(.+?)(회사|사무실)/);
            if (companyMatch && companyMatch[1].length > 1) {
                baseLocation = companyMatch[1] + companyMatch[2];
            }
        }
        
        // 3. 최종 정리
        if (!baseLocation || baseLocation.length === 0) {
            baseLocation = '미정';
        }
        
        // 그룹에 추가
        if (!groups[baseLocation]) {
            groups[baseLocation] = {
                locations: []
            };
        }
        
        // 해당 장소의 씬 번호들 수집
        const scenes = getScenesForLocation(location);
        
        groups[baseLocation].locations.push({
            name: location,
            count: data.count,
            dayCount: data.dayCount,
            nightCount: data.nightCount,
            scenes: scenes
        });
    });
    
    return groups;
}

/**
 * 장소 그룹 토글 함수
 */
function toggleLocationGroup(headerElement) {
    const groupElement = headerElement.parentElement;
    const detailsElement = groupElement.querySelector('.location-group-details');
    const toggleIcon = headerElement.querySelector('.toggle-icon');
    
    if (detailsElement.style.display === 'none') {
        detailsElement.style.display = 'block';
        toggleIcon.textContent = '▼';
        groupElement.classList.add('expanded');
    } else {
        detailsElement.style.display = 'none';
        toggleIcon.textContent = '▶';
        groupElement.classList.remove('expanded');
    }
}

/**
 * 등장인물 역할 분류 함수
 */
function classifyCharacterRoles(characters) {
    // 언급 횟수 기준으로 정렬
    const sortedCharacters = characters.sort((a, b) => {
        const aAppearances = a.appearances || 0;
        const bAppearances = b.appearances || 0;
        return bAppearances - aAppearances;
    });
    
    return sortedCharacters.map((character, index) => {
        const appearances = character.appearances || 0;
        let role = '조연';
        
        // 언급 횟수와 순서를 기반으로 역할 분류
        if (appearances >= 10 && index < 3) {
            role = '주연';
        } else if (appearances >= 5 && index < 6) {
            role = '주조연';
        } else if (appearances >= 2) {
            role = '조연';
        } else if (appearances >= 1) {
            role = '단역';
        } else {
            role = '언급없음';
        }
        
        return {
            ...character,
            role: role
        };
    });
}

function renderStep2AnalysisReport() {
    const container = document.getElementById('errorScenesList');
    const report = generateAnalysisReport();
    
    let reportHTML = `
        <div class="analysis-report">
            <!-- 요약 통계 -->
            <div class="report-section">
                <h4>📊 분석 요약</h4>
                <div class="report-stats">
                    <div class="stat-card">
                        <div class="stat-number">${report.summary.totalScenes}</div>
                        <div class="stat-label">총 씬 수</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.summary.totalLocations}</div>
                        <div class="stat-label">촬영 장소</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.summary.totalCharacters}</div>
                        <div class="stat-label">등장인물</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.summary.dayScenes}/${report.summary.nightScenes}</div>
                        <div class="stat-label">주간/야간</div>
                    </div>
                </div>
            </div>
            
            <!-- 장소별 분석 -->
            <div class="report-section">
                <h4>📍 촬영 장소별 분석</h4>
                <div class="location-breakdown">
    `;
    
    // 비슷한 장소들을 그룹핑
    const groupedLocations = groupSimilarLocations(report.locationBreakdown);
    
    Object.entries(groupedLocations).forEach(([groupName, group]) => {
        const totalScenes = group.locations.reduce((sum, loc) => sum + loc.count, 0);
        const totalDay = group.locations.reduce((sum, loc) => sum + loc.dayCount, 0);
        const totalNight = group.locations.reduce((sum, loc) => sum + loc.nightCount, 0);
        
        reportHTML += `
            <div class="location-group">
                <div class="location-group-header" onclick="toggleLocationGroup(this)">
                    <div class="location-group-name">
                        <span class="toggle-icon">▼</span>
                        ${groupName}
                        <span class="location-count">(${group.locations.length}개 세부 장소)</span>
                    </div>
                    <div class="location-group-stats">
                        <span>총 ${totalScenes}씬</span>
                        <span class="day-count">주간 ${totalDay}</span>
                        <span class="night-count">야간 ${totalNight}</span>
                    </div>
                </div>
                <div class="location-group-details">
        `;
        
        group.locations.forEach(location => {
            reportHTML += `
                <div class="location-sub-item">
                    <div class="location-sub-name">${location.name}</div>
                    <div class="location-sub-stats">
                        <span>S${location.scenes.join(', S')}</span>
                        <span class="scene-count">${location.count}씬</span>
                        <span class="day-count">주간 ${location.dayCount}</span>
                        <span class="night-count">야간 ${location.nightCount}</span>
                    </div>
                </div>
            `;
        });
        
        reportHTML += `
                </div>
            </div>
        `;
    });
    
    reportHTML += `
                </div>
            </div>
            
            <!-- 주요 등장인물 -->
            <div class="report-section">
                <h4>👥 주요 등장인물</h4>
                <div class="character-breakdown">
    `;
    
    // 등장인물에 역할 분류 추가
    const classifiedCharacters = classifyCharacterRoles(report.characterBreakdown);
    
    classifiedCharacters.forEach(character => {
        const name = character.name || character;
        const appearances = character.appearances || 0;
        const role = character.role || '미분류';
        
        // 0회 출연인 경우 스킵하거나 다르게 처리
        if (appearances === 0) return;
        
        reportHTML += `
            <div class="character-item">
                <div class="character-name">${name}</div>
                <div class="character-stats">
                    <span class="character-role ${role.toLowerCase()}">${role}</span>
                    <span class="character-count">${appearances}회 언급</span>
                </div>
            </div>
        `;
    });
    
    reportHTML += `
                </div>
            </div>
            
            <!-- 씬 리스트 -->
            <div class="report-section">
                <h4>🎬 씬 리스트</h4>
                <div class="scene-list-table">
                    <div class="scene-table-header">
                        <div class="scene-col-number">씬</div>
                        <div class="scene-col-location">장소</div>
                        <div class="scene-col-time">시간</div>
                        <div class="scene-col-content">내용</div>
                    </div>
    `;
    
    analysisResult.scenes.forEach((scene, index) => {
        const timeIcon = scene.timeOfDay === 'DAY' ? '☀️' : '🌙';
        const isLongContent = scene.content.length > 50;
        const shortContent = isLongContent ? scene.content.substring(0, 50) + '...' : scene.content;
        
        reportHTML += `
            <div class="scene-table-row">
                <div class="scene-col-number">${scene.number}</div>
                <div class="scene-col-location">${scene.location}</div>
                <div class="scene-col-time">
                    <span class="time-badge ${scene.timeOfDay.toLowerCase()}">${timeIcon} ${scene.timeOfDay}</span>
                </div>
                <div class="scene-col-content">
                    ${isLongContent ? `
                        <div class="content-preview" id="content-preview-${index}">
                            ${shortContent}
                            <button class="expand-btn" onclick="toggleSceneContent(${index})" data-expanded="false">더보기</button>
                        </div>
                        <div class="content-full" id="content-full-${index}" style="display: none;">
                            ${scene.content}
                            <button class="expand-btn" onclick="toggleSceneContent(${index})" data-expanded="true">접기</button>
                        </div>
                    ` : `
                        <div class="content-preview">
                            ${scene.content}
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    reportHTML += `
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = reportHTML;
}

// 씬 내용 토글 함수
function toggleSceneContent(index) {
    const preview = document.getElementById(`content-preview-${index}`);
    const full = document.getElementById(`content-full-${index}`);
    
    if (preview.style.display === 'none') {
        // 접기
        preview.style.display = 'block';
        full.style.display = 'none';
    } else {
        // 펼치기
        preview.style.display = 'none';
        full.style.display = 'block';
    }
}

// 필드 표시명 가져오기
function getFieldDisplayName(field) {
    const displayNames = {
        'location': '촬영장소',
        'timeOfDay': '시간대',
        'content': '씬내용'
    };
    return displayNames[field] || field;
}

// AI 추천값 적용
function applySuggestion(errorIndex) {
    const error = mockErrorScenes[errorIndex];
    const input = document.querySelector(`[data-error-index="${errorIndex}"] .error-field-input`);
    
    if (input) {
        input.value = error.suggestedValue;
        
        // 실제 데이터 업데이트
        if (analysisResult.scenes[error.sceneIndex]) {
            analysisResult.scenes[error.sceneIndex][error.errorField] = error.suggestedValue;
        }
        
        showStatus('AI 추천값이 적용되었습니다.', 'success');
    }
}

// 3단계: 촬영 순서 렌더링
function renderStep3ShootingOrder() {
    const container = document.getElementById('shootingOrderRecommendation');
    
    // 새로운 통합 그룹핑 사용
    const groupedScenes = groupScenesByLocation(analysisResult.scenes);
    
    let groupsHTML = '';
    groupedScenes.forEach((group) => {
        // 세부 장소 정보 표시
        const subLocationsInfo = group.originalLocations && group.originalLocations.length > 1 
            ? `<div class="sub-locations-info">
                세부: ${group.originalLocations.map(loc => loc.name).join(', ')}
               </div>` 
            : '';
        
        // 시간대 분포 정보
        const timeDistribution = [];
        if (group.dayScenes > 0) timeDistribution.push(`낮 ${group.dayScenes}개`);
        if (group.nightScenes > 0) timeDistribution.push(`밤 ${group.nightScenes}개`);
        const timeInfo = timeDistribution.length > 0 ? ` (${timeDistribution.join(', ')})` : '';
        
        groupsHTML += `
            <div class="location-group">
                <div class="location-group-header">
                    <div class="location-icon">📍</div>
                    <div class="location-group-info">
                        <div class="location-group-title">${group.location}</div>
                        ${subLocationsInfo}
                    </div>
                    <div class="location-group-stats">
                        <div style="font-size: 0.9rem; color: #666666;">${group.totalScenes}개 씬${timeInfo}</div>
                        <div style="font-size: 0.8rem; color: #888888;">예상 ${group.estimatedHours}시간</div>
                    </div>
                </div>
                <div class="location-scenes">
                    ${group.scenes.map(scene => `
                        <div class="scene-card" draggable="true" data-scene="${scene.number}">
                            <div class="scene-number-card">${scene.number}</div>
                            <div class="scene-time-card">${scene.timeOfDay}</div>
                            <div class="scene-location-detail" title="원본 장소: ${scene.location}">
                                ${scene.location !== group.location ? scene.location : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = groupsHTML;
    
    // 드래그 앤 드롭 이벤트 추가 (향후 구현)
    addDragDropEvents();
}

// 드래그 앤 드롭 이벤트 추가 (기본 구현)
function addDragDropEvents() {
    const locationGroups = document.querySelectorAll('.location-group');
    
    locationGroups.forEach(group => {
        const sceneCards = group.querySelectorAll('.scene-card');
        
        sceneCards.forEach((card, index) => {
            // 순서 조정 버튼 추가
            const controls = document.createElement('div');
            controls.className = 'scene-order-controls';
            controls.innerHTML = `
                <button class="order-btn order-up" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="order-btn order-down" ${index === sceneCards.length - 1 ? 'disabled' : ''}>↓</button>
            `;
            
            card.appendChild(controls);
            
            // 위로 이동 버튼
            const upBtn = controls.querySelector('.order-up');
            upBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index > 0) {
                    group.insertBefore(card, sceneCards[index - 1]);
                    updateOrderControls(group);
                }
            });
            
            // 아래로 이동 버튼
            const downBtn = controls.querySelector('.order-down');
            downBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index < sceneCards.length - 1) {
                    group.insertBefore(sceneCards[index + 1], card);
                    updateOrderControls(group);
                }
            });
        });
    });
}

// 순서 조정 컨트롤 업데이트
function updateOrderControls(group) {
    const sceneCards = group.querySelectorAll('.scene-card');
    sceneCards.forEach((card, index) => {
        const upBtn = card.querySelector('.order-up');
        const downBtn = card.querySelector('.order-down');
        
        if (upBtn) upBtn.disabled = index === 0;
        if (downBtn) downBtn.disabled = index === sceneCards.length - 1;
    });
}

// 최종 촬영계획표 생성
function generateFinalSchedule() {
    // 변경 사항을 analysisResult에 반영
    
    // 3단계 순서 조정 사항 반영
    if (currentGroupedScenes.length > 0) {
        // 조정된 순서대로 씬 배열 재구성
        const reorderedScenes = [];
        currentGroupedScenes.forEach(group => {
            reorderedScenes.push(...group.scenes);
        });
        analysisResult.scenes = reorderedScenes;
    }
    
    // 2단계 오류 수정 사항 반영
    const errorInputs = document.querySelectorAll('.error-field-input');
    errorInputs.forEach(input => {
        const sceneIndex = parseInt(input.getAttribute('data-scene-index'));
        const field = input.getAttribute('data-field');
        const value = input.value;
        
        if (analysisResult.scenes[sceneIndex]) {
            analysisResult.scenes[sceneIndex][field] = value;
        }
    });
    
    // 선택된 주요 등장인물 정보 저장
    analysisResult.mainCharacters = selectedMainCharacters;
    
    // 완료 진행률 업데이트 (100%)
    updateOverallProgress(100);
    updateQuickReviewProgress(3);
    
    showStatus('검토가 완료되었습니다! 최종 촬영계획표를 다운로드하세요.', 'success');
    
    // 빠른 검토 모드 종료
    exitQuickReviewMode();
    
    // 바로 다운로드 실행
    downloadExcel();
}

// 빠른 검토 모드 종료
function exitQuickReviewMode() {
    isQuickReviewMode = false;
    
    // UI 복원
    document.getElementById('quickReviewMode').style.display = 'none';
    document.getElementById('quickReviewBtn').style.display = 'inline-block';
    document.getElementById('editModeBtn').style.display = 'inline-block';
    
    // 기존 섹션 표시
    const editableSections = document.querySelectorAll('.editable-scene-section, .character-management');
    editableSections.forEach(section => {
        section.style.display = 'block';
    });
    
    // 데이터 다시 렌더링
    renderEditableSceneList(analysisResult);
    renderCharacterManagement(analysisResult);
}

// 상태 메시지 표시
function showStatus(message, type = 'success') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.add('show');

    // 3초 후 자동 숨김
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 3000);
}

// ==================== 설문조사 및 모달 기능 ====================

// 피드백 제출 상태 관리
let feedbackSubmitting = false;

// 피드백 제출
function submitFeedback(type) {
    // 이미 제출 중인 경우 중복 방지
    if (feedbackSubmitting) {
        return;
    }
    
    feedbackSubmitting = true;
    
    const surveyThanks = document.getElementById('surveyThanks');
    const feedbackButtons = document.getElementById('feedbackButtons'); // 피드백 버튼들만 선택
    
    // 피드백 타입에 따른 메시지
    const messages = {
        'positive': '✨ 도움이 되셨다니 정말 기쁩니다!',
        'negative': '😔 아쉬우셨다니 죄송합니다. 더 나은 서비스로 보답하겠습니다!'
    };
    
    surveyThanks.querySelector('p').textContent = messages[type] || '✨ 소중한 피드백 감사합니다!';
    feedbackButtons.style.display = 'none'; // 피드백 버튼들만 숨김
    surveyThanks.style.display = 'block';
    
    // Google Apps Script로 피드백 전송
    sendFeedbackToSheet(type);
    
    // 5초 후 피드백 버튼 다시 보이기 및 상태 리셋
    setTimeout(() => {
        feedbackButtons.style.display = 'flex'; // 피드백 버튼들만 다시 표시
        surveyThanks.style.display = 'none';
        feedbackSubmitting = false; // 상태 리셋
    }, 5000);
}

// 피드백 데이터를 스프레드시트로 전송
function sendFeedbackToSheet(feedbackType) {
    // 비동기 처리를 백그라운드에서 실행 (사용자 경험 방해하지 않음)
    setTimeout(async () => {
        try {
            const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZcRtpYcTTC4YvG2JVkRg10A8-BJspwBjdYNzdcPsF8IYfchsbVcHt7zx1Lh766unW/exec';
            
            const feedbackData = {
                type: 'feedback',
                feedbackType: feedbackType, // 'positive' 또는 'negative'
                timestamp: new Date().toISOString(),
                page: window.location.href,
                userAgent: navigator.userAgent
            };
            
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });
            
            console.log(`피드백 전송 완료: ${feedbackType}`);
            
        } catch (error) {
            console.error('피드백 전송 오류:', error);
            // 오류가 발생해도 사용자 경험을 방해하지 않음
        }
    }, 100); // 100ms 후에 실행하여 UI 업데이트와 분리
}

// 개선 제안 모달 열기
function openSuggestionModal() {
    const modal = document.getElementById('suggestionModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// 개선 제안 모달 닫기
function closeSuggestionModal() {
    const modal = document.getElementById('suggestionModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // 모달 내용 초기화
        const textarea = document.getElementById('suggestionText');
        const email = document.getElementById('suggestionEmail');
        const name = document.getElementById('suggestionName');
        if (textarea) textarea.value = '';
        if (email) email.value = '';
        if (name) name.value = '';
    }
}

// 개선 제안 제출
async function submitSuggestion() {
    const suggestionText = document.getElementById('suggestionText').value.trim();
    const suggestionEmail = document.getElementById('suggestionEmail').value.trim();
    const suggestionName = document.getElementById('suggestionName').value.trim();
    
    if (!suggestionText) {
        alert('개선 제안 내용을 입력해주세요.');
        return;
    }

    const submitButton = document.querySelector('.btn-suggestion-submit');
    const cancelButton = document.querySelector('.btn-suggestion-cancel');
    
    // 버튼 비활성화 및 로딩 상태
    submitButton.disabled = true;
    cancelButton.disabled = true;
    submitButton.textContent = '제출 중...';
    
    try {
        const formData = {
            name: suggestionName,
            email: suggestionEmail,
            suggestion: suggestionText,
            timestamp: new Date().toISOString(),
            page: window.location.href
        };
        
        console.log('폼 데이터:', formData);
        
        // 구글 스프레드시트로 전송 (CORS 우회)
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZcRtpYcTTC4YvG2JVkRg10A8-BJspwBjdYNzdcPsF8IYfchsbVcHt7zx1Lh766unW/exec';
        
        // CORS 문제를 우회하기 위해 no-cors 모드 사용
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // no-cors 모드에서는 응답을 읽을 수 없으므로 성공으로 가정
        alert('개선 제안이 성공적으로 전송되었습니다. 소중한 의견 감사합니다!');
        
        // 폼 초기화
        document.getElementById('suggestionText').value = '';
        document.getElementById('suggestionEmail').value = '';
        if (document.getElementById('suggestionName')) {
            document.getElementById('suggestionName').value = '';
        }
        
        closeSuggestionModal();
            
    } catch (error) {
        console.error('API 오류:', error);
        alert(`전송 중 오류가 발생했습니다: ${error.message}`);
    } finally {
        // 버튼 상태 복원
        submitButton.disabled = false;
        cancelButton.disabled = false;
        submitButton.textContent = '제안하기';
    }
}


// 모달 외부 클릭시 닫기
document.addEventListener('click', function(e) {
    const suggestionModal = document.getElementById('suggestionModal');
    if (e.target === suggestionModal) {
        closeSuggestionModal();
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const suggestionModal = document.getElementById('suggestionModal');
        if (suggestionModal.style.display === 'flex') {
            closeSuggestionModal();
        }
    }
});

// ==================== 분석 옵션 선택 ====================

// 분석 옵션 선택 함수
function selectAnalysisOption(type) {
    // AI 모드가 비활성화된 경우 클릭 방지
    if (type === 'ai' && event.currentTarget.classList.contains('disabled')) {
        return false;
    }
    
    // 모든 옵션에서 selected 클래스 제거
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 클릭된 옵션에 selected 클래스 추가
    event.currentTarget.classList.add('selected');
    
    // 해당 라디오 버튼 체크
    document.querySelector(`input[value="${type}"]`).checked = true;
}

// 라디오 버튼 변경 시 선택 상태 업데이트
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[name="analysisMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // 비활성화된 옵션은 무시
            if (this.disabled) return;
            
            document.querySelectorAll('.analysis-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.closest('.analysis-option').classList.add('selected');
        });
    });
    
    // 초기 선택 상태 설정 (기본 분석이 기본 선택)
    const ruleOption = document.querySelector('input[value="rule"]').closest('.analysis-option');
    if (ruleOption) {
        ruleOption.classList.add('selected');
    }
});

// ======================
// 촬영 순서 확인 UI 개선
// ======================

// 장소별 씬 그룹핑
function groupScenesByLocation(scenes) {
    // 먼저 장소별 분석 결과를 생성하여 그룹핑 정보 가져오기
    const locationBreakdown = {};
    scenes.forEach(scene => {
        const location = scene.location || '미정';
        if (!locationBreakdown[location]) {
            locationBreakdown[location] = {
                count: 0,
                dayCount: 0,
                nightCount: 0
            };
        }
        locationBreakdown[location].count++;
        if (scene.timeOfDay === 'DAY') locationBreakdown[location].dayCount++;
        if (scene.timeOfDay === 'NIGHT') locationBreakdown[location].nightCount++;
    });
    
    // 비슷한 장소들을 그룹핑 (기존 그룹핑 로직 재사용)
    const groupedLocations = groupSimilarLocations(locationBreakdown);
    
    // 그룹핑된 결과를 촬영 순서에 맞게 재구성
    const finalGroups = [];
    
    Object.entries(groupedLocations).forEach(([groupName, group]) => {
        // 해당 그룹의 모든 씬 수집
        const allScenesInGroup = [];
        group.locations.forEach(loc => {
            const locationScenes = scenes.filter(scene => scene.location === loc.name);
            allScenesInGroup.push(...locationScenes);
        });
        
        if (allScenesInGroup.length > 0) {
            finalGroups.push({
                location: groupName,
                originalLocations: group.locations, // 원본 세부 장소들
                scenes: allScenesInGroup.sort((a, b) => {
                    const aNum = parseInt(a.number.replace('S', ''));
                    const bNum = parseInt(b.number.replace('S', ''));
                    return aNum - bNum;
                }),
                estimatedHours: Math.ceil(allScenesInGroup.length * 1.5),
                totalScenes: allScenesInGroup.length,
                dayScenes: allScenesInGroup.filter(s => s.timeOfDay === 'DAY').length,
                nightScenes: allScenesInGroup.filter(s => s.timeOfDay === 'NIGHT').length
            });
        }
    });
    
    return finalGroups;
}

// 시간대 분포 계산
function getTimeDistribution(scenes) {
    const dayScenes = scenes.filter(s => s.timeOfDay === 'DAY').length;
    const nightScenes = scenes.filter(s => s.timeOfDay === 'NIGHT').length;
    
    const parts = [];
    if (dayScenes > 0) parts.push(`낮 ${dayScenes}개`);
    if (nightScenes > 0) parts.push(`밤 ${nightScenes}개`);
    
    return parts.join(', ');
}

// 일차별 장소 분배
function getDay1Locations(groups) {
    const day1Groups = groups.slice(0, Math.ceil(groups.length / 2));
    return day1Groups.map(g => g.location).join(' + ');
}

function getDay1Hours(groups) {
    const day1Groups = groups.slice(0, Math.ceil(groups.length / 2));
    return day1Groups.reduce((sum, g) => sum + g.estimatedHours, 0);
}

function getDay2Locations(groups) {
    const day2Groups = groups.slice(Math.ceil(groups.length / 2));
    return day2Groups.map(g => g.location).join(' + ');
}

function getDay2Hours(groups) {
    const day2Groups = groups.slice(Math.ceil(groups.length / 2));
    return day2Groups.reduce((sum, g) => sum + g.estimatedHours, 0);
}

// 3단계 촬영 순서 확인 UI 렌더링
function renderShootingOrderStep(scenes) {
    const groupedScenes = groupScenesByLocation(scenes);
    currentGroupedScenes = [...groupedScenes]; // 전역 변수에 복사
    
    // 장소별 플로우 렌더링
    const locationFlow = document.getElementById('locationFlow');
    locationFlow.innerHTML = groupedScenes.map((group, index) => {
        const arrow = index < groupedScenes.length - 1 ? '<span class="flow-arrow">→</span>' : '';
        return `
            <span class="location-item">${group.location} (${group.scenes.length}개 씬)</span>
            ${arrow}
        `;
    }).join('');

    // 상세 정보 카드들 렌더링 (순서 조정 기능 포함)
    const locationDetails = document.getElementById('locationDetails');
    locationDetails.innerHTML = groupedScenes.map((group, index) => `
        <div class="location-card" data-location-index="${index}" draggable="true">
            <div class="location-header">
                <div class="location-controls">
                    <button class="order-btn up-btn" ${index === 0 ? 'disabled' : ''} 
                            onclick="moveLocationGroup(${index}, 'up')" title="위로 이동">
                        ↑
                    </button>
                    <button class="order-btn down-btn" ${index === groupedScenes.length - 1 ? 'disabled' : ''} 
                            onclick="moveLocationGroup(${index}, 'down')" title="아래로 이동">
                        ↓
                    </button>
                    <span class="drag-handle" title="드래그하여 순서 조정">⋮⋮</span>
                </div>
                <div class="location-info">
                    <h4>📍 ${group.location}</h4>
                    <span class="location-meta">
                        ${group.scenes.length}개 씬
                    </span>
                </div>
                <div class="time-distribution">
                    ${getTimeDistribution(group.scenes)}
                </div>
            </div>
            
            <div class="scene-list">
                ${group.scenes.map(scene => `
                    <div class="scene-item">
                        <span class="scene-number">S${scene.number.replace('S', '')}</span>
                        <span class="scene-time">(${scene.timeOfDay === 'DAY' ? '낮' : '밤'})</span>
                        <span class="scene-content">
                            ${scene.content.substring(0, 40)}${scene.content.length > 40 ? '...' : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // 드래그 앤 드롭 이벤트 리스너 추가
    setupDragAndDrop();

    // 촬영 개요 렌더링
    const overviewStats = document.getElementById('overviewStats');
    if (groupedScenes.length > 1) {
        overviewStats.innerHTML = `
            <span>• 1일차: ${getDay1Locations(groupedScenes)}</span>
            <span>• 2일차: ${getDay2Locations(groupedScenes)}</span>
        `;
    } else {
        overviewStats.innerHTML = `
            <span>• 1일차: ${groupedScenes[0].location}</span>
        `;
    }
}

// 전역 변수로 현재 그룹핑된 씬 데이터 저장
let currentGroupedScenes = [];

// 위아래 버튼으로 장소 그룹 순서 조정
function moveLocationGroup(index, direction) {
    if (direction === 'up' && index > 0) {
        // 배열에서 요소들 위치 교체
        [currentGroupedScenes[index - 1], currentGroupedScenes[index]] = 
        [currentGroupedScenes[index], currentGroupedScenes[index - 1]];
    } else if (direction === 'down' && index < currentGroupedScenes.length - 1) {
        // 배열에서 요소들 위치 교체
        [currentGroupedScenes[index], currentGroupedScenes[index + 1]] = 
        [currentGroupedScenes[index + 1], currentGroupedScenes[index]];
    }
    
    // UI 업데이트
    updateLocationDetailsAfterReorder();
    updateLocationFlowAfterReorder();
    updateOverviewStatsAfterReorder();
}

// 드래그 앤 드롭 설정
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.location-card');
    let draggedIndex = null;
    
    cards.forEach((card, index) => {
        card.addEventListener('dragstart', (e) => {
            draggedIndex = index;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.outerHTML);
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            draggedIndex = null;
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            card.classList.add('drag-over');
        });
        
        card.addEventListener('dragleave', (e) => {
            card.classList.remove('drag-over');
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            
            const targetIndex = index;
            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                // 배열에서 요소 이동
                const draggedItem = currentGroupedScenes[draggedIndex];
                currentGroupedScenes.splice(draggedIndex, 1);
                currentGroupedScenes.splice(targetIndex, 0, draggedItem);
                
                // UI 업데이트
                updateLocationDetailsAfterReorder();
                updateLocationFlowAfterReorder();
                updateOverviewStatsAfterReorder();
            }
        });
    });
}

// 순서 변경 후 상세 정보 카드들 업데이트
function updateLocationDetailsAfterReorder() {
    const locationDetails = document.getElementById('locationDetails');
    locationDetails.innerHTML = currentGroupedScenes.map((group, index) => `
        <div class="location-card" data-location-index="${index}" draggable="true">
            <div class="location-header">
                <div class="location-controls">
                    <button class="order-btn up-btn" ${index === 0 ? 'disabled' : ''} 
                            onclick="moveLocationGroup(${index}, 'up')" title="위로 이동">
                        ↑
                    </button>
                    <button class="order-btn down-btn" ${index === currentGroupedScenes.length - 1 ? 'disabled' : ''} 
                            onclick="moveLocationGroup(${index}, 'down')" title="아래로 이동">
                        ↓
                    </button>
                    <span class="drag-handle" title="드래그하여 순서 조정">⋮⋮</span>
                </div>
                <div class="location-info">
                    <h4>📍 ${group.location}</h4>
                    <span class="location-meta">
                        ${group.scenes.length}개 씬
                    </span>
                </div>
                <div class="time-distribution">
                    ${getTimeDistribution(group.scenes)}
                </div>
            </div>
            
            <div class="scene-list">
                ${group.scenes.map(scene => `
                    <div class="scene-item">
                        <span class="scene-number">S${scene.number.replace('S', '')}</span>
                        <span class="scene-time">(${scene.timeOfDay === 'DAY' ? '낮' : '밤'})</span>
                        <span class="scene-content">
                            ${scene.content.substring(0, 40)}${scene.content.length > 40 ? '...' : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // 드래그 앤 드롭 다시 설정
    setupDragAndDrop();
}

// 순서 변경 후 플로우 업데이트
function updateLocationFlowAfterReorder() {
    const locationFlow = document.getElementById('locationFlow');
    locationFlow.innerHTML = currentGroupedScenes.map((group, index) => {
        const arrow = index < currentGroupedScenes.length - 1 ? '<span class="flow-arrow">→</span>' : '';
        return `
            <span class="location-item">${group.location} (${group.scenes.length}개 씬)</span>
            ${arrow}
        `;
    }).join('');
}

// 순서 변경 후 개요 업데이트
function updateOverviewStatsAfterReorder() {
    const overviewStats = document.getElementById('overviewStats');
    if (currentGroupedScenes.length > 1) {
        overviewStats.innerHTML = `
            <span>• 1일차: ${getDay1Locations(currentGroupedScenes)}</span>
            <span>• 2일차: ${getDay2Locations(currentGroupedScenes)}</span>
        `;
    } else {
        overviewStats.innerHTML = `
            <span>• 1일차: ${currentGroupedScenes[0].location}</span>
        `;
    }
}

// 2단계 텍스트를 분석 모드에 따라 업데이트
function updateStep2TextByAnalysisMode() {
    const step2Title = document.getElementById('step2Title');
    const step2Guide = document.getElementById('step2Guide');
    
    if (currentAnalysisMode === 'ai') {
        step2Title.textContent = '2단계: AI 분석 결과를 확인해주세요';
        step2Guide.textContent = 'AI가 분석한 대본 정보와 통계를 확인하세요. 내용이 정확한지 검토해주세요.';
    } else {
        step2Title.textContent = '2단계: 분석 결과를 확인해주세요';
        step2Guide.textContent = '분석된 대본 정보와 통계를 확인하세요. 내용이 정확한지 검토해주세요.';
    }
}

// ==================== 4단계: 미리보기 기능 ====================

// 4단계 미리보기 렌더링
function renderPreviewStep() {
    // 기본적으로 촬영계획표 탭이 선택되어 있으므로 바로 렌더링
    renderShootingPlanPreview();
}

// 탭 전환 함수
function switchPreviewTab(tabName) {
    // 모든 탭 비활성화
    document.querySelectorAll('.preview-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.preview-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName.replace(/-/g, '')}Preview`).classList.add('active');
    
    // 탭별 컨텐츠 렌더링
    switch(tabName) {
        case 'shooting-plan':
            renderShootingPlanPreview();
            break;
        case 'scene-list':
            renderSceneListPreview();
            break;
        case 'analysis-info':
            renderAnalysisInfoPreview();
            break;
    }
}

// 촬영계획표 미리보기 렌더링
function renderShootingPlanPreview() {
    const table = document.getElementById('shootingPlanTable');
    const totalShootingEl = document.getElementById('totalShooting');
    const previewShootingEl = document.getElementById('previewShooting');
    
    if (!analysisResult || !analysisResult.scenes) {
        table.innerHTML = '<tr><td colspan="12">데이터가 없습니다.</td></tr>';
        return;
    }
    
    // 모크 데이터 생성 (실제로는 서버에서 받아온 엑셀 데이터 사용)
    const shootingPlanData = generateShootingPlanData();
    const previewCount = Math.min(15, shootingPlanData.length);
    
    totalShootingEl.textContent = shootingPlanData.length;
    previewShootingEl.textContent = previewCount;
    
    // 테이블 헤더
    const headers = ['Ep', 'S#', 'D/N', 'L/S', '시제', '장소', '내용', '주요인물1', '주요인물2', '주요인물3', '보조출연자', '미술&소품', '특촬/비고'];
    
    let tableHTML = '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // 미리보기 데이터 (최대 15개)
    for (let i = 0; i < previewCount; i++) {
        const row = shootingPlanData[i];
        if (row.isLocationSeparator) {
            tableHTML += `<tr class="location-separator"><td colspan="13">${row.content}</td></tr>`;
        } else {
            tableHTML += '<tr>';
            tableHTML += `<td>1</td>`;
            tableHTML += `<td>${row.sceneNumber}</td>`;
            tableHTML += `<td>${row.timeOfDay}</td>`;
            tableHTML += `<td>-</td>`;
            tableHTML += `<td>-</td>`;
            tableHTML += `<td>${row.location}</td>`;
            tableHTML += `<td>${row.content.substring(0, 50)}${row.content.length > 50 ? '...' : ''}</td>`;
            
            // 주요 인물 3명
            const mainChars = selectedMainCharacters.slice(0, 3);
            for (let j = 0; j < 3; j++) {
                if (j < mainChars.length && row.characters.includes(mainChars[j])) {
                    tableHTML += `<td class="main-character">${mainChars[j]}</td>`;
                } else {
                    tableHTML += `<td>-</td>`;
                }
            }
            
            tableHTML += `<td>-</td>`;
            tableHTML += `<td>-</td>`;
            tableHTML += `<td>-</td>`;
            tableHTML += '</tr>';
        }
    }
    
    tableHTML += '</tbody>';
    table.innerHTML = tableHTML;
}

// 씬리스트 미리보기 렌더링
function renderSceneListPreview() {
    const table = document.getElementById('sceneListTable');
    const totalScenesEl = document.getElementById('totalScenes');
    const previewScenesEl = document.getElementById('previewScenes');
    
    if (!analysisResult || !analysisResult.scenes) {
        table.innerHTML = '<tr><td colspan="6">데이터가 없습니다.</td></tr>';
        return;
    }
    
    const scenes = analysisResult.scenes;
    const previewCount = Math.min(20, scenes.length);
    
    totalScenesEl.textContent = scenes.length;
    previewScenesEl.textContent = previewCount;
    
    // 테이블 헤더
    const headers = ['씬번호', '장소', '시간대', '내용요약', '등장인물', '소품'];
    
    let tableHTML = '<thead><tr>';
    headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    // 미리보기 데이터
    for (let i = 0; i < previewCount; i++) {
        const scene = scenes[i];
        const isLowConfidence = Math.random() < 0.1; // 10% 확률로 신뢰도 낮음 표시
        
        tableHTML += `<tr${isLowConfidence ? ' class="low-confidence"' : ''}>`;
        tableHTML += `<td>${scene.number}</td>`;
        tableHTML += `<td>${scene.location}</td>`;
        tableHTML += `<td>${scene.timeOfDay === 'DAY' ? '낮' : '밤'}</td>`;
        tableHTML += `<td>${scene.content.substring(0, 80)}${scene.content.length > 80 ? '...' : ''}</td>`;
        tableHTML += `<td>${scene.characters ? scene.characters.slice(0, 3).join(', ') : '-'}</td>`;
        tableHTML += `<td>-</td>`;
        tableHTML += '</tr>';
    }
    
    tableHTML += '</tbody>';
    table.innerHTML = tableHTML;
}

// 분석 정보 미리보기 렌더링
function renderAnalysisInfoPreview() {
    const container = document.getElementById('analysisInfoCards');
    
    if (!analysisResult) {
        container.innerHTML = '<p>데이터가 없습니다.</p>';
        return;
    }
    
    // 분석 정보 계산
    const totalScenes = analysisResult.scenes ? analysisResult.scenes.length : 0;
    const totalCharacters = analysisResult.characters ? analysisResult.characters.length : 0;
    
    // 장소별 그룹핑
    const locations = [...new Set(analysisResult.scenes.map(scene => scene.location))];
    const mainLocations = locations.slice(0, 3);
    
    // 예상 촬영일수 (장소 수 기준)
    const estimatedDays = Math.ceil(locations.length / 2);
    
    // 장소 이동 횟수
    const locationChanges = analysisResult.scenes.reduce((count, scene, index) => {
        if (index > 0 && scene.location !== analysisResult.scenes[index - 1].location) {
            return count + 1;
        }
        return count;
    }, 0);
    
    // 주/야간 비율
    const dayScenes = analysisResult.scenes.filter(scene => scene.timeOfDay === 'DAY').length;
    const nightScenes = totalScenes - dayScenes;
    const dayNightRatio = `${Math.round((dayScenes / totalScenes) * 100)}% : ${Math.round((nightScenes / totalScenes) * 100)}%`;
    
    const analysisData = [
        { title: '총 씬 수', value: totalScenes, unit: '개', highlight: true },
        { title: '총 등장인물', value: totalCharacters, unit: '명', highlight: false },
        { title: '주요 촬영장소', value: mainLocations.length, unit: '곳', highlight: false },
        { title: '예상 촬영일수', value: estimatedDays, unit: '일', highlight: true },
        { title: '장소 이동횟수', value: locationChanges, unit: '회', highlight: false },
        { title: '주/야간 비율', value: dayNightRatio, unit: '', highlight: false }
    ];
    
    let cardsHTML = '';
    analysisData.forEach(item => {
        cardsHTML += `
            <div class="analysis-info-card ${item.highlight ? 'highlight' : ''}">
                <h5>${item.title}</h5>
                <div class="value">${item.value}</div>
                <div class="unit">${item.unit}</div>
            </div>
        `;
    });
    
    container.innerHTML = cardsHTML;
}

// 촬영계획표 데이터 생성 (모크)
function generateShootingPlanData() {
    if (!analysisResult || !analysisResult.scenes) return [];
    
    const data = [];
    const groupedScenes = groupScenesByLocation(analysisResult.scenes);
    
    groupedScenes.forEach(group => {
        // 장소 구분자 추가
        data.push({
            isLocationSeparator: true,
            content: `─── ${group.location} (${group.scenes.length}씬) ───`
        });
        
        // 해당 장소의 씬들 추가
        group.scenes.forEach(scene => {
            data.push({
                sceneNumber: scene.number,
                timeOfDay: scene.timeOfDay,
                location: scene.location,
                content: scene.content,
                characters: scene.characters || []
            });
        });
    });
    
    return data;
}

// 간단한 샘플 엑셀 다운로드 함수
async function downloadSampleExcel() {
    const sampleBtn = document.querySelector('.sample-download-btn');
    const originalText = sampleBtn.innerHTML;
    
    try {
        console.log('샘플 다운로드 시작');
        
        // 버튼 상태 변경
        sampleBtn.innerHTML = `
            <span class="btn-text">생성 중...</span>
            <span class="btn-icon">⏳</span>
        `;
        sampleBtn.disabled = true;
        
        // 간단한 GET 요청으로 샘플 엑셀 다운로드
        console.log('API 요청 시작: /api/sample-excel');
        const response = await fetch('/api/sample-excel');
        console.log('API 응답 받음:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log('Blob 생성 중...');
        const blob = await response.blob();
        console.log('Blob 크기:', blob.size, 'bytes');
        
        const url = window.URL.createObjectURL(blob);
        console.log('다운로드 URL 생성:', url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = '촬영계획표_샘플.xlsx';
        document.body.appendChild(a);
        console.log('다운로드 트리거');
        a.click();
        
        // 정리
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('다운로드 완료 및 정리됨');

        // 성공 상태
        sampleBtn.innerHTML = `
            <span class="btn-text">다운로드 완료!</span>
            <span class="btn-icon">✅</span>
        `;

        // 3초 후 원래 상태로 복구
        setTimeout(() => {
            sampleBtn.innerHTML = originalText;
            sampleBtn.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('샘플 다운로드 오류:', error);
        
        // 오류 상태
        sampleBtn.innerHTML = `
            <span class="btn-text">오류 발생</span>
            <span class="btn-icon">❌</span>
        `;

        // 3초 후 원래 상태로 복구
        setTimeout(() => {
            sampleBtn.innerHTML = originalText;
            sampleBtn.disabled = false;
        }, 3000);
    }
}

// 샘플 섹션 표시/숨기기 함수
function showSampleSection() {
    const sampleSection = document.getElementById('sampleSection');
    if (sampleSection) {
        sampleSection.style.display = 'block';
        
        // 부드러운 스크롤 애니메이션으로 해당 섹션으로 이동
        setTimeout(() => {
            sampleSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    }
}

function hideSampleSection() {
    const sampleSection = document.getElementById('sampleSection');
    if (sampleSection) {
        sampleSection.style.display = 'none';
    }
}

// downloadSampleExcel 함수 별칭 (기존 함수와 통합)
function downloadSampleExcelSafe() {
    downloadSampleExcel();
}

// ==================== 모바일 네비게이션 ====================

// 모바일 메뉴 토글 함수
function toggleMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// 메뉴 링크 클릭시 모바일 메뉴 닫기
document.addEventListener('click', function(e) {
    if (e.target.matches('.nav-link')) {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// ==================== 가이드 페이지 기능 ====================

// 가이드 페이지 내부 링크 처리
document.addEventListener('click', function(e) {
    if (e.target.matches('.guide-toc a')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// 가이드 페이지 표시 함수 (기존 showPage에 통합되어 있음)
function showGuide() {
    showPage('guide');
}

