/**
 * Phase E: 공정별 자재 관리 통합 테스트
 *
 * 목표: Phase A~D 전체 기능 연동 검증
 * - stockService 공정별 재고 관리
 * - ProcessView 자재 자동 등록 워크플로우
 * - MaterialStock 공정별 현황 조회
 * - MaterialReceiving 공정 자재 스캔 워크플로우
 *
 * 테스트 시나리오:
 * 1. 공정 자재 스캔 → 등록 → 조회 → 사용 → 소진 전체 사이클
 * 2. 다중 공정 독립 관리 검증
 * 3. LOT 상태 전이 검증 (신규 → 사용중 → 소진)
 * 4. 에러 케이스 및 경계값 테스트
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

describe('Phase E: 공정별 자재 관리 통합 테스트', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('1. 전체 워크플로우 사이클 테스트', () => {
    it('스캔 → 등록 → 조회 → 사용 → 소진 전체 사이클', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const materialId = 1
      const materialCode = 'M001'
      const lotNumber = 'LOT-CYCLE-001'

      // Step 1: 스캔 전 상태 확인
      const initialStatus = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(initialStatus.exists).toBe(false)
      expect(initialStatus.canRegister).toBe(true)

      // Step 2: 공정 재고 등록 (스캔 시뮬레이션)
      const registerResult = await module.registerProcessStock({
        processCode,
        materialId,
        materialCode,
        materialName: '테스트 자재',
        lotNumber,
        quantity: 100,
      })
      expect(registerResult.success).toBe(true)
      expect(registerResult.isNewEntry).toBe(true)

      // Step 3: 재고 조회 확인
      const stocks = await module.getStocksByProcess(processCode)
      expect(stocks.length).toBe(1)
      expect(stocks[0].availableQty).toBe(100)

      // Step 4: 부분 사용 (50개)
      const consumeResult1 = await module.consumeProcessStock(processCode, materialId, 50)
      expect(consumeResult1.deductedQty).toBe(50)

      // Step 5: 중간 상태 확인
      const midStatus = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(midStatus.availableQty).toBe(50)
      expect(midStatus.isExhausted).toBe(false)
      expect(midStatus.canRegister).toBe(true)

      // Step 6: 나머지 사용 (50개)
      const consumeResult2 = await module.consumeProcessStock(processCode, materialId, 50)
      expect(consumeResult2.deductedQty).toBe(50)

      // Step 7: 소진 상태 확인
      const finalStatus = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(finalStatus.availableQty).toBe(0)
      expect(finalStatus.isExhausted).toBe(true)
      expect(finalStatus.canRegister).toBe(false)

      // Step 8: 소진된 LOT 재등록 시도 - 실패해야 함
      const reRegisterResult = await module.registerProcessStock({
        processCode,
        materialId,
        materialCode,
        materialName: '테스트 자재',
        lotNumber,
        quantity: 50,
      })
      expect(reRegisterResult.success).toBe(false)
      expect(reRegisterResult.error).toContain('이미 사용이 완료된 바코드')
    })

    it('남은 수량 있는 LOT 추가 스캔 워크플로우', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'MC'
      const lotNumber = 'LOT-PARTIAL-CYCLE'

      // 첫 스캔: 100개 등록
      await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber,
        quantity: 100,
      })

      // 70개 사용 (30개 남음)
      await module.consumeProcessStock(processCode, 1, 70)

      // 상태 확인: 추가 등록 가능
      const status = await module.checkProcessStockStatus(processCode, lotNumber)
      expect(status.availableQty).toBe(30)
      expect(status.canRegister).toBe(true)

      // 두 번째 스캔: 50개 추가
      const addResult = await module.registerProcessStock({
        processCode,
        materialId: 1,
        materialCode: 'M001',
        materialName: '테스트',
        lotNumber,
        quantity: 50,
      })
      expect(addResult.success).toBe(true)
      expect(addResult.isNewEntry).toBe(false) // 기존 LOT에 추가
      expect(addResult.stock?.quantity).toBe(150) // 100 + 50
      expect(addResult.stock?.availableQty).toBe(80) // 150 - 70
    })
  })

  describe('2. 다중 공정 독립 관리', () => {
    it('같은 LOT가 공정별로 독립 관리되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const lotNumber = 'SHARED-LOT-001'

      // CA 공정에 100개 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        materialName: '공유 자재',
        lotNumber,
        quantity: 100,
      })

      // MC 공정에 같은 LOT 80개 등록
      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 1,
        materialCode: 'M001',
        materialName: '공유 자재',
        lotNumber,
        quantity: 80,
      })

      // SB 공정에 같은 LOT 60개 등록
      await module.registerProcessStock({
        processCode: 'SB',
        materialId: 1,
        materialCode: 'M001',
        materialName: '공유 자재',
        lotNumber,
        quantity: 60,
      })

      // 각 공정별 독립 확인
      const caStocks = await module.getStocksByProcess('CA')
      const mcStocks = await module.getStocksByProcess('MC')
      const sbStocks = await module.getStocksByProcess('SB')

      expect(caStocks[0].availableQty).toBe(100)
      expect(mcStocks[0].availableQty).toBe(80)
      expect(sbStocks[0].availableQty).toBe(60)

      // CA에서만 전량 소진
      await module.consumeProcessStock('CA', 1, 100)

      // CA만 소진, 다른 공정은 영향 없음
      const caStatus = await module.checkProcessStockStatus('CA', lotNumber)
      const mcStatus = await module.checkProcessStockStatus('MC', lotNumber)
      const sbStatus = await module.checkProcessStockStatus('SB', lotNumber)

      expect(caStatus.isExhausted).toBe(true)
      expect(mcStatus.isExhausted).toBe(false)
      expect(sbStatus.isExhausted).toBe(false)
    })

    it('공정별 통계가 독립적으로 집계되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // CA 공정에 2개 자재 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-CA-001',
        quantity: 100,
      })
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 2,
        materialCode: 'M002',
        lotNumber: 'LOT-CA-002',
        quantity: 200,
      })

      // MC 공정에 1개 자재 등록
      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 3,
        materialCode: 'M003',
        lotNumber: 'LOT-MC-001',
        quantity: 150,
      })

      // 통계 확인
      const caStats = await module.getProcessStockSummary('CA')
      const mcStats = await module.getProcessStockSummary('MC')

      expect(caStats.totalLots).toBe(2)
      expect(caStats.totalQuantity).toBe(300)
      expect(caStats.materialCount).toBe(2)

      expect(mcStats.totalLots).toBe(1)
      expect(mcStats.totalQuantity).toBe(150)
      expect(mcStats.materialCount).toBe(1)
    })
  })

  describe('3. MaterialStock 공정별 조회', () => {
    it('전체 조회 시 processCode 포함되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 공정 지정 자재
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-PROCESS',
        quantity: 100,
      })

      // 공정 미지정 자재 (기존 방식)
      await module.receiveStock({
        materialId: 2,
        materialCode: 'M002',
        lotNumber: 'LOT-NO-PROCESS',
        quantity: 200,
      })

      const allStocks = await module.getAllStocks()
      expect(allStocks.length).toBe(2)

      const processStock = allStocks.find(s => s.lotNumber === 'LOT-PROCESS')
      const noProcessStock = allStocks.find(s => s.lotNumber === 'LOT-NO-PROCESS')

      expect(processStock?.processCode).toBe('CA')
      expect(noProcessStock?.processCode).toBeUndefined()
    })

    it('공정 필터로 조회 시 해당 공정만 반환', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-CA',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 2,
        materialCode: 'M002',
        lotNumber: 'LOT-MC',
        quantity: 200,
      })

      const caOnly = await module.getStocksByProcess('CA')
      expect(caOnly.length).toBe(1)
      expect(caOnly[0].processCode).toBe('CA')

      const mcOnly = await module.getStocksByProcess('MC')
      expect(mcOnly.length).toBe(1)
      expect(mcOnly[0].processCode).toBe('MC')
    })

    it('소진 재고 showZero 옵션 동작 확인', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-EXHAUST',
        quantity: 100,
      })

      // 전량 소진
      await module.consumeProcessStock('CA', 1, 100)

      // 기본 조회 - 소진 재고 숨김
      const defaultStocks = await module.getStocksByProcess('CA')
      expect(defaultStocks.length).toBe(0)

      // showZero: true - 소진 재고 포함
      const allStocks = await module.getStocksByProcess('CA', { showZero: true })
      expect(allStocks.length).toBe(1)
      expect(allStocks[0].availableQty).toBe(0)
    })
  })

  describe('4. MaterialReceiving 스캔 워크플로우', () => {
    it('금일 스캔 내역 조회', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      // 오늘 날짜로 등록
      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-TODAY-1',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode: 'MC',
        materialId: 2,
        materialCode: 'M002',
        lotNumber: 'LOT-TODAY-2',
        quantity: 200,
      })

      // 전체 금일 내역
      const allToday = await module.getTodayProcessReceivings()
      expect(allToday.length).toBe(2)

      // CA 공정만
      const caToday = await module.getTodayProcessReceivings('CA')
      expect(caToday.length).toBe(1)
      expect(caToday[0].processCode).toBe('CA')
    })
  })

  describe('5. FIFO 차감 검증', () => {
    it('오래된 LOT부터 차감되어야 함 (FIFO)', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const materialId = 1

      // 먼저 등록된 LOT (오래된 것)
      await module.registerProcessStock({
        processCode,
        materialId,
        materialCode: 'M001',
        lotNumber: 'LOT-OLD',
        quantity: 50,
        receivedAt: new Date('2024-01-01').toISOString(),
      })

      // 나중에 등록된 LOT (새 것)
      await module.registerProcessStock({
        processCode,
        materialId,
        materialCode: 'M001',
        lotNumber: 'LOT-NEW',
        quantity: 50,
        receivedAt: new Date('2024-12-01').toISOString(),
      })

      // 60개 차감 - OLD 50개 전량 + NEW 10개
      const result = await module.consumeProcessStock(processCode, materialId, 60)

      expect(result.lots.length).toBe(2)
      expect(result.lots[0].lotNumber).toBe('LOT-OLD')
      expect(result.lots[0].usedQty).toBe(50)
      expect(result.lots[1].lotNumber).toBe('LOT-NEW')
      expect(result.lots[1].usedQty).toBe(10)
    })
  })

  describe('6. 에러 케이스 및 경계값', () => {
    it('빈 공정코드로 등록 시 오류', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: '',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-001',
        quantity: 100,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('공정')
    })

    it('빈 LOT번호로 등록 시 오류', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: '',
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
        lotNumber: 'LOT-001',
        quantity: -50,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('수량')
    })

    it('수량 0으로 등록 시 정상 처리', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const result = await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-ZERO',
        quantity: 0,
      })

      // 0 수량도 등록은 성공
      expect(result.success).toBe(true)
      expect(result.stock?.quantity).toBe(0)
    })

    it('존재하지 않는 공정 조회 시 빈 배열', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const stocks = await module.getStocksByProcess('NONEXISTENT')
      expect(stocks).toEqual([])

      const stats = await module.getProcessStockSummary('NONEXISTENT')
      expect(stats.totalLots).toBe(0)
      expect(stats.totalQuantity).toBe(0)
    })
  })

  describe('7. 데이터 영속성 (localStorage)', () => {
    it('등록된 데이터가 localStorage에 저장되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      await module.registerProcessStock({
        processCode: 'CA',
        materialId: 1,
        materialCode: 'M001',
        lotNumber: 'LOT-PERSIST',
        quantity: 100,
      })

      // localStorage에 저장되었는지 확인
      expect(localStorageMock.setItem).toHaveBeenCalled()

      // 저장된 데이터 확인
      const stocksJson = localStorageMock.getItem('vietnam_mes_stocks')
      expect(stocksJson).toBeTruthy()

      const stocks = JSON.parse(stocksJson!)
      expect(stocks.length).toBeGreaterThan(0)
      expect(stocks.some((s: any) => s.lotNumber === 'LOT-PERSIST')).toBe(true)
    })
  })

  describe('8. 가용 수량 계산', () => {
    it('공정별 가용 수량이 정확히 계산되어야 함', async () => {
      const module = await import('../src/services/mock/stockService.mock')

      const processCode = 'CA'
      const materialId = 1

      // 같은 자재 여러 LOT 등록
      await module.registerProcessStock({
        processCode,
        materialId,
        materialCode: 'M001',
        lotNumber: 'LOT-1',
        quantity: 100,
      })

      await module.registerProcessStock({
        processCode,
        materialId,
        materialCode: 'M001',
        lotNumber: 'LOT-2',
        quantity: 200,
      })

      // 초기 가용 수량: 300
      let available = await module.getProcessAvailableQty(processCode, materialId)
      expect(available).toBe(300)

      // 80개 사용
      await module.consumeProcessStock(processCode, materialId, 80)

      // 사용 후 가용 수량: 220
      available = await module.getProcessAvailableQty(processCode, materialId)
      expect(available).toBe(220)
    })
  })
})
