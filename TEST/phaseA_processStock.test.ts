/**
 * Phase A: 공정별 재고 관리 테스트
 *
 * 목표: stockService.mock의 공정별 재고 기능 검증
 * - processCode 필드 추가
 * - registerProcessStock() 함수 - 공정에 자재 등록
 * - getStocksByProcess() 함수 - 공정별 재고 조회
 * - getProcessStockByLot() 함수 - LOT로 공정 재고 조회
 * - isLotExistsForProcess() 함수 - 공정+LOT 중복 체크
 * - 남은 수량(remainingQty) 체크 로직
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

describe('Phase A: 공정별 재고 관리', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('1. StockItem processCode 필드', () => {
    it('StockItem에 processCode 필드가 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 공정에 자재 등록
      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 100,
      })

      expect(result.success).toBe(true)
      expect(result.stock).toBeDefined()
      expect(result.stock?.processCode).toBe('CA')
    })

    it('processCode가 없으면 undefined로 저장되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 기존 receiveStock은 processCode 없이 동작
      const result = await module.receiveStock({
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-241223-002',
        quantity: 100,
      })

      expect(result.success).toBe(true)

      // getAllStocks로 확인
      const stocks = await module.getAllStocks()
      const found = stocks.find(s => s.lotNumber === 'LOT-241223-002')
      expect(found?.processCode).toBeUndefined()
    })
  })

  describe('2. registerProcessStock() 함수', () => {
    it('공정에 자재를 등록할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 100,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.processCode).toBe('CA')
      expect(result.stock?.quantity).toBe(100)
      expect(result.stock?.availableQty).toBe(100)
    })

    it('같은 공정에 같은 LOT 중복 등록 시 기존 수량에 추가되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 첫 번째 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 100,
      })

      // 같은 공정, 같은 LOT로 다시 등록 (남은 수량 추가)
      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 50,
      })

      expect(result.success).toBe(true)
      expect(result.stock?.quantity).toBe(150) // 100 + 50
      expect(result.stock?.availableQty).toBe(150)
    })

    it('다른 공정에는 같은 LOT를 별도로 등록할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 100,
      })

      // MC 공정에 같은 LOT 등록
      const result = await module.registerProcessStock({
        processCode: 'MC',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 50,
      })

      expect(result.success).toBe(true)

      // 각 공정별로 별도 관리
      const caStocks = await module.getStocksByProcess('CA')
      const mcStocks = await module.getStocksByProcess('MC')

      expect(caStocks.length).toBe(1)
      expect(caStocks[0].quantity).toBe(100)
      expect(mcStocks.length).toBe(1)
      expect(mcStocks[0].quantity).toBe(50)
    })
  })

  describe('3. getStocksByProcess() 함수', () => {
    it('공정별 재고를 조회할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 자재 등록
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

      // MC 공정에 자재 등록
      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 3,
        materialCode: 'M003',
        materialName: '자재3',
        lotNumber: 'LOT-003',
        quantity: 50,
      })

      const caStocks = await module.getStocksByProcess('CA')
      const mcStocks = await module.getStocksByProcess('MC')

      expect(caStocks.length).toBe(2)
      expect(mcStocks.length).toBe(1)
    })

    it('소진된 재고는 기본적으로 숨겨져야 함', async () => {
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

    it('자재 코드로 필터링할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

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

      const filtered = await module.getStocksByProcess('CA', { materialCode: 'M001' })
      expect(filtered.length).toBe(1)
      expect(filtered[0].materialCode).toBe('M001')
    })
  })

  describe('4. getProcessStockByLot() 함수', () => {
    it('공정+LOT로 재고를 조회할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-241223-001',
        quantity: 100,
      })

      const stock = await module.getProcessStockByLot('CA', 'LOT-241223-001')

      expect(stock).not.toBeNull()
      expect(stock?.processCode).toBe('CA')
      expect(stock?.lotNumber).toBe('LOT-241223-001')
      expect(stock?.quantity).toBe(100)
    })

    it('존재하지 않는 LOT는 null을 반환해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const stock = await module.getProcessStockByLot('CA', 'NON-EXIST')
      expect(stock).toBeNull()
    })
  })

  describe('5. isLotExistsForProcess() 함수', () => {
    it('공정+LOT 중복 여부를 확인할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 등록 전 - 존재하지 않음
      expect(module.isLotExistsForProcess('CA', 'LOT-001')).toBe(false)

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 등록 후 - 존재함
      expect(module.isLotExistsForProcess('CA', 'LOT-001')).toBe(true)

      // 다른 공정에는 없음
      expect(module.isLotExistsForProcess('MC', 'LOT-001')).toBe(false)
    })
  })

  describe('6. consumeProcessStock() 함수 - 공정별 FIFO 차감', () => {
    it('공정별로 FIFO 차감이 되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 2개 LOT 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
        receivedAt: '2024-12-23T09:00:00Z', // 먼저 입고
      })

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-002',
        quantity: 100,
        receivedAt: '2024-12-23T10:00:00Z', // 나중 입고
      })

      // 150개 차감 (FIFO: LOT-001에서 100, LOT-002에서 50)
      const result = await module.consumeProcessStock('CA', 1, 150)

      expect(result.deductedQty).toBe(150)
      expect(result.lots).toHaveLength(2)
      expect(result.lots[0]).toEqual({ lotNumber: 'LOT-001', usedQty: 100 })
      expect(result.lots[1]).toEqual({ lotNumber: 'LOT-002', usedQty: 50 })

      // 남은 재고 확인
      const lot1 = await module.getProcessStockByLot('CA', 'LOT-001')
      const lot2 = await module.getProcessStockByLot('CA', 'LOT-002')

      expect(lot1?.availableQty).toBe(0)
      expect(lot2?.availableQty).toBe(50)
    })

    it('다른 공정의 재고는 영향받지 않아야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA, MC 공정에 같은 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-002',
        quantity: 100,
      })

      // CA 공정에서만 차감
      await module.consumeProcessStock('CA', 1, 50)

      // CA는 차감됨
      const caStock = await module.getProcessStockByLot('CA', 'LOT-001')
      expect(caStock?.availableQty).toBe(50)

      // MC는 그대로
      const mcStock = await module.getProcessStockByLot('MC', 'LOT-002')
      expect(mcStock?.availableQty).toBe(100)
    })
  })

  describe('7. 남은 수량(remainingQty) 체크 로직', () => {
    it('사용 후 남은 수량이 있는 LOT는 재사용 가능해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

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

      // 남은 수량 확인 (50개 남음)
      const stock = await module.getProcessStockByLot('CA', 'LOT-001')
      expect(stock?.availableQty).toBe(50)
      expect(stock?.usedQty).toBe(50)

      // 다시 30개 사용 가능
      const result = await module.consumeProcessStock('CA', 1, 30)
      expect(result.deductedQty).toBe(30)

      // 최종 남은 수량 확인 (20개 남음)
      const finalStock = await module.getProcessStockByLot('CA', 'LOT-001')
      expect(finalStock?.availableQty).toBe(20)
    })

    it('남은 수량이 0인 LOT 스캔 시 경고 상태를 확인할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

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

      // 같은 LOT 스캔 시 상태 확인
      const checkResult = await module.checkProcessStockStatus('CA', 'LOT-001')

      expect(checkResult.exists).toBe(true)
      expect(checkResult.availableQty).toBe(0)
      expect(checkResult.isExhausted).toBe(true) // 소진됨
    })

    it('스캔 가능 여부를 확인할 수 있어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 새 LOT - 등록 가능
      const newCheck = await module.checkProcessStockStatus('CA', 'NEW-LOT')
      expect(newCheck.exists).toBe(false)
      expect(newCheck.canRegister).toBe(true)

      // 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'EXISTING-LOT',
        quantity: 100,
      })

      // 기존 LOT (남은 수량 있음) - 추가 등록 가능
      const existingCheck = await module.checkProcessStockStatus('CA', 'EXISTING-LOT')
      expect(existingCheck.exists).toBe(true)
      expect(existingCheck.availableQty).toBe(100)
      expect(existingCheck.isExhausted).toBe(false)
      expect(existingCheck.canRegister).toBe(true) // 추가 등록 가능

      // 전량 소진 후
      await module.consumeProcessStock('CA', 1, 100)
      const exhaustedCheck = await module.checkProcessStockStatus('CA', 'EXISTING-LOT')
      expect(exhaustedCheck.isExhausted).toBe(true)
      expect(exhaustedCheck.canRegister).toBe(false) // 추가 등록 불가 (이미 사용된 바코드)
    })
  })

  describe('8. localStorage 영속화', () => {
    it('공정별 재고가 localStorage에 저장되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vietnam_mes_stocks',
        expect.any(String)
      )

      // 저장된 데이터 확인
      const savedData = localStorageMock.getItem('vietnam_mes_stocks')
      expect(savedData).not.toBeNull()

      const parsed = JSON.parse(savedData!)
      expect(parsed.length).toBe(1)
      expect(parsed[0].processCode).toBe('CA')
    })

    it('모듈 리로드 시 공정별 재고가 유지되어야 함', async () => {
      // 첫 번째 세션
      const module1 = await import('../src/services/mock/stockService.mock')

      await module1.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트 자재',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      // 모듈 리로드
      vi.resetModules()

      // 두 번째 세션
      const module2 = await import('../src/services/mock/stockService.mock')

      const stocks = await module2.getStocksByProcess('CA')
      expect(stocks.length).toBe(1)
      expect(stocks[0].processCode).toBe('CA')
      expect(stocks[0].quantity).toBe(100)
    })
  })

  describe('9. 하위 호환성', () => {
    it('기존 receiveStock() 함수는 그대로 동작해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.receiveStock({
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      expect(result.success).toBe(true)

      // getAllStocks로 조회 가능
      const stocks = await module.getAllStocks()
      expect(stocks.length).toBe(1)
    })

    it('기존 getAllStocks()는 모든 재고를 반환해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 기존 방식 입고
      await module.receiveStock({
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-OLD',
        quantity: 100,
      })

      // 새 방식 공정 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 2,
        materialCode: 'M002',
        materialName: '자재2',
        lotNumber: 'LOT-NEW',
        quantity: 200,
      })

      const allStocks = await module.getAllStocks()
      expect(allStocks.length).toBe(2)
    })

    it('기존 consumeStockFIFOWithNegative()는 그대로 동작해야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      await module.receiveStock({
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      const result = await module.consumeStockFIFOWithNegative(1, 50)

      expect(result.deductedQty).toBe(50)
      expect(result.lots).toHaveLength(1)
    })
  })
})
