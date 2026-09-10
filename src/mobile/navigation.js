import { Browser } from '@capacitor/browser';
import { AppLauncher } from '@capacitor/app-launcher';
import { isNative } from './platform';
import { externalUrl } from './urls';

export async function openExternal(value, { replacePage = false } = {}) {
    const url = externalUrl(value);
    if (isNative()) {
        if (url.startsWith('mpshare:')) {
            const { completed } = await AppLauncher.openUrl({ url });
            if (!completed) throw new Error('No se pudo abrir Mercado Pago en este dispositivo.');
        } else {
            await Browser.open({ url });
        }
    } else if (replacePage) {
        window.location.assign(url);
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
