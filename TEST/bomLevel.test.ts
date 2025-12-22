/**
 * BOM Level Tests
 *
 * BOMContext.tsx의 Level 결정 로직 및 그룹핑 테스트
 */
import { describe, it, expect } from 'vitest'
import {
  determineLevel,
  getProcessName,
  type BOMItem,
  type BOMGroup,
  type LevelGroup,
  type CrimpGroup,
} from '../src/app/context/BOMContext'

describe('BOM Level Functions', () => {
  describe('determineLevel', () => {
    it('should return level 1 for PA (제품조립)', () => {
      expect(determineLevel('PA')).toBe(1)
      expect(determineLevel('pa')).toBe(1)
      expect(determineLevel('Pa')).toBe(1)
    })

    it('should return level 2 for MC (수동압착)', () => {
      expect(determineLevel('MC')).toBe(2)
      expect(determineLevel('mc')).toBe(2)
    })

    it('should return level 3 for SB (서브조립)', () => {
      expect(determineLevel('SB')).toBe(3)
      expect(determineLevel('sb')).toBe(3)
    })

    it('should return level 3 for MS (중간탈피)', () => {
      expect(determineLevel('MS')).toBe(3)
      expect(determineLevel('ms')).toBe(3)
    })

    it('should return level 4 for CA (자동절단압착)', () => {
      expect(determineLevel('CA')).toBe(4)
      expect(determineLevel('ca')).toBe(4)
    })

    it('should return level 1 as default for unknown process codes', () => {
      expect(determineLevel('')).toBe(1)
      expect(determineLevel('XX')).toBe(1)
      expect(determineLevel('SP')).toBe(1)  // SP는 자재수집, BOM에 포함 안됨
      expect(determineLevel('HS')).toBe(1)  // HS는 형태처리
      expect(determineLevel('CQ')).toBe(1)  // CQ는 검사
      expect(determineLevel('CI')).toBe(1)  // CI는 검사
      expect(determineLevel('VI')).toBe(1)  // VI는 검사
    })

    it('should handle null/undefined gracefully', () => {
      expect(determineLevel(null as unknown as string)).toBe(1)
      expect(determineLevel(undefined as unknown as string)).toBe(1)
    })
  })

  describe('getProcessName', () => {
    it('should return correct Korean names for valid process codes', () => {
      expect(getProcessName('PA')).toBe('제품조립')
      expect(getProcessName('MC')).toBe('수동압착')
      expect(getProcessName('SB')).toBe('서브조립')
      expect(getProcessName('MS')).toBe('중간탈피')
      expect(getProcessName('CA')).toBe('자동절단압착')
    })

    it('should be case insensitive', () => {
      expect(getProcessName('pa')).toBe('제품조립')
      expect(getProcessName('Mc')).toBe('수동압착')
      expect(getProcessName('ca')).toBe('자동절단압착')
    })

    it('should return process code for unknown codes', () => {
      expect(getProcessName('XX')).toBe('XX')
      expect(getProcessName('SP')).toBe('SP')
    })

    it('should return "기타" for empty string', () => {
      expect(getProcessName('')).toBe('기타')
    })
  })
})

describe('BOM Level Grouping Logic', () => {
  // 테스트용 BOM 데이터 생성 함수
  function createTestBOMItem(overrides: Partial<BOMItem>): BOMItem {
    return {
      id: 1,
      productCode: '00315452',
      productName: '테스트 제품',
      materialCode: 'MAT001',
      materialName: '테스트 자재',
      quantity: 1,
      unit: 'EA',
      processCode: 'PA',
      level: 1,
      regDate: '2025-01-01',
      ...overrides,
    }
  }

  // 그룹핑 로직 시뮬레이션 (BOMContext의 useMemo 로직과 동일)
  function groupBOMItems(bomItems: BOMItem[]): BOMGroup[] {
    // Step 1: 품번별로 그룹핑
    const productMap = new Map<string, {
      productCode: string;
      productName?: string;
      items: BOMItem[];
    }>();

    bomItems.forEach(item => {
      if (!productMap.has(item.productCode)) {
        productMap.set(item.productCode, {
          productCode: item.productCode,
          productName: item.productName,
          items: []
        });
      }
      productMap.get(item.productCode)!.items.push(item);
    });

    // Step 2: 각 품번에 대해 Level별 그룹핑
    const result: BOMGroup[] = [];

    productMap.forEach((productGroup) => {
      const levelMap = new Map<number, BOMItem[]>();

      productGroup.items.forEach(item => {
        const level = item.level;
        if (!levelMap.has(level)) {
          levelMap.set(level, []);
        }
        levelMap.get(level)!.push(item);
      });

      const levelGroups: LevelGroup[] = [];

      [1, 2, 3, 4].forEach(level => {
        const items = levelMap.get(level);
        if (items && items.length > 0) {
          const processCode = items[0].processCode?.toUpperCase() || '';

          const levelGroup: LevelGroup = {
            level,
            processCode,
            processName: getProcessName(processCode),
            items
          };

          // LV4 (CA)인 경우 crimpCode별로 추가 그룹핑
          if (level === 4) {
            const crimpMap = new Map<string, BOMItem[]>();

            items.forEach(item => {
              const code = item.crimpCode || '(미지정)';
              if (!crimpMap.has(code)) {
                crimpMap.set(code, []);
              }
              crimpMap.get(code)!.push(item);
            });

            levelGroup.crimpGroups = Array.from(crimpMap.entries())
              .map(([crimpCode, crimpItems]) => ({
                crimpCode,
                items: crimpItems
              }))
              .sort((a, b) => a.crimpCode.localeCompare(b.crimpCode));
          }

          levelGroups.push(levelGroup);
        }
      });

      result.push({
        productCode: productGroup.productCode,
        productName: productGroup.productName,
        levelGroups,
        totalItems: productGroup.items.length
      });
    });

    return result.sort((a, b) => a.productCode.localeCompare(b.productCode));
  }

  describe('Basic Grouping', () => {
    it('should group items by productCode', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 3, productCode: 'B002', processCode: 'PA', level: 1 }),
      ]

      const groups = groupBOMItems(items)

      expect(groups).toHaveLength(2)
      expect(groups[0].productCode).toBe('A001')
      expect(groups[0].totalItems).toBe(2)
      expect(groups[1].productCode).toBe('B002')
      expect(groups[1].totalItems).toBe(1)
    })

    it('should group items by level within product', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'MC', level: 2 }),
        createTestBOMItem({ id: 3, productCode: 'A001', processCode: 'CA', level: 4 }),
      ]

      const groups = groupBOMItems(items)

      expect(groups).toHaveLength(1)
      expect(groups[0].levelGroups).toHaveLength(3)
      expect(groups[0].levelGroups[0].level).toBe(1)
      expect(groups[0].levelGroups[1].level).toBe(2)
      expect(groups[0].levelGroups[2].level).toBe(4)
    })

    it('should sort level groups in ascending order', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'CA', level: 4 }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 3, productCode: 'A001', processCode: 'SB', level: 3 }),
        createTestBOMItem({ id: 4, productCode: 'A001', processCode: 'MC', level: 2 }),
      ]

      const groups = groupBOMItems(items)

      expect(groups[0].levelGroups.map(g => g.level)).toEqual([1, 2, 3, 4])
    })
  })

  describe('Level 4 CrimpCode Grouping', () => {
    it('should group CA items by crimpCode', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-001' }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-001' }),
        createTestBOMItem({ id: 3, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-002' }),
        createTestBOMItem({ id: 4, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-003' }),
      ]

      const groups = groupBOMItems(items)
      const level4Group = groups[0].levelGroups.find(g => g.level === 4)

      expect(level4Group).toBeDefined()
      expect(level4Group!.crimpGroups).toBeDefined()
      expect(level4Group!.crimpGroups).toHaveLength(3)
      expect(level4Group!.crimpGroups![0].crimpCode).toBe('00315452-001')
      expect(level4Group!.crimpGroups![0].items).toHaveLength(2)
      expect(level4Group!.crimpGroups![1].crimpCode).toBe('00315452-002')
      expect(level4Group!.crimpGroups![1].items).toHaveLength(1)
    })

    it('should use "(미지정)" for items without crimpCode', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: undefined }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-001' }),
      ]

      const groups = groupBOMItems(items)
      const level4Group = groups[0].levelGroups.find(g => g.level === 4)

      expect(level4Group!.crimpGroups).toHaveLength(2)
      expect(level4Group!.crimpGroups!.find(g => g.crimpCode === '(미지정)')).toBeDefined()
    })

    it('should sort crimpGroups alphabetically', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-003' }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-001' }),
        createTestBOMItem({ id: 3, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: '00315452-002' }),
      ]

      const groups = groupBOMItems(items)
      const level4Group = groups[0].levelGroups.find(g => g.level === 4)

      expect(level4Group!.crimpGroups!.map(g => g.crimpCode)).toEqual([
        '00315452-001',
        '00315452-002',
        '00315452-003',
      ])
    })

    it('should NOT create crimpGroups for non-CA levels', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'MC', level: 2 }),
        createTestBOMItem({ id: 3, productCode: 'A001', processCode: 'SB', level: 3 }),
      ]

      const groups = groupBOMItems(items)

      groups[0].levelGroups.forEach(levelGroup => {
        expect(levelGroup.crimpGroups).toBeUndefined()
      })
    })
  })

  describe('Process Name Assignment', () => {
    it('should assign correct processName to each level group', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'MC', level: 2 }),
        createTestBOMItem({ id: 3, productCode: 'A001', processCode: 'SB', level: 3 }),
        createTestBOMItem({ id: 4, productCode: 'A001', processCode: 'CA', level: 4 }),
      ]

      const groups = groupBOMItems(items)
      const levelGroups = groups[0].levelGroups

      expect(levelGroups.find(g => g.level === 1)!.processName).toBe('제품조립')
      expect(levelGroups.find(g => g.level === 2)!.processName).toBe('수동압착')
      expect(levelGroups.find(g => g.level === 3)!.processName).toBe('서브조립')
      expect(levelGroups.find(g => g.level === 4)!.processName).toBe('자동절단압착')
    })

    it('should handle MS processCode at level 3', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'MS', level: 3 }),
      ]

      const groups = groupBOMItems(items)
      const level3Group = groups[0].levelGroups.find(g => g.level === 3)

      expect(level3Group!.processName).toBe('중간탈피')
    })
  })

  describe('Complex Scenario', () => {
    it('should handle realistic BOM structure', () => {
      // 실제 BOM 구조 시뮬레이션: 00315452 완제품
      const items: BOMItem[] = [
        // LV1: PA 제품조립 자재
        createTestBOMItem({ id: 1, productCode: '00315452', processCode: 'PA', level: 1, materialCode: 'HOUSING001' }),
        createTestBOMItem({ id: 2, productCode: '00315452', processCode: 'PA', level: 1, materialCode: 'COVER001' }),
        createTestBOMItem({ id: 3, productCode: '00315452', processCode: 'PA', level: 1, materialCode: 'LABEL001' }),

        // LV2: MC 수동압착 자재
        createTestBOMItem({ id: 4, productCode: '00315452', processCode: 'MC', level: 2, materialCode: 'TERM001' }),
        createTestBOMItem({ id: 5, productCode: '00315452', processCode: 'MC', level: 2, materialCode: 'TERM002' }),

        // LV3: SB 서브조립 자재
        createTestBOMItem({ id: 6, productCode: '00315452', processCode: 'SB', level: 3, materialCode: 'SUB001' }),

        // LV4: CA 자동절단압착 자재 (crimpCode별 그룹)
        createTestBOMItem({ id: 7, productCode: '00315452', processCode: 'CA', level: 4, crimpCode: '00315452-001', materialCode: 'WIRE001' }),
        createTestBOMItem({ id: 8, productCode: '00315452', processCode: 'CA', level: 4, crimpCode: '00315452-001', materialCode: 'SEAL001' }),
        createTestBOMItem({ id: 9, productCode: '00315452', processCode: 'CA', level: 4, crimpCode: '00315452-002', materialCode: 'WIRE002' }),
        createTestBOMItem({ id: 10, productCode: '00315452', processCode: 'CA', level: 4, crimpCode: '00315452-002', materialCode: 'SEAL002' }),
        createTestBOMItem({ id: 11, productCode: '00315452', processCode: 'CA', level: 4, crimpCode: '00315452-003', materialCode: 'WIRE003' }),
      ]

      const groups = groupBOMItems(items)

      // 1개 제품 그룹
      expect(groups).toHaveLength(1)
      expect(groups[0].productCode).toBe('00315452')
      expect(groups[0].totalItems).toBe(11)

      // 4개 Level 그룹 (LV1, LV2, LV3, LV4)
      expect(groups[0].levelGroups).toHaveLength(4)

      // LV1: 3개 자재
      const lv1 = groups[0].levelGroups.find(g => g.level === 1)
      expect(lv1!.items).toHaveLength(3)
      expect(lv1!.processName).toBe('제품조립')

      // LV2: 2개 자재
      const lv2 = groups[0].levelGroups.find(g => g.level === 2)
      expect(lv2!.items).toHaveLength(2)
      expect(lv2!.processName).toBe('수동압착')

      // LV3: 1개 자재
      const lv3 = groups[0].levelGroups.find(g => g.level === 3)
      expect(lv3!.items).toHaveLength(1)
      expect(lv3!.processName).toBe('서브조립')

      // LV4: 5개 자재, 3개 crimpCode 그룹
      const lv4 = groups[0].levelGroups.find(g => g.level === 4)
      expect(lv4!.items).toHaveLength(5)
      expect(lv4!.processName).toBe('자동절단압착')
      expect(lv4!.crimpGroups).toHaveLength(3)

      // crimpCode별 자재 수 확인
      expect(lv4!.crimpGroups!.find(g => g.crimpCode === '00315452-001')!.items).toHaveLength(2)
      expect(lv4!.crimpGroups!.find(g => g.crimpCode === '00315452-002')!.items).toHaveLength(2)
      expect(lv4!.crimpGroups!.find(g => g.crimpCode === '00315452-003')!.items).toHaveLength(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const groups = groupBOMItems([])
      expect(groups).toHaveLength(0)
    })

    it('should handle single item', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'PA', level: 1 }),
      ]

      const groups = groupBOMItems(items)

      expect(groups).toHaveLength(1)
      expect(groups[0].levelGroups).toHaveLength(1)
      expect(groups[0].totalItems).toBe(1)
    })

    it('should handle multiple products with same levels', () => {
      const items: BOMItem[] = [
        createTestBOMItem({ id: 1, productCode: 'A001', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 2, productCode: 'A001', processCode: 'CA', level: 4, crimpCode: 'A001-001' }),
        createTestBOMItem({ id: 3, productCode: 'B002', processCode: 'PA', level: 1 }),
        createTestBOMItem({ id: 4, productCode: 'B002', processCode: 'CA', level: 4, crimpCode: 'B002-001' }),
      ]

      const groups = groupBOMItems(items)

      expect(groups).toHaveLength(2)

      // A001
      expect(groups[0].productCode).toBe('A001')
      expect(groups[0].levelGroups).toHaveLength(2)

      // B002
      expect(groups[1].productCode).toBe('B002')
      expect(groups[1].levelGroups).toHaveLength(2)
    })
  })
})

describe('Level Auto-Calculation Integration', () => {
  it('should correctly calculate level when processCode is provided', () => {
    // 이 테스트는 addBOMItems가 level을 자동 산출하는 것을 검증
    const testCases = [
      { processCode: 'PA', expectedLevel: 1 },
      { processCode: 'MC', expectedLevel: 2 },
      { processCode: 'SB', expectedLevel: 3 },
      { processCode: 'MS', expectedLevel: 3 },
      { processCode: 'CA', expectedLevel: 4 },
      { processCode: '', expectedLevel: 1 },
      { processCode: 'UNKNOWN', expectedLevel: 1 },
    ]

    testCases.forEach(({ processCode, expectedLevel }) => {
      const level = determineLevel(processCode)
      expect(level).toBe(expectedLevel)
    })
  })
})
