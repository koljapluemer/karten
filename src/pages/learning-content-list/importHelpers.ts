import JSZip from 'jszip'

export type ParsedLearningContent = {
  content: string
  filename: string
  media?: string[]
  tags?: string[]
}

export const parseLearningContentFromZip = async (
  file: File
): Promise<{ items: ParsedLearningContent[], zip: JSZip | null }> => {
  const zip = await JSZip.loadAsync(file)

  const manifestEntry = zip.file('content.jsonl')
  if (manifestEntry) {
    return parseManifestMode(zip, manifestEntry)
  }

  return { items: await parseLegacyMode(zip), zip: null }
}

const parseManifestMode = async (
  zip: JSZip,
  manifestEntry: JSZip.JSZipObject
): Promise<{ items: ParsedLearningContent[], zip: JSZip }> => {
  const text = await manifestEntry.async('text')
  const lines = text.split('\n')
  const items: ParsedLearningContent[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed.content === 'string') {
        const item: ParsedLearningContent = {
          content: parsed.content,
          filename: ''
        }

        if (Array.isArray(parsed.media)) {
          const paths = parsed.media.filter((p: unknown) => typeof p === 'string')
          if (paths.length > 0) {
            item.media = paths
          }
        }

        if (Array.isArray(parsed.tags)) {
          const tags = parsed.tags.filter((t: unknown) => typeof t === 'string')
          if (tags.length > 0) {
            item.tags = tags
          }
        }

        items.push(item)
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  return { items, zip }
}

const parseLegacyMode = async (zip: JSZip): Promise<ParsedLearningContent[]> => {
  const items: ParsedLearningContent[] = []

  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue

    const lowerName = filename.toLowerCase()
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      const rawContent = await zipEntry.async('text')
      const basename = filename.split('/').pop() || filename
      const nameWithoutExt = basename.replace(/\.(md|txt)$/i, '')
      const content = `# ${nameWithoutExt}\n\n${rawContent}`
      items.push({ content, filename })
    }
  }

  return items
}
