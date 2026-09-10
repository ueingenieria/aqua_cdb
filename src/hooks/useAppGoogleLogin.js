import { useGoogleLogin } from '@react-oauth/google';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { isNative, platform } from '../mobile/platform';

let initialization;

export function useAppGoogleLogin(options) {
    const webLogin = useGoogleLogin(options);
    return async () => {
        if (!isNative()) return webLogin();
        try {
            const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
            const iOSClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
            if (!webClientId || (platform() === 'ios' && !iOSClientId)) {
                throw new Error('El acceso con Google todavía no está configurado para esta versión.');
            }
            initialization ??= SocialLogin.initialize({
                google: { webClientId, iOSClientId, mode: 'online' },
            }).catch(error => { initialization = undefined; throw error; });
            await initialization;
            const { result } = await SocialLogin.login({
                provider: 'google',
                options: { scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'] },
            });
            const token = result.accessToken?.token;
            // The existing PHP bridge verifies an OAuth access token, not an ID token.
            if (!token) throw new Error('Google no devolvió el permiso necesario para iniciar sesión.');
            await options.onSuccess?.({ access_token: token });
        } catch (error) {
            options.onError?.({ error: error.message });
        }
    };
}
