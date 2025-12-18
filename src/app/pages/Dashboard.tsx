import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Activity, 
  Package, 
  CheckCircle2, 
  Clock, 
  Pin,
  Factory,
  ArrowRight
} from 'lucide-react';

const productionData = [
  { time: '08:00', amount: 120 },
  { time: '09:00', amount: 350 },
  { time: '10:00', amount: 480 },
  { time: '11:00', amount: 600 },
  { time: '12:00', amount: 620 },
  { time: '13:00', amount: 800 },
  { time: '14:00', amount: 950 },
  { time: '15:00', amount: 1100 },
  { time: '16:00', amount: 1250 },
  { time: '17:00', amount: 1400 },
];

const processAchievement = [
  { name: '자재입고', target: 1000, current: 950 },
  { name: 'CA공정', target: 2000, current: 1800 },
  { name: 'PA조립', target: 1500, current: 1400 },
  { name: '최종검사', target: 1500, current: 1350 },
];

const lowStockItems = [
  { id: 'M-001', name: '터미널 A-Type', stock: 150, min: 500, unit: 'EA' },
  { id: 'W-203', name: 'UL1007 24AWG Red', stock: 20, min: 100, unit: 'M' },
  { id: 'H-055', name: 'Housing 4P White', stock: 80, min: 200, unit: 'EA' },
];

export const Dashboard = () => {
  const navigate = useNavigate();

  const pinnedProcesses = [
    { id: 'material/receiving', label: '자재 입고', desc: '바코드 스캔 및 입고 처리', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'process/ca', label: '자동절단압착 (CA)', desc: '전선 절단 및 압착 공정', icon: Factory, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'process/pa', label: '제품 조립 (PA)', desc: '최종 제품 조립 및 라벨링', icon: Factory, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Quick Links Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Pin size={18} className="text-slate-500" />
          자주 찾는 공정
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {pinnedProcesses.map((proc) => (
            <Card key={proc.id} className="cursor-pointer hover:shadow-md transition-shadow border-slate-200" onClick={() => navigate(`/${proc.id}`)}>
              <CardContent className="p-6 flex items-start justify-between">
                <div className="space-y-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${proc.bg} ${proc.color}`}>
                    <proc.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{proc.label}</h3>
                    <p className="text-sm text-slate-500">{proc.desc}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <ArrowRight size={18} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 2. Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">금일 총 생산량</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,400 <span className="text-sm font-normal text-slate-500">EA</span></div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              목표 달성률 92%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">평균 불량률</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.8%</div>
            <p className="text-xs text-slate-500 mt-1">
              관리 기준(1.0%) 이내
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">가동 라인</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 <span className="text-sm font-normal text-slate-500">/ 5</span></div>
            <p className="text-xs text-slate-500 mt-1">
              80% 가동률
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-orange-50 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">재고 경고</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{lowStockItems.length} <span className="text-sm font-normal text-orange-700">건</span></div>
            <Button variant="link" className="px-0 h-auto text-xs text-orange-700 underline decoration-orange-700" onClick={() => navigate('/material/stock')}>
              확인하기
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts & Alerts Row */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Production Trend Chart */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>공정별 달성률</CardTitle>
            <CardDescription>일일 생산 목표 대비 실적</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processAchievement} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="현재 실적" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="target" name="목표 수량" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="col-span-3 shadow-sm border-orange-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle size={18} />
                재고 부족 알림
              </CardTitle>
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Safety Stock 미만</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{item.stock} {item.unit}</p>
                    <p className="text-xs text-slate-400">최소 {item.min} {item.unit}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  재고 부족 항목이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-slate-600" onClick={() => navigate('/material/stock')}>
              재고 현황 전체보기
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
