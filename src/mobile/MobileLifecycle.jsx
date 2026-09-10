import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { useAuth } from '../context/AuthContext';
import { isNative } from './platform';
import { getAppRoute } from './urls';

export default function MobileLifecycle() {
    const auth = useAuth();
    const currentAuth = useRef(auth);
    currentAuth.current = auth;
    const navigate = useNavigate();

    useEffect(() => {
        if (!isNative()) return;
        let disposed = false;
        const handles = [];
        const keep = async pending => {
            const handle = await pending;
            if (disposed) await handle.remove();
            else handles.push(handle);
        };
        const refresh = () => {
            const { user, refreshBalance, refreshSubscriptionStatus } = currentAuth.current;
            if (user) void Promise.allSettled([refreshBalance(), refreshSubscriptionStatus()]);
        };
        const openLink = async ({ url }) => {
            const route = getAppRoute(url);
            if (!route || disposed) return;
            await Browser.close().catch(() => {});
            navigate(route);
            refresh();
        };
        void Promise.all([
            keep(App.addListener('appUrlOpen', openLink)),
            keep(App.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); })),
            keep(Browser.addListener('browserFinished', refresh)),
            keep(App.addListener('backButton', ({ canGoBack }) => {
                if (canGoBack) window.history.back();
                else void App.minimizeApp();
            })),
            keep(FirebaseMessaging.addListener('notificationActionPerformed', () => navigate('/novedades'))),
            keep(FirebaseMessaging.addListener('tokenReceived', async () => {
                const { user } = currentAuth.current;
                if (user) {
                    const { savePushToken } = await import('../api/notifications');
                    await savePushToken(user.id).catch(console.error);
                }
            })),
            App.getLaunchUrl().then(link => { if (link) return openLink(link); }),
        ]).catch(error => console.error('No se pudo configurar un servicio móvil:', error));
        return () => { disposed = true; handles.forEach(handle => void handle.remove()); };
    }, [navigate]);

    return null;
}
