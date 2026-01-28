import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/marketing_digial.png';

export default function Login({ setIsAuthenticated }) {
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('accion', '90'); // Case 90: Login
            formData.append('password', pass);

            const res = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
                method: 'POST',
                body: formData
            });
            const text = await res.text();

            if (text.includes('OK')) {
                localStorage.setItem('admin_token', 'session-active-' + Date.now());
                setIsAuthenticated(true);
                navigate('/');
            } else {
                alert('Contraseña incorrecta');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-center -my-6">
                    <img src={Logo} alt="Admin Marketing" className="w-full h-auto object-contain" />
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de Acceso</label>
                        <input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ingrese contraseña"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
}
