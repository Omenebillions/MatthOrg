import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf-8');
  
  const routes = [
    'business',
    'admin',
    'recommend',
    'recommendations',
    'blog',
    'services',
    'locations',
    'app'
  ];

  for (const route of routes) {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent, 'utf-8');
    fs.writeFileSync(path.join(distDir, `${route}.html`), htmlContent, 'utf-8');
  }

  console.log(`[Build] Static route fallbacks generated for: ${routes.join(', ')}`);
} else {
  console.warn('[Build] dist/index.html not found, skipping route fallback generation.');
}
