import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, CreditCard, Trash2, Save, Lock, Unlock, User, ArrowLeft, X, MessageSquare, Upload, MapPin, LogOut } from 'lucide-react';
import { modifyUser, deleteUser, toggleCardLock, linkCard } from '../api/user';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { sendSupportRequest } from '../api/support';

export default function Profile() {
    const { user, logout, refreshBalance } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: user.name || '',
        surname: user.surname || '',
        dni: user.dni || '',
        tag: user.tag || '-',
        tagLock: user.tagLock || '0'
    });
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingLock, setLoadingLock] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportForm, setSupportForm] = useState({
        name: user.name || '',
        surname: user.surname || '',
        phone: '',
        email: user.email || '',
        description: ''
    });

    useEffect(() => {
        setFormData({
            name: user.name || '',
            surname: user.surname || '',
            dni: user.dni || '',
            tag: user.tag || '-',
            tagLock: user.tagLock || '0'
        });
    }, [user]);

    const handleLockToggle = async () => {
        const isLocked = Number(formData.tagLock) === 1;

        const result = await Swal.fire({
            title: isLocked ? '¿Desbloquear Tarjeta?' : '¿Bloquear Tarjeta?',
            text: isLocked
                ? "Vas a desbloquear tu tarjeta. Podrás volver a utilizarla."
                : "Si bloqueás tu tarjeta no podrá ser usada hasta que la habilites.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: isLocked ? 'Sí, desbloquear' : 'Sí, bloquear',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: isLocked ? '#22c55e' : '#ef4444'
        });

        if (result.isConfirmed) {
            setLoadingLock(true);
            const response = await toggleCardLock(user.email, !isLocked); // Toggle state

            if (response.success) {
                const newLockState = response.status === 'locked' ? '1' : '0';
                await refreshBalance(); // Sync global state

                Swal.fire({
                    icon: 'success',
                    title: '¡Listo!',
                    text: newLockState === '1'
                        ? "Ya bloqueamos tu tarjeta."
                        : "Ya habilitamos tu tarjeta.",
                    timer: 2000
                });
            } else {
                Swal.fire('Error', response.message || 'Error al actualizar', 'error');
            }
            setLoadingLock(false);
        }
    };

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
        if (!cardId || cardId.length < 8) {
            Swal.fire('Error', 'El ID de tarjeta debe tener 8 caracteres', 'warning');
            return;
        }

        // Show loading state if desired, or just wait
        Swal.showLoading();

        try {
            const response = await linkCard(user.email, cardId);

            if (response.success) {
                const saldoAnterior = parseFloat(user.credit) || 0;
                const saldoTarjeta = response.cardBalance;
                const saldoTotal = saldoAnterior + saldoTarjeta;

                await refreshBalance(); // Sync app state
                setShowLinkModal(false); // Close modal

                Swal.fire({
                    icon: 'success',
                    title: '¡Tarjeta vinculada!',
                    html: `
                        <div style="text-align: left;">
                            <p>Se vinculó correctamente la tarjeta a tu cuenta.</p>
                            <br/>
                            <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="color: #6b7280;">Saldo anterior:</span>
                                    <span style="font-weight: bold;">$ ${saldoAnterior}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="color: #6b7280;">Saldo en tarjeta:</span>
                                    <span style="font-weight: bold; color: #10b981;">+ $ ${saldoTarjeta}</span>
                                </div>
                                <div style="border-top: 1px solid #d1d5db; margin: 5px 0;"></div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #111827; font-weight: bold;">Saldo actual:</span>
                                    <span style="font-weight: bold; color: #0ea5e9;">$ ${saldoTotal}</span>
                                </div>
                            </div>
                        </div>
                    `
                });
            } else {
                Swal.fire('Ups!', response.message || 'Error al vincular tarjeta', 'warning');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Hubo un problema de conexión', 'error');
        }
    };

    const handleDeleteAccount = async () => {
        const confirm = await Swal.fire({
            title: '¿Eliminar cuenta?',
            text: 'Esta acción es irreversible. Perderás todos tus puntos y saldo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        const isGoogle = user.loginMethod === 'google';
        let password = localStorage.getItem('pass') || '';

        // Si es usuario regular y no tenemos el pass, pedírselo
        if (!isGoogle && !password) {
            const { value: inputPass } = await Swal.fire({
                title: 'Confirmá tu contraseña',
                text: 'Por seguridad, ingresá tu contraseña para continuar.',
                input: 'password',
                inputPlaceholder: 'Tu contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ef4444',
                inputAttributes: { autocomplete: 'current-password' },
            });
            if (!inputPass) return;
            password = inputPass;
        }

        setLoading(true);
        try {
            if (isGoogle) {
                const { deleteGoogleAccountBridge } = await import('../api/googleAuth');
                const result = await deleteGoogleAccountBridge(user.email);
                if (!result.success) throw new Error(result.p_msg || 'Error al eliminar la cuenta.');
            } else {
                await deleteUser(user.email, password);
            }

            await Swal.fire({
                icon: 'success',
                title: 'Cuenta eliminada',
                html: '<p>Tus datos han sido <strong>completamente eliminados</strong> de nuestros servidores.</p>',
                confirmButtonText: 'OK',
                allowOutsideClick: false,
            });
            logout();
            navigate('/login');
        } catch (error) {
            Swal.fire('Error', error.message || 'Ocurrió un error al eliminar la cuenta.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', supportForm.name);
            formData.append('surname', supportForm.surname);
            formData.append('phone', supportForm.phone);
            formData.append('email', supportForm.email);
            formData.append('store', supportForm.store);
            formData.append('description', supportForm.description);
            if (supportForm.file) {
                formData.append('file', supportForm.file);
            }

            const result = await sendSupportRequest(formData);
            if (result.success || result === 'OK') {
                await Swal.fire('Mensaje Enviado', 'Gracias por contactarnos. Te responderemos a la brevedad.', 'success');
                setShowSupportModal(false);
                setSupportForm({
                    ...supportForm,
                    description: '',
                    store: '',
                    file: null
                });
            } else {
                Swal.fire('Error', result.msg || 'No se pudo enviar el mensaje.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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

                        <div className="flex flex-col gap-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-1">ID Tarjeta</p>
                                    <p className="font-mono font-bold text-xl tracking-widest">{formData.tag}</p>
                                </div>
                                {formData.tag !== '-' && (
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold border ${Number(formData.tagLock) === 1 ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-green-500/20 text-green-300 border-green-500/50'}`}>
                                        {Number(formData.tagLock) === 1 ? 'BLOQUEADA' : 'ACTIVA'}
                                    </div>
                                )}
                            </div>

                            {formData.tag === '-' ? (
                                <Button size="sm" variant="secondary" onClick={() => setShowLinkModal(true)} className="bg-white/20 text-white hover:bg-white/30 border-0 w-full">Vincular</Button>
                            ) : (
                                <Button
                                    onClick={handleLockToggle}
                                    disabled={loadingLock}
                                    size="sm"
                                    className={`w-full border-none ${Number(formData.tagLock) === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    {loadingLock ? <Loader2 className="h-4 w-4 animate-spin" /> : (Number(formData.tagLock) === 1 ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />)}
                                    {Number(formData.tagLock) === 1 ? 'Desbloquear Tarjeta' : 'Bloquear Tarjeta'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Card Soporte */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                            Ayuda y Soporte
                        </h3>
                        <p className="text-sm text-gray-500">
                            ¿Tuviste algún problema con la App? Contanos y te ayudamos.
                        </p>
                        <Button variant="secondary" onClick={() => setShowSupportModal(true)} className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100">
                            Contactanos
                        </Button>
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

                    {/* Botón de Logout */}
                    <div className="pt-4">
                        <button
                            onClick={async () => {
                                const result = await Swal.fire({
                                    title: '¿Cerrar Sesión?',
                                    text: "Tendrás que volver a ingresar tus credenciales.",
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonText: 'Sí, salir',
                                    cancelButtonText: 'Cancelar',
                                    confirmButtonColor: '#ef4444'
                                });
                                if (result.isConfirmed) {
                                    logout();
                                    navigate('/login');
                                }
                            }}
                            className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2 text-lg"
                        >
                            <LogOut className="h-6 w-6" />
                            Cerrar Sesión
                        </button>
                    </div>
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
                                <p className="text-gray-500 text-sm">Ingresá el código de 8 caracteres que te dieron al comprar tu tarjeta</p>
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

            {/* Support Modal */}
            {showSupportModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl relative max-h-[calc(100dvh-2rem)] flex flex-col">
                        <button
                            onClick={() => setShowSupportModal(false)}
                            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="overflow-y-auto flex-1 p-6 pb-12 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="h-6 w-6 text-blue-500" />
                                    Contactanos
                                </h3>
                                <p className="text-gray-500 text-sm">Completá el formulario y te responderemos a la brevedad.</p>
                            </div>

                            <form onSubmit={handleSupportSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                                        <Input
                                            value={supportForm.name}
                                            onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                                            disabled={!!user.name}
                                            className={user.name ? "bg-gray-100/50 text-gray-500" : ""}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Apellido</label>
                                        <Input
                                            value={supportForm.surname}
                                            onChange={(e) => setSupportForm({ ...supportForm, surname: e.target.value })}
                                            disabled={!!user.surname}
                                            className={user.surname ? "bg-gray-100/50 text-gray-500" : ""}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                    <Input
                                        type="email"
                                        value={supportForm.email}
                                        onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                                        disabled={!!user.email}
                                        className={user.email ? "bg-gray-100/50 text-gray-500" : ""}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                                    <Input
                                        type="tel"
                                        value={supportForm.phone}
                                        onChange={(e) => setSupportForm({ ...supportForm, phone: e.target.value })}
                                        placeholder="Ej: 11 1234 5678"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Lavadero / Sucursal</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={supportForm.store}
                                            onChange={(e) => setSupportForm({ ...supportForm, store: e.target.value })}
                                            placeholder="Ej: Lavadero Centro"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Adjuntar Comprobante (Opcional)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={(e) => setSupportForm({ ...supportForm, file: e.target.files[0] })}
                                            accept="image/*,.pdf"
                                        />
                                        <label htmlFor="file-upload" className="flex items-center justify-center w-full px-4 py-2 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Upload className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="text-sm text-gray-600 truncate">
                                                {supportForm.file ? supportForm.file.name : 'Subir foto o PDF'}
                                            </span>
                                        </label>
                                        {supportForm.file && (
                                            <button
                                                type="button"
                                                onClick={() => setSupportForm({ ...supportForm, file: null })}
                                                className="absolute right-2 top-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                                            >
                                                <X className="h-3 w-3 text-gray-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">¿En qué podemos ayudarte?</label>
                                    <textarea
                                        className="w-full flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                                        value={supportForm.description}
                                        onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                                        placeholder="Describe tu problema o consulta..."
                                        required
                                    />
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Enviar Mensaje'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
