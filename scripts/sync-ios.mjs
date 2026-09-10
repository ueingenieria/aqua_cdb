import { execFileSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'copy' : 'sync';
execFileSync(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', command, 'ios'], { stdio: 'inherit' });
if (command === 'copy') {
    console.log('Recursos iOS copiados. Las dependencias Swift se sincronizan en macOS (workflow iOS).');
}
