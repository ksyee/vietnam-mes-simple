import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Database, Printer, Settings, User, LogOut, ScanBarcode, Languages } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'KO' | 'VI'>('KO');

  // Breadcrumb logic
  const getBreadcrumb = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0 || parts[0] === 'dashboard') return '대시보드';
    
    if (parts[0] === 'material') {
      if (parts[1] === 'receiving') return '자재 관리 > 자재 입고';
      if (parts[1] === 'stock') return '자재 관리 > 재고 현황';
      return '자재 관리';
    }

    if (parts[0] === 'process') {
      const processName = parts[1]?.toUpperCase() || '';
      const processLabels: Record<string, string> = {
        CA: 'CA - 자동절단압착',
        MC: 'MC - 수동압착',
        MS: 'MS - 중간스트립',
        SB: 'SB - Sub',
        PA: 'PA - 제품조립',
        HS: 'HS - 열수축',
      };
      return `생산 공정 > ${processLabels[processName] || processName}`;
    }

    if (parts[0] === 'inspection') {
      const inspectMap: Record<string, string> = {
        crimp: '압착 검사',
        circuit: '회로 검사',
        visual: '육안 검사'
      };
      return `품질 검사 > ${inspectMap[parts[1]] || parts[1]}`;
    }

    if (parts[0] === 'report') {
      const reportMap: Record<string, string> = {
        production: '생산 현황',
        trace: 'LOT 추적',
        'input-history': '투입 이력'
      };
      return `조회 및 리포트 > ${reportMap[parts[1]] || parts[1]}`;
    }

    if (parts[0] === 'master') {
      const masterMap: Record<string, string> = {
        product: '완제품 관리',
        material: '자재 관리',
        bom: 'BOM 관리',
        user: '사용자 관리'
      };
      return `기준 정보 > ${masterMap[parts[1]] || parts[1]}`;
    }

    if (parts[0] === 'settings') return '시스템 설정';

    return 'Barcord System';
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'KO' ? 'VI' : 'KO');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-800 truncate max-w-[200px] md:max-w-none">{getBreadcrumb()}</h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Language Toggle */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage} 
          className="flex items-center gap-2 font-bold text-slate-600 border-slate-300 px-2 lg:px-3"
        >
          <Languages size={16} />
          <span className="hidden sm:inline">{language}</span>
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* System Status Indicators - Responsive */}
        <div className="flex items-center gap-1.5 lg:gap-3">
          {/* Scanner Status */}
          <div 
            className="flex items-center gap-2 p-1.5 lg:px-3 lg:py-1 bg-green-50 text-green-700 rounded-md lg:rounded-full text-xs font-medium border border-green-200"
            title="스캐너 연결됨"
          >
            <ScanBarcode className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            <span className="hidden lg:inline">스캐너 연결됨</span>
          </div>
          
          {/* Printer Status */}
          <div 
            className="flex items-center gap-2 p-1.5 lg:px-3 lg:py-1 bg-blue-50 text-blue-700 rounded-md lg:rounded-full text-xs font-medium border border-blue-200"
            title="프린터 준비"
          >
            <Printer className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            <span className="hidden lg:inline">프린터 준비</span>
          </div>

          {/* DB Status */}
          <div 
            className="flex items-center gap-2 p-1.5 lg:px-3 lg:py-1 bg-green-50 text-green-700 rounded-md lg:rounded-full text-xs font-medium border border-green-200"
            title="DB 연결됨"
          >
            <Database className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            <span className="hidden lg:inline">DB 연결됨</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

        <Button variant="ghost" size="icon" className="text-slate-500 relative hidden sm:flex">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <Button variant="ghost" size="icon" className="text-slate-500 hidden sm:flex" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-4 text-slate-700 hover:bg-slate-50">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <User size={16} />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium leading-none">관리자</p>
                <p className="text-xs text-slate-500 mt-0.5">Admin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>프로필 설정</DropdownMenuItem>
            <DropdownMenuItem>비밀번호 변경</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut size={16} className="mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
