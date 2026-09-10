// Only application routes from our web site may become internal navigation.
export function getAppRoute(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password ||
            !['aquaexpress.com.ar', 'www.aquaexpress.com.ar'].includes(url.host)) return null;
        if (url.pathname !== '/cdb' && !url.pathname.startsWith('/cdb/')) return null;
        const path = url.pathname.slice(4) || '/';
        if (path.startsWith('//') || /%2f|%5c/i.test(path)) return null;
        return path + url.search + url.hash;
    } catch {
        return null;
    }
}

export function externalUrl(value) {
    const url = new URL(value);
    if (!['https:', 'mpshare:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('El enlace de pago o navegación no es válido.');
    }
    return url.href;
}
