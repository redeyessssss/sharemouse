# Installation Guide

## System Requirements

### Linux (Debian/Ubuntu/Kali)

Install required dependencies:

```bash
sudo apt-get update
sudo apt-get install -y libxtst-dev libpng++-dev build-essential
```

### macOS

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

### Windows

Install windows-build-tools:

```bash
npm install --global windows-build-tools
```

## Installation Steps

### 1. Install Server

```bash
cd mouse-share/server
npm install
```

### 2. Install Client

```bash
cd mouse-share/client
npm install
```

If robotjs fails to build, try:

```bash
npm rebuild robotjs
# or
npm install --build-from-source
```

### 3. Grant Permissions

#### macOS
- System Preferences → Security & Privacy → Privacy → Accessibility
- Add Terminal (or your terminal app)

#### Linux
```bash
export DISPLAY=:0
```

#### Windows
- Run terminal as Administrator

## Troubleshooting

### robotjs installation fails on Linux

```bash
# Install dependencies
sudo apt-get install -y libxtst-dev libpng++-dev build-essential g++ make

# Clean and reinstall
cd mouse-share/client
rm -rf node_modules package-lock.json
npm install
```

### Module not found error

```bash
cd mouse-share/client
npm install
npm rebuild
```

### Permission denied on Linux

```bash
sudo chmod +x client.js
```

### Display error on Linux

```bash
export DISPLAY=:0
# Add to ~/.bashrc to make permanent
echo 'export DISPLAY=:0' >> ~/.bashrc
```

## Verify Installation

Test if robotjs works:

```bash
cd mouse-share/client
node -e "const robot = require('robotjs'); console.log('Screen size:', robot.getScreenSize());"
```

If this prints your screen size, robotjs is working correctly!
