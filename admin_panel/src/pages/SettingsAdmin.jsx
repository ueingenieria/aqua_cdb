import { useState } from 'react';
import { Save, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SettingsAdmin() {
    const [form, setForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.new_password !== form.confirm_password) {
            Swal.fire('Error', 'Las contraseñas nuevas no coinciden', 'error');
            return;
        }

        if (form.new_password.length < 6) {
            Swal.fire('Error', 'La contraseña nueva debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('accion', '91'); // Case 91: Change Password
            formData.append('old_password', form.old_password);
            formData.append('new_password', form.new_password);

            const res = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
                method: 'POST',
                body: formData
            });

            const text = await res.text();

            if (text.includes('OK')) {
                Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success');
                setForm({ old_password: '', new_password: '', confirm_password: '' });
            } else {
                Swal.fire('Error', text.replace('ERROR:', ''), 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Lock className="mr-2 h-6 w-6 text-blue-600" />
                Configuración de Seguridad
            </h2>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Cambiar Contraseña</h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                        <input
                            type="password"
                            name="old_password"
                            value={form.old_password}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            placeholder="Ingrese su contraseña actual"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                name="new_password"
                                value={form.new_password}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={form.confirm_password}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="Repita la nueva contraseña"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors w-full md:w-auto justify-center"
                        >
                            <Save className="h-5 w-5 mr-2" />
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
