import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash, Eye, EyeOff } from 'lucide-react';

export default function NewsAdmin() {
    const [news, setNews] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ titulo: '', subtitulo: '', cuerpo: '', imagen_url: '' });

    const [file, setFile] = useState(null);

    // Use absolute URL to the PHP backend
    const API_URL = 'https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php';

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        const formData = new FormData();
        formData.append('accion', '71');
        const res = await axios.post(API_URL, formData);

        let data = res.data;
        if (typeof data === 'string') {
            try {
                const cleanData = data.trim();
                // Fix possible PHP garbage output before JSON
                const jsonStartIndex = cleanData.indexOf('[');
                if (jsonStartIndex !== -1) {
                    data = JSON.parse(cleanData.substring(jsonStartIndex));
                }
            } catch (e) { }
        }
        if (Array.isArray(data)) setNews(data);
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) {
                Swal.fire('Error', 'El archivo supera los 5MB', 'error');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
                Swal.fire('Error', 'Formato no soportado (Solo JPG, PNG, WEBP)', 'error');
                return;
            }
            setFile(selected);
            // Preview URL just for UI
            setForm({ ...form, imagen_url: URL.createObjectURL(selected) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('accion', '72');
        formData.append('titulo', form.titulo);
        formData.append('subtitulo', form.subtitulo);
        formData.append('cuerpo', form.cuerpo);

        if (file) {
            formData.append('imagen_file', file);
        } else {
            formData.append('imagen_url', form.imagen_url);
        }

        if (editing) formData.append('id', editing.id);

        try {
            const res = await axios.post(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data === 'OK' || (typeof res.data === 'string' && res.data.includes('OK'))) {
                fetchNews();
                setEditing(null);
                setFile(null);
                setForm({ titulo: '', subtitulo: '', cuerpo: '', imagen_url: '' });
                Swal.fire('Guardado', 'Novedad guardada correctamente', 'success');
            } else {
                Swal.fire('Error', 'Hubo un error al guardar: ' + res.data, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    };

    const handleEdit = (item) => {
        setEditing(item);
        setFile(null);
        setForm({
            titulo: item.titulo,
            subtitulo: item.subtitulo || '',
            cuerpo: item.cuerpo || item.descripcion,
            imagen_url: item.imagen_url || ''
        });
    };

    const handleToggle = async (id) => {
        const formData = new FormData();
        formData.append('accion', '73');
        formData.append('sub_accion', 'toggle');
        formData.append('id', id);
        await axios.post(API_URL, formData);
        fetchNews();
    };

    const handleDelete = async (id) => {
        if (!(await Swal.fire({ title: '¿Eliminar?', showCancelButton: true })).isConfirmed) return;

        const formData = new FormData();
        formData.append('accion', '73');
        formData.append('sub_accion', 'delete');
        formData.append('id', id);
        await axios.post(API_URL, formData);
        fetchNews();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Administrar Novedades</h1>

            {/* Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar Novedad' : 'Nueva Novedad'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Título"
                            className="w-full p-2 border rounded"
                            value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Subtítulo (Opcional)"
                            className="w-full p-2 border rounded"
                            value={form.subtitulo} onChange={e => setForm({ ...form, subtitulo: e.target.value })}
                        />
                    </div>
                    <textarea
                        placeholder="Cuerpo de la noticia"
                        className="w-full p-2 border rounded h-32"
                        value={form.cuerpo} onChange={e => setForm({ ...form, cuerpo: e.target.value })}
                        required
                    />

                    {/* Image Upload Section */}
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
                        <input
                            type="file"
                            id="fileInput"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/webp"
                        />
                        <label htmlFor="fileInput" className="cursor-pointer text-blue-600 font-medium hover:underline">
                            {file ? 'Cambiar Imagen' : 'Subir Imagen desde dispositivo'}
                        </label>
                        <p className="text-xs text-gray-400 mt-1">Máx. 5MB. Formatos: JPG, PNG, WEBP</p>

                        {!file && (
                            <div className="mt-2 text-xs text-gray-400">
                                O pegar URL externa:
                                <input
                                    placeholder="https://..."
                                    className="w-full p-1 border rounded mt-1 text-xs"
                                    value={form.imagen_url}
                                    onChange={e => setForm({ ...form, imagen_url: e.target.value })}
                                />
                            </div>
                        )}

                        {form.imagen_url && (
                            <div className="mt-3 relative inline-block">
                                <img src={form.imagen_url} className="h-24 w-auto rounded border shadow-sm" alt="Preview" />
                                <span className="text-xs block text-gray-500 mt-1">Vista Previa</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                            {editing ? 'Actualizar Novedad' : 'Publicar Novedad'}
                        </button>
                        {editing && (
                            <button type="button" onClick={() => { setEditing(null); setFile(null); setForm({ titulo: '', subtitulo: '', cuerpo: '', imagen_url: '' }); }} className="px-4 py-2 bg-gray-200 rounded">
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map(item => (
                    <div key={item.id} className={`bg-white rounded-xl shadow border overflow-hidden ${item.activo == 0 ? 'opacity-60' : ''}`}>
                        {item.imagen_url && <img src={item.imagen_url} className="h-40 w-full object-cover" />}
                        <div className="p-4">
                            <h3 className="font-bold text-lg">{item.titulo}</h3>
                            <p className="text-sm text-gray-500 mb-4">{item.subtitulo}</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleToggle(item.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                                    {item.activo == 1 ? <Eye /> : <EyeOff />}
                                </button>
                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                    <Trash className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
