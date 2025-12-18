import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Printer, Save, RefreshCw, KeyRound, Database, Sliders, Factory, Scale, MoreHorizontal, Plus, Trash2, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Line {
  id: number;
  code: string;
  name: string;
  process: string;
  active: boolean;
}

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('lines');
  const [lines, setLines] = useState<Line[]>([
    { id: 1, code: 'CA-L01', name: '자동절단압착 1라인', process: 'CA', active: true },
    { id: 2, code: 'CA-L02', name: '자동절단압착 2라인', process: 'CA', active: true },
    { id: 3, code: 'PA-L01', name: '제품조립 1라인', process: 'PA', active: true },
    { id: 4, code: 'PA-L02', name: '제품조립 2라인', process: 'PA', active: false },
  ]);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);

  const handleSave = () => {
    toast.success('설정이 저장되었습니다.');
  };

  const handleBackup = () => {
    toast.info('시스템 백업을 시작합니다...');
    setTimeout(() => {
      toast.success('백업이 완료되었습니다. (backup_20231218.zip)');
    }, 2000);
  };

  const handleEditLine = (line: Line) => {
    setEditingLine(line);
    setLineModalOpen(true);
  };

  const handleAddLine = () => {
    setEditingLine(null);
    setLineModalOpen(true);
  };

  const saveLine = (e: React.FormEvent) => {
    e.preventDefault();
    setLineModalOpen(false);
    toast.success(editingLine ? '라인 정보가 수정되었습니다.' : '새 라인이 추가되었습니다.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">시스템 설정</h2>
        <p className="text-slate-500">애플리케이션 환경, 규칙 및 인프라 설정을 관리합니다.</p>
      </div>

      <Tabs defaultValue="lines" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="lines">라인 관리</TabsTrigger>
          <TabsTrigger value="rules">비즈니스 규칙</TabsTrigger>
          <TabsTrigger value="device">장치 및 라벨</TabsTrigger>
          <TabsTrigger value="data">데이터 및 백업</TabsTrigger>
          <TabsTrigger value="account">계정 보안</TabsTrigger>
        </TabsList>

        {/* Line Management */}
        <TabsContent value="lines" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">생산 라인 목록</h3>
            <Button onClick={handleAddLine} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> 라인 추가
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>라인 코드</TableHead>
                    <TableHead>라인명</TableHead>
                    <TableHead>담당 공정</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono font-medium">{line.code}</TableCell>
                      <TableCell>{line.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{line.process}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={line.active ? "default" : "secondary"} className={line.active ? "bg-green-600" : ""}>
                          {line.active ? '사용 중' : '중지됨'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLine(line)}>
                              <Edit2 className="mr-2 h-4 w-4" /> 수정
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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
        </TabsContent>

        {/* Business Rules */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory size={20} /> 재고 통제 규칙
                </CardTitle>
                <CardDescription>재고 부족 시 시스템 동작을 제어합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">마이너스 재고 허용</Label>
                    <p className="text-sm text-slate-500">재고가 부족해도 출고 처리를 진행합니다.</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">안전 재고 경고</Label>
                    <p className="text-sm text-slate-500">재고가 안전 재고 미만일 때 알림을 띄웁니다.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale size={20} /> BOM 검증 규칙
                </CardTitle>
                <CardDescription>생산 투입 시 BOM 유효성 검사 수준을 설정합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">BOM 엄격 모드</Label>
                    <p className="text-sm text-slate-500">등록된 대체 자재 외에는 투입을 차단합니다.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">LOT 선입선출 강제</Label>
                    <p className="text-sm text-slate-500">오래된 자재부터 사용하도록 강제합니다.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} className="ml-auto">
              <Save className="mr-2 h-4 w-4" /> 규칙 저장
            </Button>
          </div>
        </TabsContent>

        {/* Device Settings */}
        <TabsContent value="device" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer size={20} /> 프린터 설정
              </CardTitle>
              <CardDescription>라벨 프린터 및 문서 프린터를 선택합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>라벨 프린터 (Label Printer)</Label>
                <Select defaultValue="zebra">
                  <SelectTrigger>
                    <SelectValue placeholder="프린터 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zebra">Zebra ZD230 (Connected)</SelectItem>
                    <SelectItem value="honeywell">Honeywell GK420t</SelectItem>
                    <SelectItem value="pdf">Microsoft Print to PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>보고서 프린터 (A4)</Label>
                <Select defaultValue="samsung">
                  <SelectTrigger>
                    <SelectValue placeholder="프린터 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="samsung">Samsung SL-M2020</SelectItem>
                    <SelectItem value="hp">HP LaserJet 1020</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders size={20} /> 라벨 출력 옵션
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 발행</Label>
                  <p className="text-xs text-slate-500">작업 완료 시 자동으로 라벨을 출력합니다.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>기본 출력 매수</Label>
                  <Input type="number" defaultValue="1" />
                </div>
                <div className="grid gap-2">
                  <Label>X축 오프셋 (mm)</Label>
                  <Input type="number" defaultValue="0" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> 설정 저장
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Data & Backup Settings */}
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} /> 백업 및 복원
              </CardTitle>
              <CardDescription>시스템 데이터를 안전하게 백업하거나 복원합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div className="space-y-1">
                  <p className="font-medium">수동 백업</p>
                  <p className="text-sm text-slate-500">현재 시점의 모든 데이터를 로컬에 저장합니다.</p>
                </div>
                <Button onClick={handleBackup}>지금 백업</Button>
              </div>

              <div className="space-y-2">
                <Label>데이터 복원</Label>
                <div className="flex gap-2">
                  <Input type="file" />
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> 복원
                  </Button>
                </div>
                <p className="text-xs text-red-500">* 복원 시 현재 데이터가 덮어씌워질 수 있습니다.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Security */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound size={20} /> 비밀번호 변경
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>현재 비밀번호</Label>
                <Input type="password" />
              </div>
              <div className="grid gap-2">
                <Label>새 비밀번호</Label>
                <Input type="password" />
              </div>
              <div className="grid gap-2">
                <Label>새 비밀번호 확인</Label>
                <Input type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> 비밀번호 변경
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Line Management Modal */}
      <Dialog open={lineModalOpen} onOpenChange={setLineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLine ? '라인 수정' : '새 라인 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveLine}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lineCode">라인 코드</Label>
                <Input id="lineCode" defaultValue={editingLine?.code} placeholder="예: PA-L03" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lineName">라인명</Label>
                <Input id="lineName" defaultValue={editingLine?.name} placeholder="예: 제품조립 3라인" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="processCode">담당 공정</Label>
                <Select defaultValue={editingLine?.process || 'CA'}>
                  <SelectTrigger>
                    <SelectValue placeholder="공정 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">자동절단압착 (CA)</SelectItem>
                    <SelectItem value="MC">수동압착 (MC)</SelectItem>
                    <SelectItem value="MS">중간스트립 (MS)</SelectItem>
                    <SelectItem value="SB">Sub (SB)</SelectItem>
                    <SelectItem value="PA">제품조립 (PA)</SelectItem>
                    <SelectItem value="HS">열수축 (HS)</SelectItem>
                    <SelectItem value="VI">육안검사 (VI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch id="isActive" defaultChecked={editingLine?.active ?? true} />
                <Label htmlFor="isActive">사용 여부</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLineModalOpen(false)}>취소</Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
