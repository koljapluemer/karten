import * as ebisu from 'ebisu-js/dist/ebisu.min.mjs'

export type EbisuModel = [number, number, number]

export const defaultModel = (t: number, a?: number, b?: number): EbisuModel =>
  ebisu.defaultModel(t, a, b)

export const predictRecall = (prior: EbisuModel, tnow: number, exact = false): number =>
  ebisu.predictRecall(prior, tnow, exact)

export const updateRecall = (
  prior: EbisuModel,
  successes: number,
  total: number,
  tnow: number,
  q0?: number
): EbisuModel => ebisu.updateRecall(prior, successes, total, tnow, q0)

export const modelToPercentileDecay = (
  model: EbisuModel,
  percentile?: number,
  tolerance?: number
): number => ebisu.modelToPercentileDecay(model, percentile, tolerance)

export const rescaleHalflife = (prior: EbisuModel, scale?: number): EbisuModel =>
  ebisu.rescaleHalflife(prior, scale)
