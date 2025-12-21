import React, { createContext, useContext, useState, useMemo, PropsWithChildren } from 'react';

// BOM 아이템 타입 정의
export interface BOMItem {
  id: number;
  productCode: string;     // 완제품/반제품 품번
  productName?: string;    // 완제품/반제품 품명
  materialCode: string;    // 자재 품번
  materialName: string;    // 자재 품명
  quantity: number;        // 소요량
  unit: string;            // 단위
  level?: number;          // BOM 레벨 (1: 직접 자재, 2+: 하위 자재)
  description?: string;    // 설명
  regDate: string;         // 등록일
}

// 품번별 그룹핑된 BOM 구조
export interface BOMGroup {
  productCode: string;
  productName?: string;
  items: BOMItem[];
}

interface BOMContextType {
  bomItems: BOMItem[];
  bomGroups: BOMGroup[];  // 품번별로 그룹핑된 데이터
  addBOMItem: (item: Omit<BOMItem, 'id' | 'regDate'>) => void;
  addBOMItems: (items: Omit<BOMItem, 'id' | 'regDate'>[]) => number;
  updateBOMItem: (item: BOMItem) => void;
  deleteBOMItem: (id: number) => void;
  deleteBOMByProduct: (productCode: string) => number;
  getBOMByProduct: (productCode: string) => BOMItem[];
  resetBOM: () => number;
}

const BOMContext = createContext<BOMContextType | undefined>(undefined);

const INITIAL_BOM: BOMItem[] = [];

export const BOMProvider = ({ children }: PropsWithChildren) => {
  const [bomItems, setBomItems] = useState<BOMItem[]>(INITIAL_BOM);

  // 품번별로 그룹핑 (useMemo로 최적화)
  const bomGroups = useMemo<BOMGroup[]>(() => {
    const groupMap = new Map<string, BOMGroup>();

    bomItems.forEach(item => {
      if (!groupMap.has(item.productCode)) {
        groupMap.set(item.productCode, {
          productCode: item.productCode,
          productName: item.productName,
          items: []
        });
      }
      groupMap.get(item.productCode)!.items.push(item);
    });

    return Array.from(groupMap.values()).sort((a, b) =>
      a.productCode.localeCompare(b.productCode)
    );
  }, [bomItems]);

  const addBOMItem = (newItem: Omit<BOMItem, 'id' | 'regDate'>) => {
    const id = Math.max(...bomItems.map(b => b.id), 0) + 1;
    const item: BOMItem = {
      ...newItem,
      id,
      regDate: new Date().toISOString().split('T')[0],
    };
    setBomItems([...bomItems, item]);
  };

  // 일괄 등록 함수
  const addBOMItems = (newItems: Omit<BOMItem, 'id' | 'regDate'>[]): number => {
    const today = new Date().toISOString().split('T')[0];

    setBomItems(prev => {
      const startId = Math.max(...prev.map(b => b.id), 0) + 1;
      const itemsToAdd: BOMItem[] = newItems.map((item, index) => ({
        ...item,
        id: startId + index,
        regDate: today,
      }));
      return [...prev, ...itemsToAdd];
    });

    return newItems.length;
  };

  const updateBOMItem = (updatedItem: BOMItem) => {
    setBomItems(bomItems.map(b => b.id === updatedItem.id ? updatedItem : b));
  };

  const deleteBOMItem = (id: number) => {
    setBomItems(bomItems.filter(b => b.id !== id));
  };

  // 특정 품번의 BOM 전체 삭제
  const deleteBOMByProduct = (productCode: string): number => {
    const toDelete = bomItems.filter(b => b.productCode === productCode);
    setBomItems(bomItems.filter(b => b.productCode !== productCode));
    return toDelete.length;
  };

  // 특정 품번의 BOM 조회
  const getBOMByProduct = (productCode: string): BOMItem[] => {
    return bomItems.filter(b => b.productCode === productCode);
  };

  const resetBOM = () => {
    const count = bomItems.length;
    setBomItems([]);
    return count;
  };

  return (
    <BOMContext.Provider value={{
      bomItems,
      bomGroups,
      addBOMItem,
      addBOMItems,
      updateBOMItem,
      deleteBOMItem,
      deleteBOMByProduct,
      getBOMByProduct,
      resetBOM
    }}>
      {children}
    </BOMContext.Provider>
  );
};

export const useBOM = () => {
  const context = useContext(BOMContext);
  if (!context) {
    throw new Error('useBOM must be used within a BOMProvider');
  }
  return context;
};
