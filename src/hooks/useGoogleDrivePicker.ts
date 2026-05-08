import { useCallback, useMemo, useState } from 'react'
import {
  DRIVE_SCOPE,
  GoogleDrivePickerCancelledError,
  ensureGoogleDrivePickerReady,
  openGoogleDriveImagePicker,
  requestGoogleDriveToken,
} from '../services/googleDrivePicker'

let sharedDriveAccessToken = ''
let sharedDriveAccessTokenExpiresAt = 0

export function useGoogleDrivePicker() {
  const [stage, setStage] = useState<'idle' | 'auth' | 'picker'>('idle')

  function toFriendlyGoogleError(err: unknown) {
    const message = String((err as { message?: string })?.message || '').trim()
    if (!message) return 'Không thể kết nối Google Drive lúc này. Vui lòng thử lại.'
    if (/popup|closed|dismissed|cancel/i.test(message)) return message
    if (/origin|cors|access blocked|idpiframe|not allowed/i.test(message)) {
      return 'Không thể kết nối Google Drive từ địa chỉ web hiện tại. Hãy kiểm tra Google Cloud OAuth và thêm Authorized JavaScript origin: http://localhost:5173'
    }
    if (/api key|developer key|invalid key/i.test(message)) {
      return 'Google API Key chưa đúng hoặc chưa bật Google Picker API.'
    }
    if (/client_id|oauth|token/i.test(message)) {
      return 'Google Client ID chưa đúng hoặc chưa cấu hình OAuth consent.'
    }
    return message
  }

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
      const now = Date.now()
      const hasValidCachedToken =
        sharedDriveAccessToken && sharedDriveAccessTokenExpiresAt > now + 30_000
      let token = sharedDriveAccessToken
      if (!hasValidCachedToken) {
        try {
          const tokenData = await requestGoogleDriveToken(clientId, DRIVE_SCOPE, {
            prompt: '',
          })
          token = tokenData.accessToken
          sharedDriveAccessToken = tokenData.accessToken
          sharedDriveAccessTokenExpiresAt =
            Date.now() + Math.max(60, Number(tokenData.expiresIn || 0)) * 1000
        } catch {
          const tokenData = await requestGoogleDriveToken(clientId, DRIVE_SCOPE, {
            prompt: 'select_account consent',
          })
          token = tokenData.accessToken
          sharedDriveAccessToken = tokenData.accessToken
          sharedDriveAccessTokenExpiresAt =
            Date.now() + Math.max(60, Number(tokenData.expiresIn || 0)) * 1000
        }
      }
      setStage('picker')
      const files = await openGoogleDriveImagePicker({
        apiKey,
        appId: appId || undefined,
        oauthToken: token,
        multiple,
      })
      return files.map((file) => ({ ...file, oauthToken: token }))
    } catch (err) {
      throw new Error(toFriendlyGoogleError(err))
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
