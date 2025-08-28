'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const scrollToSection = (sectionId: string) => {
    if (pathname !== '/') {
      // 홈페이지가 아니면 홈으로 이동 후 스크롤
      window.location.href = `/#${sectionId}`;
      return;
    }
    
    // 홈페이지에서는 바로 스크롤
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-white shadow-sm" style={{borderBottom: '1px solid #e0e0e0'}}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-2xl font-bold text-blue-600 flex-shrink-0">
            드라마 대본 마법사
          </Link>
          <div className="hidden sm:flex items-center gap-4 lg:gap-6">
            <Link 
              href="/about"
              className={`transition-colors text-sm lg:text-base ${
                pathname === '/about' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              서비스 소개
            </Link>
            <Link 
              href="/"
              className={`transition-colors text-sm lg:text-base ${
                pathname === '/' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              드라마 대본 마법사
            </Link>
            <Link 
              href="/guide"
              className={`transition-colors text-sm lg:text-base ${
                pathname === '/guide' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              사용 가이드
            </Link>
          </div>
          
          {/* 모바일 메뉴 */}
          <div className="sm:hidden flex items-center gap-2 text-xs">
            <Link 
              href="/about"
              className={`transition-colors ${
                pathname === '/about' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600'
              }`}
            >
              소개
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="/"
              className={`transition-colors ${
                pathname === '/' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600'
              }`}
            >
              홈
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="/guide"
              className={`transition-colors ${
                pathname === '/guide' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600'
              }`}
            >
              가이드
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}