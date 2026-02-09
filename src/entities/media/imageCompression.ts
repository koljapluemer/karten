const MAX_WIDTH = 1000
const JPEG_QUALITY = 0.85

export async function processImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  let width = bitmap.width
  let height = bitmap.height

  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width)
    width = MAX_WIDTH
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: JPEG_QUALITY
  })

  return blob
}
