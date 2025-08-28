'use client';

import { useState, useEffect } from 'react';
import { parseScript } from '../lib/parser';
import { formatToHTML } from '../lib/formatter';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';

export default function Home() {
  const [scriptContent, setScriptContent] = useState('');
  const [parsedElements, setParsedElements] = useState([]);
  const [previewHTML, setPreviewHTML] = useState('');
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isServiceInfoOpen, setIsServiceInfoOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);
  const [improvementText, setImprovementText] = useState('');
  const [improvementName, setImprovementName] = useState('');
  const [improvementEmail, setImprovementEmail] = useState('');

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setScriptContent(content);
  };

  // 실시간 파싱 및 포맷팅
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scriptContent.trim()) {
        const parsed = parseScript(scriptContent);
        const html = formatToHTML(parsed);
        setParsedElements(parsed);
        setPreviewHTML(html);
      } else {
        setParsedElements([]);
        setPreviewHTML('');
      }
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [scriptContent]);

  const handleSampleLoad = () => {
    const sampleScript = `# 밤, 거리
급하게 밤거리를 걸어가는 정현. 유리에게 계속 전화를 거는데, 받지 않는다.
정현: 유리야, 나야. 제발 전화 받아.
휴대폰을 보며 초조해하는 정현.

# 새벽, 유리의 집 앞
정현이 유리의 집 앞에 도착한다. 불이 켜져 있다.
정현: (중얼거리며) 집에는 있구나.
벨을 누른다. 잠시 후 유리가 문을 연다.
유리: 왜 이렇게 늦게 와?
정현: 미안해. 꼭 해야 할 말이 있어서.`;
    
    setScriptContent(sampleScript);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setScriptContent(result.content);
      } else {
        alert(result.error || '파일 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드에 실패했습니다.');
    }

    // 파일 input 리셋
    event.target.value = '';
  };

  // 피드백 제출 함수
  const handleFeedback = async (type: 'positive' | 'negative') => {
    try {
      console.log('피드백 제출 중...', { type });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      const result = await response.json();
      console.log('피드백 API 응답:', result, 'Status:', response.status);
      
      if (response.ok && result.success) {
        setFeedbackSubmitted(true);
      } else {
        console.error('피드백 제출 실패:', result);
      }
    } catch (error) {
      console.error('피드백 제출 오류:', error);
    }
  };

  // 개선 제안 제출 함수
  const handleImprovementSubmit = async () => {
    if (!improvementText.trim()) {
      alert('개선 제안 내용을 입력해주세요.');
      return;
    }
    
    try {
      console.log('개선 제안 제출 중...', {
        type: 'improvement', 
        content: improvementText,
        name: improvementName,
        email: improvementEmail
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'improvement', 
          content: improvementText,
          name: improvementName,
          email: improvementEmail
        }),
      });
      
      const result = await response.json();
      console.log('API 응답:', result, 'Status:', response.status);
      
      if (response.ok && result.success) {
        setIsImprovementModalOpen(false);
        setImprovementText('');
        setImprovementName('');
        setImprovementEmail('');
        alert('소중한 의견 감사합니다! 서비스 개선에 반영하겠습니다.');
      } else {
        console.error('개선 제안 제출 실패:', result);
        alert('제출 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('개선 제안 제출 오류:', error);
      alert('제출 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleDownload = async (format: 'hwp' | 'word') => {
    if (!scriptContent.trim()) {
      alert('다운로드할 스크립트가 없습니다.');
      return;
    }

    try {
      const endpoint = format === 'hwp' ? '/api/export/hwp' : '/api/export/word';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: scriptContent }),
      });

      if (response.ok) {
        // 파일 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Content-Disposition 헤더에서 파일명 추출
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch?.[1] || `drama-script.${format === 'hwp' ? 'hwp' : 'docx'}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(errorData.error || '파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // 모바일 접근 제한
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">💻</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">드라마 대본 마법사</h1>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">PC에서 이용해주세요</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            더 나은 대본 작성 경험을 위해<br />
            PC 또는 태블릿에서 접속해주세요.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• 실시간 미리보기</p>
            <p>• 편리한 키보드 입력</p>
            <p>• 큰 화면에서 작업</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <HeroSection 
          title="드라마 대본 작성의"
          subtitle="든든한 파트너"
          descriptions={[
            "방송작가와 드라마 작가를 위한 무료 도구입니다.",
            "기본 텍스트를 80% 완성도의 드라마 대본 초안으로 변환합니다.",
            "포맷팅 시간을 줄이고 창작에 집중하세요."
          ]}
          showCTA={true}
          onSampleLoad={handleSampleLoad}
          scrollToSection={scrollToSection}
        />

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 영역 */}
          <div className="bg-white rounded-lg shadow-sm" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="p-4" style={{borderBottom: '1px solid #e0e0e0'}}>
              <h2 className="font-medium text-gray-900" style={{fontSize: 'var(--font-size-lg)'}}>스크립트 입력</h2>
              <p className="text-gray-500 mt-1" style={{fontSize: 'var(--font-size-sm)'}}>
                # 씬 제목, 캐릭터: 대사 형태로 입력하세요
              </p>
            </div>
            <div className="p-4">
              <textarea
                value={scriptContent}
                onChange={handleScriptChange}
                placeholder={`예시:
# 밤, 거리
급하게 밤거리를 걸어가는 정현. 유리에게 계속 전화를 거는데, 받지 않는다.
정현: 유리야, 나야. 제발 전화 받아.
휴대폰을 보며 초조해하는 정현.`}
                className="w-full h-96 p-4 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                style={{border: '1px solid #e0e0e0'}}
                style={{fontSize: 'var(--font-size-sm)'}}
              />
              
              {/* 개인정보 보호 안내 */}
              <div className="mt-4 px-1">
                <div className="bg-blue-50 rounded-md p-3" style={{border: '1px solid #e0e0e0'}}>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500" style={{fontSize: 'var(--font-size-sm)'}}>🔒</span>
                    <div>
                      <p className="text-blue-700 font-medium" style={{fontSize: 'var(--font-size-xs)'}}>
                        안심하고 사용하세요
                      </p>
                      <p className="text-blue-600 mt-1" style={{fontSize: 'var(--font-size-xs)', lineHeight: 'var(--line-height-tight)'}}>
                        작가님의 소중한 작품은 서버에 저장되지 않고, 포맷 변환 후 바로 사라집니다. 저작권 걱정 없이 마음껏 활용하세요!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="flex gap-2">
                    <label className="btn-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
                      파일 업로드
                      <input
                        type="file"
                        accept=".txt,.hwp,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button 
                      onClick={handleSampleLoad}
                      className="btn-base rounded-md hover:bg-gray-50 transition-colors" style={{border: '1px solid #e0e0e0'}}>
                      샘플 대본 불러오기
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    현재는 .txt 파일 형식만 지원합니다.
                  </p>
                </div>
                <span className="text-gray-500" style={{fontSize: 'var(--font-size-sm)'}}>
                  {scriptContent.length} 글자
                </span>
              </div>
            </div>
          </div>

          {/* 미리보기 영역 */}
          <div className="bg-white rounded-lg shadow-sm" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="p-4" style={{borderBottom: '1px solid #e0e0e0'}}>
              <h2 className="font-medium text-gray-900" style={{fontSize: 'var(--font-size-lg)'}}>미리보기</h2>
              <p className="text-gray-500 mt-1" style={{fontSize: 'var(--font-size-sm)'}}>
                변환된 드라마 포맷을 확인하세요
              </p>
            </div>
            <div className="p-4">
              <div className="h-96 rounded-md p-4 bg-white overflow-auto font-serif" style={{border: '1px solid #e0e0e0'}}>
                {previewHTML ? (
                  <div 
                    className="script-preview text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                  />
                ) : (
                  <p className="text-gray-500 italic" style={{fontSize: 'var(--font-size-sm)'}}>
                    스크립트를 입력하면 여기에 미리보기가 표시됩니다.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => handleDownload('hwp')}
                  disabled={!scriptContent.trim()}
                  className="btn-base bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
                  HWP 다운로드
                </button>
                <button 
                  onClick={() => handleDownload('word')}
                  disabled={!scriptContent.trim()}
                  className="btn-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                  Word 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 어떻게 작성하나요? (접을 수 있는 섹션) */}
        <div id="how-to-use" className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <button
            onClick={() => setIsHowToUseOpen(!isHowToUseOpen)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <h3 className="font-medium text-gray-900" style={{fontSize: 'var(--font-size-lg)'}}>어떻게 작성하나요?</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isHowToUseOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isHowToUseOpen && (
            <div className="px-6 pb-6" style={{borderTop: '1px solid #e0e0e0'}}>
              <div className="mt-6">
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">단 3가지 규칙만 기억하세요!</h4>
                  <p className="text-gray-600 mb-6">
                    복잡한 포맷팅 규칙을 외울 필요 없습니다. 이 3가지만 알면 누구나 전문적인 드라마 대본을 만들 수 있어요.
                  </p>
                </div>
                
                <div className="space-y-8">
                  {/* 규칙 1 */}
                  <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">1</span>
                      <h4 className="text-xl font-semibold text-gray-900"># 으로 시작하면 씬 헤더</h4>
                    </div>
                    <p className="text-gray-600 mb-4">
                      장소와 시간을 나타내는 씬 제목입니다. # 뒤에 한 칸 띄고 내용을 적으면 자동으로 S1, S2, S3... 번호가 매겨져요.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-gray-700 mb-3">✏️ 이렇게 작성하세요:</h5>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          <span className="text-gray-500"># </span>
                          <span>밤, 거리</span>
                        </div>
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          <span className="text-gray-500"># </span>
                          <span>새벽, 유리의 집 거실</span>
                        </div>
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          <span className="text-gray-500">#S </span>
                          <span>오후, 카페 내부</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2">📖 이렇게 변환됩니다:</h5>
                      <div className="font-serif text-sm space-y-2">
                        <div className="font-bold">S1 밤, 거리</div>
                        <div className="font-bold">S2 새벽, 유리의 집 거실</div>
                        <div className="font-bold">S3 오후, 카페 내부</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 규칙 2 */}
                  <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold">2</span>
                      <h4 className="font-semibold text-gray-900" style={{fontSize: 'var(--font-size-xl)'}}>: 콜론이 있으면 대사</h4>
                    </div>
                    <p className="text-gray-600 mb-4">
                      캐릭터 이름 뒤에 콜론(:)을 붙이고 대사를 적습니다. 긴 대사도 자동으로 예쁘게 정렬돼요.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-gray-700 mb-3">✏️ 이렇게 작성하세요:</h5>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          <span className="text-blue-600 font-medium">정현</span>
                          <span className="text-gray-500">: </span>
                          <span>안녕하세요. 오랜만이에요.</span>
                        </div>
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          <span className="text-blue-600 font-medium">유리</span>
                          <span className="text-gray-500">: </span>
                          <span>정말 오랜만이네요! 요즘 어떻게 지내세요?</span>
                        </div>
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          <span className="text-blue-600 font-medium">정현</span>
                          <span className="text-gray-500">: </span>
                          <span>(웃으며) 바쁘게 지내고 있어요. 새 프로젝트를 준비하고 있거든요.</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2">📖 이렇게 변환됩니다:</h5>
                      <div className="font-serif text-sm space-y-2">
                        <div><span className="font-medium">정현:</span><span className="ml-8">안녕하세요. 오랜만이에요.</span></div>
                        <div><span className="font-medium">유리:</span><span className="ml-8">정말 오랜만이네요! 요즘 어떻게 지내세요?</span></div>
                        <div><span className="font-medium">정현:</span><span className="ml-8">(웃으며) 바쁘게 지내고 있어요. 새 프로젝트를 준비하고 있거든요.</span></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 규칙 3 */}
                  <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold">3</span>
                      <h4 className="font-semibold text-gray-900" style={{fontSize: 'var(--font-size-xl)'}}>나머지는 모두 지문</h4>
                    </div>
                    <p className="text-gray-600 mb-4">
                      #도 :도 없는 텍스트는 모두 지문(상황 설명)이 됩니다. 문장 단위로 자동 분리되어 읽기 편해져요.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-gray-700 mb-3">✏️ 이렇게 작성하세요:</h5>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          정현이 문을 열고 들어온다. 유리가 소파에 앉아 책을 읽고 있다.
                        </div>
                        <div className="bg-white p-2" style={{borderLeft: '3px solid #22c55e'}}>
                          비가 내리기 시작한다. 사람들이 우산을 펴고 발걸음을 재촉한다.
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-medium text-purple-700 mb-2">📖 이렇게 변환됩니다:</h5>
                      <div className="font-serif text-sm space-y-1 pl-8">
                        <div>정현이 문을 열고 들어온다.</div>
                        <div>유리가 소파에 앉아 책을 읽고 있다.</div>
                        <div className="mt-2">비가 내리기 시작한다.</div>
                        <div>사람들이 우산을 펴고 발걸음을 재촉한다.</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 완전한 예제 */}
                <div className="mt-10 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg" style={{border: '1px solid #e0e0e0'}}>
                  <h5 className="text-xl font-semibold text-gray-900 mb-4">🎬 완전한 예제</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h6 className="font-medium text-gray-700 mb-3">✏️ 이렇게 작성하면...</h6>
                      <div className="bg-white p-4 rounded font-mono text-sm leading-relaxed" style={{border: '1px solid #e0e0e0'}}>
                        <div># 밤, 거리</div>
                        <div>급하게 걸어가는 정현. 전화를 걸고 있다.</div>
                        <div>정현: 유리야, 나야. 어디야?</div>
                        <div>전화가 끊어진다. 정현이 한숨을 쉰다.</div>
                        <div></div>
                        <div># 같은 시각, 유리의 집</div>
                        <div>유리가 핸드폰을 보고 있다. 망설이다가 전화를 끊는다.</div>
                        <div>유리: (중얼거리며) 미안해...</div>
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-gray-700 mb-3">📖 이렇게 변환됩니다!</h6>
                      <div className="bg-white p-4 rounded font-serif text-sm leading-relaxed" style={{border: '1px solid #e0e0e0'}}>
                        <div className="font-bold">S1 밤, 거리</div>
                        <div className="mt-3"></div>
                        <div className="pl-8">급하게 걸어가는 정현.</div>
                        <div className="pl-8">전화를 걸고 있다.</div>
                        <div className="mt-2"><span className="font-medium">정현:</span><span className="ml-8">유리야, 나야. 어디야?</span></div>
                        <div className="pl-8 mt-2">전화가 끊어진다.</div>
                        <div className="pl-8">정현이 한숨을 쉰다.</div>
                        
                        <div className="font-bold mt-6">S2 같은 시각, 유리의 집</div>
                        <div className="mt-3"></div>
                        <div className="pl-8">유리가 핸드폰을 보고 있다.</div>
                        <div className="pl-8">망설이다가 전화를 끊는다.</div>
                        <div className="mt-2"><span className="font-medium">유리:</span><span className="ml-8">(중얼거리며) 미안해...</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 추가 팁 */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-3">💡 작성 팁</h5>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>빈 줄은 자동으로 정리되니 자유롭게 사용하세요</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>캐릭터 이름은 일관되게 사용해주세요</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>지문이 길어도 문장 단위로 자동 분리됩니다</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-3">🚀 이렇게 하면 더 좋아요</h5>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>'샘플 대본 불러오기'로 예제를 먼저 확인해보세요</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>실시간 미리보기로 결과를 바로 확인하며 작성</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>완성되면 HWP나 Word로 다운로드하여 사용</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 서비스 소개 */}
        <div id="service-info" className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <button
            onClick={() => setIsServiceInfoOpen(!isServiceInfoOpen)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <h3 className="text-lg font-medium text-gray-900">서비스 소개</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isServiceInfoOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isServiceInfoOpen && (
            <div className="px-6 pb-6" style={{borderTop: '1px solid #e0e0e0'}}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">🎭 드라마 작가를 위한 포맷터</h4>
                  <p className="text-gray-600 mb-4">
                    복잡한 대본 포맷팅 규칙을 몰라도 괜찮습니다. 
                    간단한 마크업 문법으로 작성하면 표준 한국 드라마 포맷으로 자동 변환해드립니다.
                  </p>
                  
                  <h5 className="font-semibold text-gray-900 mb-3">핵심 기능</h5>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>실시간 미리보기로 즉시 결과 확인</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>씬 헤더 자동 번호 매기기 (S1, S2, S3...)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>대사와 지문 자동 들여쓰기 및 정렬</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>지문 문장 단위 분리로 가독성 향상</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>HWP/Word 파일로 바로 다운로드</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">👥 누가 사용하나요?</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-semibold text-blue-900 mb-2">드라마 작가</h5>
                      <p className="text-sm text-blue-800">
                        TV 드라마, 웹드라마 대본 작성 시 표준 포맷으로 빠르게 변환
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-semibold text-green-900 mb-2">방송 작가</h5>
                      <p className="text-sm text-green-800">
                        예능, 교양 프로그램의 스크립트 정리 및 포맷팅
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h5 className="font-semibold text-purple-900 mb-2">영상 제작자</h5>
                      <p className="text-sm text-purple-800">
                        YouTube, 광고 영상 시나리오 작성 및 정리
                      </p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h5 className="font-semibold text-orange-900 mb-2">연극/뮤지컬 관계자</h5>
                      <p className="text-sm text-orange-800">
                        무대 대본 작성 및 연습용 스크립트 제작
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <h5 className="font-semibold text-indigo-900 mb-3">🚀 왜 이 도구를 만들었나요?</h5>
                <p className="text-indigo-800 mb-3">
                  작가들이 창작에 집중할 수 있도록 복잡한 포맷팅 작업을 자동화하고, 
                  누구나 쉽게 사용할 수 있는 무료 도구를 제공하기 위해 만들어졌습니다.
                </p>
                <p className="text-sm text-indigo-700">
                  "기술이 창작을 방해하지 않고 도와야 한다"는 믿음으로 개발되었습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <button
            onClick={() => setIsFAQOpen(!isFAQOpen)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <h3 className="text-lg font-medium text-gray-900">자주 묻는 질문 (FAQ)</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isFAQOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isFAQOpen && (
            <div className="px-6 pb-6" style={{borderTop: '1px solid #e0e0e0'}}>
              <div className="space-y-6 mt-6">
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 무료로 사용할 수 있나요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: 네, 완전히 무료입니다. 회원가입이나 결제 없이 누구나 사용할 수 있습니다.
                  </p>
                </div>
                
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 제가 입력한 내용이 저장되나요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: 아니요, 서버에 저장되지 않습니다. 모든 처리는 브라우저에서만 이루어지므로 완전히 안전합니다.
                  </p>
                </div>
                
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 어떤 파일 형식을 지원하나요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: 현재 텍스트(.txt) 파일 업로드를 지원하며, HWP와 Word(.docx) 형식으로 다운로드할 수 있습니다.
                  </p>
                </div>
                
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 포맷팅 규칙이 복잡한가요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: 전혀 복잡하지 않습니다! 단 3가지 규칙만 기억하세요:<br/>
                    • # 으로 시작하면 씬 헤더<br/>
                    • : 콜론이 있으면 대사<br/>
                    • 나머지는 모두 지문
                  </p>
                </div>
                
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 어떤 기기에서 사용할 수 있나요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: PC 또는 태블릿에서 사용하실 수 있습니다. 더 나은 작성 경험을 위해 큰 화면에서의 사용을 권장합니다.
                  </p>
                </div>
                
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 오류나 제안사항이 있으면 어디에 연락하나요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: 상단 메뉴의 '문의' 버튼을 통해 의견을 보내주세요. 피드백과 제안을 언제나 환영합니다!
                  </p>
                </div>
                
                <div className="pl-4" style={{borderLeft: '1px solid #e0e0e0'}}>
                  <h4 className="font-semibold text-gray-900 mb-2">Q: 다른 언어나 다른 국가의 대본 포맷도 지원하나요?</h4>
                  <p className="text-gray-600 text-sm">
                    A: 현재는 한국 드라마 표준 포맷에 특화되어 있습니다. 다른 포맷에 대한 요청이 많으면 추가 개발을 검토하겠습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 피드백 섹션 */}
        <section className="mt-16 bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 이 도구가 도움이 되셨나요?</h2>
            <p className="text-gray-600 mb-8">여러분의 의견을 들려주세요</p>
            
            {!feedbackSubmitted ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                <button 
                  onClick={() => handleFeedback('positive')}
                  className="flex items-center gap-3 px-6 py-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors min-w-[140px]"
                  style={{border: '1px solid #e0e0e0'}}
                >
                  <span className="text-2xl">👍</span>
                  <div className="font-medium text-green-800">도움됐어요!</div>
                </button>
                
                <button 
                  onClick={() => handleFeedback('negative')}
                  className="flex items-center gap-3 px-6 py-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-w-[140px]"
                  style={{border: '1px solid #e0e0e0'}}
                >
                  <span className="text-2xl">👎</span>
                  <div className="font-medium text-red-800">아쉬워요</div>
                </button>
                
                <button 
                  onClick={() => setIsImprovementModalOpen(true)}
                  className="flex items-center gap-3 px-6 py-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors min-w-[140px]"
                  style={{border: '1px solid #e0e0e0'}}
                >
                  <span className="text-2xl">💡</span>
                  <div className="text-left">
                    <div className="font-medium text-blue-800">개선 제안</div>
                    <div className="text-sm text-blue-600">아이디어가 있어요</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-4xl">✨</div>
                  <h3 className="text-xl font-semibold text-gray-900">감사합니다!</h3>
                  
                  <button 
                    onClick={() => setIsImprovementModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    style={{border: '1px solid #e0e0e0'}}
                  >
                    <span className="text-2xl">💡</span>
                    <div className="text-left">
                      <div className="font-medium text-blue-800">개선 제안</div>
                      <div className="text-sm text-blue-600">아이디어가 있어요</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 개선 제안 모달 */}
        {isImprovementModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-semibold text-gray-900">개선 제안</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                서비스 개선을 위한 아이디어나 의견을 자유롭게 남겨주세요.
              </p>
              
              {/* 이름 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 (선택사항)
                </label>
                <input
                  type="text"
                  value={improvementName}
                  onChange={(e) => setImprovementName(e.target.value)}
                  placeholder="익명으로 제출하시려면 비워두세요"
                  className="w-full p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  style={{border: '1px solid #9ca3af'}}
                  style={{fontSize: 'var(--font-size-sm)'}}
                />
              </div>

              {/* 이메일 입력 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답변 받을 이메일 (선택사항)
                </label>
                <input
                  type="email"
                  value={improvementEmail}
                  onChange={(e) => setImprovementEmail(e.target.value)}
                  placeholder="답변이 필요한 경우에만 입력하세요"
                  className="w-full p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  style={{border: '1px solid #9ca3af'}}
                  style={{fontSize: 'var(--font-size-sm)'}}
                />
              </div>
              
              {/* 개선 제안 내용 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  어떤 부분이 개선되면 좋을까요?
                </label>
                <textarea
                  value={improvementText}
                  onChange={(e) => setImprovementText(e.target.value)}
                  placeholder="예시:&#10;• 더 많은 파일 형식 지원&#10;• 특정 기능 추가 요청&#10;• 오류/환경 제보&#10;• 사용성 개선 제안&#10;• 기타 의견 등"
                  className="w-full h-32 p-3 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  style={{border: '1px solid #9ca3af'}}
                  style={{fontSize: 'var(--font-size-sm)'}}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleImprovementSubmit}
                  disabled={!improvementText.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  제출하기
                </button>
                <button
                  onClick={() => {
                    setIsImprovementModalOpen(false);
                    setImprovementText('');
                    setImprovementName('');
                    setImprovementEmail('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
