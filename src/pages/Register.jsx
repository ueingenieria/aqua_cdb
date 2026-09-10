import { useState, useEffect } from 'react';
import { registerUser } from '../api/user';
import { registerReferral } from '../api/referrals';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Mail, Loader2, ArrowLeft, Gift } from 'lucide-react';
import Logo from '../assets/logo_aqua_4d.png';
import globalBg from '../assets/fondo.png';
import Swal from 'sweetalert2';
import { useAppGoogleLogin } from '../hooks/useAppGoogleLogin';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();
    const [searchParams] = useSearchParams();
    const refFromUrl = searchParams.get('ref') || '';
    const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '', confirmPassword: '', referralCode: refFromUrl.toUpperCase() });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (refFromUrl) {
            sessionStorage.setItem('pending_referral_code', refFromUrl.toUpperCase());
        }
    }, []);

    const handleGoogleRegister = async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            const axios = (await import('axios')).default;
            const { googleLoginBridge, registerGoogleUserBridge } = await import('../api/googleAuth');

            // Obtener perfil de Google
            const profileRes = await axios.get(
                `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`,
                { headers: { Authorization: `Bearer ${tokenResponse.access_token}`, Accept: 'application/json' } }
            );
            const googleProfile = profileRes.data;

            // Intentar login primero (por si ya tiene cuenta)
            const loginResult = await googleLoginBridge(tokenResponse.access_token);
            if (loginResult.success) {
                // Aún con cuenta existente, aplicar código de referido si hay uno pendiente
                const refCode = formData.referralCode.trim() || sessionStorage.getItem('pending_referral_code') || '';
                if (refCode) {
                    await registerReferral(googleProfile.email, refCode);
                    sessionStorage.removeItem('pending_referral_code');
                }
                await loginWithGoogle(null, loginResult.data, googleProfile.email);
                navigate('/');
                return;
            }

            // No tiene cuenta → registrar
            const registerData = { name: googleProfile.given_name || 'Usuario', surname: googleProfile.family_name || '', email: googleProfile.email, password: '', dni: '0' };
            const regResult = await registerGoogleUserBridge(tokenResponse.access_token, registerData);

            if (regResult.success) {
                // Aplicar código de referido apenas se confirma el registro exitoso
                const refCode = formData.referralCode.trim() || sessionStorage.getItem('pending_referral_code') || '';
                if (refCode) {
                    await registerReferral(googleProfile.email, refCode);
                    sessionStorage.removeItem('pending_referral_code');
                }
                if (regResult.data?.p_id_cliente) {
                    await loginWithGoogle(null, regResult.data, googleProfile.email);
                    navigate('/');
                } else {
                    // Registro OK pero sin auto-login → redirigir al login
                    await Swal.fire({
                        title: '¡Cuenta creada!',
                        text: 'Tu cuenta fue creada con éxito. Iniciá sesión para continuar.',
                        icon: 'success',
                        confirmButtonText: 'Ir al login',
                        confirmButtonColor: '#0ea5e9',
                    });
                    navigate('/login');
                }
            } else {
                setError(regResult.msg || 'Error al registrar con Google.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con Google.');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useAppGoogleLogin({
        onSuccess: handleGoogleRegister,
        onError: () => setError('Error al conectar con Google.'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const result = await registerUser(formData.name, formData.surname, formData.email, formData.password);

            // Legacy responses checking
            let resultText = result;
            if (typeof result !== 'string') {
                resultText = JSON.stringify(result); // Fallback si Axios parseó un JSON
            }

            if (resultText && (resultText.includes("correctamente") || resultText.includes("CORRECTAMENTE"))) {
                if (formData.referralCode.trim()) {
                    await registerReferral(formData.email, formData.referralCode.trim());
                }
                await Swal.fire({
                    title: '¡Cuenta creada!',
                    html: 'Tu cuenta fue creada con éxito.<br/>Por favor <strong>verificá tu email</strong> para activarla.',
                    icon: 'success',
                    confirmButtonText: 'Ir al inicio de sesión',
                    confirmButtonColor: '#0ea5e9',
                    allowOutsideClick: false,
                });
                navigate('/login');
            } else if (resultText && (resultText.includes("existe") || resultText.includes("EXISTE"))) {
                setError("El email ya está registrado.");
            } else {
                console.warn("Respuesta desconocida:", result);
                setError("Error al registrar usuario: " + (resultText || "Respuesta vacía"));
            }

        } catch (err) {
            setError('Error de conexión o servidor.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Fondo Global de la App */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src={globalBg}
                    alt="App Background"
                    className="w-full h-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sky-200/90" />
            </div>

            <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in duration-300 relative z-10">
                <div className="text-center">
                    <div className="mx-auto w-72 h-auto -mb-4 relative">
                        <img src={Logo} alt="AquaExpress" className="w-full h-full object-contain" />
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Crear Cuenta</h2>
                    <p className="text-sky-100">Unite a AquaExpress hoy mismo</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 space-y-6 border border-gray-100">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">Nombre</label>
                                <Input
                                    placeholder="Juan"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 ml-1">Apellido</label>
                                <Input
                                    placeholder="Pérez"
                                    value={formData.surname}
                                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Repetir Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Código de referido <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <div className="relative">
                                <Gift className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="AQUA-XXXXX"
                                    className="pl-10 uppercase"
                                    value={formData.referralCode}
                                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
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
                            {loading ? 'Creando cuenta...' : 'Registrarse'}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">O registrate con</span>
                        </div>
                    </div>

                    <Button variant="secondary" type="button" className="w-full" onClick={() => googleLogin()} disabled={loading}>
                        <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                        Continuar con Google
                    </Button>
                </div>

                <p className="text-center text-sm text-gray-500">
                    ¿Ya tenés cuenta?{' '}
                    <button onClick={() => navigate('/login')} className="font-semibold text-primary hover:text-sky-600 transition-colors">
                        Iniciar sesión
                    </button>
                </p>
            </div>
        </div>
    );
}

