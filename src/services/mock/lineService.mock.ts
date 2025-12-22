/**
 * Line Service (Mock)
 *
 * 브라우저 개발용 Mock 데이터
 */

export interface Line {
  id: number
  code: string
  name: string
  processCode: string
  isActive: boolean
}

// Mock 라인 데이터 (공정별 기본 라인)
const MOCK_LINES: Line[] = [
  // CA - 자동절단압착 라인
  { id: 1, code: 'CA-01', name: 'CA 1호기', processCode: 'CA', isActive: true },
  { id: 2, code: 'CA-02', name: 'CA 2호기', processCode: 'CA', isActive: true },
  { id: 3, code: 'CA-03', name: 'CA 3호기', processCode: 'CA', isActive: true },
  // MC - 수동압착 라인
  { id: 4, code: 'MC-01', name: 'MC 1호기', processCode: 'MC', isActive: true },
  { id: 5, code: 'MC-02', name: 'MC 2호기', processCode: 'MC', isActive: true },
  // MS - 중간스트립 라인
  { id: 6, code: 'MS-01', name: 'MS 1호기', processCode: 'MS', isActive: true },
  // SB - 서브조립 라인
  { id: 7, code: 'SB-01', name: 'SB 1호기', processCode: 'SB', isActive: true },
  { id: 8, code: 'SB-02', name: 'SB 2호기', processCode: 'SB', isActive: true },
  // PA - 제품조립 라인
  { id: 9, code: 'PA-01', name: 'PA 1호기', processCode: 'PA', isActive: true },
  { id: 10, code: 'PA-02', name: 'PA 2호기', processCode: 'PA', isActive: true },
  { id: 11, code: 'PA-03', name: 'PA 3호기', processCode: 'PA', isActive: true },
  // CI - 회로검사 라인
  { id: 12, code: 'CI-01', name: 'CI 1호기', processCode: 'CI', isActive: true },
  { id: 13, code: 'CI-02', name: 'CI 2호기', processCode: 'CI', isActive: true },
  // VI - 육안검사 라인
  { id: 14, code: 'VI-01', name: 'VI 1호기', processCode: 'VI', isActive: true },
  { id: 15, code: 'VI-02', name: 'VI 2호기', processCode: 'VI', isActive: true },
  // HS - 열수축 라인
  { id: 16, code: 'HS-01', name: 'HS 1호기', processCode: 'HS', isActive: true },
  // CQ - 압착검사 라인
  { id: 17, code: 'CQ-01', name: 'CQ 1호기', processCode: 'CQ', isActive: true },
  // SP - 제품조립제공부품 라인
  { id: 18, code: 'SP-01', name: 'SP 1호기', processCode: 'SP', isActive: true },
]

/**
 * 전체 라인 목록 조회
 */
export async function getLines(): Promise<Line[]> {
  await new Promise((r) => setTimeout(r, 100))
  return MOCK_LINES
}

/**
 * 공정별 라인 목록 조회
 */
export async function getLinesByProcess(processCode: string): Promise<Line[]> {
  await new Promise((r) => setTimeout(r, 100))
  return MOCK_LINES.filter((l) => l.processCode === processCode.toUpperCase())
}

/**
 * 라인 생성
 */
export async function createLine(data: {
  code: string
  name: string
  processCode: string
}): Promise<Line> {
  await new Promise((r) => setTimeout(r, 200))
  const newLine: Line = {
    id: MOCK_LINES.length + 1,
    ...data,
    isActive: true,
  }
  MOCK_LINES.push(newLine)
  return newLine
}

/**
 * 라인 수정
 */
export async function updateLine(lineId: number, data: Partial<Line>): Promise<Line> {
  await new Promise((r) => setTimeout(r, 150))
  const line = MOCK_LINES.find((l) => l.id === lineId)
  if (!line) throw new Error('Line not found')

  Object.assign(line, data)
  return line
}

/**
 * 라인 활성화/비활성화
 */
export async function setLineActive(lineId: number, isActive: boolean): Promise<void> {
  await new Promise((r) => setTimeout(r, 150))
  const line = MOCK_LINES.find((l) => l.id === lineId)
  if (line) {
    line.isActive = isActive
  }
}

/**
 * 라인 삭제
 */
export async function deleteLine(lineId: number): Promise<void> {
  await new Promise((r) => setTimeout(r, 150))
  const index = MOCK_LINES.findIndex((l) => l.id === lineId)
  if (index !== -1) {
    MOCK_LINES.splice(index, 1)
  }
}

/**
 * 라인 데이터 초기화 (모든 라인 삭제)
 */
export function resetLineData(): number {
  const count = MOCK_LINES.length
  MOCK_LINES.length = 0
  return count
}
