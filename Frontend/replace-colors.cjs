const fs = require('fs');
const path = require('path');

const files = [
  'src/dashboard/ProfessorDashboard.jsx',
  'src/dashboard/AdminDashboard.jsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  content = content.replace(/cyan-500/g, 'sky-400');
  content = content.replace(/cyan-400/g, 'sky-400');
  content = content.replace(/cyan-300/g, 'sky-300');
  content = content.replace(/cyan-200/g, 'sky-200');
  content = content.replace(/emerald-400/g, 'violet-400');
  content = content.replace(/blue-500/g, 'sky-500');
  content = content.replace(/blue-400/g, 'sky-400');
  content = content.replace(/rgba\(6,182,212/g, 'rgba(56,189,248');

  fs.writeFileSync(fullPath, content, 'utf8');
});

console.log('Replaced colors successfully!');
