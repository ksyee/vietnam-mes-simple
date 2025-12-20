import * as XLSX from 'xlsx';

/**
 * 날짜를 YYYYMMDD 형식으로 반환
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 데이터를 Excel 파일로 다운로드
 * @param data - 내보낼 데이터 배열
 * @param fileName - 파일명 (확장자 제외)
 * @param sheetName - 시트 이름 (기본값: 'Sheet1')
 */
export function downloadExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'Sheet1'
): void {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 데이터를 워크시트로 변환
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 컬럼 너비 자동 조정
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length * 2, 10)
  }));
  worksheet['!cols'] = colWidths;

  // 워크북에 워크시트 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일 다운로드
  const fullFileName = `${fileName}_${getDateString()}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
}

/**
 * 빈 템플릿(헤더만 있는) Excel 파일 다운로드
 * @param headers - 헤더 배열 (한글 컬럼명)
 * @param fileName - 파일명 (확장자 제외)
 * @param sheetName - 시트 이름 (기본값: 'Sheet1')
 */
export function downloadTemplate(
  headers: string[],
  fileName: string,
  sheetName: string = 'Sheet1'
): void {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 헤더만 있는 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);

  // 컬럼 너비 설정
  worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 2, 12) }));

  // 워크북에 워크시트 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일 다운로드
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * 다중 시트 Excel 파일 다운로드
 * @param sheets - { sheetName: data[] } 형태의 객체
 * @param fileName - 파일명 (확장자 제외)
 */
export function downloadMultiSheetExcel(
  sheets: Record<string, Record<string, unknown>[]>,
  fileName: string
): void {
  const workbook = XLSX.utils.book_new();

  Object.entries(sheets).forEach(([sheetName, data]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 컬럼 너비 자동 조정
    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length * 2, 10)
      }));
      worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const fullFileName = `${fileName}_${getDateString()}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
}
