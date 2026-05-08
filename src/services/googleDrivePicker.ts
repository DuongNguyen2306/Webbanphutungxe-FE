const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
const GAPI_SRC = 'https://apis.google.com/js/api.js'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

export class GoogleDrivePickerCancelledError extends Error {
  constructor(message = 'Đã đóng cửa sổ chọn ảnh Google Drive.') {
    super(message)
    this.name = 'GoogleDrivePickerCancelledError'
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existed = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existed) {
      if (existed.dataset.loaded === 'true') {
        resolve()
        return
      }
      existed.addEventListener('load', () => resolve(), { once: true })
      existed.addEventListener('error', () => reject(new Error(`Không tải được script: ${src}`)), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    script.addEventListener('error', () => reject(new Error(`Không tải được script: ${src}`)), {
      once: true,
    })
    document.head.appendChild(script)
  })
}

let setupPromise: Promise<void> | null = null

export function ensureGoogleDrivePickerReady() {
  if (setupPromise) return setupPromise
  setupPromise = (async () => {
    await Promise.all([loadScript(GAPI_SRC), loadScript(GIS_SRC)])
    await new Promise<void>((resolve, reject) => {
      if (!window.gapi?.load) {
        reject(new Error('Google API chưa sẵn sàng.'))
        return
      }
      window.gapi.load('picker', {
        callback: () => resolve(),
        onerror: () => reject(new Error('Không khởi tạo được Google Picker API.')),
      })
    })
    if (!window.google?.accounts?.oauth2?.initTokenClient) {
      throw new Error('Google Identity Services chưa sẵn sàng.')
    }
    if (!window.google?.picker) {
      throw new Error('Google Picker chưa sẵn sàng.')
    }
  })()
  return setupPromise
}

export function buildGoogleDriveUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`
}

export function requestGoogleDriveToken(
  clientId: string,
  scope = DRIVE_SCOPE,
  opts: { prompt?: string } = {},
) {
  return new Promise<{ accessToken: string, expiresIn: number }>((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: (resp: any) => {
        if (resp?.error) {
          reject(new Error(resp.error_description || resp.error || 'Không lấy được quyền Google Drive.'))
          return
        }
        if (!resp?.access_token) {
          reject(new Error('Google không trả access token.'))
          return
        }
        resolve({
          accessToken: String(resp.access_token),
          expiresIn: Number(resp?.expires_in || 0),
        })
      },
      error_callback: (err: any) => {
        reject(new Error(err?.message || 'Không mở được xác thực Google.'))
      },
    })
    tokenClient.requestAccessToken({ prompt: opts.prompt || '' })
  })
}

export type PickedDriveImage = {
  id: string
  name: string
  mimeType: string
  googleDriveUrl: string
  previewUrl: string
  oauthToken?: string
}

export function openGoogleDriveImagePicker({
  apiKey,
  appId,
  oauthToken,
  multiple = true,
}: {
  apiKey: string
  appId?: string
  oauthToken: string
  multiple?: boolean
}) {
  return new Promise<PickedDriveImage[]>((resolve, reject) => {
    const picker = window.google.picker
    const docsView = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setOwnedByMe(false)
      .setSelectFolderEnabled(false)
      .setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml')

    let builder = new picker.PickerBuilder()
      .addView(docsView)
      .setOAuthToken(oauthToken)
      .setDeveloperKey(apiKey)
      .setCallback((data: any) => {
        if (data.action === picker.Action.CANCEL) {
          reject(new GoogleDrivePickerCancelledError())
          return
        }
        if (data.action !== picker.Action.PICKED) return
        const docs = Array.isArray(data.docs) ? data.docs : []
        const files = docs
          .map((doc) => {
            const id = String(doc?.id || '').trim()
            if (!id) return null
            const previewUrl = String(
              doc?.thumbnails?.[0]?.url ||
                doc?.thumbnailUrl ||
                `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
            ).trim()
            return {
              id,
              name: String(doc?.name || '').trim(),
              mimeType: String(doc?.mimeType || '').trim(),
              googleDriveUrl: buildGoogleDriveUrl(id),
              previewUrl,
            }
          })
          .filter(Boolean) as PickedDriveImage[]
        resolve(files)
      })

    if (appId) {
      builder = builder.setAppId(appId)
    }
    builder = builder
      .setOrigin(window.location.origin)
      .enableFeature(picker.Feature.SUPPORT_DRIVES)
    if (multiple) {
      builder = builder.enableFeature(picker.Feature.MULTISELECT_ENABLED)
    }
    builder.build().setVisible(true)
  })
}

export { DRIVE_SCOPE }
