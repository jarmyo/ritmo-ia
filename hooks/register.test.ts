import { expect, mock, test } from 'claude-code/testing'

const RESET = Date.parse('2026-11-05T12:00:00Z')
// Mitad de la semana: ideal 50%.
const AHORA = RESET - 84 * 3600_000
const lectura = (percentUsed: number) => [
  { kind: 'seven_day', percentUsed, resetsAt: new Date(RESET).toISOString() },
]

test('arriba del ritmo: 70% usado a media semana', async ($, on) => {
  const vistos: (string | undefined)[] = []
  on('clock.now', () => ({ value: AHORA }))
  on('clock.every', () => ({ value: undefined }))
  mock.store(on)
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
  mock.store(on)
  on('ui.status', (_, e) => (vistos.push(e.text), { value: undefined }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.measure({
    context: {} as never,
    rateLimits: [{ kind: 'seven_day', percentUsed: 30, resetsAt: new Date(RESET).toISOString() }],
    changed: ['rateLimits'],
  })
  expect(vistos.at(-1)).toBe('▼ -20 🔵')
})

test('un chat nuevo muestra la lectura guardada antes de su primera respuesta', async ($, on) => {
  const vistos: (string | undefined)[] = []
  mock.store(on, { ultimaLectura: lectura(70) })
  on('clock.now', () => ({ value: AHORA }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.status', (_, e) => (vistos.push(e.text), { value: undefined }))
  on('session.usage', () => ({ value: { rateLimits: [] } as never }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(vistos.at(-1)).toBe('▲ +20 🔴')
})

test('una lectura nueva queda guardada para los demás chats', async ($, on) => {
  const escritos: unknown[] = []
  on('store.set', (_, e) => (escritos.push(e.value), { value: undefined }))
  on('clock.now', () => ({ value: AHORA }))
  on('ui.status', () => ({ value: undefined }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.measure({
    context: {} as never,
    rateLimits: lectura(70),
    changed: ['rateLimits'],
  })
  expect(escritos).toEqual([lectura(70)])
})

test('una medición sin límites no borra lo que se muestra', async ($, on) => {
  const vistos: (string | undefined)[] = []
  const escritos: unknown[] = []
  on('store.get', () => ({ value: lectura(70) }))
  on('store.set', (_, e) => (escritos.push(e.value), { value: undefined }))
  on('clock.now', () => ({ value: AHORA }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.status', (_, e) => (vistos.push(e.text), { value: undefined }))
  on('session.usage', () => ({ value: { rateLimits: [] } as never }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.session.measure({ context: {} as never, rateLimits: [], changed: ['context'] })
  expect(vistos.at(-1)).toBe('▲ +20 🔴')
  expect(escritos).toEqual([])
})

test('una lectura de la semana pasada no se muestra', async ($, on) => {
  const vistos: (string | undefined)[] = []
  mock.store(on, { ultimaLectura: lectura(70) })
  on('clock.now', () => ({ value: RESET + 3600_000 }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.status', (_, e) => (vistos.push(e.text), { value: undefined }))
  on('session.usage', () => ({ value: { rateLimits: [] } as never }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(vistos.at(-1)).toBeUndefined()
})
