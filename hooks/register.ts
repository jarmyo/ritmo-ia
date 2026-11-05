import type { Hook, Register, SessionRateLimit } from 'claude-code'

type Dolar = Parameters<Hook<'session.measure'>>[0]

// ideal = % de la ventana transcurrido; desviación = usado − ideal.
const VENTANAS: Record<string, { horas: number; nombre: string }> = {
  seven_day: { horas: 168, nombre: '' },
}

// El uso semanal es de la cuenta, no del chat: la última lectura sirve para
// todos. Un chat nuevo no tiene datos propios hasta su primera respuesta.
const CLAVE = 'ultimaLectura'

let ultimos: SessionRateLimit[] = []

export function diagnostico(lim: SessionRateLimit, ahoraMs: number) {
  const v = VENTANAS[lim.kind]
  if (!v || !lim.resetsAt) return undefined
  const resetMs = Date.parse(lim.resetsAt)
  // Una lectura guardada de la semana anterior ya no dice nada.
  if (Number.isNaN(resetMs) || resetMs <= ahoraMs) return undefined
  const totalMs = v.horas * 3600_000
  const transcurrido = Math.min(totalMs, Math.max(0, ahoraMs - (resetMs - totalMs)))
  const ideal = (transcurrido / totalMs) * 100
  const dif = lim.percentUsed - ideal
  const badge =
    dif > 15 ? '🔴' : dif > 5 ? '🟡' : dif >= -10 ? '🟢' : '🔵'
  const flecha = dif > 0.5 ? '▲' : dif < -0.5 ? '▼' : '='
  const signo = dif >= 0 ? '+' : ''
  const prefijo = v.nombre ? `${v.nombre} ` : ''
  return `${prefijo}${flecha} ${signo}${Math.round(dif)} ${badge}`
}

export function texto(limites: SessionRateLimit[], ahoraMs: number) {
  const orden = ['seven_day']
  const partes = orden
    .map(k => limites.find(l => l.kind === k))
    .filter((l): l is SessionRateLimit => !!l)
    .map(l => diagnostico(l, ahoraMs))
    .filter((s): s is string => !!s)
  return partes.length ? partes.join(' · ') : undefined
}

async function pintar($: Dolar) {
  $.ui.status(texto(ultimos, await $.clock.now()))
}

async function guardados($: Dolar) {
  try {
    const v = await $.store.get(CLAVE)
    return Array.isArray(v) ? (v as SessionRateLimit[]) : []
  } catch {
    return []
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    try {
      const vivos = (await $.session.usage()).rateLimits
      ultimos = vivos.length ? vivos : await guardados($)
      await pintar($)
    } catch {}
    // El ideal avanza con el tiempo aunque no haya turnos, y otro chat puede
    // haber guardado una lectura más nueva.
    $.clock.every(60_000, async () => {
      const g = await guardados($)
      if (g.length) ultimos = g
      await pintar($)
    })
    return r
  })

  on('session.measure', async ($, e, next) => {
    if (e.rateLimits.length) {
      ultimos = e.rateLimits
      if (e.changed.includes('rateLimits')) {
        try {
          await $.store.set(CLAVE, e.rateLimits)
        } catch {}
      }
    }
    await pintar($)
    return next(e)
  })
}
