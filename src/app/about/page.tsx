import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import HeroSection from '../../components/HeroSection';

export default function About() {
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
        />

        {/* 왜 만들었나 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              🎬 작가님의 창작 시간을 아껴드립니다
            </h2>
            <p className="text-lg text-gray-600 mb-8 text-center">
              드라마 대본 마법사는 방송작가와 드라마 작가를 위한 무료 대본 포맷 변환 도구입니다.<br />
              복잡한 대본 작성 프로그램 없이도, 간단한 텍스트만으로 한국 드라마 대본의 기본 포맷을 만들 수 있습니다.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mb-6">왜 이 서비스를 만들었을까요?</h3>
            
            <div className="space-y-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">"대본 쓰는 시간보다 포맷 맞추는 시간이 더 오래 걸려요"</h4>
                <p className="text-blue-800">
                  대본은 가독성이 생명입니다. PD, 배우, 스탭 모두가 읽기 편해야 하죠. 그런데 매번 Tab 키로 들여쓰기를 맞추고, 캐릭터명과 대사 간격을 조정하는 일은 정말 지치는 작업입니다.
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">"씬 하나 추가했는데 뒤에 씬 번호 다 바꿔야 해요..."</h4>
                <p className="text-green-800">
                  S15 다음에 새로운 씬을 넣으면 S16부터 끝까지 전부 수정해야 합니다. 100개가 넘는 씬이라면? 상상만 해도 끔찍하죠.
                </p>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">"Tab, Tab, Tab... 언제까지 이렇게 써야 하나요?"</h4>
                <p className="text-yellow-800">
                  캐릭터명은 정렬, 대사는 들여쓰기, 지문은 또 다른 간격... 워드에서 일일이 맞추다 보면 창작의 열정이 식어버립니다.
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">"비싼 전문 프로그램 꼭 사야 하나요?"</h4>
                <p className="text-purple-800">
                  신인 작가나 학생에게는 전문 프로그램이 부담스러울 수 있습니다.
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">그래서 만들었습니다.</p>
              <p className="text-lg text-gray-600">
                기본 포맷은 자동으로, 작가님은 오직 스토리에만 집중할 수 있는 도구를요.
              </p>
            </div>
          </div>
        </section>

        {/* 3초 규칙 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              🚀 3초만 배우면 바로 쓸 수 있어요
            </h2>
            <p className="text-lg text-gray-600 mb-8 text-center">딱 3가지만 기억하세요</p>

            <div className="space-y-8">
              {/* 규칙 1 */}
              <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">1</span>
                  <h3 className="text-xl font-semibold text-gray-900">씬 제목은 #으로 시작</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="space-y-2 font-mono text-sm">
                    <div># 낮, 카페</div>
                    <div># 밤, 정현의 집 - 거실</div>
                  </div>
                </div>
                <p className="text-gray-600">씬 번호는 자동으로 매겨집니다. 중간에 추가/삭제해도 알아서 정리됩니다!</p>
              </div>

              {/* 규칙 2 */}
              <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold">2</span>
                  <h3 className="text-xl font-semibold text-gray-900">대사는 이름: 으로 시작</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="space-y-2 font-mono text-sm">
                    <div>정현: 유리야, 괜찮아?</div>
                    <div>유리 (웃으며): 걱정 마, 난 괜찮아.</div>
                  </div>
                </div>
                <p className="text-gray-600">Tab 키 한 번도 누르지 마세요. 들여쓰기는 자동입니다.</p>
              </div>

              {/* 규칙 3 */}
              <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold">3</span>
                  <h3 className="text-xl font-semibold text-gray-900">나머지는 모두 지문</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="space-y-2 font-mono text-sm">
                    <div>급하게 밤거리를 걸어가는 정현.</div>
                    <div>유리를 발견하고 멈춰선다.</div>
                  </div>
                </div>
                <p className="text-gray-600">끝입니다! 이제 작성만 하세요. 기본 포맷은 자동으로 완성됩니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 주요 기능 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">✨ 주요 기능</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">📝 스마트 자동 변환</h3>
                <p className="text-gray-600">
                  씬 헤더, 캐릭터명, 대사, 지문을 자동으로 인식하여 기본 드라마 대본 포맷으로 변환합니다. 
                  약 80% 수준까지 자동 처리되며, 나머지는 간단한 수정으로 완성할 수 있습니다.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">👀 실시간 미리보기</h3>
                <p className="text-gray-600">
                  왼쪽에 타이핑하면 오른쪽에 즉시 결과가 나타납니다. 수정사항도 바로바로 반영되어 작업 효율이 극대화됩니다.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">📄 한국 작가를 위한 출력 형식</h3>
                <p className="text-gray-600 mb-4">한국 작가들이 가장 많이 사용하는 두 가지 포맷을 지원합니다.</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li><strong>Word (.docx):</strong> 범용적으로 사용 가능한 포맷</li>
                  <li><strong>한글 (.hwp):</strong> 한국 방송업계 표준 포맷</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  *(다운로드된 파일은 추가적인 포맷 조정이 필요할 수 있습니다. 한글 프로그램 버전에 따라 간혹 호환 문제가 발생할 수 있습니다)*
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 추천 대상 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">💡 이런 분들께 추천해요</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">✅ 신인 작가님</h3>
                <p className="text-blue-800">
                  비싼 대본 프로그램 구매 전, 무료로 시작해보세요. 공모전 제출용 대본의 기본 포맷도 만들 수 있어요.
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">✅ 시나리오 학과 학생</h3>
                <p className="text-green-800">
                  과제와 실습용 대본을 빠르게 작성하세요. 포맷 걱정 줄이고 창작에 더 집중할 수 있습니다.
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3">✅ 웹드라마 창작자</h3>
                <p className="text-purple-800">
                  유튜브, 웹드라마용 짧은 대본도 기본 포맷으로 만들어보세요.
                </p>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-3">✅ 현업 작가님</h3>
                <p className="text-yellow-800">
                  아이디어 스케치나 초고 작업 시 빠르게 기본 포맷을 잡아보세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 안전성 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🔒 안심하고 사용하세요</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">저장하지 않습니다</h3>
                <p className="text-gray-600 text-sm">
                  입력하신 모든 텍스트는 브라우저에서만 처리됩니다. 서버에 저장되지 않아 작품이 유출될 걱정이 없어요.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">로그인 불필요</h3>
                <p className="text-gray-600 text-sm">
                  회원가입이나 로그인 없이 바로 사용 가능합니다. 개인정보를 요구하지 않아요.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🆓</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">무료 도구</h3>
                <p className="text-gray-600 text-sm">
                  기본 대본 변환 도구를 100% 무료로 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 사용법 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🎯 간단 사용법</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">텍스트 입력</h3>
                <p className="text-gray-600 text-sm">왼쪽 창에 내용 작성</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">실시간 확인</h3>
                <p className="text-gray-600 text-sm">오른쪽에서 포맷 확인</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">다운로드</h3>
                <p className="text-gray-600 text-sm">원하는 형식으로 저장</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-lg font-medium text-gray-900">30초면 충분합니다!</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-blue-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">지금 바로 시작해보세요!</h2>
            <p className="mb-6">작가님의 창작을 응원합니다 ✍️</p>
            <Link href="/" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
              드라마 대본 마법사 사용하기
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}