import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2 } from 'lucide-react';
import { useAppGoogleLogin } from '../hooks/useAppGoogleLogin';
import Logo from '../assets/aqua-png.png';
import globalBg from '../assets/fondo.png';

export default function Login() {
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para el flujo de vinculación
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [googleToken, setGoogleToken] = useState(null);
    const [googleEmail, setGoogleEmail] = useState('');
    const [linkData, setLinkData] = useState({ email: '', password: '' }); // Deprecated but kept for now to avoid breaking if referenced elsewhere, but unused. Actually better remove.
    // Clean up unused state


    const handleGoogleSuccess = async (tokenResponse) => {
        setLoading(true);
        setError('');
        try {
            // Importar API
            const { googleLoginBridge, registerGoogleUserBridge } = await import('../api/googleAuth');

            // 1. Intentar Login Directo
            const result = await googleLoginBridge(tokenResponse.access_token);

            if (result.success) {
                // Login Exitoso (Usuario existía)
                // Usamos result.data.email (agregado en bridge) o fallback a p_login
                const userEmail = result.data.email || result.data.p_login;
                await loginWithAuthData(result.data, userEmail);
                navigate('/');
            } else {
                // FALLO EL LOGIN. Solo intentamos registro si el mensaje confirma que no existe.
                const msg = result.msg ? result.msg.toLowerCase() : '';

                // Chequeamos variaciones de "usuario no encontrado"
                if (msg.includes('no encontrado') || msg.includes('not found') || msg.includes('inexistente')) {
                    // Usuario NO existe -> Proceder a Registro Automático
                    const axios = (await import('axios')).default;
                    const profileResponse = await axios.get(
                        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`,
                        { headers: { Authorization: `Bearer ${tokenResponse.access_token}`, Accept: 'application/json' } }
                    );

                    const googleProfile = profileResponse.data;
                    const Swal = (await import('sweetalert2')).default;

                    // Intentar REGISTRO automático
                    const registerData = {
                        name: googleProfile.given_name || 'User',
                        surname: googleProfile.family_name || '',
                        email: googleProfile.email,
                        password: '',
                        dni: '0'
                    };

                    const regResult = await registerGoogleUserBridge(tokenResponse.access_token, registerData);

                    if (regResult.success) {
                        if (regResult.data && regResult.data.p_id_cliente) {
                            // Aplicar código de referido pendiente si existe
                            const pendingRef = sessionStorage.getItem('pending_referral_code');
                            if (pendingRef) {
                                const { registerReferral } = await import('../api/referrals');
                                await registerReferral(googleProfile.email, pendingRef);
                                sessionStorage.removeItem('pending_referral_code');
                            }
                            await loginWithAuthData(regResult.data, googleProfile.email);
                            navigate('/');
                        } else {
                            Swal.fire({
                                title: 'Cuenta Creada',
                                text: regResult.msg || 'Hemos creado tu cuenta. Verifica tu email si es necesario.',
                                icon: 'success'
                            });
                        }
                    } else {
                        setError(regResult.msg || 'Error al intentar registrar el usuario.');
                    }
                } else {
                    // El error NO fue "usuario no encontrado", sino algo más grave (token inválido, error server backend, etc.)
                    console.error("Login Bridge Failed:", result);
                    setError(result.msg || 'Error de conexión con el servidor.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error de comunicación con el servidor de autenticación');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useAppGoogleLogin({
        onSuccess: (response) => {
            handleGoogleSuccess(response);
        },
        onError: (error) => {
            console.error("Google Login ERROR DETAILED:", error);
            setError('Error al iniciar sesión con Google: ' + JSON.stringify(error));
        },
        // flow: 'implicit' // Quitamos esto para usar el default
    });

    // Helper para loguear manualmente usando los datos que devolvio el bridge/legacy
    const loginWithAuthData = async (legacyData, email) => {
        // Esta función simula lo que hace login() en AuthContext pero con datos ya recibidos
        // Podríamos exponer una función 'setUserData' en AuthContext o usar localStorage direct hacks (no recomendado)
        // Lo ideal: Modificar loginWithGoogle del context para aceptar los datos
        await loginWithGoogle(null, legacyData, email);
    };



    const handleForgotPassword = async () => {
        const Swal = (await import('sweetalert2')).default;
        const { value: email } = await Swal.fire({
            title: 'Recuperar contraseña',
            input: 'email',
            inputLabel: 'Ingresá tu email registrado',
            inputPlaceholder: 'tu@email.com',
            inputValue: formData.email,
            confirmButtonText: 'Enviar',
            confirmButtonColor: '#0ea5e9',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) return 'Por favor ingresá tu email';
            }
        });

        if (!email) return;

        try {
            const { forgotPassword } = await import('../api/auth');
            await forgotPassword(email);
            Swal.fire({
                icon: 'success',
                title: 'Correo enviado',
                text: 'Si tu email está registrado, recibirás las instrucciones para restablecer tu contraseña.',
                confirmButtonColor: '#0ea5e9',
            });
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo procesar la solicitud. Intentá nuevamente.',
                confirmButtonColor: '#0ea5e9',
            });
        }
    };

    const handleForceChangePassword = async (email, tempPassword) => {
        const Swal = (await import('sweetalert2')).default;
        const { changePassword } = await import('../api/auth');

        // Mostrar aviso primero
        await Swal.fire({
            icon: 'info',
            title: 'Cambiá tu contraseña',
            text: 'Recibiste una contraseña temporal. Por seguridad, creá una nueva antes de continuar.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#0ea5e9',
            allowOutsideClick: false,
            allowEscapeKey: false,
        });

        let succeeded = false;
        while (!succeeded) {
            const { value: newPass, isDismissed: d1 } = await Swal.fire({
                title: 'Nueva contraseña',
                input: 'password',
                inputLabel: 'Ingresá tu nueva contraseña (mínimo 6 caracteres)',
                inputPlaceholder: '••••••••',
                confirmButtonText: 'Siguiente',
                confirmButtonColor: '#0ea5e9',
                allowOutsideClick: false,
                allowEscapeKey: false,
                inputValidator: (v) => {
                    if (!v) return 'Ingresá una contraseña';
                    if (v.length < 6) return 'Debe tener al menos 6 caracteres';
                }
            });
            if (d1 || !newPass) break;

            const { value: confirmPass, isDismissed: d2 } = await Swal.fire({
                title: 'Confirmá tu contraseña',
                input: 'password',
                inputLabel: 'Ingresá la contraseña nuevamente',
                inputPlaceholder: '••••••••',
                confirmButtonText: 'Guardar',
                confirmButtonColor: '#0ea5e9',
                allowOutsideClick: false,
                allowEscapeKey: false,
                inputValidator: (v) => {
                    if (!v) return 'Confirmá tu contraseña';
                    if (v !== newPass) return 'Las contraseñas no coinciden';
                }
            });
            if (d2 || !confirmPass) break;

            try {
                const res = await changePassword(email, tempPassword, newPass, confirmPass);
                const text = typeof res === 'string' ? res : JSON.stringify(res);

                if (text.includes('realizado correctamente')) {
                    await Swal.fire({
                        icon: 'success',
                        title: '¡Contraseña actualizada!',
                        text: 'Tu contraseña fue cambiada exitosamente.',
                        confirmButtonColor: '#0ea5e9',
                    });
                    succeeded = true;
                    navigate('/');
                } else if (text.includes('simple')) {
                    await Swal.fire({ icon: 'error', title: 'Contraseña muy simple', text: 'Elegí una contraseña más segura.', confirmButtonColor: '#0ea5e9' });
                } else if (text.includes('caracteres')) {
                    await Swal.fire({ icon: 'error', title: 'Contraseña muy corta', text: 'Debe tener al menos 6 caracteres.', confirmButtonColor: '#0ea5e9' });
                } else {
                    await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar la contraseña. Intentá de nuevo.', confirmButtonColor: '#0ea5e9' });
                }
            } catch {
                await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'Intentá de nuevo.', confirmButtonColor: '#0ea5e9' });
            }
        }

        // Si nunca cambió la contraseña, igual dejarlo entrar (ya está logueado)
        if (!succeeded) {
            navigate('/');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                if (result.data?.reset_password === 'SI') {
                    await handleForceChangePassword(formData.email, formData.password);
                } else {
                    navigate('/');
                }
            } else if (result.message && result.message.toLowerCase().includes('no confirmó')) {
                const Swal = (await import('sweetalert2')).default;
                Swal.fire({
                    icon: 'info',
                    title: 'Verificá tu correo',
                    html: 'Tu cuenta aún no está activa.<br/>Revisá tu casilla de correo y hacé clic en el enlace de confirmación que te enviamos.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#0ea5e9',
                });
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const { registerGoogleUserBridge } = await import('../api/googleAuth');
            // Usamos el email de google. Password generamos uno random o usamos el ID de google como pass inicial (hash)
            // Para simplificar UX, generamos un password seguro aleatorio que el usuario no necesita saber, 
            // ya que entrará con Google. Si quiere entrar normal, tendrá que hacer "Olvidé mi contraseña".
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            // Decodificamos el token para sacar nombre y apellido si es posible, o usamos placeholders
            // El endpoint de info del token ya nos dio el email. 
            // Podriamos pasar nombre y apellido desde el objeto googleUser en el bridge, pero aqui solo tenemos token.
            // Para hacerlo bien, decodifiquemos el JWT aqui un poco a lo bruto o pidamos al bridge que lo haga.
            // MEJOR OPCION: El bridge ya valida el token y saca los datos. 
            // Pasemos datos dummy de nombre/apellido y que el bridge los saque del token seria ideal, 
            // pero el bridge actual usa los datos que le mandamos en 'user_data'.
            // Vamos a mandar "Usuario" "Google" por ahora y el usuario luego lo cambia en su perfil.

            const userData = {
                name: "Usuario",
                surname: "Google",
                email: googleEmail,
                password: randomPassword
            };

            const result = await registerGoogleUserBridge(googleToken, userData);

            if (result.success) {
                await loginWithAuthData(result.data, googleEmail);
                navigate('/');
            } else {
                setError(result.msg || 'Error al registrar usuario');
            }
        } catch (err) {
            setError('Error al intentar registrar');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Global App Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src={globalBg}
                    alt="App Background"
                    className="w-full h-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sky-200/90" />
            </div>

            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-300 relative z-10">
                <div className="text-center">
                    <div className="mx-auto w-72 h-auto -mb-6 relative">
                        <img src={Logo} alt="AquaExpress" className="w-full h-full object-contain" />
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Bienvenido</h2>
                    <p className="text-sky-100">Ingresá a tu cuenta para continuar</p>
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
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-sky-500 hover:text-sky-700 transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
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
                        <Button variant="secondary" type="button" className="w-full" onClick={() => { console.log("Click en Google Login"); googleLogin(); }}>
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
