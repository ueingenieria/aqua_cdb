import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState('not_subscribed');

    useEffect(() => {
        // Verificar sesión guardada
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // Save/Update Push Token
            import('../api/notifications').then(({ savePushToken }) => {
                savePushToken(parsedUser.id);
            });
            refreshSubscriptionStatus(parsedUser.id);
        }
        setLoading(false);
    }, []);

    const refreshSubscriptionStatus = async (userId) => {
        const id = userId || user?.id;
        if (!id) return;

        try {
            const { getSubscriptionStatus } = await import('../api/subscription');
            const data = await getSubscriptionStatus(id);
            if (data && data.status) {
                setSubscriptionStatus(data.status);
                console.log("Subscription Status Updated:", data.status);
            }
        } catch (error) {
            console.error("Error refreshing subscription status:", error);
        }
    };

    const login = async (email, password) => {
        const data = await loginUser(email, password);

        if (data.p_msg && data.p_msg.includes("Acceso correcto")) {
            const userData = {
                id: data.p_id_cliente,
                email: email,
                name: data.nombre,
                surname: data.apellido,
                points: data.p_puntos,
                credit: data.p_valor_credito,
                dni: data.dni,
            };

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('email', email);
            localStorage.setItem('logued', 'true');

            import('../api/notifications').then(({ savePushToken }) => {
                savePushToken(data.p_id_cliente);
            });

            refreshSubscriptionStatus(data.p_id_cliente);

            return { success: true, data };
        } else {
            return { success: false, message: data.p_msg || "Error de autenticación" };
        }
    };

    const loginWithGoogle = async (token) => {
        console.log("Simulating Google Login with token:", token);
        const userData = {
            id: "google_123",
            name: "Usuario",
            surname: "Google",
            email: "usuario@gmail.com",
            points: 0,
            credit: 0
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('logued', 'true');
        refreshSubscriptionStatus(userData.id);
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('email');
        localStorage.removeItem('logued');
        localStorage.removeItem('pass');
    };

    const refreshBalance = async () => {
        if (!user?.email) return;

        try {
            const { getUserBalance } = await import('../api/user');
            const balanceData = await getUserBalance(user.email);

            if (balanceData) {
                const updatedUser = {
                    ...user,
                    credit: balanceData.credit,
                    tag: balanceData.tag,
                    tagLock: balanceData.tagLock
                };

                if (updatedUser.credit !== user.credit || updatedUser.tag !== user.tag || updatedUser.tagLock !== user.tagLock) {
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log('Balance updated:', balanceData);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            loginWithGoogle,
            logout,
            loading,
            refreshBalance,
            subscriptionStatus,
            refreshSubscriptionStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
