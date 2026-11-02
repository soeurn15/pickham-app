import { showToast } from '../composables/useToast'

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image'
}

/**
 * Saves an image to the user's device with a sensible file name and the
 * correct extension. Falls back to opening the image in a new tab when the
 * browser blocks the direct download (e.g. cross-origin images).
 * Returns true when a download was started.
 */
export async function downloadImage(url: string, title: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    const extension = EXTENSIONS[blob.type] || url.split('?')[0]?.split('.').pop()?.toLowerCase() || 'jpg'

    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${slugify(title)}.${extension}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

    showToast('Download started')
    return true
  } catch {
    window.open(url, '_blank', 'noopener')
    showToast('Opened the image in a new tab - right-click to save it', 'info', 4500)
    return false
  }
}
