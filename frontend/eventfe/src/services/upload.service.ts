import { http } from "@/configs/http.comfig"

const API = process.env.NEXT_PUBLIC_API_URL

interface PresignResponse {
  success: boolean
  data: {
    uploadUrl: string
    key: string
  }
}

interface ReadUrlResponse {
  success: boolean
  data: {
    url: string
  }
}

type UploadFolder = "avatars" | "covers" | "logos" | "documents" | "gallery"

/**
 * Get a presigned upload URL from the backend.
 */
export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder: UploadFolder,
) {
  const res = await http.post<PresignResponse>(`${API}/uploads/presign`, {
    fileName,
    fileType,
    folder,
  })
  return res?.data ?? null
}

/**
 * Upload a file directly to S3 using a presigned PUT URL.
 * Returns the S3 key to store in the database.
 */
export async function uploadFileToS3(
  file: File,
  folder: UploadFolder,
): Promise<string | null> {
  const presign = await getPresignedUploadUrl(file.name, file.type, folder)
  if (!presign) return null

  // PUT the file directly to S3
  const uploadRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  })

  if (!uploadRes.ok) return null

  return presign.key
}

/**
 * Get a presigned read URL for an S3 key.
 */
export async function getPresignedReadUrl(key: string) {
  const res = await http.get<ReadUrlResponse>(
    `${API}/uploads/url?key=${encodeURIComponent(key)}`,
  )
  return res?.data?.url ?? null
}
