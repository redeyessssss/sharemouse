# Mouse Share - Seamless Mouse Control Across Laptops

Share one physical mouse across 2-3 laptops seamlessly - just like dual monitors!

## Quick Start

### 1. Start Server (Once)

```bash
cd server
npm install
npm start
```

Server runs on `http://localhost:3001`

### 2. Host Laptop (with physical mouse)

```bash
cd client
npm install
npm start
```

- Select `1` (Host)
- Note the OTP code
- When client connects, choose position (left/right/top/bottom)

### 3. Client Laptop (to be controlled)

```bash
cd client
npm install
npm start
```

- Select `2` (Client)
- Enter OTP code
- Done! Move mouse to edge to switch between laptops

## How It Works

```
┌─────────────┐         ┌─────────────┐
│  Laptop 1   │ ──────→ │  Laptop 2   │
│   (Host)    │ ←────── │  (Client)   │
└─────────────┘         └─────────────┘
```

Move mouse to RIGHT edge of Laptop 1 → appears on LEFT edge of Laptop 2
Move mouse to LEFT edge of Laptop 2 → returns to RIGHT edge of Laptop 1

## Requirements

- Node.js 16+
- macOS: Grant Accessibility permissions
- Linux: X11 display access
- Windows: Run as Administrator

## Troubleshooting

**robotjs fails to install:**
- macOS: `xcode-select --install`
- Linux: `sudo apt-get install libxtst-dev libpng++-dev`

**Mouse not moving:**
- macOS: System Preferences → Security & Privacy → Accessibility
- Linux: `export DISPLAY=:0`
- Windows: Run as Administrator

## Features

✓ Seamless edge-to-edge mouse flow
✓ No clicking or hotkeys needed
✓ Support for 2-3 clients
✓ Position clients on any side
✓ Works over LAN or internet
