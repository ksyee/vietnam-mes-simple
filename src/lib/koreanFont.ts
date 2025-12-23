/**
 * Korean Font Utility for jsPDF
 *
 * jsPDF에서 한글 폰트를 사용하기 위한 유틸리티
 * Noto Sans KR 폰트를 Base64로 로드하여 사용
 */
import { jsPDF } from 'jspdf'

// 폰트 캐시
let fontLoaded = false
let fontData: string | null = null

// Noto Sans KR Regular 폰트 URL (Google Fonts)
// TTF 형식이 필요하므로 CDN에서 직접 가져옴
const FONT_URL = 'https://cdn.jsdelivr.net/gh/nicapos/korean-fonts@1.0/NanumGothic.ttf'

/**
 * 한글 폰트 로드 (CDN에서 fetch)
 */
export async function loadKoreanFont(): Promise<string | null> {
  if (fontLoaded && fontData) {
    return fontData
  }

  try {
    const response = await fetch(FONT_URL)
    if (!response.ok) {
      console.warn('한글 폰트 로드 실패, 기본 폰트 사용')
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    fontData = arrayBufferToBase64(arrayBuffer)
    fontLoaded = true
    return fontData
  } catch (error) {
    console.warn('한글 폰트 로드 오류:', error)
    return null
  }
}

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * jsPDF에 한글 폰트 등록
 */
export async function registerKoreanFont(pdf: jsPDF): Promise<boolean> {
  try {
    const font = await loadKoreanFont()
    if (!font) {
      return false
    }

    // VFS에 폰트 파일 추가
    pdf.addFileToVFS('NanumGothic.ttf', font)

    // 폰트 등록
    pdf.addFont('NanumGothic.ttf', 'NanumGothic', 'normal')

    // 기본 폰트로 설정
    pdf.setFont('NanumGothic')

    return true
  } catch (error) {
    console.warn('한글 폰트 등록 실패:', error)
    return false
  }
}

/**
 * 한글 폰트 설정 (이미 등록된 경우)
 */
export function setKoreanFont(pdf: jsPDF): void {
  try {
    pdf.setFont('NanumGothic')
  } catch {
    // 폰트가 없으면 기본 폰트 사용
    pdf.setFont('helvetica')
  }
}
