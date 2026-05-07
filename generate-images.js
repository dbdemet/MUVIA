const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure directory exists
const dir = path.join(__dirname, 'assets', 'university');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Create campus background (1080x1920 with gradient and campus elements)
const svgBg = `
<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(52,211,153);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(34,197,94);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#grad1)"/>
  
  <!-- Campus buildings -->
  <rect x="100" y="300" width="300" height="300" fill="rgb(79,70,229)" opacity="0.8"/>
  <rect x="650" y="250" width="300" height="300" fill="rgb(59,130,246)" opacity="0.8"/>
  <rect x="150" y="1000" width="350" height="300" fill="rgb(251,146,60)" opacity="0.8"/>
  
  <!-- Campus paths -->
  <line x1="0" y1="700" x2="1080" y2="700" stroke="rgb(245,245,245)" stroke-width="40" opacity="0.5"/>
  <line x1="500" y1="0" x2="500" y2="1920" stroke="rgb(245,245,245)" stroke-width="40" opacity="0.5"/>
  
  <!-- Text -->
  <text x="100" y="150" font-size="48" font-weight="bold" fill="white" font-family="Arial">MUGLA CAMPUS</text>
  <text x="100" y="1850" font-size="36" font-weight="bold" fill="white" font-family="Arial">MUVIA Platform</text>
</svg>
`;

// Create logo (400x400)
const svgLogo = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(26,54,93);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(42,105,172);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#logoGrad)"/>
  
  <!-- Outer circle -->
  <circle cx="200" cy="200" r="170" fill="none" stroke="white" stroke-width="8"/>
  
  <!-- Building/Tower -->
  <rect x="150" y="100" width="100" height="200" fill="rgb(255,200,0)" opacity="0.9"/>
  
  <!-- Roof -->
  <polygon points="150,100 250,100 200,30" fill="rgb(255,140,0)"/>
  
  <!-- Windows -->
  <rect x="165" y="120" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="210" y="120" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="165" y="160" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="210" y="160" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="165" y="200" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="210" y="200" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="165" y="240" width="25" height="20" fill="rgb(100,150,200)"/>
  <rect x="210" y="240" width="25" height="20" fill="rgb(100,150,200)"/>
  
  <!-- Text -->
  <text x="140" y="330" font-size="32" font-weight="bold" fill="white" font-family="Arial">MSKU</text>
</svg>
`;

Promise.all([
  sharp(Buffer.from(svgBg)).jpeg({ quality: 95 }).toFile(path.join(dir, 'campus.jpg')),
  sharp(Buffer.from(svgLogo)).png().toFile(path.join(dir, 'logo.png'))
]).then(() => {
  console.log('✓ campus.jpg created (1080x1920)');
  console.log('✓ logo.png created (400x400)');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
