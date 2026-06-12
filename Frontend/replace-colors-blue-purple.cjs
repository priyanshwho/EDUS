const fs = require('fs');
const path = require('path');

const files = [
  'src/dashboard/StudentDashboard.jsx',
  'src/dashboard/ProfessorDashboard.jsx',
  'src/dashboard/AdminDashboard.jsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace 'sky' with 'blue'
  content = content.replace(/sky-500/g, 'blue-600');
  content = content.replace(/sky-400/g, 'blue-500');
  content = content.replace(/sky-300/g, 'blue-400');
  content = content.replace(/sky-200/g, 'blue-300');
  
  // Replace 'violet' with 'purple'
  content = content.replace(/violet-500/g, 'purple-600');
  content = content.replace(/violet-400/g, 'purple-500');
  content = content.replace(/violet-300/g, 'purple-400');

  // Replace RGB of sky (56,189,248) with blue (59,130,246)
  content = content.replace(/rgba\(56,189,248/g, 'rgba(59,130,246');
  
  // If there's still any cyan left (e.g. from missed sed) replace to blue
  content = content.replace(/cyan-500/g, 'blue-600');
  content = content.replace(/cyan-400/g, 'blue-500');
  content = content.replace(/cyan-300/g, 'blue-400');
  content = content.replace(/cyan-200/g, 'blue-300');
  content = content.replace(/emerald-400/g, 'purple-500');
  content = content.replace(/rgba\(6,182,212/g, 'rgba(59,130,246');

  // Any explicit from-blue-* via-* to-* should be updated
  // For example, from-sky-400 to-violet-400 -> from-blue-500 to-purple-500
  // or bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 -> from-blue-600 via-blue-500 to-purple-500

  fs.writeFileSync(fullPath, content, 'utf8');
});

console.log('Colors replaced successfully!');
