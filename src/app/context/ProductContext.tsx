import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

// 완제품 데이터 타입 정의
export interface Product {
  id: number;
  code: string;          // 품번
  name: string;          // 품명
  spec?: string;         // 규격
  type: string;          // 유형 (FINISHED, SEMI 등)
  processCode?: string;  // 공정 코드
  crimpCode?: string;    // 압착 코드
  description?: string;  // 설명
  regDate: string;       // 등록일
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'regDate'>) => void;
  addProducts: (products: Omit<Product, 'id' | 'regDate'>[]) => number; // 일괄 등록
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  resetProducts: () => number;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// 초기 데이터 없음
const INITIAL_PRODUCTS: Product[] = [];

export const ProductProvider = ({ children }: PropsWithChildren) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const addProduct = (newProd: Omit<Product, 'id' | 'regDate'>) => {
    const id = Math.max(...products.map(p => p.id), 0) + 1;
    const product: Product = {
      ...newProd,
      id,
      regDate: new Date().toISOString().split('T')[0],
    };
    setProducts([...products, product]);
  };

  // 일괄 등록 함수
  const addProducts = (newProds: Omit<Product, 'id' | 'regDate'>[]): number => {
    const startId = Math.max(...products.map(p => p.id), 0) + 1;
    const today = new Date().toISOString().split('T')[0];

    const productsToAdd: Product[] = newProds.map((prod, index) => ({
      ...prod,
      id: startId + index,
      regDate: today,
    }));

    setProducts(prev => [...prev, ...productsToAdd]);
    return productsToAdd.length;
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts(products.map(p => p.id === updatedProd.id ? updatedProd : p));
  };

  const deleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const resetProducts = () => {
    const count = products.length;
    setProducts([]);
    return count;
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      addProducts,
      updateProduct,
      deleteProduct,
      resetProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
