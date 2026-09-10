import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist-mobile';
async function check(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await check(path);
        else if (!/\.(html|js|css|png|jpg|jpeg|webp|svg|ico|mp4|woff2?|ttf)$/i.test(entry.name)) {
            throw new Error(`Archivo no permitido en el paquete móvil: ${path}`);
        }
    }
}
await check(root);
const html = await readFile(join(root, 'index.html'), 'utf8');
if (html.includes('/cdb/') || html.includes('manifest.webmanifest')) {
    throw new Error('El paquete móvil contiene rutas o registro de PWA de la web.');
}
console.log('Paquete móvil verificado: recursos de cliente, sin PHP/SQL ni manifiesto PWA.');
