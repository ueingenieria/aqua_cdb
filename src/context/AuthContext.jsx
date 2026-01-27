import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sesión guardada
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await loginUser(email, password);

        // Validar respuesta de API Legacy
        // login.js: if(login_data.p_msg.includes("Acceso correcto"))
        if (data.p_msg && data.p_msg.includes("Acceso correcto")) {
            const userData = {
                email: email,
                name: data.nombre,
                surname: data.apellido,
                points: data.p_puntos,
                credit: data.p_valor_credito,
                dni: data.dni,
                // Guardamos pass por compatibilidad con legacy si es necesario para llamadas futuras que lo requieran en headers,
                // aunque idealmente no deberíamos. La API parece requerir p_login y p_password en cada llamada? 
                // Viendo cupones.js: usa p_login en headers, pero NO p_password. Solo login usa p_password.
                // Entonces NO guardamos password.
            };

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('email', email); // Legacy compat
            localStorage.setItem('logued', 'true'); // Legacy compat
            return { success: true, data };
        } else {
            return { success: false, message: data.p_msg || "Error de autenticación" };
        }
    };

    const loginWithGoogle = async (token) => {
        // Aquí se enviaría el token al backend para validación
        console.log("Simulating Google Login with token:", token);

        // Mock user data
        const userData = {
            name: "Usuario",
            surname: "Google",
            email: "usuario@gmail.com",
            points: 0,
            credit: 0
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('logued', 'true');
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('email');
        localStorage.removeItem('logued');
        localStorage.removeItem('pass'); // Limpiar legacy si existe
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
