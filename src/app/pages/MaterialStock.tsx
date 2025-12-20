import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Search, Filter, Download } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useMaterial } from '../context/MaterialContext';
import { downloadExcel } from '@/lib/excelUtils';
import { toast } from 'sonner';

export const MaterialStock = () => {
  const [showExhausted, setShowExhausted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use Global Context
  const { materials } = useMaterial();

  const getStatus = (stock: number, safeStock: number) => {
    if (stock === 0) return 'exhausted';
    if (stock < safeStock * 0.3) return 'danger'; // 30% 미만 위험
    if (stock < safeStock) return 'warning'; // 안전재고 미만 경고
    return 'good';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'good': return '정상';
      case 'warning': return '경고';
      case 'danger': return '위험';
      case 'exhausted': return '소진';
      default: return status;
    }
  };

  const handleDownloadExcel = () => {
    const exportData = materials.map(item => ({
      '상태': getStatusText(getStatus(item.stock, item.safeStock)),
      '품번': item.code,
      '품명': item.name,
      '분류': item.category,
      '현재고': item.stock,
      '안전재고': item.safeStock,
      '단위': item.unit
    }));
    downloadExcel(exportData, '재고현황', '재고목록');
    toast.success('재고 현황이 다운로드되었습니다.');
  };

  const filteredData = materials
    .map(item => ({
      ...item,
      status: getStatus(item.stock, item.safeStock)
    }))
    .filter(item => {
      if (!showExhausted && item.stock === 0) return false;
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) || 
        item.code.toLowerCase().includes(query)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">재고 현황 조회</h2>
        <Button variant="outline" onClick={handleDownloadExcel}>
          <Download className="mr-2 h-4 w-4" />
          엑셀 다운로드
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-500">검색 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid w-full gap-1.5 flex-1">
              <Label htmlFor="search">검색어</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="search" 
                  placeholder="품번, 품명, 바코드로 검색..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox 
                id="exhausted" 
                checked={showExhausted}
                onCheckedChange={(checked) => setShowExhausted(checked as boolean)}
              />
              <Label htmlFor="exhausted" className="cursor-pointer">소진된 재고 포함</Label>
            </div>

            <Button variant="secondary">
              <Filter className="mr-2 h-4 w-4" />
              상세 필터
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">품번</th>
                <th className="px-6 py-4">품명</th>
                <th className="px-6 py-4">분류</th>
                <th className="px-6 py-4 text-right">현재고</th>
                <th className="px-6 py-4 text-right">안전재고</th>
                <th className="px-6 py-4 text-center">단위</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {item.status === 'danger' && <Badge variant="destructive">위험</Badge>}
                    {item.status === 'warning' && <Badge className="bg-orange-500 hover:bg-orange-600">경고</Badge>}
                    {item.status === 'good' && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">정상</Badge>}
                    {item.status === 'exhausted' && <Badge variant="secondary">소진</Badge>}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">{item.code}</td>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4 text-slate-500">{item.category}</td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    item.status === 'danger' || item.status === 'exhausted' ? 'text-red-600' : ''
                  }`}>
                    {item.stock.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">{item.safeStock.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
