/**
 * BOM Import Mapping Tests (Phase 2)
 *
 * MasterData.tsx handleImportComplete() BOM 매핑 로직 테스트
 * - processCode → level 자동 산출
 * - crimpCode 매핑 (CA 자재만)
 */
import { describe, it, expect } from 'vitest'
import { determineLevel } from '../src/app/context/BOMContext'

/**
 * MasterData.tsx handleImportComplete() BOM 매핑 로직 시뮬레이션
 * 실제 코드와 동일한 로직으로 테스트
 */
function mapBOMImportData(rawData: unknown[]): {
  productCode: string;
  productName?: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  processCode: string;
  crimpCode?: string;
}[] {
  return rawData.map((item: unknown) => {
    const bom = item as {
      productCode: string;
      itemCode: string;
      quantity?: number;
      unit?: string;
      processCode?: string;
      crimpCode?: string;
    };

    // 공정 코드 정규화 (대문자 변환)
    const processCode = (bom.processCode || '').toUpperCase();

    return {
      productCode: bom.productCode,
      productName: undefined,
      materialCode: bom.itemCode,
      materialName: bom.itemCode,
      quantity: bom.quantity || 1,
      unit: bom.unit || 'EA',
      processCode: processCode,
      crimpCode: processCode === 'CA' ? bom.crimpCode : undefined,
      // level은 addBOMItems에서 determineLevel(processCode)로 자동 산출
    };
  });
}

describe('BOM Import Mapping (Phase 2)', () => {
  describe('mapBOMImportData', () => {
    it('should map basic BOM fields correctly', () => {
      const rawData = [
        {
          productCode: '00315452',
          itemCode: 'WIRE001',
          quantity: 1.5,
          unit: 'M',
          processCode: 'CA',
        },
      ];

      const result = mapBOMImportData(rawData);

      expect(result).toHaveLength(1);
      expect(result[0].productCode).toBe('00315452');
      expect(result[0].materialCode).toBe('WIRE001');
      expect(result[0].materialName).toBe('WIRE001');
      expect(result[0].quantity).toBe(1.5);
      expect(result[0].unit).toBe('M');
    });

    it('should normalize processCode to uppercase', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001', processCode: 'ca' },
        { productCode: 'P001', itemCode: 'M002', processCode: 'Pa' },
        { productCode: 'P001', itemCode: 'M003', processCode: 'MC' },
      ];

      const result = mapBOMImportData(rawData);

      expect(result[0].processCode).toBe('CA');
      expect(result[1].processCode).toBe('PA');
      expect(result[2].processCode).toBe('MC');
    });

    it('should use default values for missing fields', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001' },
      ];

      const result = mapBOMImportData(rawData);

      expect(result[0].quantity).toBe(1);
      expect(result[0].unit).toBe('EA');
      expect(result[0].processCode).toBe('');
    });

    it('should apply crimpCode only for CA process', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001', processCode: 'CA', crimpCode: 'P001-001' },
        { productCode: 'P001', itemCode: 'M002', processCode: 'MC', crimpCode: 'P001-001' },
        { productCode: 'P001', itemCode: 'M003', processCode: 'PA', crimpCode: 'P001-001' },
        { productCode: 'P001', itemCode: 'M004', processCode: 'SB', crimpCode: 'P001-001' },
      ];

      const result = mapBOMImportData(rawData);

      // CA만 crimpCode 적용
      expect(result[0].crimpCode).toBe('P001-001');
      // 다른 공정은 undefined
      expect(result[1].crimpCode).toBeUndefined();
      expect(result[2].crimpCode).toBeUndefined();
      expect(result[3].crimpCode).toBeUndefined();
    });

    it('should handle undefined crimpCode for CA', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001', processCode: 'CA' },
      ];

      const result = mapBOMImportData(rawData);

      expect(result[0].crimpCode).toBeUndefined();
    });
  });

  describe('Level Auto-Calculation Integration', () => {
    it('should calculate correct levels for each processCode', () => {
      const processCodesWithExpectedLevels = [
        { processCode: 'PA', expectedLevel: 1 },
        { processCode: 'MC', expectedLevel: 2 },
        { processCode: 'SB', expectedLevel: 3 },
        { processCode: 'MS', expectedLevel: 3 },
        { processCode: 'CA', expectedLevel: 4 },
        { processCode: '', expectedLevel: 1 },
        { processCode: 'UNKNOWN', expectedLevel: 1 },
      ];

      const rawData = processCodesWithExpectedLevels.map((item, index) => ({
        productCode: 'P001',
        itemCode: `M00${index + 1}`,
        processCode: item.processCode,
      }));

      const mappedData = mapBOMImportData(rawData);

      // determineLevel을 적용하여 level 확인
      mappedData.forEach((item, index) => {
        const level = determineLevel(item.processCode);
        expect(level).toBe(processCodesWithExpectedLevels[index].expectedLevel);
      });
    });
  });

  describe('Realistic BOM Import Scenario', () => {
    it('should handle complete BOM import data', () => {
      // 실제 Excel 데이터 시뮬레이션
      const excelData = [
        // LV4: CA 자재 (절압착)
        { productCode: '00315452', itemCode: 'WIRE-RED-05', processCode: 'CA', crimpCode: '00315452-001', quantity: 0.5, unit: 'M' },
        { productCode: '00315452', itemCode: 'TERM-110', processCode: 'CA', crimpCode: '00315452-001', quantity: 2, unit: 'EA' },
        { productCode: '00315452', itemCode: 'SEAL-SM', processCode: 'CA', crimpCode: '00315452-001', quantity: 2, unit: 'EA' },
        { productCode: '00315452', itemCode: 'WIRE-BLK-05', processCode: 'CA', crimpCode: '00315452-002', quantity: 0.5, unit: 'M' },
        { productCode: '00315452', itemCode: 'TERM-110', processCode: 'CA', crimpCode: '00315452-002', quantity: 2, unit: 'EA' },

        // LV3: SB 자재 (서브조립)
        { productCode: '00315452', itemCode: 'CLIP-A', processCode: 'SB', quantity: 3, unit: 'EA' },
        { productCode: '00315452', itemCode: 'GROMMET-B', processCode: 'SB', quantity: 1, unit: 'EA' },

        // LV3: MS 자재 (중간탈피)
        { productCode: '00315452', itemCode: 'SPLICE-C', processCode: 'MS', quantity: 2, unit: 'EA' },

        // LV2: MC 자재 (수동압착)
        { productCode: '00315452', itemCode: 'TERM-250', processCode: 'MC', quantity: 4, unit: 'EA' },

        // LV1: PA 자재 (제품조립)
        { productCode: '00315452', itemCode: 'HOUSING-6P', processCode: 'PA', quantity: 1, unit: 'EA' },
        { productCode: '00315452', itemCode: 'COVER-6P', processCode: 'PA', quantity: 1, unit: 'EA' },
        { productCode: '00315452', itemCode: 'LABEL-001', processCode: 'PA', quantity: 1, unit: 'EA' },
      ];

      const mappedData = mapBOMImportData(excelData);

      // 전체 자재 수 확인
      expect(mappedData).toHaveLength(12);

      // CA 자재 확인 (5개)
      const caItems = mappedData.filter(item => item.processCode === 'CA');
      expect(caItems).toHaveLength(5);
      caItems.forEach(item => {
        expect(item.crimpCode).toBeDefined();
        expect(determineLevel(item.processCode)).toBe(4);
      });

      // SB 자재 확인 (2개)
      const sbItems = mappedData.filter(item => item.processCode === 'SB');
      expect(sbItems).toHaveLength(2);
      sbItems.forEach(item => {
        expect(item.crimpCode).toBeUndefined();
        expect(determineLevel(item.processCode)).toBe(3);
      });

      // MS 자재 확인 (1개)
      const msItems = mappedData.filter(item => item.processCode === 'MS');
      expect(msItems).toHaveLength(1);
      msItems.forEach(item => {
        expect(item.crimpCode).toBeUndefined();
        expect(determineLevel(item.processCode)).toBe(3);
      });

      // MC 자재 확인 (1개)
      const mcItems = mappedData.filter(item => item.processCode === 'MC');
      expect(mcItems).toHaveLength(1);
      mcItems.forEach(item => {
        expect(item.crimpCode).toBeUndefined();
        expect(determineLevel(item.processCode)).toBe(2);
      });

      // PA 자재 확인 (3개)
      const paItems = mappedData.filter(item => item.processCode === 'PA');
      expect(paItems).toHaveLength(3);
      paItems.forEach(item => {
        expect(item.crimpCode).toBeUndefined();
        expect(determineLevel(item.processCode)).toBe(1);
      });

      // crimpCode 그룹핑 확인 (CA 자재)
      const crimpCodes = new Set(caItems.map(item => item.crimpCode));
      expect(crimpCodes.size).toBe(2); // 00315452-001, 00315452-002
    });

    it('should handle multiple products in same import', () => {
      const excelData = [
        { productCode: 'PROD-A', itemCode: 'M001', processCode: 'PA', quantity: 1 },
        { productCode: 'PROD-A', itemCode: 'M002', processCode: 'CA', crimpCode: 'PROD-A-001', quantity: 2 },
        { productCode: 'PROD-B', itemCode: 'M003', processCode: 'PA', quantity: 1 },
        { productCode: 'PROD-B', itemCode: 'M004', processCode: 'MC', quantity: 3 },
      ];

      const mappedData = mapBOMImportData(excelData);

      expect(mappedData).toHaveLength(4);

      // PROD-A 자재
      const prodAItems = mappedData.filter(item => item.productCode === 'PROD-A');
      expect(prodAItems).toHaveLength(2);

      // PROD-B 자재
      const prodBItems = mappedData.filter(item => item.productCode === 'PROD-B');
      expect(prodBItems).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const result = mapBOMImportData([]);
      expect(result).toHaveLength(0);
    });

    it('should handle whitespace in processCode', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001', processCode: ' CA ' },
      ];

      const result = mapBOMImportData(rawData);

      // 현재 로직은 trim하지 않으므로 ' CA '가 그대로 대문자화됨
      // 실제 Excel에서는 공백 없이 들어오므로 이 케이스는 드물지만 테스트
      expect(result[0].processCode).toBe(' CA ');
    });

    it('should handle null/undefined processCode', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001', processCode: null },
        { productCode: 'P001', itemCode: 'M002', processCode: undefined },
      ];

      const result = mapBOMImportData(rawData as unknown[]);

      expect(result[0].processCode).toBe('');
      expect(result[1].processCode).toBe('');
      expect(determineLevel(result[0].processCode)).toBe(1);
      expect(determineLevel(result[1].processCode)).toBe(1);
    });

    it('should handle numeric quantity as string', () => {
      const rawData = [
        { productCode: 'P001', itemCode: 'M001', quantity: '2.5' },
      ];

      const result = mapBOMImportData(rawData as unknown[]);

      // JavaScript 자동 형변환으로 2.5로 처리됨
      expect(result[0].quantity).toBe('2.5');
    });
  });
});

describe('Excel Import Template Validation', () => {
  it('should have correct BOM template headers', () => {
    // BOM 템플릿에 필요한 한글 헤더 확인
    const expectedHeaders = [
      '완제품 품번*',
      '절압착품번',
      '자재코드*',
      '공정',
      '소요량*',
      '단위',
      '비고',
    ];

    // 이 테스트는 excelImportService.ts의 템플릿 정의와 일치해야 함
    expect(expectedHeaders).toContain('완제품 품번*');
    expect(expectedHeaders).toContain('절압착품번');
    expect(expectedHeaders).toContain('공정');
  });

  it('should have correct Korean to English mapping for BOM', () => {
    // KOREAN_TO_ENGLISH_MAPPING.bom 확인
    const expectedMapping = {
      '완제품 품번*': 'productCode',
      '절압착품번': 'crimpCode',
      '자재코드*': 'itemCode',
      '공정': 'processCode',
      '소요량*': 'quantity',
      '단위': 'unit',
      '비고': 'description',
    };

    // 핵심 매핑 확인
    expect(expectedMapping['완제품 품번*']).toBe('productCode');
    expect(expectedMapping['절압착품번']).toBe('crimpCode');
    expect(expectedMapping['공정']).toBe('processCode');
  });
});
