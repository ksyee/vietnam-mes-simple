import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Download, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { downloadExcel } from '@/lib/excelUtils';
import { toast } from 'sonner';

export const ReportView = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const getTitle = () => {
    switch (reportId) {
      case 'production': return '생산 현황 (Production Report)';
      case 'trace': return 'LOT 추적 (Traceability)';
      case 'input-history': return '투입 이력 조회 (Input History)';
      default: return '보고서';
    }
  };

  const handleDownloadExcel = () => {
    if (reportId === 'production') {
      const data = [1, 2, 3, 4, 5].map(i => ({
        '날짜': '2023-12-18',
        '공정': '자동절압착',
        '품번': `P-100${i}`,
        '품명': 'Wire Harness Type-A',
        '생산수량': 1000 * i,
        '불량수량': 5 * i,
        '직행률(%)': `99.${9 - i}%`
      }));
      downloadExcel(data, '생산현황', '생산리포트');
      toast.success('생산 현황이 다운로드되었습니다.');
    } else if (reportId === 'input-history') {
      const data = [1, 2, 3, 4, 5].map(i => ({
        '투입일시': `2023-12-18 10:0${i}:00`,
        '완제품 LOT': `PA-20231218-00${i}`,
        '공정': '제품조립 (PA)',
        '투입 자재 코드': `M-WIRE-00${i}`,
        '투입 자재명': 'UL1007 Wire Black',
        '자재 LOT': `L-MAT-00${i}`,
        '투입수량': `${10 * i} M`
      }));
      downloadExcel(data, '투입이력', '투입이력');
      toast.success('투입 이력이 다운로드되었습니다.');
    } else {
      toast.info('LOT 추적은 검색 후 다운로드 가능합니다.');
    }
  };

  // Mock Data
  const renderTable = () => {
    if (reportId === 'production') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead>공정</TableHead>
              <TableHead>품번</TableHead>
              <TableHead>품명</TableHead>
              <TableHead className="text-right">생산수량</TableHead>
              <TableHead className="text-right">불량수량</TableHead>
              <TableHead className="text-right">직행률(%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1,2,3,4,5].map((i) => (
              <TableRow key={i}>
                <TableCell>2023-12-18</TableCell>
                <TableCell>자동절압착</TableCell>
                <TableCell className="font-mono">P-100{i}</TableCell>
                <TableCell>Wire Harness Type-A</TableCell>
                <TableCell className="text-right">{1000 * i}</TableCell>
                <TableCell className="text-right">{5 * i}</TableCell>
                <TableCell className="text-right">99.{9-i}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    } 
    
    if (reportId === 'input-history') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>투입일시</TableHead>
              <TableHead>완제품 LOT</TableHead>
              <TableHead>공정</TableHead>
              <TableHead>투입 자재 코드</TableHead>
              <TableHead>투입 자재명</TableHead>
              <TableHead>자재 LOT</TableHead>
              <TableHead className="text-right">투입수량</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {[1,2,3,4,5].map((i) => (
              <TableRow key={i}>
                <TableCell>2023-12-18 10:0{i}:00</TableCell>
                <TableCell className="font-mono font-bold">PA-20231218-00{i}</TableCell>
                <TableCell>제품조립 (PA)</TableCell>
                <TableCell className="font-mono">M-WIRE-00{i}</TableCell>
                <TableCell>UL1007 Wire Black</TableCell>
                <TableCell className="font-mono">L-MAT-00{i}</TableCell>
                <TableCell className="text-right">{10 * i} M</TableCell>
              </TableRow>
             ))}
          </TableBody>
        </Table>
      );
    }

    if (reportId === 'trace') {
       return (
         <div className="p-8 text-center text-slate-500">
           <Search size={48} className="mx-auto mb-4 opacity-20" />
           <p className="text-lg">LOT 번호를 검색하면 추적 트리가 표시됩니다.</p>
         </div>
       )
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{getTitle()}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadExcel}><Download size={16} className="mr-2"/> 엑셀 다운로드</Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">검색 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <span className="text-sm font-medium leading-none">날짜 선택</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={clsx(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2 flex-1 min-w-[200px]">
              <span className="text-sm font-medium leading-none">검색어</span>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="품번, 품명, LOT 번호 검색" className="pl-8" />
              </div>
            </div>

            <Button className="bg-slate-800 hover:bg-slate-900">
              <Filter className="mr-2 h-4 w-4" /> 조회
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 min-h-[500px]">
        <CardContent className="p-0">
          {renderTable()}
        </CardContent>
      </Card>
    </div>
  );
};
