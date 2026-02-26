# Instructions for Kali Linux

## Step 1: Install System Dependencies (One Time Only)

```bash
sudo apt-get update
sudo apt-get install -y libxtst-dev libpng++-dev build-essential g++ make
```

## Step 2: Clone and Install

```bash
cd ~
git clone https://github.com/redeyessssss/sharemouse.git
cd sharemouse/client
npm install
```

If you get errors, try:
```bash
npm rebuild robotjs
```

## Step 3: Test robotjs (Optional)

```bash
node test-robotjs.js
```

You should see: `✓ robotjs is working!`

## Step 4: Connect to Mac Server

### Option A: Same WiFi Network

If both laptops are on the same WiFi:

```bash
export SERVER_URL=http://MAC_IP_ADDRESS:3002
npm start
```

Replace `MAC_IP_ADDRESS` with your Mac's IP (e.g., `192.168.1.100`)

### Option B: Localhost (if server is on Kali)

If you're running the server on Kali:

```bash
npm start
```

## Step 5: Run Client Mode

1. Type `2` and press Enter (Client mode)
2. Enter the OTP code from your Mac (e.g., `ABC123`)
3. Wait for connection

## Step 6: Done!

Once connected, the Mac will ask where Kali is positioned:
- If Kali is on the RIGHT of Mac → Mac user selects `2`
- If Kali is on the LEFT of Mac → Mac user selects `1`

Then move the mouse to the edge and it will flow between laptops!

---

## Troubleshooting

### robotjs not found
```bash
cd ~/sharemouse/client
rm -rf node_modules package-lock.json
npm install
```

### Permission denied
```bash
export DISPLAY=:0
```

### Can't connect to server
```bash
# Check if you can reach the Mac
ping MAC_IP_ADDRESS

# Make sure you're using the right URL
export SERVER_URL=http://MAC_IP_ADDRESS:3002
npm start
```

### Mouse not moving
```bash
# Grant X11 permissions
xhost +
export DISPLAY=:0
```
