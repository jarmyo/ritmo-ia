import type { Hook, Register, SessionRateLimit } from 'claude-code'

type Dolar = Parameters<Hook<'session.measure'>>[0]

// ideal = % de la ventana transcurrido; desviación = usado − ideal.
const VENTANAS: Record<string, { horas: number; nombre: string }> = {
  seven_day: { horas: 168, nombre: '' },
}

let ultimos: SessionRateLimit[] = []

export function diagnostico(lim: SessionRateLimit, ahoraMs: number) {
  const v = VENTANAS[lim.kind]
  if (!v || !lim.resetsAt) return undefined
  const resetMs = Date.parse(lim.resetsAt)
  if (Number.isNaN(resetMs)) return undefined
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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    try {
      ultimos = (await $.session.usage()).rateLimits
      await pintar($)
    } catch {}
    // El ideal avanza con el tiempo aunque no haya turnos.
    $.clock.every(60_000, () => pintar($))
    return r
  })

  on('session.measure', async ($, e, next) => {
    ultimos = e.rateLimits
    await pintar($)
    return next(e)
  })
}
