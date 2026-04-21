import { useCallback, useMemo, useState } from 'react'
import {
  DRIVE_SCOPE,
  GoogleDrivePickerCancelledError,
  ensureGoogleDrivePickerReady,
  openGoogleDriveImagePicker,
  requestGoogleDriveToken,
} from '../services/googleDrivePicker'

export function useGoogleDrivePicker() {
  const [stage, setStage] = useState<'idle' | 'auth' | 'picker'>('idle')

  const pickImages = useCallback(async ({ multiple = true }: { multiple?: boolean } = {}) => {
    const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
    const apiKey = String(import.meta.env.VITE_GOOGLE_API_KEY || '').trim()
    const appId = String(import.meta.env.VITE_GOOGLE_APP_ID || '').trim()

    if (!clientId || !apiKey) {
      throw new Error('Thiếu biến môi trường Google Picker (VITE_GOOGLE_CLIENT_ID / VITE_GOOGLE_API_KEY).')
    }

    try {
      setStage('auth')
      await ensureGoogleDrivePickerReady()
      const token = await requestGoogleDriveToken(clientId, DRIVE_SCOPE)
      setStage('picker')
      const files = await openGoogleDriveImagePicker({
        apiKey,
        appId: appId || undefined,
        oauthToken: token,
        multiple,
      })
      return files
    } finally {
      setStage('idle')
    }
  }, [])

  return useMemo(
    () => ({
      stage,
      isBusy: stage !== 'idle',
      pickImages,
      isCancelledError: (err: unknown) => err instanceof GoogleDrivePickerCancelledError,
    }),
    [pickImages, stage],
  )
}
