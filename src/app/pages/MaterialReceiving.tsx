import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useDropzone } from 'react-dropzone';
import { Upload, ScanBarcode, FileSpreadsheet, Check, X, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

export const MaterialReceiving = () => {
  const [barcode, setBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<any[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    toast.success(`${acceptedFiles[0].name} 파일이 업로드되었습니다.`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;
    
    // Mock scan logic
    const newItem = {
      id: Date.now(),
      code: barcode,
      name: `자재-${Math.floor(Math.random() * 1000)}`,
      qty: 100,
      unit: 'EA',
      time: new Date().toLocaleTimeString()
    };

    setScannedItems([newItem, ...scannedItems]);
    setBarcode('');
    toast.success('자재가 스캔되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">자재 입고 관리</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            양식 다운로드
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="scan">바코드 스캔 입고</TabsTrigger>
          <TabsTrigger value="manual">엑셀 일괄 업로드</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>스캔 입력</CardTitle>
              <CardDescription>본사 바코드를 스캔하여 입고 처리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="flex gap-4">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="바코드를 스캔하세요..." 
                    className="pl-9" 
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  입고 확정
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>금일 입고 내역 ({scannedItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                    <tr>
                      <th className="px-4 py-3">시간</th>
                      <th className="px-4 py-3">바코드</th>
                      <th className="px-4 py-3">품명</th>
                      <th className="px-4 py-3 text-right">수량</th>
                      <th className="px-4 py-3 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scannedItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          스캔된 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      scannedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">{item.time}</td>
                          <td className="px-4 py-3 font-mono">{item.code}</td>
                          <td className="px-4 py-3">{item.name}</td>
                          <td className="px-4 py-3 text-right font-bold">{item.qty} {item.unit}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <Check className="w-3 h-3 mr-1" /> 완료
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>파일 업로드</CardTitle>
              <CardDescription>엑셀 파일을 드래그하여 업로드하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="font-medium">파일을 드래그하거나 클릭하여 선택하세요</p>
                  <p className="text-xs">지원 형식: .xlsx, .xls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
