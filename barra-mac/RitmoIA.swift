// ritmo-ia en la barra de menú de macOS.
//
// Lee la última lectura semanal que guarda el mod en
// ~/.claude/plugins/store/ritmo-ia_*.json y muestra el mismo indicador que
// la línea de estado: ▲/▼, puntos de diferencia contra el ideal y color.

import AppKit

struct Lectura {
    let percentUsed: Double
    let resetsAt: Date
    let leidaEn: Date
}

let semana: TimeInterval = 168 * 3600

func fecha(_ s: String) -> Date? {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let d = f.date(from: s) { return d }
    f.formatOptions = [.withInternetDateTime]
    return f.date(from: s)
}

// El archivo más reciente gana: puede haber uno del mod instalado y otro de
// una copia en desarrollo.
func leer() -> Lectura? {
    let dir = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".claude/plugins/store")
    guard let nombres = try? FileManager.default.contentsOfDirectory(
        at: dir, includingPropertiesForKeys: [.contentModificationDateKey]) else { return nil }
    let archivos = nombres
        .filter { $0.lastPathComponent.hasPrefix("ritmo-ia") && $0.pathExtension == "json" }
        .compactMap { url -> (URL, Date)? in
            let m = try? url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate
            return m.map { (url, $0) }
        }
        .sorted { $0.1 > $1.1 }
    for (url, modificado) in archivos {
        guard let datos = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: datos) as? [String: Any],
              let limites = json["ultimaLectura"] as? [[String: Any]],
              let s = limites.first(where: { $0["kind"] as? String == "seven_day" }),
              let usado = (s["percentUsed"] as? NSNumber)?.doubleValue,
              let reset = (s["resetsAt"] as? String).flatMap(fecha)
        else { continue }
        return Lectura(percentUsed: usado, resetsAt: reset, leidaEn: modificado)
    }
    return nil
}

// Misma cuenta que diagnostico() en hooks/register.ts.
func diagnostico(_ l: Lectura, ahora: Date) -> (titulo: String, ideal: Double, dif: Double)? {
    if l.resetsAt <= ahora { return nil }
    let transcurrido = min(semana, max(0, ahora.timeIntervalSince(l.resetsAt.addingTimeInterval(-semana))))
    let ideal = transcurrido / semana * 100
    let dif = l.percentUsed - ideal
    let badge = dif > 15 ? "🔴" : dif > 5 ? "🟡" : dif >= -10 ? "🟢" : "🔵"
    let flecha = dif > 0.5 ? "▲" : dif < -0.5 ? "▼" : "="
    let signo = dif >= 0 ? "+" : ""
    return ("\(flecha) \(signo)\(Int(dif.rounded())) \(badge)", ideal, dif)
}

final class App: NSObject, NSApplicationDelegate {
    let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    var timer: Timer?

    func applicationDidFinishLaunching(_ n: Notification) {
        pintar()
        // El ideal avanza solo con el tiempo; la lectura la renueva cualquier chat.
        timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.pintar()
        }
    }

    func pintar() {
        let ahora = Date()
        let menu = NSMenu()
        func linea(_ s: String) {
            let i = NSMenuItem(title: s, action: nil, keyEquivalent: "")
            i.isEnabled = false
            menu.addItem(i)
        }

        if let l = leer(), let d = diagnostico(l, ahora: ahora) {
            item.button?.title = d.titulo
            linea(String(format: "Usado: %.0f %%  ·  ideal: %.0f %%", l.percentUsed, d.ideal))
            linea(String(format: "Diferencia: %+.1f puntos", d.dif))
            linea("Se reinicia: " + l.resetsAt.formatted(date: .abbreviated, time: .shortened))
            linea("Última lectura: " + l.leidaEn.formatted(.relative(presentation: .named)))
        } else {
            item.button?.title = "ritmo-ia ·"
            linea("Sin lectura de esta semana.")
            linea("Se actualiza tras una respuesta en Claude Code.")
        }

        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Actualizar", action: #selector(actualizar), keyEquivalent: "r"))
        menu.addItem(NSMenuItem(title: "Salir", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        menu.items.forEach { if $0.action == #selector(actualizar) { $0.target = self } }
        item.menu = menu
    }

    @objc func actualizar() { pintar() }
}

let app = NSApplication.shared
let delegado = App()
app.delegate = delegado
app.setActivationPolicy(.accessory)
app.run()
