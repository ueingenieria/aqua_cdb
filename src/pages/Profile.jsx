import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { modifyUser, deleteUser } from '../api/user';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, CreditCard, Trash2, Save, Lock, User, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: user.name || '',
        surname: user.surname || '',
        dni: user.dni || '',
        tag: user.tag || '-'
    });
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    useEffect(() => {
        setFormData({
            name: user.name || '',
            surname: user.surname || '',
            dni: user.dni || '',
            tag: user.tag || '-'
        });
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await modifyUser(user.email, formData.name, formData.surname, formData.dni);
            alert('Datos actualizados correctamente');
            setEditing(false);
        } catch (error) {
            alert('Error al actualizar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkCard = async (cardId) => {
        // Logic for linking card (legacy accion=59)
        if (cardId && cardId.length >= 6) {
            alert("Funcionalidad de vinculación en proceso de implementación (Requiere endpoint legacy)");
            setShowLinkModal(false);
        } else {
            alert("ID de tarjeta inválido (mínimo 6 caracteres)");
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm("¿Estás seguro que deseas eliminar tu cuenta DEFINITIVAMENTE?")) {
            const pass = prompt("Ingresá tu contraseña para confirmar:");
            if (pass) {
                setLoading(true);
                try {
                    await deleteUser(user.email, pass);
                    alert("Cuenta eliminada");
                    logout();
                } catch (error) {
                    alert("Error al eliminar cuenta. Verific confirmado.");
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
                    <p className="text-white/80">Administrá tus datos personales</p>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                    <User className="h-6 w-6" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card Datos Personales */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 h-fit">
                    <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
                        Datos Personales
                        <User className="h-5 w-5 text-gray-400" />
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Nombre</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!editing}
                                className={!editing ? "bg-gray-50 border-transparent px-0" : ""}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Apellido</label>
                            <Input
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                disabled={!editing}
                                className={!editing ? "bg-gray-50 border-transparent px-0" : ""}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">DNI</label>
                            <Input
                                value={formData.dni}
                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                disabled={!editing}
                                className={!editing ? "bg-gray-50 border-transparent px-0" : ""}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                            <div className="text-gray-700 font-medium py-2 break-all">
                                {user.email}
                            </div>
                        </div>
                    </div>

                    {editing ? (
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleSave} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar
                            </Button>
                            <Button variant="secondary" onClick={() => setEditing(false)} className="w-full">Cancelar</Button>
                        </div>
                    ) : (
                        <Button variant="secondary" onClick={() => setEditing(true)} className="w-full mt-2 bg-gray-50 hover:bg-gray-100 text-gray-900 border-0">
                            Modificar Datos
                        </Button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Card Tarjeta */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
                            Tarjeta AquaExpress
                            <CreditCard className="h-5 w-5 text-gray-400" />
                        </h3>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-white shadow-lg">
                            <div>
                                <p className="text-xs text-gray-400 uppercase mb-1">ID Tarjeta</p>
                                <p className="font-mono font-bold text-xl tracking-widest">{formData.tag}</p>
                            </div>
                            {formData.tag === '-' ? (
                                <Button size="sm" variant="secondary" onClick={() => setShowLinkModal(true)} className="bg-white/20 text-white hover:bg-white/30 border-0">Vincular</Button>
                            ) : (
                                <Lock className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Card Account Details */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-400" />
                            Datos de Cuenta
                        </h3>
                        <p className="text-sm text-red-700/80">
                            Eliminar tu cuenta implica perder todos tus puntos y saldo. Esta acción no se puede deshacer.
                        </p>
                        <button onClick={handleDeleteAccount} className="w-full bg-white text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 border border-red-200 transition-colors shadow-sm">
                            Eliminar Cuenta Definitivamente
                        </button>
                    </div>
                </div>
            </div>

            {/* Link Card Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                        <button
                            onClick={() => setShowLinkModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-6 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Vincular Tarjeta</h3>
                                <p className="text-gray-500 text-sm">Ingresá el ID de 8 caracteres que figura en tu tarjeta AquaExpress</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleLinkCard(e.target.cardId.value); }} className="space-y-4">
                                <Input
                                    name="cardId"
                                    placeholder="Ej: 12345678"
                                    className="text-center font-mono text-lg tracking-widest uppercase"
                                    maxLength={8}
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Button type="button" variant="secondary" onClick={() => setShowLinkModal(false)}>Cancelar</Button>
                                    <Button type="submit">Vincular</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
