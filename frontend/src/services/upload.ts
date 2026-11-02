import { getToken } from './session'

export interface UploadResult {
  status: number
  data: any
}

/**
 * POSTs a FormData body and reports upload progress (0-100). fetch cannot report upload progress,
 * so this uses XMLHttpRequest; it still sends the session token like every other API call.
 */
export function uploadWithProgress(url: string, body: FormData, onProgress: (percent: number) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      let data: any = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        /* non-JSON error page */
      }
      resolve({ status: xhr.status, data })
    }
    xhr.onerror = () => reject(new Error('Network connection failed.'))
    xhr.ontimeout = () => reject(new Error('The upload timed out. Please try again.'))
    xhr.timeout = 120_000
    xhr.send(body)
  })
}
