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
        } else if (e.target.id === 'generateFinalBtn') {
            generateFinalSchedule();
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
    
    // AI 분석이 선택되었지만 아직 준비되지 않은 경우
    if (useAI) {
        showStatus('AI 분석 기능은 현재 준비 중입니다. 기본 분석을 사용해주세요.', 'error');
        return;
    }
    
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
    const overallProgress = 50 + (step * 15);
    if (reviewProgressFill) {
        reviewProgressFill.style.width = `${overallProgress}%`;
    }
    if (reviewProgressText) {
        reviewProgressText.textContent = `${overallProgress}% 완료`;
    }
    
    // 검토 단계 진행률
    const stepProgress = (step / 3) * 100;
    if (stepProgressFill) {
        stepProgressFill.style.width = `${stepProgress}%`;
    }
    if (stepProgressText) {
        stepProgressText.textContent = `${step}/3 단계`;
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
    
    let charactersHTML = '';
    analysisResult.characters.forEach(character => {
        // character는 이제 {name, appearances, role} 객체
        const name = character.name || character;
        const frequency = character.appearances || analysisResult.characterFrequency[name] || 0;
        const isSelected = selectedMainCharacters.includes(name);
        
        charactersHTML += `
            <div class="character-option ${isSelected ? 'selected' : ''}" data-character="${name}">
                <div class="character-checkbox"></div>
                <div class="character-info">
                    <div class="character-option-name">${name}</div>
                    <div class="character-option-frequency">${frequency}회 출현</div>
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

// 2단계: 분석 결과 리포트 렌더링
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
                <h4>📍 장소별 촬영 분석</h4>
                <div class="location-breakdown">
    `;
    
    Object.entries(report.locationBreakdown).forEach(([location, data]) => {
        reportHTML += `
            <div class="location-item">
                <div class="location-name">${location}</div>
                <div class="location-stats">
                    <span>총 ${data.count}씬</span>
                    <span class="day-count">주간 ${data.dayCount}</span>
                    <span class="night-count">야간 ${data.nightCount}</span>
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
    
    report.characterBreakdown.forEach(character => {
        const name = character.name || character;
        const appearances = character.appearances || 0;
        const role = character.role || '미분류';
        reportHTML += `
            <div class="character-item">
                <div class="character-name">${name}</div>
                <div class="character-stats">
                    <span class="character-role">${role}</span>
                    <span class="character-count">${appearances}회 출현</span>
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
    
    analysisResult.scenes.forEach(scene => {
        const timeIcon = scene.timeOfDay === 'DAY' ? '☀️' : '🌙';
        const content = scene.content.length > 50 ? 
            scene.content.substring(0, 50) + '...' : scene.content;
        
        reportHTML += `
            <div class="scene-table-row">
                <div class="scene-col-number">${scene.number}</div>
                <div class="scene-col-location">${scene.location}</div>
                <div class="scene-col-time">
                    <span class="time-badge ${scene.timeOfDay.toLowerCase()}">${timeIcon} ${scene.timeOfDay}</span>
                </div>
                <div class="scene-col-content">${content}</div>
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
    
    // 장소별로 씬 그룹핑
    const locationGroups = {};
    analysisResult.scenes.forEach((scene, index) => {
        const location = scene.location;
        if (!locationGroups[location]) {
            locationGroups[location] = [];
        }
        locationGroups[location].push({ ...scene, originalIndex: index });
    });
    
    let groupsHTML = '';
    Object.entries(locationGroups).forEach(([location, scenes]) => {
        groupsHTML += `
            <div class="location-group">
                <div class="location-group-header">
                    <div class="location-icon">📍</div>
                    <div class="location-group-title">${location}</div>
                    <div style="margin-left: auto; font-size: 0.9rem; color: #666666;">${scenes.length}개 씬</div>
                </div>
                <div class="location-scenes">
                    ${scenes.map(scene => `
                        <div class="scene-card" draggable="true" data-scene="${scene.number}">
                            <div class="scene-number-card">${scene.number}</div>
                            <div class="scene-time-card">${scene.timeOfDay}</div>
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

// 피드백 제출
function submitFeedback(type) {
    const surveyThanks = document.getElementById('surveyThanks');
    const surveyButtons = document.querySelector('.survey-buttons');
    
    // 피드백 타입에 따른 메시지
    const messages = {
        'positive': '✨ 도움이 되셨다니 정말 기쁩니다!',
        'negative': '😔 아쉬우셨다니 죄송합니다. 더 나은 서비스로 보답하겠습니다!'
    };
    
    surveyThanks.querySelector('p').textContent = messages[type] || '✨ 소중한 피드백 감사합니다!';
    surveyButtons.style.display = 'none';
    surveyThanks.style.display = 'block';
    
    // 3초 후 다시 버튼 보이기
    setTimeout(() => {
        surveyButtons.style.display = 'flex';
        surveyThanks.style.display = 'none';
    }, 3000);
    
    // 실제 서비스에서는 여기서 피드백 데이터를 서버로 전송
    console.log(`피드백 제출: ${type}`);
}

// 개선 제안 모달 열기
function openSuggestionModal() {
    const modal = document.getElementById('suggestionModal');
    modal.style.display = 'flex';
    
    // 텍스트 영역에 포커스
    setTimeout(() => {
        document.getElementById('suggestionText').focus();
    }, 100);
}

// 개선 제안 모달 닫기
function closeSuggestionModal() {
    const modal = document.getElementById('suggestionModal');
    modal.style.display = 'none';
    
    // 입력 필드 초기화
    document.getElementById('suggestionText').value = '';
    document.getElementById('suggestionEmail').value = '';
}

// 개선 제안 제출
function submitSuggestion() {
    const suggestionText = document.getElementById('suggestionText').value.trim();
    const suggestionEmail = document.getElementById('suggestionEmail').value.trim();
    
    if (!suggestionText) {
        alert('개선 제안 내용을 입력해주세요.');
        return;
    }
    
    // 메일 본문 구성
    const emailBody = `ScriptPlanner 개선 제안
    
제안 내용:
${suggestionText}

답변받을 이메일: ${suggestionEmail || '없음'}

제출 시간: ${new Date().toLocaleString('ko-KR')}`;
    
    // 메일 링크 생성
    const mailtoLink = `mailto:showdam@gmail.com?subject=ScriptPlanner 개선 제안&body=${encodeURIComponent(emailBody)}`;
    
    // 메일 앱 열기
    window.location.href = mailtoLink;
    
    // 성공 메시지 표시
    setTimeout(() => {
        alert('메일 앱이 열렸습니다. 소중한 의견 감사합니다! 🙏');
    }, 500);
    
    // 모달 닫기
    closeSuggestionModal();
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
    const groups = {};
    const locations = [...new Set(scenes.map(scene => scene.location))];
    
    locations.forEach(location => {
        const locationScenes = scenes.filter(scene => scene.location === location);
        if (locationScenes.length > 0) {
            groups[location] = {
                location: location,
                scenes: locationScenes.sort((a, b) => parseInt(a.number) - parseInt(b.number)),
                estimatedHours: Math.ceil(locationScenes.length * 1.5)
            };
        }
    });
    
    return Object.values(groups);
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