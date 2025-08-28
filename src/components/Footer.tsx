'use client';

import { useState } from 'react';

export default function Footer() {
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);
  const [improvementText, setImprovementText] = useState('');
  const [improvementName, setImprovementName] = useState('');
  const [improvementEmail, setImprovementEmail] = useState('');

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

  return (
    <footer className="mt-16 bg-gray-800 text-white rounded-lg p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {/* 서비스 정보 */}
        <div>
          <h4 className="font-semibold text-lg mb-4">드라마 대본 마법사</h4>
          <p className="text-gray-300 text-sm mb-4">
            한국 드라마 작가들을 위한 무료 대본 포맷팅 도구입니다. 
            복잡한 규칙 없이 간단하게 표준 포맷으로 변환하세요.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              무료
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              안전
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              빠름
            </span>
          </div>
        </div>
        
        {/* 빈 공간 1 */}
        <div></div>
        
        {/* 웹사이트 정보 */}
        <div>
          <h4 className="font-semibold text-lg mb-4">웹사이트</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <a href="/about" className="hover:text-white transition-colors">
                서비스 소개
              </a>
            </li>
            <li>
              <a href="/guide" className="hover:text-white transition-colors">
                사용 가이드  
              </a>
            </li>
            <li>
              <button 
                onClick={() => setIsImprovementModalOpen(true)}
                className="hover:text-white transition-colors text-left"
              >
                문의하기
              </button>
            </li>
          </ul>
        </div>
        
        {/* 관련 도구 */}
        <div>
          <h4 className="font-semibold text-lg mb-4">관련 도구</h4>
          <div className="space-y-3">
            <a 
              href="https://script-planner.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <div className="font-medium text-white mb-1">📋 촬영 계획표 마법사</div>
              <div className="text-sm text-gray-300">드라마 촬영 일정 관리 도구</div>
              <div className="text-xs text-blue-400 mt-1">→ 바로가기</div>
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 text-center" style={{borderTop: '1px solid #e0e0e0'}}>
        <p className="text-sm text-gray-400">
          &copy; 2025 드라마 대본 마법사. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          이 서비스는 무료로 제공되며, 사용자의 대본을 수집하거나 저장하지 않습니다.
        </p>
      </div>

      {/* 개선 제안 모달 */}
      {isImprovementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-semibold text-gray-900">개선 제안</h3>
              </div>
              <button
                onClick={() => {
                  setIsImprovementModalOpen(false);
                  setImprovementText('');
                  setImprovementName('');
                  setImprovementEmail('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              서비스 개선을 위한 아이디어나 의견을 자유롭게 남겨주세요.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 (선택사항)
                </label>
                <input
                  type="text"
                  value={improvementName}
                  onChange={(e) => setImprovementName(e.target.value)}
                  className="w-full p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{border: '1px solid #9ca3af'}}
                  placeholder="익명으로 제출하시려면 비워두세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답변 받을 이메일 (선택사항)
                </label>
                <input
                  type="email"
                  value={improvementEmail}
                  onChange={(e) => setImprovementEmail(e.target.value)}
                  className="w-full p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  style={{border: '1px solid #9ca3af'}}
                  placeholder="답변이 필요한 경우에만 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  어떤 부분이 개선되면 좋을까요?
                </label>
                <textarea
                  value={improvementText}
                  onChange={(e) => setImprovementText(e.target.value)}
                  className="w-full h-32 p-3 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  style={{border: '1px solid #9ca3af'}}
                  placeholder="예시:&#10;• 더 많은 파일 형식 지원&#10;• 특정 기능 추가 요청&#10;• 오류/환경 제보&#10;• 사용성 개선 제안&#10;• 기타 의견 등"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
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
    </footer>
  );
}