# Windows 환경 설정 가이드

## 개요

이 문서는 Vietnam MES 프로젝트를 Windows 환경에서 실행하기 위한 설정 과정을 기록합니다.

**작성일**: 2025-12-21
**환경**: Windows + WSL2

---

## 1. PostgreSQL 17 설치

### 1.1 winget을 통한 설치

```powershell
# PowerShell에서 실행
winget install PostgreSQL.PostgreSQL.17 --accept-source-agreements --accept-package-agreements
```

### 1.2 설치 확인

```powershell
# 서비스 상태 확인
Get-Service postgresql*

# 결과: postgresql-x64-17 Running Automatic
```

### 1.3 데이터베이스 및 사용자 생성

`setup_postgres.ps1` 스크립트를 관리자 권한으로 실행:

```powershell
# 관리자 PowerShell에서 실행
Set-ExecutionPolicy Bypass -Scope Process
.\setup_postgres.ps1
```

**스크립트 내용**:
- pg_hba.conf를 임시로 `trust` 인증으로 변경
- `vietnam_mes` 데이터베이스 생성
- `postgres` 사용자 비밀번호를 `postgres`로 설정
- 원래 인증 방식으로 복원

### 1.4 WSL 연결 허용

WSL에서 Windows PostgreSQL에 접속하려면 pg_hba.conf에 WSL 네트워크 규칙 추가 필요:

```powershell
# add_wsl_access.ps1 스크립트 실행 (관리자 권한)
```

**추가된 규칙**:
```
# WSL2 connections
host    all    all    172.16.0.0/12    scram-sha-256
```

---

## 2. 환경 변수 설정

### 2.1 .env 파일 생성

```bash
# /mnt/c/Project/vietnam-mes-simple/.env

# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@172.30.192.1:5432/vietnam_mes?schema=public"

# Node Environment
NODE_ENV="development"
```

### 2.2 WSL에서 Windows IP 확인 방법

```bash
# Windows 호스트 IP 확인
ip route | grep default | awk '{print $3}'
# 결과 예: 172.30.192.1
```

**주의**: WSL2의 Windows 호스트 IP는 재부팅 시 변경될 수 있습니다.

---

## 3. 의존성 설치

### 3.1 WSL에서 npm 패키지 설치

```bash
cd /mnt/c/Project/vietnam-mes-simple
npm install
```

### 3.2 Windows에서 npm 패키지 설치

```powershell
cd C:\Project\vietnam-mes-simple
npm install
```

**참고**: WSL과 Windows에서 각각 설치해야 합니다 (바이너리 호환성 문제).

---

## 4. Prisma 설정

### 4.1 Prisma 클라이언트 생성

```bash
npx prisma generate
```

### 4.2 마이그레이션 적용

```bash
npx prisma migrate deploy
```

**적용된 마이그레이션**:
1. `20251220090248_init` - 초기 스키마
2. `20251221055338_add_mbom_models` - MBOM 모델 추가
3. `20251221083624_add_bundle_type` - 번들 타입 추가

### 4.3 데이터베이스 확인

```bash
npx prisma studio
```

---

## 5. 앱 실행

### 5.1 배치 파일 사용 (권장)

`start-app.bat` 파일을 더블클릭하여 실행:

```batch
@echo off
echo Starting Vietnam MES...
cd /d "C:\Project\vietnam-mes-simple"
call npm run dev
pause
```

### 5.2 명령 프롬프트에서 직접 실행

```powershell
cd C:\Project\vietnam-mes-simple
npm run dev
```

### 5.3 실행 결과

- Vite 개발 서버: http://localhost:5173/
- Electron 앱 창 자동 실행 (1200x800)

---

## 6. 생성된 설정 파일

| 파일 | 용도 |
|------|------|
| `.env` | 데이터베이스 연결 정보 |
| `setup_postgres.ps1` | PostgreSQL 초기 설정 스크립트 |
| `add_wsl_access.ps1` | WSL 네트워크 접근 허용 스크립트 |
| `start-app.bat` | 앱 실행 배치 파일 |

---

## 7. 문제 해결

### 7.1 PostgreSQL 연결 실패

**증상**: `P1001: Can't reach database server at localhost:5432`

**원인**: WSL에서 `localhost`는 Windows가 아닌 WSL 자체를 가리킴

**해결**:
1. Windows 호스트 IP 확인: `ip route | grep default | awk '{print $3}'`
2. `.env` 파일의 `DATABASE_URL`에서 `localhost`를 해당 IP로 변경

### 7.2 PostgreSQL 비밀번호 분실

**해결**:
1. `setup_postgres.ps1` 스크립트를 관리자 권한으로 다시 실행
2. 비밀번호가 `postgres`로 재설정됨

### 7.3 Electron 실행 안됨 (WSL)

**증상**: `libnspr4.so: cannot open shared object file`

**원인**: WSL에서는 Linux용 Electron 바이너리가 실행되며, GUI 라이브러리가 없음

**해결**: Windows PowerShell 또는 cmd.exe에서 `npm run dev` 실행

### 7.4 WSL IP 변경 시

WSL 재시작 후 IP가 변경되면:

```bash
# 새 IP 확인
ip route | grep default | awk '{print $3}'

# .env 파일 업데이트
nano .env
# DATABASE_URL의 IP 주소 변경
```

---

## 8. 데이터베이스 정보

| 항목 | 값 |
|------|-----|
| 호스트 | Windows IP (예: 172.30.192.1) |
| 포트 | 5432 |
| 데이터베이스 | vietnam_mes |
| 사용자 | postgres |
| 비밀번호 | postgres |
| 스키마 | public |

---

## 9. Python 프로젝트와의 비교

### 9.1 기술 스택 비교

| 항목 | Python (Barcord) | Electron (Vietnam MES) |
|------|------------------|------------------------|
| 언어 | Python 3.11+ | TypeScript + React 18 |
| UI | PyQt6 | Electron + Radix UI |
| DB | SQLite (로컬) | PostgreSQL (서버) |
| ORM | SQLAlchemy | Prisma 6 |
| 빌드 | PyInstaller | Vite + electron-builder |

### 9.2 기능 비교

| 기능 | Python | Electron |
|------|:------:|:--------:|
| 바코드 V1/V2 | ✅ | ✅ |
| 번들 바코드 | ✅ | ✅ |
| CI 바코드 | ✅ | ✅ |
| LOT 추적 | ✅ | ✅ |
| 2단계 워크플로우 | ✅ | ✅ |
| MBOM 시스템 | ❌ | ✅ |
| 공정 라우팅 | ❌ | ✅ |
| 다국어 (ko/vi) | ✅ | ✅ |

### 9.3 주요 차이점

1. **MBOM 시스템**: Electron 버전에 7단계 MBOM 구현 추가
2. **공정 라우팅**: 제품별 공정 순서 관리 기능
3. **데이터베이스**: 단일 PC(SQLite) → 멀티 유저(PostgreSQL)
4. **UI**: 40+ Radix UI 컴포넌트로 더 현대적인 인터페이스

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2025-12-21 | Windows 환경 설정 가이드 작성 |
| 2025-12-21 | PostgreSQL 17 설치 및 설정 |
| 2025-12-21 | WSL-Windows 연동 설정 |
| 2025-12-21 | Prisma 마이그레이션 적용 (3개) |
