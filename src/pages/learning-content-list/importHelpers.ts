import JSZip from 'jszip'

export type ParsedLearningContent = {
  content: string
  filename: string
}

export const parseLearningContentFromZip = async (file: File): Promise<ParsedLearningContent[]> => {
  const zip = await JSZip.loadAsync(file)
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
