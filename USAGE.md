# How to Use Mouse Share

## Current Features

✅ Seamless mouse movement between laptops
✅ Edge detection and automatic switching
✅ Real-time cursor synchronization
✅ Position configuration (left/right/top/bottom)

## Mouse Control

### Movement
- Move your physical mouse on the host laptop
- When you reach the screen edge, cursor appears on client laptop
- Cursor on client follows your host mouse movements in real-time
- Move back to edge to return to host

### Clicking (Current Implementation)

**While cursor is on CLIENT laptop:**

Since robotjs cannot detect mouse button presses, you have two options:

**Option 1: Use keyboard shortcuts (Recommended)**
- Press `Ctrl` on host = Left click on client
- Press `Alt` on host = Right click on client  
- Press `Shift` on host = Middle click on client

**Option 2: Click normally**
- Your physical clicks on host will work on host screen
- To click on client, you need to physically use client's mouse

## Workaround for Full Click Support

For full mouse click forwarding, you would need:
1. A native mouse hook library (like `node-global-key-listener`)
2. Or use a hardware solution (KVM switch)
3. Or use commercial software (Synergy, Barrier)

## What Works Perfectly

✅ Mouse cursor moves seamlessly between laptops
✅ Only ONE cursor visible (host's cursor)
✅ Real-time synchronization
✅ Smooth edge transitions
✅ Multiple client support

## Limitations

⚠️ Mouse clicks are not automatically forwarded (robotjs limitation)
⚠️ Scroll wheel not supported yet
⚠️ Drag and drop not supported

## Tips

- Keep both laptops on same network for best performance
- Position laptops physically the same way you configure them
- Use keyboard shortcuts for clicking when on client screen
- For intensive clicking work, return cursor to host
