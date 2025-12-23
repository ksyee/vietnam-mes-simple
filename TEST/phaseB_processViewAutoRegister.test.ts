/**
 * Phase B: ProcessView 자재 자동 등록 테스트
 *
 * 목표: 바코드 스캔 시 공정 재고 자동 등록 및 남은 수량 체크
 * - 스캔 시 registerProcessStock() 호출하여 공정 재고 등록
 * - checkProcessStockStatus()로 LOT 상태 확인
 * - 소진된 LOT (availableQty = 0, usedQty > 0) 스캔 시 경고
 * - 남은 수량 있는 LOT 재스캔 시 추가 등록
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

describe('Phase B: ProcessView 자재 자동 등록', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('1. 바코드 스캔 시 공정 재고 자동 등록', () => {
    it('새 바코드 스캔 시 공정 재고가 자동 등록되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 새 LOT 스캔 - 자동 등록
      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'P682028Q20000S250922V1',
        quantity: 20000,
      })

      expect(result.success).toBe(true)
      expect(result.isNewEntry).toBe(true)
      expect(result.stock?.processCode).toBe('CA')
      expect(result.stock?.quantity).toBe(20000)
      expect(result.stock?.availableQty).toBe(20000)
    })

    it('MES 바코드 스캔 시 공정 재고가 등록되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // MES V2 바코드 형식
      const result = await module.registerProcessStock({
        processCode: 'MC',
        materialId: 2,
        materialCode: 'M002',
        materialName: '반제품',
        lotNumber: 'CAP001Q100-C241223-001',
        quantity: 100,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.processCode).toBe('MC')
    })
  })

  describe('2. checkProcessStockStatus - 스캔 전 상태 확인', () => {
    it('새 LOT 스캔 시 canRegister가 true여야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const status = await module.checkProcessStockStatus('CA', 'NEW-LOT-001')

      expect(status.exists).toBe(false)
      expect(status.canRegister).toBe(true)
      expect(status.isExhausted).toBe(false)
    })

    it('남은 수량 있는 LOT 스캔 시 canRegister가 true여야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 50개 사용
      await module.consumeProcessStock('CA', 1, 50)

      // 상태 확인 (50개 남음)
      const status = await module.checkProcessStockStatus('CA', 'LOT-001')

      expect(status.exists).toBe(true)
      expect(status.availableQty).toBe(50)
      expect(status.isExhausted).toBe(false)
      expect(status.canRegister).toBe(true)
    })

    it('소진된 LOT 스캔 시 canRegister가 false여야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 전량 사용
      await module.consumeProcessStock('CA', 1, 100)

      // 상태 확인 (0개 남음)
      const status = await module.checkProcessStockStatus('CA', 'LOT-001')

      expect(status.exists).toBe(true)
      expect(status.availableQty).toBe(0)
      expect(status.usedQty).toBe(100)
      expect(status.isExhausted).toBe(true)
      expect(status.canRegister).toBe(false)
    })
  })

  describe('3. 소진된 LOT 재등록 시 오류', () => {
    it('소진된 LOT에 재등록 시도하면 실패해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 첫 번째 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 전량 사용
      await module.consumeProcessStock('CA', 1, 100)

      // 소진된 LOT에 재등록 시도
      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 50,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('이미 사용이 완료된 바코드')
    })
  })

  describe('4. 남은 수량 있는 LOT 재등록', () => {
    it('남은 수량 있는 LOT는 추가 등록 가능해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 첫 번째 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 50개 사용 (50개 남음)
      await module.consumeProcessStock('CA', 1, 50)

      // 남은 LOT에 추가 등록 (같은 바코드를 다시 스캔)
      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 30, // 추가 30개
      })

      expect(result.success).toBe(true)
      expect(result.isNewEntry).toBe(false) // 기존 항목에 추가
      expect(result.stock?.quantity).toBe(130) // 100 + 30
      expect(result.stock?.availableQty).toBe(80) // 130 - 50
    })
  })

  describe('5. 스캔 워크플로우 시뮬레이션', () => {
    it('시나리오: 새 바코드 스캔 → 등록 성공', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const lotNumber = 'P682028Q20000S250922V1'

      // Step 1: 상태 확인
      const status = await module.checkProcessStockStatus(processCode, lotNumber)

      // Step 2: 등록 가능하면 등록
      expect(status.canRegister).toBe(true)

      const result = await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: '250-1235',
        materialName: '전선 자재',
        lotNumber,
        quantity: 20000,
      })

      expect(result.success).toBe(true)
    })

    it('시나리오: 소진된 바코드 스캔 → 경고 메시지', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const lotNumber = 'LOT-EXHAUSTED'

      // 준비: 자재 등록 후 전량 소진
      await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber,
        quantity: 100,
      })
      await module.consumeProcessStock(processCode, 1, 100)

      // Step 1: 상태 확인
      const status = await module.checkProcessStockStatus(processCode, lotNumber)

      // Step 2: 소진됨 확인
      expect(status.isExhausted).toBe(true)
      expect(status.canRegister).toBe(false)

      // 경고 메시지 구성 가능
      const warningMessage = `이미 사용이 완료된 바코드입니다. (LOT: ${lotNumber})`
      expect(warningMessage).toContain('이미 사용이 완료')
    })

    it('시나리오: 남은 수량 있는 바코드 재스캔 → 추가 등록', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const lotNumber = 'LOT-PARTIAL'

      // 준비: 자재 등록 후 일부 소진
      await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber,
        quantity: 100,
      })
      await module.consumeProcessStock(processCode, 1, 70) // 30개 남음

      // Step 1: 상태 확인
      const status = await module.checkProcessStockStatus(processCode, lotNumber)

      // Step 2: 남은 수량 있음 확인
      expect(status.exists).toBe(true)
      expect(status.availableQty).toBe(30)
      expect(status.canRegister).toBe(true)

      // Step 3: 추가 등록 가능
      const result = await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber,
        quantity: 50, // 남은 소포장에서 추가 스캔
      })

      expect(result.success).toBe(true)
      expect(result.stock?.availableQty).toBe(80) // 30 + 50
    })
  })

  describe('6. 다중 공정 시나리오', () => {
    it('같은 LOT가 다른 공정에서 독립적으로 관리되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const lotNumber = 'SHARED-LOT-001'

      // CA 공정에 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber,
        quantity: 100,
      })

      // MC 공정에 같은 LOT 등록 (독립적)
      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber,
        quantity: 50,
      })

      // CA에서 전량 소진
      await module.consumeProcessStock('CA', 1, 100)

      // CA 상태: 소진됨
      const caStatus = await module.checkProcessStockStatus('CA', lotNumber)
      expect(caStatus.isExhausted).toBe(true)
      expect(caStatus.canRegister).toBe(false)

      // MC 상태: 아직 가용
      const mcStatus = await module.checkProcessStockStatus('MC', lotNumber)
      expect(mcStatus.isExhausted).toBe(false)
      expect(mcStatus.availableQty).toBe(50)
      expect(mcStatus.canRegister).toBe(true)
    })
  })

  describe('7. 에러 케이스 처리', () => {
    it('잘못된 processCode로 등록해도 정상 동작해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'UNKNOWN',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.processCode).toBe('UNKNOWN')
    })

    it('수량 0으로 등록 시 정상 처리되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-ZERO',
        quantity: 0,
      })

      // 0 수량도 등록은 성공 (경고는 UI에서 처리)
      expect(result.success).toBe(true)
      expect(result.stock?.quantity).toBe(0)
    })
  })
})
