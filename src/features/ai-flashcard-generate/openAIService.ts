import { getOpenAIKey } from '@/app/storage/openAIKey'
import type { GeneratedCard } from './types'

export function buildSchema(): object {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            front: { type: 'string' },
            back: { type: 'string' }
          },
          required: ['front', 'back']
        }
      }
    },
    required: ['cards']
  }
}

function parseCards(text: string): GeneratedCard[] {
  const parsed = JSON.parse(text) as { cards?: GeneratedCard[] }
  if (!parsed.cards || !Array.isArray(parsed.cards)) return []
  return parsed.cards.filter(
    (card) => card.front && card.front.trim().length > 0 && card.back && card.back.trim().length > 0
  )
}

export async function generateFlashcards(
  prompt: string
): Promise<GeneratedCard[]> {
  const apiKey = getOpenAIKey()
  if (!apiKey) {
    throw new Error('OpenAI API key not set')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Return only JSON that matches the provided schema. No extra commentary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'generated_cards',
          strict: true,
          schema: buildSchema()
        }
      }
    })
  })

  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI error.'
    throw new Error(`${message} (${response.status})`)
  }

  const text = data?.choices?.[0]?.message?.content ?? ''
  if (!text) throw new Error('No response content.')

  return parseCards(text)
}
