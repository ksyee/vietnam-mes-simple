/**
 * Phase C: MaterialStock 공정별 자재 현황 테스트
 *
 * 목표: 공정별 필터링 및 현황 표시 기능 검증
 * - getStocksByProcess() 공정별 필터링
 * - getAllStocks()에서 processCode 필터링
 * - 공정 미지정 자재 조회
 * - 공정별 통계
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

describe('Phase C: MaterialStock 공정별 자재 현황', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('1. 공정별 재고 조회', () => {
    it('getStocksByProcess로 특정 공정 재고만 조회되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-CA-001',
        quantity: 100,
      })

      // MC 공정에 자재 등록
      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 2,
        materialCode: 'M002',
        materialName: '자재2',
        lotNumber: 'LOT-MC-001',
        quantity: 200,
      })

      // CA 공정만 조회
      const caStocks = await module.getStocksByProcess('CA')
      expect(caStocks.length).toBe(1)
      expect(caStocks[0].materialCode).toBe('M001')

      // MC 공정만 조회
      const mcStocks = await module.getStocksByProcess('MC')
      expect(mcStocks.length).toBe(1)
      expect(mcStocks[0].materialCode).toBe('M002')
    })

    it('getAllStocks로 전체 재고 조회 시 processCode 포함되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 공정 지정 자재
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 공정 미지정 자재 (기존 방식)
      await module.receiveStock({
        materialId: 2,
        materialCode: 'M002',
        materialName: '자재2',
        lotNumber: 'LOT-002',
        quantity: 200,
      })

      const allStocks = await module.getAllStocks()
      expect(allStocks.length).toBe(2)

      // 공정 지정 자재
      const processStock = allStocks.find(s => s.lotNumber === 'LOT-001')
      expect(processStock?.processCode).toBe('CA')

      // 공정 미지정 자재
      const noProcessStock = allStocks.find(s => s.lotNumber === 'LOT-002')
      expect(noProcessStock?.processCode).toBeUndefined()
    })
  })

  describe('2. 공정 미지정 자재 조회', () => {
    it('processCode가 undefined인 자재만 조회할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 공정 지정 자재
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 공정 미지정 자재 (기존 방식)
      await module.receiveStock({
        materialId: 2,
        materialCode: 'M002',
        lotNumber: 'LOT-002',
        quantity: 200,
      })

      await module.receiveStock({
        materialId: 3,
        materialCode: 'M003',
        lotNumber: 'LOT-003',
        quantity: 300,
      })

      // getAllStocks에서 필터링
      const allStocks = await module.getAllStocks()
      const unassignedStocks = allStocks.filter(s => !s.processCode)

      expect(unassignedStocks.length).toBe(2)
      expect(unassignedStocks.every(s => s.processCode === undefined)).toBe(true)
    })
  })

  describe('3. 공정별 통계', () => {
    it('getProcessStockSummary로 공정별 통계 조회되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 2개 LOT 등록
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

      const summary = await module.getProcessStockSummary('CA')

      expect(summary.totalLots).toBe(2)
      expect(summary.totalQuantity).toBe(300)
      expect(summary.totalUsed).toBe(50)
      expect(summary.totalAvailable).toBe(250)
      expect(summary.materialCount).toBe(2)
    })

    it('빈 공정의 통계는 모두 0이어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const summary = await module.getProcessStockSummary('EMPTY')

      expect(summary.totalLots).toBe(0)
      expect(summary.totalQuantity).toBe(0)
      expect(summary.totalUsed).toBe(0)
      expect(summary.totalAvailable).toBe(0)
      expect(summary.materialCount).toBe(0)
    })
  })

  describe('4. 복합 필터링', () => {
    it('공정 + 자재코드 필터링이 동작해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 여러 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'WIRE-001',
        materialName: '전선1',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 2,
        materialCode: 'WIRE-002',
        materialName: '전선2',
        lotNumber: 'LOT-002',
        quantity: 200,
      })

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 3,
        materialCode: 'TERMINAL-001',
        materialName: '단자1',
        lotNumber: 'LOT-003',
        quantity: 300,
      })

      // 공정 + 자재코드 필터
      const wireStocks = await module.getStocksByProcess('CA', { materialCode: 'WIRE' })

      expect(wireStocks.length).toBe(2)
      expect(wireStocks.every(s => s.materialCode.includes('WIRE'))).toBe(true)
    })

    it('공정 + 소진재고 포함 필터링이 동작해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 전량 소진
      await module.consumeProcessStock('CA', 1, 100)

      // 기본 조회 - 소진 재고 숨김
      const stocks = await module.getStocksByProcess('CA')
      expect(stocks.length).toBe(0)

      // showZero 옵션으로 소진 재고 포함
      const allStocks = await module.getStocksByProcess('CA', { showZero: true })
      expect(allStocks.length).toBe(1)
      expect(allStocks[0].availableQty).toBe(0)
    })
  })

  describe('5. 공정별 가용 재고', () => {
    it('getProcessAvailableQty로 공정별 가용 수량 조회되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 같은 자재를 여러 LOT로 등록
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
        materialId: 1,
        materialCode: 'M001',
        materialName: '자재1',
        lotNumber: 'LOT-002',
        quantity: 200,
      })

      // 50개 사용
      await module.consumeProcessStock('CA', 1, 50)

      const availableQty = await module.getProcessAvailableQty('CA', 1)
      expect(availableQty).toBe(250) // 100 + 200 - 50
    })
  })

  describe('6. 공정 목록 (UI용)', () => {
    it('등록된 공정 목록을 추출할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 여러 공정에 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 2,
        materialCode: 'M002',
        lotNumber: 'LOT-002',
        quantity: 200,
      })

      await module.registerProcessStock({
        processCode: 'SB',
        materialId: 3,
        materialCode: 'M003',
        lotNumber: 'LOT-003',
        quantity: 300,
      })

      // 전체 조회 후 공정 목록 추출
      const allStocks = await module.getAllStocks()
      const processCodes = [...new Set(allStocks.map(s => s.processCode).filter(Boolean))]

      expect(processCodes.length).toBe(3)
      expect(processCodes).toContain('CA')
      expect(processCodes).toContain('MC')
      expect(processCodes).toContain('SB')
    })
  })
})
