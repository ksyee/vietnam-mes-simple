import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from 'react';

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
  updateMaterial: (material: Material) => void;
  deleteMaterial: (id: number) => void;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

// 초기 Mock Data (두 페이지의 데이터를 통합)
const INITIAL_MATERIALS: Material[] = [
  { id: 1, code: 'MAT-001', name: '전선 (2.5mm)', spec: '2.5mm / Red', category: '원자재', unit: 'M', stock: 20, safeStock: 100, desc: '기본 전원선', regDate: '2023-12-01' },
  { id: 2, code: 'MAT-002', name: '터미널 (Ring)', spec: 'R-Type / Ø4', category: '부자재', unit: 'EA', stock: 150, safeStock: 500, desc: '링 터미널', regDate: '2023-12-02' },
  { id: 3, code: 'MAT-003', name: '수축 튜브', spec: 'Ø3 / Black', category: '부자재', unit: 'M', stock: 50, safeStock: 50, desc: '절연 마감용', regDate: '2023-12-05' },
  { id: 4, code: 'MAT-004', name: '커넥터 (2P)', spec: 'Housing 2P', category: '부자재', unit: 'EA', stock: 0, safeStock: 300, desc: '전원 연결용', regDate: '2023-12-10' },
  { id: 5, code: 'MAT-005', name: '라벨 용지', spec: '40x20mm', category: '소모품', unit: 'Roll', stock: 1200, safeStock: 500, desc: '식별 라벨', regDate: '2023-12-11' },
];

export const MaterialProvider = ({ children }: PropsWithChildren) => {
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);

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

  const updateMaterial = (updatedMat: Material) => {
    setMaterials(materials.map(m => m.id === updatedMat.id ? updatedMat : m));
  };

  const deleteMaterial = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  return (
    <MaterialContext.Provider value={{ materials, addMaterial, updateMaterial, deleteMaterial }}>
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
