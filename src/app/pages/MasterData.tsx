import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Plus, Search, Edit2, Trash2, MoreHorizontal, FileDown, Upload, FolderTree } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

export const MasterData = () => {
  const { type } = useParams<{ type: string }>();

  const getTitle = () => {
    switch (type) {
      case 'product': return '품번 관리 (Product Master)';
      case 'material': return '자재 관리 (Material Master)';
      case 'bom': return 'BOM 관리 (Bill of Materials)';
      case 'user': return '사용자 관리 (User Management)';
      default: return '기준 정보 관리';
    }
  };

  const renderContent = () => {
    if (type === 'bom') {
      return (
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-8 text-center text-slate-500">
            <FolderTree size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">BOM 구조 관리</h3>
            <p>제품을 선택하면 하위 자재 구조가 트리 형태로 표시됩니다.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Input placeholder="완제품 품번 검색..." className="max-w-xs" />
              <Button>조회</Button>
            </div>
          </CardContent>
        </Card>
      );
    }

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
                <TableHead>코드</TableHead>
                <TableHead>명칭</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{i}</TableCell>
                  <TableCell className="font-mono">
                    {type === 'user' ? `USER-00${i}` : `ITEM-${202300+i}`}
                  </TableCell>
                  <TableCell>
                    {type === 'user' ? `홍길동 ${i}` : `Standard Component ${i}`}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {type === 'user' ? '생산팀 / 사원' : '기본 자재입니다.'}
                  </TableCell>
                  <TableCell>2023-12-01</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
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
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{getTitle()}</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> 양식
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> 업로드
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> 신규 등록
          </Button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};
