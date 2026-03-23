import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IconUpload, IconDownload, IconAlertCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import React from "react"
import * as XLSX from "xlsx"

interface ImportExcelDialogProps {
  onSubmit?: (csvText: string) => Promise<void>
  templateHref?: string
}

async function fileToCsvText(file: File): Promise<string> {
  const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
  if (!isExcel) {
    return file.text()
  }
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_csv(firstSheet)
}

export function ImportExcelDialog({ onSubmit, templateHref }: ImportExcelDialogProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)

  function handleFile(f: File) {
    setFile(f)
    setError(null)
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setFile(null)
      setError(null)
    }
  }

  async function handleImport() {
    if (!file || !onSubmit) return
    setLoading(true)
    setError(null)
    try {
      const csvText = await fileToCsvText(file)
      await onSubmit(csvText)
      setOpen(false)
      setFile(null)
    } catch (err: any) {
      setError(err?.message ?? "Import thất bại, vui lòng kiểm tra lại file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconUpload />
          Nhập CSV / Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm mới bằng file CSV / Excel</DialogTitle>
        </DialogHeader>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
          onClick={() => document.getElementById("csv-file-input")?.click()}
          className={`
            flex flex-col items-center justify-center gap-2
            rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-muted-foreground/30 hover:bg-muted/50"}
          `}
        >
          <IconUpload className="size-10 text-blue-500" />
          {file ? (
            <p className="text-sm font-medium text-green-600">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium">Nhấp hoặc kéo tệp vào đây để tải lên</p>
              <p className="text-xs text-muted-foreground">csv, xlsx, xls</p>
            </>
          )}
          <input
            id="csv-file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <IconAlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {templateHref && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={templateHref} download>
                <IconDownload />
                Tải file mẫu
              </a>
            </Button>
          )}
          <Button onClick={handleImport} disabled={!file || loading || !onSubmit}>
            {loading ? "Đang nhập..." : "Nhập"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
