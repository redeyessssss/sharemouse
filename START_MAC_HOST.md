# Mac is Running as HOST

## Status:
✅ Server is running on port 3002
✅ Client app is ready

## What's Running:
- Terminal 1: Server (background)
- Terminal 2: Client waiting for input (background)

## To Complete Setup:

Since the client is running in background, you need to run it manually in a terminal:

### Open a new Terminal and run:

```bash
cd ~/projects/mouse/mouse-share/client
npm start
```

Then:
1. Type `1` and press Enter (Host mode)
2. You'll see an OTP code like: `ABC123`
3. Keep this terminal open

### Your Mac IP Address:

Find your Mac's IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

You'll need this for Kali to connect if they're on the same network.

---

## For Kali Linux (Your Other Laptop):

See KALI_INSTRUCTIONS.md
