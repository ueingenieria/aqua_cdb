import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Coupons from './pages/Coupons';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import QRScanner from './pages/QRScanner';
import LocationsMap from './pages/LocationsMap';
import CreditsMap from './pages/CreditsMap';
import Activity from './pages/Activity';
import News from './pages/News';
import Benefits from './pages/Benefits';
import Redeem from './pages/Redeem';
import MyQR from './pages/MyQR';
import Referidos from './pages/Referidos';
import MainLayout from './components/layout/MainLayout';
import { Loader2 } from 'lucide-react';
import { SplashScreen } from './components/ui/SplashScreen';
import { useState } from 'react';
import MobileLifecycle from './mobile/MobileLifecycle';
import { isNative } from './mobile/platform';
import { onNativeMessage } from './mobile/push';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (isNative()) {
      let disposed = false;
      let listener;
      onNativeMessage(async ({ notification }) => {
        const Swal = (await import('sweetalert2')).default;
        if (!disposed) Swal.fire({ title: notification.title || 'AquaExpress', text: notification.body || '', toast: true, position: 'top-end', timer: 5000, showConfirmButton: false });
      }).then(handle => {
        if (disposed) void handle.remove();
        else listener = handle;
      }).catch(console.error);
      return () => { disposed = true; void listener?.remove(); };
    }
    // Listen for foreground push messages
    const listenForMessages = async () => {
      try {
        const { onMessageListener } = await import('./firebase');
        const Swal = (await import('sweetalert2')).default;

        onMessageListener().then(payload => {
          console.log('Foreground Message Received:', payload);
          Swal.fire({
            title: payload.notification.title,
            text: payload.notification.body,
            icon: 'info',
            confirmButtonText: 'Ver',
            toast: true,
            position: 'top-end',
            timer: 5000
          });
        }).catch(err => console.log('Failed: ', err));
      } catch (e) {
        console.log('Error setting up listener', e);
      }
    };
    listenForMessages();
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <MobileLifecycle />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="cupones" element={<Coupons />} />
              <Route path="billetera" element={<Wallet />} />
              <Route path="qr" element={<QRScanner />} />
              <Route path="qr-usuario" element={<MyQR />} />
              <Route path="perfil" element={<Profile />} />
              <Route path="mapa" element={<LocationsMap />} />
              <Route path="creditos-mapa" element={<CreditsMap />} />
              <Route path="actividad" element={<Activity />} />
              <Route path="novedades" element={<News />} />
              <Route path="beneficios" element={<Benefits />} />
              <Route path="canje" element={<Redeem />} />
              <Route path="referidos" element={<Referidos />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
};

export default App;
