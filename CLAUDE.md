# Vietnam MES 프로젝트

## 개요

베트남 제조 실행 시스템 (Manufacturing Execution System) - Electron 데스크톱 애플리케이션

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite 7 |
| 데스크톱 | Electron |
| 스타일링 | Tailwind CSS v4 |
| UI 컴포넌트 | Radix UI + MUI |
| 상태관리 | React Context API |
| 라우팅 | React Router (HashRouter) |
| 차트 | Recharts |

## 디렉토리 구조

```
src/
├── app/
│   ├── components/
│   │   ├── ui/           # 재사용 UI 컴포넌트 (Button, Dialog, Table 등)
│   │   └── figma/        # Figma 디자인 컴포넌트
│   ├── context/          # React Context (MaterialContext 등)
│   ├── layout/           # 레이아웃 (Header, Sidebar, MainLayout)
│   └── pages/            # 페이지 컴포넌트
│       ├── Dashboard.tsx
│       ├── MaterialReceiving.tsx
│       ├── MaterialStock.tsx
│       ├── ProcessView.tsx
│       └── ...
├── styles/               # CSS 파일
└── main.tsx              # 앱 진입점

electron/
├── main.ts               # Electron 메인 프로세스
└── preload.ts            # Preload 스크립트
```

## 컴포넌트 규칙

### UI 컴포넌트 사용

```tsx
// Radix UI 기반 컴포넌트 사용
import { Button } from "@/app/components/ui/button"
import { Dialog } from "@/app/components/ui/dialog"
```

### className 조합

```tsx
// cn() 유틸리티로 조건부 className 조합
import { cn } from "@/lib/utils"

<div className={cn("base-class", isActive && "active-class")} />
```

### 반응형 디자인

```tsx
// Tailwind lg: 브레이크포인트 (1024px) 기준
<div className="hidden lg:block">  // 데스크톱
<div className="block lg:hidden">  // 모바일
```

## Context 사용 패턴

### 기존 Context 사용

```tsx
import { useMaterial } from "@/app/context/MaterialContext"

function MyComponent() {
  const { materials, addMaterial, updateMaterial } = useMaterial()
  // ...
}
```

### 새 Context 추가 시

1. `src/app/context/[Name]Context.tsx` 파일 생성
2. `App.tsx`에서 Provider 등록

```tsx
// App.tsx
<MaterialProvider>
  <NewProvider>  {/* 새 Provider 추가 */}
    <RouterProvider router={router} />
  </NewProvider>
</MaterialProvider>
```

## 라우팅 규칙

### 라우터 설정

- **HashRouter** 사용 (Electron 호환성)
- 경로 패턴: `/도메인/액션`

### 주요 경로

| 경로 | 페이지 |
|------|--------|
| `/` | 대시보드 |
| `/material/receiving` | 자재 입고 |
| `/material/stock` | 재고 현황 |
| `/process/:processId` | 공정 모니터링 |
| `/inspection/:type` | 품질 검사 |
| `/report/:reportId` | 리포트 |
| `/master/:type` | 마스터 데이터 |

## 자재(Material) 데이터 구조

```typescript
interface Material {
  id: string
  code: string          // 자재 코드
  name: string          // 자재명
  spec: string          // 규격
  category: string      // 분류
  unit: string          // 단위
  stock: number         // 현재고
  safeStock: number     // 안전재고
  status: 'good' | 'warning' | 'danger' | 'exhausted'
}
```

## Import 별칭

```tsx
// @ = src 디렉토리
import { Component } from "@/app/components/ui/component"
import { useMaterial } from "@/app/context/MaterialContext"
```

## Excel 다운로드 기능

### 유틸리티 함수

```tsx
import { downloadExcel, downloadTemplate } from "@/lib/excelUtils"

// 데이터 내보내기
downloadExcel(data, '파일명', '시트명')

// 빈 템플릿 다운로드
downloadTemplate(['헤더1', '헤더2'], '파일명', '시트명')
```

### 지원 페이지

| 페이지 | 기능 | 파일명 |
|--------|------|--------|
| 자재 입고 | 입고 양식 템플릿 | `자재입고_양식.xlsx` |
| 재고 현황 | 재고 데이터 내보내기 | `재고현황_YYYYMMDD.xlsx` |
| 마스터 데이터 | 자재 등록 양식 | `자재등록_양식.xlsx` |
| 리포트 (생산) | 생산 현황 내보내기 | `생산현황_YYYYMMDD.xlsx` |
| 리포트 (투입) | 투입 이력 내보내기 | `투입이력_YYYYMMDD.xlsx` |

## 엔터프라이즈 규칙 참조

회사 전반 코딩 스탠더드는 `~/.claude/ENTERPRISE.md` 참조

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2025-12-20 | Excel 다운로드 기능 구현 (xlsx 라이브러리, 4개 페이지 5개 버튼) |
