import robot from 'robotjs';
import { io } from 'socket.io-client';
import readline from 'readline';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';
const EDGE = 5;
const SAFE = 50;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let socket, otp, screen, mode;
let clients = new Map();
let myPos = null;
let active = false;

function ask(q) {
  return new Promise(r => rl.question(q, r));
}

function log(m) {
  console.log(`[${new Date().toLocaleTimeString()}] ${m}`);
}

// HOST MODE
async function host() {
  socket = io(SERVER_URL);
  
  socket.on('connect', () => {
    socket.emit('create-session', (res) => {
      otp = res.otp;
      console.log(`\n✓ HOST MODE\n  OTP: ${otp}\n`);
      hostLoop();
    });
  });
  
  socket.on('client-joined', async (d) => {
    log(`Client connected`);
    const p = await ask('Position (1=left 2=right 3=top 4=bottom): ');
    const pos = ['left','right','top','bottom'][p-1] || 'right';
    clients.set(d.clientId, { pos, active: false });
    socket.emit('set-client-position', { clientId: d.clientId, position: pos });
    log(`Client positioned: ${pos}`);
  });
  
  socket.on('take-back', (d) => {
    const c = clients.get(d.clientId);
    if (c) {
      c.active = false;
      active = true;
      const x = Math.round(d.x * screen.width);
      const y = Math.round(d.y * screen.height);
      robot.moveMouse(x, y);
      log('← Back to host');
    }
  });
}

function hostLoop() {
  screen = robot.getScreenSize();
  active = true;
  
  console.log(`  Screen: ${screen.width}x${screen.height}`);
  console.log(`  Move mouse to edge to switch!\n`);
  
  setInterval(() => {
    // Check if client is active
    const ac = Array.from(clients.entries()).find(([_, c]) => c.active);
    
    if (ac) {
      // Client has control - just wait
      return;
    }
    
    if (!active) return;
    
    const pos = robot.getMousePos();
    
    // Check edges
    for (const [id, c] of clients) {
      if (c.active) continue;
      
      let go = false, x = 0, y = 0;
      
      if (c.pos === 'right' && pos.x >= screen.width - EDGE) {
        go = true;
        x = SAFE / screen.width;
        y = pos.y / screen.height;
      } else if (c.pos === 'left' && pos.x <= EDGE) {
        go = true;
        x = 1 - SAFE / screen.width;
        y = pos.y / screen.height;
      } else if (c.pos === 'bottom' && pos.y >= screen.height - EDGE) {
        go = true;
        x = pos.x / screen.width;
        y = SAFE / screen.height;
      } else if (c.pos === 'top' && pos.y <= EDGE) {
        go = true;
        x = pos.x / screen.width;
        y = 1 - SAFE / screen.height;
      }
      
      if (go) {
        active = false;
        c.active = true;
        
        console.log(`  Switching to ${c.pos} client...`);
        
        // Hide host cursor
        robot.moveMouse(screen.width + 500, screen.height + 500);
        
        socket.emit('switch', { clientId: id, x, y });
        log(`→ Switched to ${c.pos} client`);
        break;
      }
    }
  }, 16);
}

// CLIENT MODE
async function client() {
  const code = await ask('\nOTP: ');
  otp = code.toUpperCase().trim();
  
  socket = io(SERVER_URL);
  
  socket.on('connect', () => {
    socket.emit('join-session', { otp }, (res) => {
      if (res.success) {
        console.log('\n✓ CLIENT MODE\n  Waiting...\n');
      } else {
        console.log('✗ Invalid OTP');
        process.exit(1);
      }
    });
  });
  
  socket.on('position-set', (d) => {
    myPos = d.position;
    log(`Position: ${myPos}`);
    console.log('  Ready to receive control!\n');
  });
  
  socket.on('take-control', (d) => {
    screen = robot.getScreenSize();
    active = true;
    
    const x = Math.round(d.x * screen.width);
    const y = Math.round(d.y * screen.height);
    robot.moveMouse(x, y);
    
    log('✓ Control active');
    clientLoop();
  });
}

function clientLoop() {
  const interval = setInterval(() => {
    if (!active) {
      clearInterval(interval);
      return;
    }
    
    const pos = robot.getMousePos();
    let back = false, x = 0, y = 0;
    
    if (myPos === 'right' && pos.x <= EDGE) {
      back = true;
      x = 1 - SAFE / screen.width;
      y = pos.y / screen.height;
    } else if (myPos === 'left' && pos.x >= screen.width - EDGE) {
      back = true;
      x = SAFE / screen.width;
      y = pos.y / screen.height;
    } else if (myPos === 'bottom' && pos.y <= EDGE) {
      back = true;
      x = pos.x / screen.width;
      y = 1 - SAFE / screen.height;
    } else if (myPos === 'top' && pos.y >= screen.height - EDGE) {
      back = true;
      x = pos.x / screen.width;
      y = SAFE / screen.height;
    }
    
    if (back) {
      active = false;
      
      // Hide client cursor
      robot.moveMouse(screen.width + 500, screen.height + 500);
      
      socket.emit('return', { x, y });
      log('← Returning to host');
    }
  }, 16);
}

// MAIN
async function main() {
  console.clear();
  console.log('\n╔══════════════════════╗');
  console.log('║   MOUSE SHARE v2.0   ║');
  console.log('╚══════════════════════╝\n');
  console.log(`Server: ${SERVER_URL}\n`);
  console.log('1. Host\n2. Client\n3. Exit\n');
  
  const ans = await ask('Select: ');
  
  if (ans === '1') await host();
  else if (ans === '2') await client();
  else process.exit(0);
}

main();
