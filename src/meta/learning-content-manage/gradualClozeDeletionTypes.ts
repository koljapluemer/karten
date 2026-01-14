export interface ClozeSelection {
  text: string
  clozedVersion: string
}

export type WizardPhase = 'confirm' | 'select'

export const CLOZE_MARKER = '＿'
