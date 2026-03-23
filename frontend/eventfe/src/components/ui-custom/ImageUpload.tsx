"use client"

import { useCallback, useRef, useState } from "react"
import { Camera, Loader2, X } from "lucide-react"
import { uploadFileToS3 } from "@/services/upload.service"
import { toast } from "sonner"

type UploadFolder = "avatars" | "covers" | "logos" | "documents" | "gallery"

interface ImageUploadProps {
  folder: UploadFolder
  /** Immediate upload mode: called with S3 key after upload */
  onUpload?: (key: string) => void
  /** Deferred mode: called with raw File (or null when cleared), no S3 upload */
  onFileChange?: (file: File | null) => void
  currentImageUrl?: string | null
  className?: string
  variant?: "avatar" | "cover"
}

export function ImageUpload({
  folder,
  onUpload,
  onFileChange,
  currentImageUrl,
  className = "",
  variant = "cover",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const deferred = typeof onFileChange === "function"
  const displaySrc = preview || currentImageUrl || null

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh tối đa 5MB")
        return
      }

      const localUrl = URL.createObjectURL(file)
      setPreview(localUrl)

      if (deferred) {
        onFileChange!(file)
        return
      }

      setUploading(true)
      try {
        const key = await uploadFileToS3(file, folder)
        if (key) {
          onUpload?.(key)
          toast.success("Upload thành công")
        } else {
          toast.error("Upload thất bại")
          setPreview(null)
        }
      } catch {
        toast.error("Upload thất bại")
        setPreview(null)
      } finally {
        setUploading(false)
      }
    },
    [folder, onUpload, onFileChange, deferred],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const clearPreview = () => {
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ""
    if (deferred) onFileChange!(null)
  }

  if (variant === "avatar") {
    return (
      <div className={`relative inline-block ${className}`}>
        <div
          className="w-[100px] h-[100px] rounded-full overflow-hidden bg-gray-100 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {displaySrc ? (
            <img src={displaySrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-gray-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-full h-full min-h-[150px] bg-gray-100 rounded-lg cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center overflow-hidden"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {displaySrc ? (
          <img src={displaySrc} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Click hoặc kéo thả ảnh vào đây</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
      {preview && !uploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); clearPreview() }}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
