/**
 * Phase D: MaterialReceiving → 공정 자재 스캔 페이지 테스트
 *
 * 목표: 페이지 기능 변경 및 공정 기반 스캔 검증
 * - 공정 선택 필수 (스캔 전 공정 선택)
 * - 스캔 시 공정 재고로 등록 (registerProcessStock)
 * - 소진 LOT 재스캔 방지 (checkProcessStockStatus)
 * - 남은 수량 있는 LOT 재스캔 허용
 * - 공정별 금일 스캔 내역 표시
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('Phase D: 공정 자재 스캔 페이지', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('1. 공정 선택 필수', () => {
    it('공정 미선택 시 registerProcessStock 호출 불가', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 공정 없이 등록 시도 - processCode가 빈 문자열이면 오류
      const result = await module.registerProcessStock({
        processCode: '', // 빈 문자열
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('공정')
    })

    it('공정 선택 시 정상 등록되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.processCode).toBe('CA')
    })
  })

  describe('2. 스캔 워크플로우', () => {
    it('새 바코드 스캔 → 공정 재고로 등록', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const lotNumber = 'P682028Q20000S250922V1'

      // 상태 확인
      const status = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(status.canRegister).toBe(true)

      // 등록
      const result = await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: '250-1235',
        materialName: '전선 자재',
        lotNumber,
        quantity: 20000,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.processCode).toBe('CA')
      expect(result.stock?.quantity).toBe(20000)
    })

    it('소진된 LOT 스캔 시 오류 반환', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const lotNumber = 'LOT-EXHAUSTED-001'

      // 등록 후 전량 소진
      await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber,
        quantity: 100,
      })
      await module.consumeProcessStock(processCode, 1, 100)

      // 상태 확인
      const status = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(status.isExhausted).toBe(true)
      expect(status.canRegister).toBe(false)

      // 재등록 시도
      const result = await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber,
        quantity: 50,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('이미 사용이 완료된 바코드')
    })

    it('남은 수량 있는 LOT 재스캔 시 추가 등록', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const lotNumber = 'LOT-PARTIAL-001'

      // 첫 등록
      await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber,
        quantity: 100,
      })

      // 50개 사용 (50개 남음)
      await module.consumeProcessStock(processCode, 1, 50)

      // 상태 확인
      const status = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(status.availableQty).toBe(50)
      expect(status.canRegister).toBe(true)

      // 재스캔 (추가 등록)
      const result = await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber,
        quantity: 30,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.quantity).toBe(130) // 100 + 30
      expect(result.stock?.availableQty).toBe(80) // 130 - 50
    })
  })

  describe('3. 공정별 금일 스캔 내역', () => {
    it('getTodayProcessReceivings로 공정별 금일 스캔 조회', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-CA-001',
        quantity: 100,
      })

      // MC 공정에 등록
      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 2,
        materialCode: 'M002',
        materialName: '자재2',
        lotNumber: 'LOT-MC-001',
        quantity: 200,
      })

      // 전체 조회
      const allReceivings = await module.getTodayProcessReceivings()
      expect(allReceivings.length).toBe(2)

      // CA 공정만 조회
      const caReceivings = await module.getTodayProcessReceivings('CA')
      expect(caReceivings.length).toBe(1)
      expect(caReceivings[0].processCode).toBe('CA')
    })
  })

  describe('4. 다중 공정 독립성', () => {
    it('같은 LOT가 다른 공정에서 독립적으로 관리되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const lotNumber = 'SHARED-LOT-001'

      // CA 공정에 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '공유 자재',
        lotNumber,
        quantity: 100,
      })

      // MC 공정에 같은 LOT 등록 (독립)
      const mcResult = await module.registerProcessStock({
        processCode: 'MC',
        materialId: 1,
        materialCode: 'M001',
        materialName: '공유 자재',
        lotNumber,
        quantity: 50,
      })

      expect(mcResult.success).toBe(true)

      // CA 전량 소진
      await module.consumeProcessStock('CA', 1, 100)

      // CA 상태: 소진
      const caStatus = await module.checkProcessStockStatus('CA', lotNumber)
      expect(caStatus.isExhausted).toBe(true)

      // MC 상태: 가용
      const mcStatus = await module.checkProcessStockStatus('MC', lotNumber)
      expect(mcStatus.isExhausted).toBe(false)
      expect(mcStatus.availableQty).toBe(50)
    })
  })

  describe('5. 스캔 통계', () => {
    it('getProcessScanStats로 공정별 스캔 통계 조회', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 여러 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 2,
        materialCode: 'M002',
        materialName: '자재2',
        lotNumber: 'LOT-002',
        quantity: 200,
      })

      // 50개 사용
      await module.consumeProcessStock('CA', 1, 50)

      const stats = await module.getProcessStockSummary('CA')

      expect(stats.totalLots).toBe(2)
      expect(stats.totalQuantity).toBe(300) // 100 + 200
      expect(stats.totalUsed).toBe(50)
      expect(stats.totalAvailable).toBe(250) // 300 - 50
      expect(stats.materialCount).toBe(2)
    })
  })

  describe('6. 에러 케이스', () => {
    it('빈 lotNumber로 등록 시 오류', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber: '', // 빈 LOT
        quantity: 100,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('LOT')
    })

    it('음수 수량으로 등록 시 오류', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber: 'LOT-001',
        quantity: -100, // 음수
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('수량')
    })
  })
})
