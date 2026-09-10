import { readFileSync, writeFileSync } from 'node:fs';
import * as plist from 'plist';

const firebase = plist.parse(readFileSync('ios/App/App/GoogleService-Info.plist', 'utf8'));
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
if (firebase.BUNDLE_ID !== config.appId || process.env.IOS_BUNDLE_ID !== config.appId) {
    throw new Error('El Bundle ID de Firebase, App Store Connect y Capacitor debe coincidir. Confirmalo antes de compilar.');
}
if (!firebase.REVERSED_CLIENT_ID || firebase.CLIENT_ID !== process.env.VITE_GOOGLE_IOS_CLIENT_ID) {
    throw new Error('La configuración OAuth iOS no coincide con GoogleService-Info.plist.');
}
const path = 'ios/App/App/Info.plist';
const info = plist.parse(readFileSync(path, 'utf8'));
info.CFBundleURLTypes = [{ CFBundleURLSchemes: [firebase.REVERSED_CLIENT_ID] }];
info.GIDClientID = firebase.CLIENT_ID;
writeFileSync(path, plist.build(info));
console.log('Firebase y retorno OAuth iOS configurados para el identificador confirmado.');
