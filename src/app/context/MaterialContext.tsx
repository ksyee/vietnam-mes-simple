import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';

// 자재 데이터 타입 정의 (MasterData와 MaterialStock의 필드 통합)
export interface Material {
  id: number;
  code: string;
  name: string;
  spec: string;       // 규격
  category: string;   // 분류 (자재 유형)
  unit: string;       // 단위
  stock: number;      // 현재고
  safeStock: number;  // 안전 재고
  desc: string;       // 설명/비고
  regDate: string;    // 등록일
  status?: 'good' | 'warning' | 'danger' | 'exhausted'; // UI용 상태 (계산됨)
}

interface MaterialContextType {
  materials: Material[];
  addMaterial: (material: Omit<Material, 'id' | 'stock' | 'regDate'>) => void;
  addMaterials: (materials: Omit<Material, 'id' | 'stock' | 'regDate'>[]) => number; // 일괄 등록
  updateMaterial: (material: Material) => void;
  deleteMaterial: (id: number) => void;
  resetMaterials: () => number; // 초기화 함수 추가
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

// localStorage 키
const STORAGE_KEY = 'vietnam_mes_materials';

// localStorage에서 데이터 로드
function loadFromStorage(): Material[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('MaterialContext: localStorage 로드 실패', e);
  }
  return [];
}

// localStorage에 데이터 저장
function saveToStorage(materials: Material[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
  } catch (e) {
    console.error('MaterialContext: localStorage 저장 실패', e);
  }
}

export const MaterialProvider = ({ children }: PropsWithChildren) => {
  // 초기 로드 시 localStorage에서 데이터 복원
  const [materials, setMaterials] = useState<Material[]>(() => loadFromStorage());

  // materials 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(materials);
  }, [materials]);

  const addMaterial = (newMat: Omit<Material, 'id' | 'stock' | 'regDate'>) => {
    const id = Math.max(...materials.map(m => m.id), 0) + 1;
    const material: Material = {
      ...newMat,
      id,
      stock: 0, // 신규 자재는 재고 0으로 시작
      regDate: new Date().toISOString().split('T')[0],
    };
    setMaterials([...materials, material]);
  };

  // 일괄 등록 함수 (React state batching 문제 해결)
  const addMaterials = (newMats: Omit<Material, 'id' | 'stock' | 'regDate'>[]): number => {
    const today = new Date().toISOString().split('T')[0];

    setMaterials(prev => {
      const startId = Math.max(...prev.map(m => m.id), 0) + 1;
      const materialsToAdd: Material[] = newMats.map((mat, index) => ({
        ...mat,
        id: startId + index,
        stock: 0,
        regDate: today,
      }));
      return [...prev, ...materialsToAdd];
    });

    return newMats.length;
  };

  const updateMaterial = (updatedMat: Material) => {
    setMaterials(materials.map(m => m.id === updatedMat.id ? updatedMat : m));
  };

  const deleteMaterial = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const resetMaterials = () => {
    const count = materials.length;
    setMaterials([]);
    return count;
  };

  return (
    <MaterialContext.Provider value={{ materials, addMaterial, addMaterials, updateMaterial, deleteMaterial, resetMaterials }}>
      {children}
    </MaterialContext.Provider>
  );
};

export const useMaterial = () => {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterial must be used within a MaterialProvider');
  }
  return context;
};
