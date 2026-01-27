import { useState } from 'react';
import { registerUser } from '../api/user';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                alert("Cuenta creada con éxito. Por favor verificá tu email.");
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => navigate('/login')} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Volver al Login
                </button>

                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Crear Cuenta</h2>
                    <p className="text-gray-500">Unite a AquaExpress hoy mismo</p>
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
                </div>
            </div>
        </div>
    );
}

