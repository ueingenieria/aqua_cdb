import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import NewsAdmin from './pages/NewsAdmin';
import PushAdmin from './pages/PushAdmin';
import SettingsAdmin from './pages/SettingsAdmin';

function App() {
    // Check if token exists and starts with session-active OR is legacy secret
    const token = localStorage.getItem('admin_token');
    const isValid = token && (token === 'secret-token' || token.startsWith('session-active-'));
    const [isAuthenticated, setIsAuthenticated] = useState(isValid);

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

                <Route path="/" element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" />}>
                    <Route index element={<Navigate to="/noticias" />} />
                    <Route path="noticias" element={<NewsAdmin />} />
                    <Route path="push" element={<PushAdmin />} />
                    <Route path="configuracion" element={<SettingsAdmin />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

export default App;
