#!/bin/sh
# Compila RitmoIA.app en ~/Applications y la deja abriendo al iniciar sesión.
set -e

aqui=$(cd "$(dirname "$0")" && pwd)
app="$HOME/Applications/RitmoIA.app"
agente="$HOME/Library/LaunchAgents/com.jarmyo.ritmo-ia.plist"

mkdir -p "$app/Contents/MacOS" "$HOME/Library/LaunchAgents"
swiftc -O -swift-version 5 "$aqui/RitmoIA.swift" -o "$app/Contents/MacOS/RitmoIA"

cat > "$app/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key><string>com.jarmyo.ritmo-ia</string>
  <key>CFBundleName</key><string>RitmoIA</string>
  <key>CFBundleExecutable</key><string>RitmoIA</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
EOF

cat > "$agente" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.jarmyo.ritmo-ia</string>
  <key>ProgramArguments</key><array><string>$app/Contents/MacOS/RitmoIA</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/com.jarmyo.ritmo-ia" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$agente"
echo "RitmoIA instalada en $app y activa al iniciar sesión."
