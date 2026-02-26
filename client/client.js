import robot from 'robotjs';
import { io } from 'socket.io-client';
import readline from 'readline';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';
const EDGE_THRESHOLD = 5; // pixels from edge to trigger switch
const SAFE_ZONE = 50; // pixels inside screen where mouse is placed after switch
const SWITCH_COOLDOWN = 500; // milliseconds before allowing another switch
const CHECK_INTERVAL = 16; // ~60fps

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let socket = null;
let mode = null;
let otp = null;
let screenSize = null;
let trackingInterval = null;
let isControlActive = false;

// Client-specific state
let myPosition = null;
let clientTrackingInterval = null;

// Host-specific state
let connectedClients = new Map();
let lastSwitchTime = 0;

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

async function startHost() {
  mode = 'host';
  socket = io(SERVER_URL);
  
  socket.on('connect', () => {
    log('✓ Connected to server');
    
    socket.emit('create-session', (response) => {
      if (response.success) {
        otp = response.otp;
        console.log('\n╔════════════════════════════════════╗');
        console.log('║     HOST MODE - SEAMLESS MOUSE     ║');
        console.log('╚════════════════════════════════════╝');
        console.log(`\n  📋 OTP Code: ${otp}`);
        console.log(`\n  Share this code with your other laptop(s)`);
        console.log('  Move mouse to screen edge to switch!\n');
        
        startHostTracking();
      }
    });
  });

  socket.on('client-joined', async (data) => {
    log(`✓ Client connected: ${data.clientId}`);
    
    console.log('\n📍 Where is this laptop positioned?');
    console.log('  1. Left');
    console.log('  2. Right');
    console.log('  3. Top');
    console.log('  4. Bottom');
    
    const answer = await question('\nSelect (1-4): ');
    const positions = { '1': 'left', '2': 'right', '3': 'top', '4': 'bottom' };
    const position = positions[answer.trim()] || 'right';
    
    connectedClients.set(data.clientId, { position, active: false });
    socket.emit('set-client-position', { clientId: data.clientId, position });
    
    log(`✓ Client positioned: ${position}`);
    console.log('');
  });

  socket.on('client-disconnected', (data) => {
    connectedClients.delete(data.clientId);
    log(`✗ Client disconnected (${data.totalClients} remaining)`);
  });

  socket.on('take-back-control', (data) => {
    const client = connectedClients.get(data.clientId);
    if (client) {
      client.active = false;
      isControlActive = true;
      lastSwitchTime = Date.now(); // Set cooldown when returning
      
      // Position mouse at safe zone where it returned
      const pos = getEdgePosition(client.position, data.x, data.y);
      robot.moveMouse(pos.x, pos.y);
      
      log(`← Control returned from ${client.position} client`);
    }
  });

  socket.on('disconnect', () => {
    log('✗ Disconnected from server');
    cleanup();
  });
}

function startHostTracking() {
  screenSize = robot.getScreenSize();
  isControlActive = true;
  let lastPos = robot.getMousePos();
  let lastSentPos = { x: 0, y: 0 };
  let cursorLockedPosition = null; // Where we locked the cursor
  
  trackingInterval = setInterval(() => {
    const now = Date.now();
    
    // Check if any client is active
    const activeClient = Array.from(connectedClients.entries()).find(([id, c]) => c.active);
    
    if (activeClient) {
      const [clientId, client] = activeClient;
      
      // When client is active:
      // 1. Read physical mouse position
      // 2. Send to client
      // 3. Keep host cursor locked off-screen
      
      const physicalPos = robot.getMousePos();
      
      // If cursor moved from locked position, send delta to client
      if (cursorLockedPosition) {
        const deltaX = physicalPos.x - cursorLockedPosition.x;
        const deltaY = physicalPos.y - cursorLockedPosition.y;
        
        if (deltaX !== 0 || deltaY !== 0) {
          // Calculate new position for client
          const newX = lastSentPos.x + (deltaX / screenSize.width);
          const newY = lastSentPos.y + (deltaY / screenSize.height);
          
          // Clamp to 0-1 range
          lastSentPos.x = Math.max(0, Math.min(1, newX));
          lastSentPos.y = Math.max(0, Math.min(1, newY));
          
          socket.emit('mouse-move', {
            clientId,
            x: lastSentPos.x,
            y: lastSentPos.y
          });
          
          // Re-lock cursor at same position
          robot.moveMouse(cursorLockedPosition.x, cursorLockedPosition.y);
        }
      }
      
      return; // Don't check for edge switching while client is active
    }
    
    // Host has control - normal operation
    cursorLockedPosition = null;
    
    if (!isControlActive) return;
    if (now - lastSwitchTime < SWITCH_COOLDOWN) return;
    
    const pos = robot.getMousePos();
    
    // Check each edge for client
    for (const [clientId, client] of connectedClients) {
      if (client.active) continue;
      
      let shouldSwitch = false;
      let entryX = 0, entryY = 0;
      
      switch (client.position) {
        case 'right':
          if (pos.x >= screenSize.width - EDGE_THRESHOLD) {
            shouldSwitch = true;
            entryX = SAFE_ZONE / screenSize.width;
            entryY = pos.y / screenSize.height;
          }
          break;
        case 'left':
          if (pos.x <= EDGE_THRESHOLD) {
            shouldSwitch = true;
            entryX = 1 - (SAFE_ZONE / screenSize.width);
            entryY = pos.y / screenSize.height;
          }
          break;
        case 'bottom':
          if (pos.y >= screenSize.height - EDGE_THRESHOLD) {
            shouldSwitch = true;
            entryX = pos.x / screenSize.width;
            entryY = SAFE_ZONE / screenSize.height;
          }
          break;
        case 'top':
          if (pos.y <= EDGE_THRESHOLD) {
            shouldSwitch = true;
            entryX = pos.x / screenSize.width;
            entryY = 1 - (SAFE_ZONE / screenSize.height);
          }
          break;
      }
      
      if (shouldSwitch) {
        isControlActive = false;
        client.active = true;
        lastSwitchTime = now;
        
        // Move cursor COMPLETELY off-screen (far outside visible area)
        // This ensures clicks don't register on host screen
        cursorLockedPosition = {
          x: -1000,  // Far off-screen to the left
          y: -1000   // Far off-screen to the top
        };
        robot.moveMouse(cursorLockedPosition.x, cursorLockedPosition.y);
        
        // Initialize sent position
        lastSentPos = { x: entryX, y: entryY };
        
        socket.emit('switch-to-client', { clientId, entryX, entryY });
        log(`→ Control switched to ${client.position} client (cursor off-screen)`);
        break;
      }
    }
  }, CHECK_INTERVAL);
}

async function startClient() {
  mode = 'client';
  
  const code = await question('\n📋 Enter OTP code: ');
  otp = code.toUpperCase().trim();
  
  console.log(`\nConnecting to server: ${SERVER_URL}`);
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });
  
  socket.on('connect', () => {
    log('✓ Connected to server');
    
    socket.emit('join-session', { otp }, (response) => {
      if (response.success) {
        console.log('\n╔════════════════════════════════════╗');
        console.log('║   CLIENT MODE - RECEIVING CONTROL  ║');
        console.log('╚════════════════════════════════════╝');
        console.log('\n  ✓ Connected to host');
        console.log('  Waiting for mouse control...\n');
      } else {
        console.log(`\n✗ Error: ${response.error}`);
        socket.disconnect();
        process.exit(1);
      }
    });
  });
  
  socket.on('connect_error', (error) => {
    console.log(`\n✗ Connection error: ${error.message}`);
    console.log(`\nMake sure:`);
    console.log(`  1. Server is running on Mac`);
    console.log(`  2. You set SERVER_URL correctly:`);
    console.log(`     export SERVER_URL=http://MAC_IP:3002`);
    console.log(`  3. Both laptops are on same network\n`);
  });

  socket.on('position-assigned', (data) => {
    myPosition = data.position;
    log(`✓ Position assigned: ${myPosition}`);
  });

  socket.on('take-control', (data) => {
    screenSize = robot.getScreenSize();
    isControlActive = true;
    
    // Move mouse to entry position
    const x = Math.round(data.x * screenSize.width);
    const y = Math.round(data.y * screenSize.height);
    robot.moveMouse(x, y);
    
    log(`✓ Mouse control activated (from ${myPosition})`);
    
    startClientTracking();
  });

  socket.on('mouse-move', (data) => {
    if (!isControlActive) return;
    
    // Move mouse based on host's movements
    const x = Math.round(data.x * screenSize.width);
    const y = Math.round(data.y * screenSize.height);
    robot.moveMouse(x, y);
  });

  socket.on('release-control', () => {
    isControlActive = false;
    
    // Hide cursor on client by moving it off-screen
    if (screenSize) {
      robot.moveMouse(screenSize.width + 100, screenSize.height + 100);
    }
    
    log('○ Mouse control released');
  });

  socket.on('host-disconnected', () => {
    log('✗ Host disconnected');
    cleanup();
    process.exit(0);
  });

  socket.on('disconnect', () => {
    log('✗ Disconnected from server');
    cleanup();
  });
}

function startClientTracking() {
  if (clientTrackingInterval) {
    clearInterval(clientTrackingInterval);
  }
  
  let lastReturnTime = 0;
  
  clientTrackingInterval = setInterval(() => {
    if (!isControlActive) return;
    
    const now = Date.now();
    if (now - lastReturnTime < SWITCH_COOLDOWN) return; // Cooldown
    
    const pos = robot.getMousePos();
    let shouldReturn = false;
    let exitX = 0, exitY = 0;
    
    switch (myPosition) {
      case 'right':
        if (pos.x <= EDGE_THRESHOLD) {
          shouldReturn = true;
          exitX = 1 - (SAFE_ZONE / screenSize.width);
          exitY = pos.y / screenSize.height;
        }
        break;
      case 'left':
        if (pos.x >= screenSize.width - EDGE_THRESHOLD) {
          shouldReturn = true;
          exitX = SAFE_ZONE / screenSize.width;
          exitY = pos.y / screenSize.height;
        }
        break;
      case 'bottom':
        if (pos.y <= EDGE_THRESHOLD) {
          shouldReturn = true;
          exitX = pos.x / screenSize.width;
          exitY = 1 - (SAFE_ZONE / screenSize.height);
        }
        break;
      case 'top':
        if (pos.y >= screenSize.height - EDGE_THRESHOLD) {
          shouldReturn = true;
          exitX = pos.x / screenSize.width;
          exitY = SAFE_ZONE / screenSize.height;
        }
        break;
    }
    
    if (shouldReturn) {
      isControlActive = false;
      lastReturnTime = now;
      clearInterval(clientTrackingInterval);
      
      // Hide cursor on client before returning
      robot.moveMouse(screenSize.width + 100, screenSize.height + 100);
      
      socket.emit('return-to-host', { exitX, exitY });
      log(`← Returning control to host`);
    }
  }, CHECK_INTERVAL);
}

function getEdgePosition(position, normalizedX, normalizedY) {
  const x = Math.round(normalizedX * screenSize.width);
  const y = Math.round(normalizedY * screenSize.height);
  
  switch (position) {
    case 'right':
      return { x: screenSize.width - SAFE_ZONE, y };
    case 'left':
      return { x: SAFE_ZONE, y };
    case 'bottom':
      return { x, y: screenSize.height - SAFE_ZONE };
    case 'top':
      return { x, y: SAFE_ZONE };
    default:
      return { x, y };
  }
}

function cleanup() {
  if (trackingInterval) clearInterval(trackingInterval);
  if (clientTrackingInterval) clearInterval(clientTrackingInterval);
  if (socket) socket.disconnect();
}

async function main() {
  console.clear();
  console.log('\n╔════════════════════════════════════╗');
  console.log('║        MOUSE SHARE CLIENT          ║');
  console.log('╚════════════════════════════════════╝\n');
  console.log(`Server URL: ${SERVER_URL}\n`);
  console.log('  1. Host (Share your mouse)');
  console.log('  2. Client (Receive control)');
  console.log('  3. Exit\n');
  
  const answer = await question('Select mode (1-3): ');
  
  switch (answer.trim()) {
    case '1':
      await startHost();
      break;
    case '2':
      await startClient();
      break;
    case '3':
      console.log('\nGoodbye!\n');
      process.exit(0);
      break;
    default:
      console.log('\n✗ Invalid option\n');
      process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n\nShutting down...\n');
  cleanup();
  process.exit(0);
});

main().catch(console.error);
