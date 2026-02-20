"use client"

import { useMutation } from "@tanstack/react-query"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

export type UploadImageVariables = {
  file: File
  isAvatar: boolean
}

export type UploadImageResponse = {
  url: string
}

async function uploadImage({
  file,
  isAvatar,
}: UploadImageVariables): Promise<UploadImageResponse> {
  const formData = new FormData()
  formData.set("file", file)
  formData.set("avatar", String(isAvatar))

  const res = await fetch(`${BASE_URL}/upload-image`, {
    method: "POST",
    body: formData,
    credentials: "include",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? "Upload failed")
  }
  return res.json()
}

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: uploadImage,
  })
}
