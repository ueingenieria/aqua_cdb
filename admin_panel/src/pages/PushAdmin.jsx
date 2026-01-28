import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function PushAdmin() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('accion', '81'); // Send Push
            formData.append('title', title);
            formData.append('body', body);

            await axios.post('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', formData);
            Swal.fire('Enviado', 'Notificación enviada a todos los dispositivos', 'success');
            setTitle('');
            setBody('');
        } catch (error) {
            Swal.fire('Error', 'No se pudo enviar', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Enviar Notificación Push</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título de la Notificación</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej: ¡Oferta Especial!"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32"
                            placeholder="Ej: Aprovecha el 2x1 en lavados hoy..."
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? 'Enviando...' : 'Enviar a Todos los Usuarios'}
                        </button>
                        <p className="text-xs text-gray-400 text-center mt-4">
                            Se enviará a todos los dispositivos registrados (Android, iOS, Web).
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
