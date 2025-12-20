# 로컬 개발 설정

팀원 공유용 로컬 개발 환경 가이드

## 빠른 시작

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build
```

## 패키지 매니저

**pnpm** 사용 (npm/yarn 아님)

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm
```

## 시스템 요구사항

- Node.js 18+
- pnpm 8+

## 개발 환경 설정

### IDE 권장 설정

- **VS Code** 권장
- 확장 프로그램:
  - ESLint
  - Tailwind CSS IntelliSense
  - TypeScript + JavaScript

### 브라우저 확장

- React Developer Tools

## 디버깅 팁

### Electron DevTools

```
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (macOS)
```

### Vite HMR (Hot Module Replacement)

- 자동 활성화됨
- 컴포넌트 수정 시 즉시 반영

### React DevTools

- Components 탭에서 컴포넌트 트리 확인
- Context 값 실시간 확인 가능

## 주의사항

### Electron 메인 프로세스

`electron/main.ts` 수정 시 **서버 재시작 필요**

```bash
# 서버 중지 후 재시작
Ctrl+C
pnpm dev
```

### Tailwind CSS v4

- `postcss.config.js` 불필요
- `@tailwindcss/vite` 플러그인으로 처리

### 경로 별칭

`@/` = `src/` 디렉토리

```tsx
// 올바른 import
import { Button } from "@/app/components/ui/button"

// 잘못된 import
import { Button } from "../../components/ui/button"
```

## 트러블슈팅

### pnpm install 오류

```bash
# 캐시 클리어 후 재설치
pnpm store prune
rm -rf node_modules
pnpm install
```

### Electron 창이 안 뜨는 경우

```bash
# dist-electron 폴더 삭제 후 재빌드
rm -rf dist-electron
pnpm dev
```

### TypeScript 타입 오류

```bash
# VS Code에서 TypeScript 서버 재시작
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## 환경 변수

프로젝트에서 환경 변수 사용 시:

1. `.env` 파일 생성 (Git 제외됨)
2. `VITE_` 접두사 필수

```env
VITE_API_URL=http://localhost:3000
```

## 참고 문서

- [Vite 공식 문서](https://vitejs.dev/)
- [Electron 공식 문서](https://www.electronjs.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
