import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const target = process.argv[2];
if (!['android', 'ios'].includes(target)) throw new Error('Plataforma inválida.');
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const required = ['VITE_GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_WEB_CLIENT_ID', 'APP_VERSION', 'APP_BUILD_NUMBER'];
required.push(target === 'android' ? 'GOOGLE_SERVICES_JSON_BASE64' : 'GOOGLE_SERVICE_INFO_PLIST_BASE64');
if (target === 'ios') required.push('IOS_BUNDLE_ID', 'VITE_GOOGLE_IOS_CLIENT_ID');
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Falta configurar: ${missing.join(', ')}`);
if (!/^\d+\.\d+\.\d+$/.test(process.env.APP_VERSION)) throw new Error('APP_VERSION debe tener formato 3.4.0.');
if (!/^[1-9]\d*$/.test(process.env.APP_BUILD_NUMBER) || Number(process.env.APP_BUILD_NUMBER) > 2100000000) {
    throw new Error('APP_BUILD_NUMBER debe ser un entero positivo válido y superior al último usado en la tienda.');
}
const destination = target === 'android' ? 'android/app/google-services.json' : 'ios/App/App/GoogleService-Info.plist';
const content = Buffer.from(process.env[target === 'android' ? 'GOOGLE_SERVICES_JSON_BASE64' : 'GOOGLE_SERVICE_INFO_PLIST_BASE64'], 'base64');
if (target === 'android') {
    const firebase = JSON.parse(content.toString('utf8'));
    if (!firebase.client?.some(client => client.client_info?.android_client_info?.package_name === config.appId)) {
        throw new Error('google-services.json no corresponde al identificador de AquaExpress.');
    }
}
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, content);
console.log(`Configuración de ${target} preparada.`);
