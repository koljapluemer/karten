import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/app/storage/db'
import { loadDocsByPrefix } from '@/app/storage/dbHelpers'
import type { MaterialDoc } from './Material'

const buildMaterialId = (): string => `material:${crypto.randomUUID()}`

export const useMaterialsStore = defineStore('materials', () => {
  const materials = ref<MaterialDoc[]>([])
  const isLoaded = ref(false)

  const loadMaterials = async (): Promise<void> => {
    if (isLoaded.value) return
    const docs = await loadDocsByPrefix<MaterialDoc>('material:')
    materials.value = docs
    isLoaded.value = true
  }

  const createMaterial = async (
    content: string,
    format: 'text' | 'markdown' = 'text'
  ): Promise<MaterialDoc> => {
    const now = new Date().toISOString()
    const material: MaterialDoc = {
      _id: buildMaterialId(),
      type: 'material',
      content,
      format,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.put(material)
    const stored = { ...material, _rev: result.rev }
    materials.value = [stored, ...materials.value]
    return stored
  }

  const updateMaterial = async (
    materialId: string,
    updates: Partial<Pick<MaterialDoc, 'content' | 'format'>>
  ): Promise<void> => {
    const current = materials.value.find((entry) => entry._id === materialId)
    if (!current) return
    const updated: MaterialDoc = {
      ...current,
      content: updates.content ?? current.content,
      format: updates.format ?? current.format,
      updatedAt: new Date().toISOString()
    }
    const result = await db.put(updated)
    materials.value = materials.value.map((entry) =>
      entry._id === materialId ? { ...updated, _rev: result.rev } : entry
    )
  }

  const deleteMaterial = async (materialId: string): Promise<void> => {
    const current = materials.value.find((entry) => entry._id === materialId)
    if (!current || !current._rev) return
    await db.put({ ...current, _deleted: true } as MaterialDoc & { _deleted: boolean })
    materials.value = materials.value.filter((entry) => entry._id !== materialId)
  }

  return {
    materials,
    isLoaded,
    loadMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
  }
})
