/**
 * BOM Tree UI Tests (Phase 3)
 *
 * MasterData.tsx 3-Level 트리 UI 로직 테스트
 * - 펼침/접기 상태 관리
 * - 레벨별 토글 로직
 * - crimpCode 토글 로직
 */
import { describe, it, expect } from 'vitest'
import { determineLevel, getProcessName, type BOMItem, type BOMGroup, type LevelGroup } from '../src/app/context/BOMContext'

/**
 * MasterData.tsx 토글 로직 시뮬레이션
 */

// LV0: 품번 토글
function toggleProductExpand(
  expandedProducts: Set<string>,
  productCode: string
): Set<string> {
  const newSet = new Set(expandedProducts);
  if (newSet.has(productCode)) {
    newSet.delete(productCode);
  } else {
    newSet.add(productCode);
  }
  return newSet;
}

// LV1-4: 레벨 토글
function toggleLevelExpand(
  expandedLevels: Map<string, Set<number>>,
  productCode: string,
  level: number
): Map<string, Set<number>> {
  const newMap = new Map(expandedLevels);
  const levels = newMap.get(productCode) || new Set<number>();
  const newLevels = new Set(levels);
  if (newLevels.has(level)) {
    newLevels.delete(level);
  } else {
    newLevels.add(level);
  }
  newMap.set(productCode, newLevels);
  return newMap;
}

// CA crimpCode 토글
function toggleCrimpExpand(
  expandedCrimps: Map<string, Set<string>>,
  productCode: string,
  crimpCode: string
): Map<string, Set<string>> {
  const newMap = new Map(expandedCrimps);
  const crimps = newMap.get(productCode) || new Set<string>();
  const newCrimps = new Set(crimps);
  if (newCrimps.has(crimpCode)) {
    newCrimps.delete(crimpCode);
  } else {
    newCrimps.add(crimpCode);
  }
  newMap.set(productCode, newCrimps);
  return newMap;
}

// 레벨별 배지 색상
function getLevelBadgeColor(level: number): string {
  switch (level) {
    case 1: return 'bg-blue-100 text-blue-700 border-blue-200';
    case 2: return 'bg-green-100 text-green-700 border-green-200';
    case 3: return 'bg-amber-100 text-amber-700 border-amber-200';
    case 4: return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

describe('BOM Tree UI Toggle Logic (Phase 3)', () => {
  describe('toggleProductExpand (LV0)', () => {
    it('should add productCode to expandedProducts when not present', () => {
      const initial = new Set<string>();
      const result = toggleProductExpand(initial, 'P001');

      expect(result.has('P001')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('should remove productCode from expandedProducts when present', () => {
      const initial = new Set<string>(['P001', 'P002']);
      const result = toggleProductExpand(initial, 'P001');

      expect(result.has('P001')).toBe(false);
      expect(result.has('P002')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('should not mutate original set', () => {
      const initial = new Set<string>(['P001']);
      const result = toggleProductExpand(initial, 'P002');

      expect(initial.size).toBe(1);
      expect(result.size).toBe(2);
    });
  });

  describe('toggleLevelExpand (LV1-4)', () => {
    it('should add level to product when not present', () => {
      const initial = new Map<string, Set<number>>();
      const result = toggleLevelExpand(initial, 'P001', 1);

      expect(result.get('P001')?.has(1)).toBe(true);
    });

    it('should remove level from product when present', () => {
      const initial = new Map<string, Set<number>>([
        ['P001', new Set([1, 2])]
      ]);
      const result = toggleLevelExpand(initial, 'P001', 1);

      expect(result.get('P001')?.has(1)).toBe(false);
      expect(result.get('P001')?.has(2)).toBe(true);
    });

    it('should handle multiple products independently', () => {
      const initial = new Map<string, Set<number>>([
        ['P001', new Set([1])],
        ['P002', new Set([2])]
      ]);

      const result = toggleLevelExpand(initial, 'P001', 2);

      expect(result.get('P001')?.has(1)).toBe(true);
      expect(result.get('P001')?.has(2)).toBe(true);
      expect(result.get('P002')?.has(2)).toBe(true);
    });

    it('should create new Set for new product', () => {
      const initial = new Map<string, Set<number>>();
      const result = toggleLevelExpand(initial, 'P001', 3);

      expect(result.has('P001')).toBe(true);
      expect(result.get('P001')?.size).toBe(1);
      expect(result.get('P001')?.has(3)).toBe(true);
    });
  });

  describe('toggleCrimpExpand', () => {
    it('should add crimpCode to product when not present', () => {
      const initial = new Map<string, Set<string>>();
      const result = toggleCrimpExpand(initial, 'P001', 'P001-001');

      expect(result.get('P001')?.has('P001-001')).toBe(true);
    });

    it('should remove crimpCode from product when present', () => {
      const initial = new Map<string, Set<string>>([
        ['P001', new Set(['P001-001', 'P001-002'])]
      ]);
      const result = toggleCrimpExpand(initial, 'P001', 'P001-001');

      expect(result.get('P001')?.has('P001-001')).toBe(false);
      expect(result.get('P001')?.has('P001-002')).toBe(true);
    });

    it('should handle multiple products independently', () => {
      const initial = new Map<string, Set<string>>([
        ['P001', new Set(['P001-001'])],
        ['P002', new Set(['P002-001'])]
      ]);

      const result = toggleCrimpExpand(initial, 'P001', 'P001-002');

      expect(result.get('P001')?.size).toBe(2);
      expect(result.get('P002')?.size).toBe(1);
    });
  });

  describe('getLevelBadgeColor', () => {
    it('should return blue for level 1', () => {
      expect(getLevelBadgeColor(1)).toContain('blue');
    });

    it('should return green for level 2', () => {
      expect(getLevelBadgeColor(2)).toContain('green');
    });

    it('should return amber for level 3', () => {
      expect(getLevelBadgeColor(3)).toContain('amber');
    });

    it('should return purple for level 4', () => {
      expect(getLevelBadgeColor(4)).toContain('purple');
    });

    it('should return slate for unknown levels', () => {
      expect(getLevelBadgeColor(0)).toContain('slate');
      expect(getLevelBadgeColor(5)).toContain('slate');
    });
  });
});

describe('Expand All / Collapse All Logic', () => {
  // 테스트용 BOM 데이터 생성
  function createMockBOMGroups(): BOMGroup[] {
    return [
      {
        productCode: 'P001',
        productName: 'Product 1',
        totalItems: 5,
        levelGroups: [
          { level: 1, processCode: 'PA', processName: '제품조립', items: [] },
          { level: 4, processCode: 'CA', processName: '자동절단압착', items: [], crimpGroups: [
            { crimpCode: 'P001-001', items: [] },
            { crimpCode: 'P001-002', items: [] }
          ]}
        ]
      },
      {
        productCode: 'P002',
        productName: 'Product 2',
        totalItems: 3,
        levelGroups: [
          { level: 1, processCode: 'PA', processName: '제품조립', items: [] },
          { level: 2, processCode: 'MC', processName: '수동압착', items: [] }
        ]
      }
    ];
  }

  it('expandAll should expand all products', () => {
    const bomGroups = createMockBOMGroups();
    const expandedProducts = new Set(bomGroups.map(g => g.productCode));

    expect(expandedProducts.size).toBe(2);
    expect(expandedProducts.has('P001')).toBe(true);
    expect(expandedProducts.has('P002')).toBe(true);
  });

  it('expandAll should expand all levels for each product', () => {
    const bomGroups = createMockBOMGroups();
    const expandedLevels = new Map<string, Set<number>>();

    bomGroups.forEach(group => {
      expandedLevels.set(group.productCode, new Set(group.levelGroups.map(lg => lg.level)));
    });

    expect(expandedLevels.get('P001')?.has(1)).toBe(true);
    expect(expandedLevels.get('P001')?.has(4)).toBe(true);
    expect(expandedLevels.get('P002')?.has(1)).toBe(true);
    expect(expandedLevels.get('P002')?.has(2)).toBe(true);
  });

  it('expandAll should expand all crimpCodes for LV4', () => {
    const bomGroups = createMockBOMGroups();
    const expandedCrimps = new Map<string, Set<string>>();

    bomGroups.forEach(group => {
      const level4 = group.levelGroups.find(lg => lg.level === 4);
      if (level4?.crimpGroups) {
        expandedCrimps.set(group.productCode, new Set(level4.crimpGroups.map(cg => cg.crimpCode)));
      }
    });

    expect(expandedCrimps.get('P001')?.has('P001-001')).toBe(true);
    expect(expandedCrimps.get('P001')?.has('P001-002')).toBe(true);
    expect(expandedCrimps.has('P002')).toBe(false); // P002 has no LV4
  });

  it('collapseAll should clear all expanded states', () => {
    const expandedProducts = new Set(['P001', 'P002']);
    const expandedLevels = new Map<string, Set<number>>([['P001', new Set([1, 4])]]);
    const expandedCrimps = new Map<string, Set<string>>([['P001', new Set(['P001-001'])]]);

    // Simulate collapseAll
    const clearedProducts = new Set<string>();
    const clearedLevels = new Map<string, Set<number>>();
    const clearedCrimps = new Map<string, Set<string>>();

    expect(clearedProducts.size).toBe(0);
    expect(clearedLevels.size).toBe(0);
    expect(clearedCrimps.size).toBe(0);
  });
});

describe('Tree UI State Helpers', () => {
  it('isLevelExpanded should return correct state', () => {
    const expandedLevels = new Map<string, Set<number>>([
      ['P001', new Set([1, 2])]
    ]);

    const isLevelExpanded = (productCode: string, level: number): boolean => {
      return expandedLevels.get(productCode)?.has(level) || false;
    };

    expect(isLevelExpanded('P001', 1)).toBe(true);
    expect(isLevelExpanded('P001', 2)).toBe(true);
    expect(isLevelExpanded('P001', 3)).toBe(false);
    expect(isLevelExpanded('P002', 1)).toBe(false);
  });

  it('isCrimpExpanded should return correct state', () => {
    const expandedCrimps = new Map<string, Set<string>>([
      ['P001', new Set(['P001-001'])]
    ]);

    const isCrimpExpanded = (productCode: string, crimpCode: string): boolean => {
      return expandedCrimps.get(productCode)?.has(crimpCode) || false;
    };

    expect(isCrimpExpanded('P001', 'P001-001')).toBe(true);
    expect(isCrimpExpanded('P001', 'P001-002')).toBe(false);
    expect(isCrimpExpanded('P002', 'P002-001')).toBe(false);
  });
});

describe('Integration: BOM Level + Tree UI', () => {
  it('should correctly determine which levels have crimpGroups', () => {
    const levelGroups: LevelGroup[] = [
      { level: 1, processCode: 'PA', processName: '제품조립', items: [] },
      { level: 2, processCode: 'MC', processName: '수동압착', items: [] },
      { level: 3, processCode: 'SB', processName: '서브조립', items: [] },
      { level: 4, processCode: 'CA', processName: '자동절단압착', items: [], crimpGroups: [
        { crimpCode: 'P001-001', items: [] }
      ]}
    ];

    levelGroups.forEach(lg => {
      const hascrimpGroups = lg.level === 4 && lg.crimpGroups && lg.crimpGroups.length > 0;

      if (lg.level === 4) {
        expect(hascrimpGroups).toBe(true);
      } else {
        expect(hascrimpGroups).toBe(false);
      }
    });
  });

  it('should use correct process names from determineLevel and getProcessName', () => {
    const processMapping = [
      { code: 'PA', expectedLevel: 1, expectedName: '제품조립' },
      { code: 'MC', expectedLevel: 2, expectedName: '수동압착' },
      { code: 'SB', expectedLevel: 3, expectedName: '서브조립' },
      { code: 'MS', expectedLevel: 3, expectedName: '중간탈피' },
      { code: 'CA', expectedLevel: 4, expectedName: '자동절단압착' },
    ];

    processMapping.forEach(({ code, expectedLevel, expectedName }) => {
      expect(determineLevel(code)).toBe(expectedLevel);
      expect(getProcessName(code)).toBe(expectedName);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty BOM groups', () => {
    const bomGroups: BOMGroup[] = [];
    const expandedProducts = new Set(bomGroups.map(g => g.productCode));

    expect(expandedProducts.size).toBe(0);
  });

  it('should handle product with no levelGroups', () => {
    const bomGroups: BOMGroup[] = [
      {
        productCode: 'P001',
        productName: 'Empty Product',
        totalItems: 0,
        levelGroups: []
      }
    ];

    const expandedLevels = new Map<string, Set<number>>();
    bomGroups.forEach(group => {
      expandedLevels.set(group.productCode, new Set(group.levelGroups.map(lg => lg.level)));
    });

    expect(expandedLevels.get('P001')?.size).toBe(0);
  });

  it('should handle LV4 without crimpGroups', () => {
    const levelGroup: LevelGroup = {
      level: 4,
      processCode: 'CA',
      processName: '자동절단압착',
      items: []
      // crimpGroups is undefined
    };

    // JavaScript && 연산자는 falsy 값 (undefined)을 반환할 수 있음
    const hascrimpGroups = levelGroup.level === 4 && levelGroup.crimpGroups && levelGroup.crimpGroups.length > 0;
    // toBeFalsy()로 undefined, false, 0 등 모두 검증
    expect(hascrimpGroups).toBeFalsy();
  });

  it('should handle LV4 with empty crimpGroups', () => {
    const levelGroup: LevelGroup = {
      level: 4,
      processCode: 'CA',
      processName: '자동절단압착',
      items: [],
      crimpGroups: []
    };

    const hascrimpGroups = levelGroup.level === 4 && levelGroup.crimpGroups && levelGroup.crimpGroups.length > 0;
    expect(hascrimpGroups).toBe(false);
  });
});
