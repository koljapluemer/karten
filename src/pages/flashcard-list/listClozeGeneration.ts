export interface ListItem {
  index: number
  fullLine: string
  itemText: string
}

const LIST_ITEM_RE = /^(\s*(?:[-*+]|\d+[.)]) )(.+)$/

export const LIST_CLOZE_MARKER = '＿＿＿'

export function detectListItems(text: string): ListItem[] {
  const items: ListItem[] = []
  for (const line of text.split('\n')) {
    const match = line.match(LIST_ITEM_RE)
    if (match) {
      items.push({
        index: items.length,
        fullLine: line,
        itemText: match[2]!.trim(),
      })
    }
  }
  return items
}

export function generateClozeFront(
  text: string,
  items: ListItem[],
  clozeIndices: Set<number>,
): string {
  let result = text
  for (const item of items) {
    if (clozeIndices.has(item.index)) {
      const prefix = item.fullLine.slice(
        0,
        item.fullLine.length - item.itemText.length,
      )
      result = result.replace(item.fullLine, prefix + LIST_CLOZE_MARKER)
    }
  }
  return result
}

export function maxCombinations(n: number): number {
  return (1 << n) - 1
}

export function generateSubsets(n: number, count: number): Set<number>[] {
  const max = maxCombinations(n)
  const clampedCount = Math.min(count, max)

  const fullSet = max // all bits set = all items clozed
  const usedMasks = new Set<number>([fullSet])
  const masks: number[] = [fullSet]

  while (masks.length < clampedCount) {
    const mask = Math.floor(Math.random() * max) + 1 // 1..max, never 0 (empty)
    if (!usedMasks.has(mask)) {
      usedMasks.add(mask)
      masks.push(mask)
    }
  }

  return masks.map((mask) => {
    const indices = new Set<number>()
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        indices.add(i)
      }
    }
    return indices
  })
}

export function buildBlockedByTiers(
  cards: { id: string; clozeCount: number }[],
): Map<string, string[]> {
  const tierMap = new Map<number, string[]>()
  for (const card of cards) {
    const existing = tierMap.get(card.clozeCount)
    if (existing) {
      existing.push(card.id)
    } else {
      tierMap.set(card.clozeCount, [card.id])
    }
  }

  const sortedTiers = [...tierMap.keys()].sort((a, b) => a - b)

  const result = new Map<string, string[]>()

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i]!
    const cardIds = tierMap.get(tier)!
    const lowerTier = i > 0 ? sortedTiers[i - 1]! : null

    for (const cardId of cardIds) {
      result.set(cardId, lowerTier !== null ? [...tierMap.get(lowerTier)!] : [])
    }
  }

  return result
}

export function subsetToClozeCount(subset: Set<number>): number {
  return subset.size
}
