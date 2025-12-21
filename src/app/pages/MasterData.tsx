import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Plus, Search, Edit2, Trash2, MoreHorizontal, FileDown, Upload, FolderTree, Package, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useMaterial, Material } from '../context/MaterialContext';
import { useProduct, Product } from '../context/ProductContext';
import { useBOM } from '../context/BOMContext';
import { downloadImportTemplate } from '@/services/excelImportService';
import { ExcelImportDialog, type ImportType } from '@/app/components/dialogs/ExcelImportDialog';

export const MasterData = () => {
  const { type } = useParams<{ type: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  
  // Use Global Context
  const { materials, addMaterial, addMaterials, updateMaterial, deleteMaterial } = useMaterial();
  const { products, addProduct, addProducts, updateProduct, deleteProduct } = useProduct();
  const { bomItems, bomGroups, addBOMItems, deleteBOMItem, deleteBOMByProduct } = useBOM();

  // Product state
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // BOM state - 펼쳐진 품번 목록
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const getTitle = () => {
    switch (type) {
      case 'product': return '완제품 관리 (Product Master)';
      case 'material': return '자재 관리 (Material Master)';
      case 'bom': return 'BOM 관리 (Bill of Materials)';
      case 'user': return '사용자 관리 (User Management)';
      default: return '기준 정보 관리';
    }
  };

  const handleEdit = (item: Material) => {
    setCurrentMaterial({ ...item });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentMaterial({
      id: 0, // ID will be assigned by context
      code: '',
      name: '',
      spec: '',
      unit: 'EA',
      category: '원자재', // Default category
      safeStock: 0,
      stock: 0,
      desc: '',
      regDate: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterial) return;

    if (currentMaterial.id > 0) {
      // Edit existing
      updateMaterial(currentMaterial);
      toast.success(`${currentMaterial.name} 정보가 수정되었습니다.`);
    } else {
      // Add new
      addMaterial({
        code: currentMaterial.code,
        name: currentMaterial.name,
        spec: currentMaterial.spec,
        category: currentMaterial.category || '원자재', // Map type to category
        unit: currentMaterial.unit,
        safeStock: currentMaterial.safeStock,
        desc: currentMaterial.desc
      });
      toast.success('새로운 자재가 등록되었습니다.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteMaterial(id);
    toast.success('자재가 삭제되었습니다.');
  };

  const handleDownloadTemplate = () => {
    const templateType = type as 'product' | 'material' | 'bom'
    if (templateType === 'product' || templateType === 'material' || templateType === 'bom') {
      downloadImportTemplate(templateType)
      toast.success('양식 파일이 다운로드되었습니다.')
    } else {
      toast.info('이 유형은 템플릿이 없습니다.')
    }
  };

  const handleUploadClick = () => {
    const validTypes = ['product', 'material', 'bom'];
    if (validTypes.includes(type || '')) {
      setIsUploadDialogOpen(true);
    } else {
      toast.info('이 유형은 업로드가 지원되지 않습니다.');
    }
  };

  const handleImportComplete = (result: { success: boolean; importedRows: number; errors: unknown[]; data?: unknown[] }) => {
    // Import된 데이터를 Context에 추가
    if (result.data && result.data.length > 0) {
      if (type === 'product') {
        const productData = result.data as Omit<Product, 'id' | 'regDate'>[];
        const addedCount = addProducts(productData);
        toast.success(`${addedCount}건이 등록되었습니다.`);
      } else if (type === 'material') {
        // 자재 일괄 등록 (addMaterials 사용 - React state batching 문제 해결)
        const materialData = result.data.map((item: unknown) => {
          const mat = item as { code: string; name: string; spec?: string; category?: string; unit?: string; safeStock?: number; description?: string };
          return {
            code: mat.code,
            name: mat.name,
            spec: mat.spec || '',
            category: mat.category || '원자재',
            unit: mat.unit || 'EA',
            safeStock: mat.safeStock || 0,
            desc: mat.description || ''
          };
        });
        const addedCount = addMaterials(materialData);
        toast.success(`${addedCount}건이 등록되었습니다.`);
      } else if (type === 'bom') {
        // BOM 일괄 등록 (Excel 필드명: productCode, itemCode, quantity, unit, processCode)
        const bomData = result.data.map((item: unknown) => {
          const bom = item as { productCode: string; itemCode: string; itemType?: string; quantity: number; unit?: string; processCode?: string };
          return {
            productCode: bom.productCode,
            productName: undefined, // Excel에서 품명은 가져오지 않음
            materialCode: bom.itemCode, // itemCode → materialCode 매핑
            materialName: bom.itemCode, // 자재명은 품번으로 대체 (실제 서비스에서 조회 필요)
            quantity: bom.quantity || 1,
            unit: bom.unit || 'EA',
            level: 1, // 기본 레벨
            description: bom.processCode ? `공정: ${bom.processCode}` : undefined
          };
        });
        const addedCount = addBOMItems(bomData);
        toast.success(`${addedCount}건이 등록되었습니다.`);
      } else {
        toast.success(`${result.importedRows}건이 파싱되었습니다. (저장 기능 미구현)`);
      }
    } else if (result.success) {
      toast.success(`${result.importedRows}건이 등록되었습니다.`);
    } else {
      toast.warning(`${result.importedRows}건 파싱, ${result.errors.length}건 오류 발생`);
    }
  };

  // BOM 펼치기/접기 토글
  const toggleProductExpand = (productCode: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productCode)) {
        newSet.delete(productCode);
      } else {
        newSet.add(productCode);
      }
      return newSet;
    });
  };

  // 전체 펼치기/접기
  const expandAll = () => {
    setExpandedProducts(new Set(bomGroups.map(g => g.productCode)));
  };

  const collapseAll = () => {
    setExpandedProducts(new Set());
  };

  // Product handlers
  const handleEditProduct = (item: Product) => {
    setCurrentProduct({ ...item });
    setIsProductModalOpen(true);
  };

  const handleAddNewProduct = () => {
    setCurrentProduct({
      id: 0,
      code: '',
      name: '',
      spec: '',
      type: 'FINISHED',
      description: '',
      regDate: ''
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    if (currentProduct.id > 0) {
      updateProduct(currentProduct);
      toast.success(`${currentProduct.name} 정보가 수정되었습니다.`);
    } else {
      addProduct({
        code: currentProduct.code,
        name: currentProduct.name,
        spec: currentProduct.spec,
        type: currentProduct.type || 'FINISHED',
        processCode: currentProduct.processCode,
        crimpCode: currentProduct.crimpCode,
        description: currentProduct.description
      });
      toast.success('새로운 완제품이 등록되었습니다.');
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: number) => {
    deleteProduct(id);
    toast.success('완제품이 삭제되었습니다.');
  };

  const renderMaterialTable = () => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">자재 목록</CardTitle>
          <CardDescription>재고 관리의 기준이 되는 자재 정보를 관리합니다.</CardDescription>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="자재명 또는 품번 검색..." className="pl-8" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">자재 품번</TableHead>
              <TableHead>품명</TableHead>
              <TableHead>규격/사양</TableHead>
              <TableHead className="text-center">단위</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="text-right">안전 재고</TableHead>
              <TableHead>설명</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-slate-500">{item.spec}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-normal">{item.unit}</Badge>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right font-medium text-blue-600">
                  {item.safeStock.toLocaleString()}
                </TableCell>
                <TableCell className="text-slate-500 truncate max-w-[150px]">{item.desc}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Edit2 className="mr-2 h-4 w-4" /> 정보 수정
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderProductTable = () => (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base">완제품 목록</CardTitle>
          <CardDescription>완제품 품번 정보를 관리합니다. ({products.length}건)</CardDescription>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="품번 또는 품명 검색..." className="pl-8" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">품번</TableHead>
              <TableHead>품명</TableHead>
              <TableHead>규격</TableHead>
              <TableHead className="text-center">유형</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  등록된 품번이 없습니다. 신규 등록 버튼을 눌러 추가하세요.
                </TableCell>
              </TableRow>
            ) : (
              products.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-slate-500">{item.spec || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-normal">
                      {item.type === 'FINISHED' ? '완제품' : item.type === 'SEMI' ? '반제품' : item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 truncate max-w-[200px]">{item.description || '-'}</TableCell>
                  <TableCell className="text-slate-500">{item.regDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProduct(item)}>
                          <Edit2 className="mr-2 h-4 w-4" /> 정보 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(item.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> 삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (type === 'product') {
      return renderProductTable();
    }

    if (type === 'material') {
      return renderMaterialTable();
    }

    if (type === 'bom') {
      return (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-blue-600" />
                BOM 구조 목록
              </CardTitle>
              <CardDescription>
                완제품/반제품별 자재 구성을 관리합니다. ({bomGroups.length}개 품번, {bomItems.length}개 자재)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll} disabled={bomGroups.length === 0}>
                전체 펼치기
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} disabled={bomGroups.length === 0}>
                전체 접기
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {bomGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FolderTree size={48} className="mx-auto mb-4 opacity-20" />
                <p>등록된 BOM이 없습니다.</p>
                <p className="text-sm mt-2">양식 다운로드 후 Excel로 업로드하세요.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bomGroups.map((group) => {
                  const isExpanded = expandedProducts.has(group.productCode);
                  return (
                    <div key={group.productCode} className="bg-white">
                      {/* 품번 헤더 (클릭하여 펼치기/접기) */}
                      <button
                        onClick={() => toggleProductExpand(group.productCode)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                          <div>
                            <span className="font-mono font-semibold text-blue-600">{group.productCode}</span>
                            {group.productName && (
                              <span className="ml-2 text-slate-600">{group.productName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-normal">
                            {group.items.length}개 자재
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const count = deleteBOMByProduct(group.productCode);
                                  toast.success(`${group.productCode} BOM ${count}건이 삭제되었습니다.`);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> 이 품번 BOM 삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </button>

                      {/* 하위 자재 목록 (펼쳐졌을 때만 표시) */}
                      {isExpanded && (
                        <div className="bg-slate-50 border-t border-slate-100">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-100/50">
                                <TableHead className="w-[50px] pl-12">Lv</TableHead>
                                <TableHead className="w-[120px]">자재 품번</TableHead>
                                <TableHead>자재명</TableHead>
                                <TableHead className="text-right w-[100px]">소요량</TableHead>
                                <TableHead className="w-[80px]">단위</TableHead>
                                <TableHead>비고</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-100/50">
                                  <TableCell className="pl-12">
                                    <Badge variant="outline" className="font-mono text-xs">
                                      L{item.level || 1}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{item.materialCode}</TableCell>
                                  <TableCell>{item.materialName}</TableCell>
                                  <TableCell className="text-right font-medium text-blue-600">
                                    {item.quantity.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-normal">{item.unit}</Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-500 text-sm">{item.description || '-'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => {
                                        deleteBOMItem(item.id);
                                        toast.success('자재가 삭제되었습니다.');
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Default Fallback for other types (product, user) - 아직 서비스 미연동
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">데이터 목록</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="검색어 입력..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>완제품 품번</TableHead>
                <TableHead>품명</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  {type === 'product' && '등록된 품번이 없습니다. 신규 등록 버튼을 눌러 추가하세요.'}
                  {type === 'user' && '등록된 사용자가 없습니다. (admin 제외)'}
                  {type !== 'product' && type !== 'user' && '데이터가 없습니다.'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{getTitle()}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" /> 양식
          </Button>
          <Button variant="outline" onClick={handleUploadClick}>
            <Upload className="mr-2 h-4 w-4" /> 업로드
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
            if (type === 'material') handleAddNew();
            else if (type === 'product') handleAddNewProduct();
            else toast.info('이 기능은 현재 자재/완제품 관리에서만 사용할 수 있습니다.');
          }}>
            <Plus className="mr-2 h-4 w-4" /> 신규 등록
          </Button>
        </div>
      </div>

      {renderContent()}

      {/* Material Edit/Create Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentMaterial?.id ? '자재 정보 수정' : '신규 자재 등록'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">자재 품번</Label>
                  <Input 
                    id="code" 
                    value={currentMaterial?.code || ''} 
                    onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, code: e.target.value} : null)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">자재 유형</Label>
                  <Input
                    id="category"
                    value={currentMaterial?.category || ''}
                    onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, category: e.target.value} : null)}
                    placeholder="예: 원자재, 부자재"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">품명</Label>
                <Input 
                  id="name" 
                  value={currentMaterial?.name || ''} 
                  onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, name: e.target.value} : null)}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spec">규격/사양</Label>
                  <Input 
                    id="spec" 
                    value={currentMaterial?.spec || ''} 
                    onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, spec: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">단위</Label>
                  <Input 
                    id="unit" 
                    value={currentMaterial?.unit || ''} 
                    onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, unit: e.target.value} : null)}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="safeStock" className="font-semibold text-slate-700">안전 재고 (알림 기준)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    id="safeStock" 
                    type="number"
                    className="bg-white"
                    value={currentMaterial?.safeStock || 0} 
                    onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, safeStock: parseInt(e.target.value)} : null)}
                  />
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {currentMaterial?.unit || 'EA'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  * 재고량이 이 수치보다 낮아지면 대시보드에 알림이 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">비고 / 설명</Label>
                <Input 
                  id="desc" 
                  value={currentMaterial?.desc || ''} 
                  onChange={(e) => setCurrentMaterial(prev => prev ? {...prev, desc: e.target.value} : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> 저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Edit/Create Dialog */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentProduct?.id ? '완제품 정보 수정' : '신규 완제품 등록'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">품번 *</Label>
                  <Input
                    id="productCode"
                    value={currentProduct?.code || ''}
                    onChange={(e) => setCurrentProduct(prev => prev ? {...prev, code: e.target.value} : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productType">유형</Label>
                  <Input
                    id="productType"
                    value={currentProduct?.type || 'FINISHED'}
                    onChange={(e) => setCurrentProduct(prev => prev ? {...prev, type: e.target.value} : null)}
                    placeholder="FINISHED, SEMI"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">품명 *</Label>
                <Input
                  id="productName"
                  value={currentProduct?.name || ''}
                  onChange={(e) => setCurrentProduct(prev => prev ? {...prev, name: e.target.value} : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productSpec">규격/사양</Label>
                <Input
                  id="productSpec"
                  value={currentProduct?.spec || ''}
                  onChange={(e) => setCurrentProduct(prev => prev ? {...prev, spec: e.target.value} : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productDesc">설명</Label>
                <Input
                  id="productDesc"
                  value={currentProduct?.description || ''}
                  onChange={(e) => setCurrentProduct(prev => prev ? {...prev, description: e.target.value} : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsProductModalOpen(false)}>취소</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> 저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        importType={(type || 'material') as ImportType}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};
