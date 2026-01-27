import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                await loginWithGoogle(tokenResponse.access_token);
                navigate('/');
            } catch (err) {
                setError('Error al iniciar sesión con Google');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Error al iniciar sesión con Google'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-24 h-24 mb-6 relative">
                        <img src="/img/logo.png" alt="AquaExpress" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                        {/* Fallback si no hay logo aun */}
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full -z-10 blur-xl"></div>
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido</h2>
                    <p className="text-gray-500">Ingresá a tu cuenta para continuar</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 space-y-6 border border-gray-100">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="pl-10"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center animate-pulse">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full text-lg" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </Button>
                    </form>

                    < div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">O continuá con</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Button variant="secondary" type="button" className="w-full" onClick={() => googleLogin()}>
                            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                            Continuar con Google
                        </Button>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500">
                    ¿No tenés cuenta?{' '}
                    <button onClick={() => navigate('/register')} className="font-semibold text-primary hover:text-sky-600 transition-colors">
                        Registrate
                    </button>
                </p>
            </div>
        </div>
    );
}
