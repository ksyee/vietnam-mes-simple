import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { CheckCircle2, XCircle, Scan, AlertTriangle } from 'lucide-react';

export const InspectionView = () => {
  const { type } = useParams<{ type: string }>();
  const [barcode, setBarcode] = useState('');
  const [currentItem, setCurrentItem] = useState<{ id: string; name: string } | null>(null);
  const [failModalOpen, setFailModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const title = type === 'ci' ? '회로 검사 (Circuit Inspection)' : 
                type === 'vi' ? '육안 검사 (Visual Inspection)' :
                type === 'crimp' ? '압착 검사 (Crimp Inspection)' :
                '품질 검사';

  useEffect(() => {
    inputRef.current?.focus();
  }, [type, currentItem]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;
    setCurrentItem({
      id: barcode,
      name: 'Wire Harness Type-A (Sample)'
    });
    setBarcode('');
  };

  const handlePass = () => {
    // API Call for PASS
    setCurrentItem(null);
    // Toast success?
  };

  const handleFail = () => {
    setFailModalOpen(true);
  };

  const confirmFail = (reason: string) => {
    // API Call for FAIL
    setFailModalOpen(false);
    setCurrentItem(null);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-100px)]">
      <div className="mb-6 flex items-center justify-between">
         <h2 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h2>
         <div className="flex gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">금일 합격: <span className="text-green-600 font-bold ml-1">1,240</span></Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">금일 불량: <span className="text-red-600 font-bold ml-1">12</span></Badge>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left: Scan & Info */}
        <Card className="flex flex-col shadow-md border-slate-200">
          <CardContent className="p-8 flex flex-col items-center justify-center h-full space-y-8">
            {!currentItem ? (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan size={48} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700">검사 대상을 스캔하세요</h3>
                <form onSubmit={handleScan}>
                  <Input 
                    ref={inputRef}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="바코드 입력 (Enter)" 
                    className="h-16 text-center text-xl shadow-inner bg-slate-50"
                    autoComplete="off"
                  />
                </form>
              </div>
            ) : (
              <div className="w-full space-y-8 animate-in zoom-in-95 duration-200">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center space-y-2">
                  <Label className="text-blue-600 font-semibold">현재 검사 LOT</Label>
                  <div className="text-4xl font-black text-slate-900 tracking-tight font-mono">{currentItem.id}</div>
                  <div className="text-xl text-slate-600">{currentItem.name}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                      <Label className="text-slate-500">규격 정보</Label>
                      <div className="text-lg font-bold mt-1">L=150mm</div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                      <Label className="text-slate-500">검사 기준</Label>
                      <div className="text-lg font-bold mt-1 text-red-500">스크래치 주의</div>
                   </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Action Buttons */}
        <div className="flex flex-col gap-4 h-full">
          <button 
            onClick={handlePass}
            disabled={!currentItem}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-30 disabled:hover:bg-green-500 text-white rounded-2xl shadow-lg transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-4 group"
          >
            <CheckCircle2 size={80} className="group-hover:scale-110 transition-transform" />
            <span className="text-5xl font-black tracking-widest">OK (합격)</span>
          </button>
          
          <button 
            onClick={handleFail}
            disabled={!currentItem}
            className="h-1/3 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:hover:bg-red-100 text-red-600 border-4 border-red-200 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4"
          >
            <XCircle size={40} />
            <span className="text-3xl font-bold">NG (불량)</span>
          </button>
        </div>
      </div>

      {/* Fail Reason Modal */}
      <Dialog open={failModalOpen} onOpenChange={setFailModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={24} />
              불량 사유 선택
            </DialogTitle>
            <DialogDescription>
              발견된 불량 유형을 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {['찍힘/스크래치', '오염/이물', '치수 불량', '미성형', '조립 불량', '기타'].map((reason) => (
              <Button 
                key={reason} 
                variant="outline" 
                className="h-16 text-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                onClick={() => confirmFail(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setFailModalOpen(false)}>취소</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
