// Quick test to verify robotjs is working
try {
  const robot = require('robotjs');
  const screenSize = robot.getScreenSize();
  const mousePos = robot.getMousePos();
  
  console.log('✓ robotjs is working!');
  console.log('Screen size:', screenSize);
  console.log('Mouse position:', mousePos);
  console.log('\nYou can now run: npm start');
} catch (error) {
  console.error('✗ robotjs is not working:');
  console.error(error.message);
  console.log('\nPlease install system dependencies:');
  console.log('Linux: sudo apt-get install libxtst-dev libpng++-dev build-essential');
  console.log('macOS: xcode-select --install');
  console.log('Windows: npm install --global windows-build-tools');
  console.log('\nThen run: npm rebuild robotjs');
}
