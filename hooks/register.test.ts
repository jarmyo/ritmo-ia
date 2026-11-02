import { expect, test } from 'claude-code/testing'

const RESET = Date.parse('2026-11-05T12:00:00Z')
// Mitad de la semana: ideal 50%.
const AHORA = RESET - 84 * 3600_000

test('arriba del ritmo: 70% usado a media semana', async ($, on) => {
  const vistos: (string | undefined)[] = []
  on('clock.now', () => ({ value: AHORA }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.status', (_, e) => (vistos.push(e.text), { value: undefined }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.measure({
    context: {} as never,
    rateLimits: [{ kind: 'seven_day', percentUsed: 70, resetsAt: new Date(RESET).toISOString() }],
    changed: ['rateLimits'],
  })
  expect(vistos.at(-1)).toBe('▲ +20 🔴')
})

test('abajo del ritmo: 30% usado a media semana', async ($, on) => {
  const vistos: (string | undefined)[] = []
  on('clock.now', () => ({ value: AHORA }))
  on('ui.status', (_, e) => (vistos.push(e.text), { value: undefined }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.measure({
    context: {} as never,
    rateLimits: [{ kind: 'seven_day', percentUsed: 30, resetsAt: new Date(RESET).toISOString() }],
    changed: ['rateLimits'],
  })
  expect(vistos.at(-1)).toBe('▼ -20 🔵')
})
