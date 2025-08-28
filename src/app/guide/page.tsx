import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import HeroSection from '../../components/HeroSection';

export default function Guide() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <HeroSection 
          title="드라마 대본을"
          subtitle="쉽고 빠르게"
          descriptions={[
            "방송작가와 드라마 작가를 위한 무료 도구입니다.",
            "기본 텍스트를 80% 완성도의 드라마 대본 초안으로 변환합니다.",
            "포맷팅 시간을 줄이고 창작에 집중하세요."
          ]}
        />

        {/* 메인 가이드 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              📖 어떻게 작성하나요?
            </h2>
            <p className="text-xl text-gray-600 mb-12 text-center">
              3가지 간단한 규칙으로 전문 대본 완성<br />
              <span className="text-lg text-gray-500">Tab 키 없이, 복잡한 설정 없이, 딱 3가지 규칙만 기억하세요.</span>
            </p>

            {/* 규칙 1: 씬 헤더 */}
            <div className="mb-12">
              <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold text-lg">1</span>
                  <h3 className="text-2xl font-semibold text-gray-900">씬 헤더 (Scene Header)</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  새로운 장면이 시작될 때 <strong># 기호</strong>로 시작하세요. 씬 번호는 자동으로 매겨집니다.
                </p>

                {/* 올바른 작성법 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span>✅</span> 올바른 작성법
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700"># 밤, 거리</span>
                        <span className="text-green-600">→ S#1 밤, 거리.</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700"># 카페 내부 - 낮</span>
                        <span className="text-green-600">→ S#2 카페 내부 - 낮.</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700"># 유리의 집, 거실</span>
                        <span className="text-green-600">→ S#3 유리의 집, 거실.</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700"># INT. 병원 복도 - 새벽</span>
                        <span className="text-green-600">→ S#4 INT. 병원 복도 - 새벽.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 다양한 표현 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <span>💡</span> 다양한 표현 방식 모두 OK
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm text-blue-800">
                      <div># 낮, 학교 운동장 <span className="text-blue-600">(한국식 표기)</span></div>
                      <div># 학교 운동장 - 낮 <span className="text-blue-600">(순서 바꿔도 OK)</span></div>
                      <div># INT. 교실 - DAY <span className="text-blue-600">(영문 표기도 가능)</span></div>
                      <div># 과거, 유리의 방 <span className="text-blue-600">(회상 씬)</span></div>
                      <div># 몽타주 - 도시 전경 <span className="text-blue-600">(특수 씬)</span></div>
                    </div>
                  </div>
                </div>

                {/* 피해야 할 실수 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span>❌</span> 피해야 할 실수
                  </h4>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">밤, 거리</span>
                        <span className="text-red-600">→ # 기호가 없으면 지문으로 인식</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">S1 밤, 거리</span>
                        <span className="text-red-600">→ 씬 번호 직접 입력 금지 (자동 부여됨)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">1. 밤, 거리</span>
                        <span className="text-red-600">→ 다른 기호 사용 금지</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-yellow-50 p-4 rounded-lg" style={{border: '1px solid #e0e0e0'}}>
                  <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <span>🎯</span> Pro Tip: 씬 추가/삭제 자유자재
                  </h4>
                  <p className="text-yellow-700 mb-3">중간에 씬을 추가하거나 삭제해도 번호가 자동으로 재정렬됩니다!</p>
                  <div className="bg-white p-3 rounded font-mono text-sm">
                    <div># 카페</div>
                    <div className="text-yellow-600"># 거리 ← 새 씬 추가</div>
                    <div># 사무실 <span className="text-yellow-600">→ 자동으로 S#1, S#2, S#3로 정렬</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 규칙 2: 캐릭터 대사 */}
            <div className="mb-12">
              <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full font-bold text-lg">2</span>
                  <h3 className="text-2xl font-semibold text-gray-900">캐릭터 대사 (Character Dialogue)</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  캐릭터 이름 뒤에 <strong>콜론(:)</strong>을 붙이고 대사를 작성하세요.
                </p>

                {/* 기본 작성법 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span>✅</span> 기본 작성법
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm">
                      <div>정현: 유리야, 괜찮아?</div>
                      <div>유리: 응, 괜찮아. 걱정하지 마.</div>
                      <div>간호사: 환자분, 이쪽으로 오세요.</div>
                    </div>
                  </div>
                </div>

                {/* 특수 상황 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-purple-700 mb-3 flex items-center gap-2">
                    <span>📞</span> 특수 상황 표현
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-800">정현(E): 여보세요?</span>
                        <span className="text-purple-600">→ 목소리만 (Effect)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-800">유리(N): 그때 나는...</span>
                        <span className="text-purple-600">→ 나레이션 (Narration)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-800">민수(전화로): 지금 어디야?</span>
                        <span className="text-purple-600">→ 전화 통화</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-800">DJ(라디오): 오늘의 날씨는...</span>
                        <span className="text-purple-600">→ 라디오/TV 소리</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 자주 하는 실수 */}
                <div className="bg-red-50 p-4 rounded-lg" style={{border: '1px solid #e0e0e0'}}>
                  <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span>❌</span> 자주 하는 실수
                  </h4>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">정현 "유리야"</span>
                      <span className="text-red-600">→ 콜론(:) 필수!</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">정현이 말한다: 괜찮아</span>
                      <span className="text-red-600">→ 캐릭터 이름만 간단히</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">정현 - 괜찮아</span>
                      <span className="text-red-600">→ 대시(-) 사용 금지</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">: 안녕하세요</span>
                      <span className="text-red-600">→ 캐릭터 이름 누락</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">(정현) 괜찮아?</span>
                      <span className="text-red-600">→ 괄호만으로는 안 됨</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 규칙 3: 지문 */}
            <div className="mb-12">
              <div className="pl-6" style={{borderLeft: '1px solid #e0e0e0'}}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full font-bold text-lg">3</span>
                  <h3 className="text-2xl font-semibold text-gray-900">지문/액션 (Action/Direction)</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  씬 헤더(#)나 대사(:)가 아닌 모든 텍스트는 자동으로 지문 처리됩니다.
                </p>

                {/* 기본 작성법 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span>✅</span> 기본 작성법
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm text-green-800">
                      <div>급하게 밤거리를 걸어가는 정현.</div>
                      <div>유리에게 계속 전화를 거는데, 받지 않는다.</div>
                      <div>떨리는 손으로 휴대폰을 부여잡는다.</div>
                      <div>갑자기 문이 열리고 유리가 들어온다.</div>
                    </div>
                  </div>
                </div>

                {/* 카메라 연출 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <span>🎬</span> 카메라/연출 지시
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm text-blue-800">
                      <div>정현의 얼굴 클로즈업.</div>
                      <div>카메라, 천천히 줌아웃.</div>
                      <div>정현의 시점으로 본 유리의 뒷모습.</div>
                      <div>화면 분할 - 정현과 유리가 서로 다른 공간에서 같은 행동을 한다.</div>
                    </div>
                  </div>
                </div>

                {/* 시간 경과 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                    <span>⏰</span> 시간 경과 표현
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm text-orange-800">
                      <div>잠시 후.</div>
                      <div>30분 후.</div>
                      <div>다음 날 아침.</div>
                      <div>일주일이 지났다.</div>
                    </div>
                  </div>
                </div>

                {/* 음향 지시 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                    <span>🎵</span> 음향/음악 지시
                  </h4>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="space-y-2 font-mono text-sm text-indigo-800">
                      <div>멀리서 구급차 사이렌 소리가 들린다.</div>
                      <div>갑자기 음악이 멈춘다.</div>
                      <div>빗소리가 점점 커진다.</div>
                      <div>BGM: 슬픈 피아노 선율.</div>
                    </div>
                  </div>
                </div>

                {/* 불필요한 기호 */}
                <div className="bg-red-50 p-4 rounded-lg" style={{border: '1px solid #e0e0e0'}}>
                  <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span>❌</span> 불필요한 기호 사용 금지
                  </h4>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">- 급하게 걸어간다</span>
                      <span className="text-red-600">→ 대시(-) 불필요</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">* 정현이 들어온다</span>
                      <span className="text-red-600">→ 별표(*) 불필요</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">(정현이 걸어간다)</span>
                      <span className="text-red-600">→ 전체 괄호는 어색함</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-700">[지문: 걸어간다]</span>
                      <span className="text-red-600">→ 대괄호 사용 금지</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 마지막 체크리스트 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              🎯 마지막 체크리스트
            </h2>
            <p className="text-lg text-gray-600 mb-8 text-center">
              작성을 마쳤다면 다음을 확인하세요:
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-green-50 p-6 rounded-lg" style={{border: '1px solid #e0e0e0'}}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-medium text-green-800">모든 씬이 #으로 시작하는가?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-medium text-green-800">모든 대사에 : 기호가 있는가?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-medium text-green-800">불필요한 기호나 괄호는 없는가?</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-medium text-green-800">씬 번호를 직접 입력하지 않았는가?</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg flex items-center justify-center" style={{border: '1px solid #e0e0e0'}}>
                <div className="text-center">
                  <div className="text-4xl mb-4">📺</div>
                  <p className="text-lg font-semibold text-blue-900 mb-2">
                    모두 확인했다면, 이제 다운로드 버튼을 누르세요!
                  </p>
                  <p className="text-blue-700">
                    완벽한 드라마 대본이 준비됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-blue-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">지금 바로 시작해보세요!</h2>
            <p className="mb-6">3가지 규칙만 기억하면 끝! 🚀</p>
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