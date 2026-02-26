# Quick Start - Seamless Mouse Between Laptops

## What This Does

Move your physical mouse to the edge of your screen and it seamlessly flows to your other laptop - just like dual monitors!

## Setup (5 minutes)

### Step 1: Start Server (Terminal 1)

```bash
cd mouse-share/server
npm install
npm start
```

✓ Server running on http://localhost:3002

---

### Step 2: Host Laptop (Terminal 2 - laptop with physical mouse)

```bash
cd mouse-share/client
npm install
npm start
```

1. Select `1` (Host)
2. You'll see: `📋 OTP Code: ABC123`
3. **Keep this terminal open!**

---

### Step 3: Client Laptop (On your second laptop)

```bash
cd mouse-share/client
npm install
npm start
```

1. Select `2` (Client)
2. Enter the OTP code: `ABC123`
3. **Keep this terminal open!**

---

### Step 4: Position Setup (Back on Host laptop)

You'll be asked:
```
📍 Where is this laptop positioned?
  1. Left
  2. Right
  3. Top
  4. Bottom
```

Select the position (e.g., if Laptop 2 is on your right, select `2`)

---

### Step 5: USE IT!

**Move your mouse to the edge!**

- Mouse at RIGHT edge of Laptop 1 → appears on LEFT edge of Laptop 2
- Mouse at LEFT edge of Laptop 2 → returns to RIGHT edge of Laptop 1

Works seamlessly like dual monitors!

---

## Visual Guide

```
┌─────────────┐         ┌─────────────┐
│  Laptop 1   │ ──────→ │  Laptop 2   │
│   (Host)    │ ←────── │  (Client)   │
│             │         │             │
│  Physical   │         │  Controlled │
│   Mouse     │         │  Remotely   │
└─────────────┘         └─────────────┘
```

---

## Troubleshooting

### robotjs installation fails

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install libxtst-dev libpng++-dev
```

**Windows:**
```bash
npm install --global windows-build-tools
```

### Mouse not moving on client laptop

**macOS:**
- System Preferences → Security & Privacy → Privacy → Accessibility
- Add Terminal to the list

**Linux:**
```bash
export DISPLAY=:0
```

**Windows:**
- Run terminal as Administrator

### Connection issues

- Make sure server is running (Terminal 1)
- Check both laptops can reach the server
- Verify OTP code is correct
- Try restarting both client applications

---

## Tips

✓ Position laptops physically the same way you configure them
✓ Keep all 3 terminals open while using
✓ Press Ctrl+C in any terminal to stop
✓ You can connect 2-3 client laptops simultaneously
✓ Each client can be on a different side (left/right/top/bottom)

---

## Over Internet (Different WiFi Networks)

1. Deploy server to Railway/Render (free tier)
2. On both laptops:

```bash
export SERVER_URL=https://your-server-url.com
npm start
```

---

## What Works

✓ Seamless edge-to-edge mouse flow
✓ No clicking or hotkeys needed
✓ Natural dual-monitor experience
✓ Support for 2-3 clients
✓ Position clients on any side
✓ Works over LAN or internet
✓ Real-time synchronization (~60fps)
