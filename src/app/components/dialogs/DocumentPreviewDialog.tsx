/**
 * Document Preview Dialog
 *
 * A4 생산 전표 미리보기 및 인쇄 다이얼로그
 * Barcord 프로젝트 document_generator.py 참조 구현
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Printer, Download, FileText, QrCode, Barcode, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

// ============================================
// Types (Barcord document_generator.py 참조)
// ============================================

export interface InputMaterialInfo {
  lotNumber: string
  productCode: string
  name: string
  quantity: number
  unit: string
  sourceType: 'material' | 'production'
  processCode?: string
  depth?: number
  bomQuantity?: number
  deductedQuantity?: number
}

export interface DocumentData {
  lotNumber: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  productionDate: Date
  processCode: string
  processName: string
  inputMaterials: InputMaterialInfo[]
  crimpProductCode?: string
  lineCode?: string
  plannedQuantity?: number
  completedQuantity?: number
  defectQuantity?: number
  workerName?: string
}

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: DocumentData | null
  onPrint?: () => void
}

// ============================================
// Constants
// ============================================

const PAGE_CONFIG = {
  width: 210,  // A4 width in mm
  height: 297, // A4 height in mm
  margin: {
    top: 15,
    right: 15,
    bottom: 15,
    left: 15,
  },
}

const PROCESS_NAMES: Record<string, string> = {
  MO: '자재출고',
  CA: '자동절압착',
  MC: '수동압착',
  MS: '미드스플라이스',
  SB: '서브조립',
  SP: '제품조립제공부품',
  PA: '제품조립',
  HS: '열수축',
  CI: '회로검사',
  VI: '육안검사',
  CQ: '압착검사',
}

// ============================================
// Component
// ============================================

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  data,
  onPrint,
}: DocumentPreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(true)
  const [showBarcode, setShowBarcode] = useState(true)
  const [showMaterials, setShowMaterials] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // PDF 생성
  useEffect(() => {
    if (open && data) {
      generatePDF()
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [open, data, showQR, showBarcode, showMaterials])

  const generatePDF = async () => {
    if (!data) return

    setIsGenerating(true)

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const { margin } = PAGE_CONFIG
      const contentWidth = PAGE_CONFIG.width - margin.left - margin.right
      let y = margin.top

      // ========================================
      // 1. 헤더 영역 - 제목 및 날짜
      // ========================================
      pdf.setFontSize(18)
      pdf.setTextColor(0, 0, 0)
      pdf.text('생산 전표', PAGE_CONFIG.width / 2, y, { align: 'center' })
      y += 6

      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      pdf.text('Production Slip', PAGE_CONFIG.width / 2, y, { align: 'center' })
      y += 8

      // 구분선
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.line(margin.left, y, PAGE_CONFIG.width - margin.right, y)
      y += 8

      // ========================================
      // 2. 기본 정보 섹션 (2열 그리드)
      // ========================================
      const colWidth = contentWidth / 2
      const rowHeight = 7

      // 좌측 컬럼
      const leftItems = [
        { label: 'LOT 번호', value: data.lotNumber },
        { label: '공정', value: `${data.processCode} (${data.processName})` },
        { label: '품번', value: data.productCode },
        { label: '품명', value: data.productName },
      ]

      // 우측 컬럼
      const rightItems = [
        { label: '작업일', value: formatDate(data.productionDate) },
        { label: '라인', value: data.lineCode || '-' },
        { label: '작업자', value: data.workerName || '-' },
        { label: '절압품번', value: data.crimpProductCode || '-' },
      ]

      pdf.setFontSize(9)

      for (let i = 0; i < Math.max(leftItems.length, rightItems.length); i++) {
        // 좌측
        if (leftItems[i]) {
          pdf.setTextColor(100, 100, 100)
          pdf.text(leftItems[i].label, margin.left, y)
          pdf.setTextColor(0, 0, 0)
          pdf.text(leftItems[i].value, margin.left + 25, y)
        }

        // 우측
        if (rightItems[i]) {
          pdf.setTextColor(100, 100, 100)
          pdf.text(rightItems[i].label, margin.left + colWidth, y)
          pdf.setTextColor(0, 0, 0)
          pdf.text(rightItems[i].value, margin.left + colWidth + 25, y)
        }

        y += rowHeight
      }

      y += 5

      // ========================================
      // 3. 수량 정보 섹션 (박스 3개)
      // ========================================
      const boxWidth = contentWidth / 3 - 3
      const boxHeight = 18

      // 계획 수량 박스
      drawQuantityBox(pdf, margin.left, y, boxWidth, boxHeight, '계획 수량', data.plannedQuantity ?? data.quantity, data.unit, '#4CAF50')

      // 완료 수량 박스
      drawQuantityBox(pdf, margin.left + boxWidth + 4, y, boxWidth, boxHeight, '완료 수량', data.completedQuantity ?? data.quantity, data.unit, '#2196F3')

      // 불량 수량 박스
      drawQuantityBox(pdf, margin.left + (boxWidth + 4) * 2, y, boxWidth, boxHeight, '불량 수량', data.defectQuantity ?? 0, data.unit, '#F44336')

      y += boxHeight + 8

      // ========================================
      // 4. 투입 자재 테이블
      // ========================================
      if (showMaterials && data.inputMaterials.length > 0) {
        pdf.setFontSize(11)
        pdf.setTextColor(0, 0, 0)
        pdf.text('투입 자재', margin.left, y)
        y += 6

        // 테이블 헤더
        const tableHeaders = ['No', 'LOT 번호', '품번', '품명', '수량', '단위', '구분']
        const colWidths = [8, 28, 25, 45, 18, 12, 18]

        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin.left, y, contentWidth, 6, 'F')

        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)

        let x = margin.left
        for (let i = 0; i < tableHeaders.length; i++) {
          pdf.text(tableHeaders[i], x + 1, y + 4)
          x += colWidths[i]
        }

        y += 6

        // 테이블 데이터
        for (let i = 0; i < Math.min(data.inputMaterials.length, 15); i++) {
          const mat = data.inputMaterials[i]

          // 줄무늬 배경
          if (i % 2 === 1) {
            pdf.setFillColor(250, 250, 250)
            pdf.rect(margin.left, y, contentWidth, 5, 'F')
          }

          pdf.setDrawColor(220, 220, 220)
          pdf.rect(margin.left, y, contentWidth, 5, 'S')

          pdf.setFontSize(7)
          pdf.setTextColor(0, 0, 0)

          x = margin.left
          const rowData = [
            String(i + 1),
            truncate(mat.lotNumber, 12),
            truncate(mat.productCode, 10),
            truncate(mat.name, 20),
            mat.quantity.toLocaleString(),
            mat.unit,
            mat.sourceType === 'material' ? '자재' : '생산',
          ]

          for (let j = 0; j < rowData.length; j++) {
            pdf.text(rowData[j], x + 1, y + 3.5)
            x += colWidths[j]
          }

          y += 5
        }

        if (data.inputMaterials.length > 15) {
          pdf.setFontSize(8)
          pdf.setTextColor(128, 128, 128)
          pdf.text(`... 외 ${data.inputMaterials.length - 15}건`, margin.left, y + 4)
          y += 6
        }

        y += 8
      }

      // ========================================
      // 5. 바코드 영역 (QR + 1D)
      // ========================================
      const barcodeY = Math.max(y, PAGE_CONFIG.height - 80)

      if (showQR || showBarcode) {
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.3)
        pdf.line(margin.left, barcodeY - 5, PAGE_CONFIG.width - margin.right, barcodeY - 5)
      }

      // QR 코드
      if (showQR) {
        const qrData = JSON.stringify({
          lot: data.lotNumber,
          process: data.processCode,
          product: data.productCode,
          qty: data.quantity,
          date: formatDate(data.productionDate),
        })

        try {
          const qrCanvas = document.createElement('canvas')
          await QRCode.toCanvas(qrCanvas, qrData, {
            width: 100,
            margin: 1,
            errorCorrectionLevel: 'M',
          })

          const qrDataUrl = qrCanvas.toDataURL('image/png')
          pdf.addImage(qrDataUrl, 'PNG', margin.left, barcodeY, 30, 30)

          pdf.setFontSize(7)
          pdf.setTextColor(128, 128, 128)
          pdf.text('QR Code', margin.left + 15, barcodeY + 33, { align: 'center' })
        } catch (e) {
          console.error('QR 생성 실패:', e)
        }
      }

      // 1D 바코드 (Code128)
      if (showBarcode) {
        try {
          const barcodeCanvas = document.createElement('canvas')
          JsBarcode(barcodeCanvas, data.lotNumber, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
          })

          const barcodeDataUrl = barcodeCanvas.toDataURL('image/png')
          const barcodeX = showQR ? margin.left + 45 : margin.left
          const barcodeWidth = showQR ? contentWidth - 50 : contentWidth

          pdf.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, Math.min(barcodeWidth, 120), 25)
        } catch (e) {
          console.error('바코드 생성 실패:', e)
        }
      }

      // ========================================
      // 6. 서명란
      // ========================================
      const signY = PAGE_CONFIG.height - margin.bottom - 25

      pdf.setFontSize(9)
      pdf.setTextColor(0, 0, 0)

      const signBoxWidth = contentWidth / 3 - 5

      // 작업자 서명
      pdf.text('작업자', margin.left + signBoxWidth / 2, signY, { align: 'center' })
      pdf.setDrawColor(150, 150, 150)
      pdf.rect(margin.left, signY + 2, signBoxWidth, 15, 'S')

      // 검사자 서명
      pdf.text('검사자', margin.left + signBoxWidth + 10 + signBoxWidth / 2, signY, { align: 'center' })
      pdf.rect(margin.left + signBoxWidth + 10, signY + 2, signBoxWidth, 15, 'S')

      // 승인자 서명
      pdf.text('승인자', margin.left + (signBoxWidth + 10) * 2 + signBoxWidth / 2, signY, { align: 'center' })
      pdf.rect(margin.left + (signBoxWidth + 10) * 2, signY + 2, signBoxWidth, 15, 'S')

      // ========================================
      // 7. 푸터
      // ========================================
      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.text(
        `생성일시: ${new Date().toLocaleString('ko-KR')}`,
        PAGE_CONFIG.width - margin.right,
        PAGE_CONFIG.height - 5,
        { align: 'right' }
      )

      // PDF URL 생성
      const blob = pdf.output('blob')
      const url = URL.createObjectURL(blob)

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      setPdfUrl(url)
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      toast.error('PDF 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 인쇄
  const handlePrint = () => {
    if (iframeRef.current && pdfUrl) {
      iframeRef.current.contentWindow?.print()
      onPrint?.()
    }
  }

  // 다운로드
  const handleDownload = () => {
    if (!pdfUrl || !data) return

    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `전표_${data.lotNumber}_${formatDate(data.productionDate)}.pdf`
    link.click()

    toast.success('전표가 다운로드되었습니다.')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            생산 전표 미리보기
          </DialogTitle>
          <DialogDescription>
            {data ? `${data.processName} - ${data.lotNumber}` : '전표를 생성 중입니다...'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="preview">미리보기</TabsTrigger>
            <TabsTrigger value="options">옵션</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2">PDF 생성 중...</span>
              </div>
            ) : pdfUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                className="w-full h-full border rounded-lg"
                title="전표 미리보기"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                전표 데이터가 없습니다.
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">바코드 옵션</h3>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR 코드 표시
                  </Label>
                  <Switch checked={showQR} onCheckedChange={setShowQR} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Barcode className="w-4 h-4" />
                    1D 바코드 표시
                  </Label>
                  <Switch checked={showBarcode} onCheckedChange={setShowBarcode} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">내용 옵션</h3>

                <div className="flex items-center justify-between">
                  <Label>투입 자재 표시</Label>
                  <Switch checked={showMaterials} onCheckedChange={setShowMaterials} />
                </div>
              </div>
            </div>

            {data && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold mb-3">전표 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-slate-500">LOT:</span>
                    <Badge variant="outline">{data.lotNumber}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">공정:</span>
                    <Badge>{data.processCode}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">품번:</span>
                    <span>{data.productCode}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">수량:</span>
                    <span>{data.quantity.toLocaleString()} {data.unit}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">투입자재:</span>
                    <span>{data.inputMaterials.length}건</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={!pdfUrl}>
            <Download className="w-4 h-4 mr-2" />
            다운로드
          </Button>
          <Button onClick={handlePrint} disabled={!pdfUrl}>
            <Printer className="w-4 h-4 mr-2" />
            인쇄
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Helper Functions
// ============================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen - 2) + '..'
}

function drawQuantityBox(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: number,
  unit: string,
  color: string
): void {
  // 배경
  pdf.setFillColor(250, 250, 250)
  pdf.roundedRect(x, y, width, height, 2, 2, 'F')

  // 테두리
  const rgb = hexToRgb(color)
  if (rgb) {
    pdf.setDrawColor(rgb.r, rgb.g, rgb.b)
  }
  pdf.setLineWidth(0.5)
  pdf.roundedRect(x, y, width, height, 2, 2, 'S')

  // 라벨
  pdf.setFontSize(8)
  pdf.setTextColor(100, 100, 100)
  pdf.text(label, x + width / 2, y + 5, { align: 'center' })

  // 값
  pdf.setFontSize(14)
  if (rgb) {
    pdf.setTextColor(rgb.r, rgb.g, rgb.b)
  }
  pdf.text(`${value.toLocaleString()} ${unit}`, x + width / 2, y + 13, { align: 'center' })
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export default DocumentPreviewDialog
