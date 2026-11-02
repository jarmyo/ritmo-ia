# ritmo-ia

Mod de Claude Code que dice si vas arriba o abajo del ritmo ideal de uso semanal de tu plan.

Junto a la línea de estado muestra, por ejemplo, `ritmo-ia ▲ +7 🟡`:

- **▲ / ▼**: vas arriba o abajo de lo que deberías llevar usado a esta altura de la semana.
- **Número**: puntos de diferencia entre el % semanal usado y el % de la semana ya transcurrido (el ideal).
- **Color**: 🔴 más de 15 arriba · 🟡 más de 5 arriba · 🟢 entre 10 abajo y 5 arriba · 🔵 más de 10 abajo.

Lee la ventana `seven_day` de los límites del plan que reporta Claude Code; se actualiza tras cada turno y cada minuto. Solo funciona con una suscripción que tenga límites semanales.

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

## Licencia

MIT
