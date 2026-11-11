# ritmo-ia

Mod de Claude Code que dice si vas arriba o abajo del ritmo ideal de uso semanal de tu plan.

Junto a la línea de estado muestra, por ejemplo, `ritmo-ia ▲ +7 🟡`:

- **▲ / ▼**: vas arriba o abajo de lo que deberías llevar usado a esta altura de la semana.
- **Número**: puntos de diferencia entre el % semanal usado y el % de la semana ya transcurrido (el ideal).
- **Color**: 🔴 más de 15 arriba · 🟡 más de 5 arriba · 🟢 entre 10 abajo y 5 arriba · 🔵 más de 10 abajo.

Lee la ventana `seven_day` de los límites del plan que reporta Claude Code; se actualiza tras cada turno y cada minuto. Como el uso semanal es de toda la cuenta, guarda la última lectura y todos los chats la muestran desde que abren, sin esperar su primera respuesta; solo hace falta que algún chat haya recibido una respuesta esta semana. Solo funciona con una suscripción que tenga límites semanales.

## Instalar

En la terminal de Claude Code:

```
/plugin install ritmo-ia --marketplace jarmyo/ritmo-ia
```

Responde `y` para agregar el marketplace y elige el alcance.

Desde una shell:

```bash
claude plugin install ritmo-ia --marketplace jarmyo/ritmo-ia
```

En la app de escritorio: clic en **+** junto al cuadro del prompt → Plugins → Add marketplace con `jarmyo/ritmo-ia` → Add plugin.

## Barra de menú de macOS

La app de escritorio de Claude no dibuja la línea de estado de los mods. Para ver el indicador siempre, junto a la hora, hay una app nativa en `barra-mac/` que lee la última lectura que guarda el mod (`~/.claude/plugins/store/ritmo-ia_*.json`). El ideal se recalcula cada 30 segundos y el menú muestra el % usado, el ideal, cuándo se reinicia la semana y de cuándo es la lectura.

Necesita el mod instalado y las herramientas de línea de comandos de Xcode (`swiftc`):

```bash
./barra-mac/instalar.sh
```

La compila en `~/Applications/RitmoIA.app` y agrega un LaunchAgent (`~/Library/LaunchAgents/com.jarmyo.ritmo-ia.plist`) para que abra al iniciar sesión. Para quitarla:

```bash
launchctl bootout gui/$(id -u)/com.jarmyo.ritmo-ia; rm -rf ~/Library/LaunchAgents/com.jarmyo.ritmo-ia.plist ~/Applications/RitmoIA.app
```

## Licencia

MIT
