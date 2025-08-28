interface HeroSectionProps {
  title: string;
  subtitle: string;
  descriptions: string[];
  showCTA?: boolean;
  onSampleLoad?: () => void;
  scrollToSection?: (sectionId: string) => void;
}

export default function HeroSection({ 
  title, 
  subtitle, 
  descriptions,
  showCTA = false,
  onSampleLoad,
  scrollToSection
}: HeroSectionProps) {
  return (
    <section className="text-center mb-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
        {title}<br />
        <span className="text-blue-600">{subtitle}</span>
      </h1>
      
      {/* 동일한 위계의 설명 문구들 */}
      <div className="mb-12 max-w-3xl mx-auto leading-relaxed">
        {descriptions.map((description, index) => (
          <p key={index} className="text-lg text-gray-600">
            {description}
          </p>
        ))}
      </div>

      {/* 핵심 기능 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <div className="text-3xl mb-3">✍️</div>
          <h3 className="font-semibold text-gray-900 mb-2">3초 규칙 학습</h3>
          <p className="text-sm text-gray-600">단 3가지 규칙만 기억하면 대본 작성 가능</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-semibold text-gray-900 mb-2">실시간 변환</h3>
          <p className="text-sm text-gray-600">타이핑과 동시에 포맷으로 변환</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <div className="text-3xl mb-3">📄</div>
          <h3 className="font-semibold text-gray-900 mb-2">Word/HWP 출력</h3>
          <p className="text-sm text-gray-600">추가 수정 가능한 문서 형태로 다운로드</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold text-gray-900 mb-2">80% 자동 완성</h3>
          <p className="text-sm text-gray-600">기본 포맷은 자동, 나머지는 간단 수정</p>
        </div>
      </div>
      
      {/* CTA 버튼 (메인 페이지에서만 표시) */}
      {showCTA && (
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={onSampleLoad}
            className="bg-blue-600 text-white px-12 py-5 rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-xl"
          >
            🚀 무료로 시작하기
          </button>
          <div className="flex gap-6 text-sm">
            <a 
              href="#how-to-use"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection?.('how-to-use');
              }}
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
            >
              사용법 보기 →
            </a>
            <a 
              href="/guide"
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
            >
              상세 가이드 →
            </a>
          </div>
        </div>
      )}
    </section>
  );
}