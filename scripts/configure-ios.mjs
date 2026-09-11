import { readFileSync, writeFileSync } from 'node:fs';
import * as plist from 'plist';

const firebase = plist.parse(readFileSync('ios/App/App/GoogleService-Info.plist', 'utf8'));
const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
const bundleIds = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*"?([^";\s]+)"?\s*;/g)].map(match => match[1]);
if (!process.env.IOS_BUNDLE_ID || firebase.BUNDLE_ID !== process.env.IOS_BUNDLE_ID ||
    !bundleIds.length || bundleIds.some(id => id !== process.env.IOS_BUNDLE_ID)) {
    throw new Error('El Bundle ID de Firebase, App Store Connect y Xcode debe coincidir. Confirmalo antes de compilar.');
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
