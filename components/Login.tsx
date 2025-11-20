
import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, getAdditionalUserInfo } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseService';
import { sendWelcomeEmail } from '../services/notificationService';
import { Spinner } from './common/Spinner';
import { CopyIcon } from './Icons';

const Login: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        setUnauthorizedDomain(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            
            // Check if it is a new user
            const additionalUserInfo = getAdditionalUserInfo(result);
            if (additionalUserInfo?.isNewUser) {
                const userEmail = result.user.email;
                const userName = result.user.displayName || 'Usuario';
                if (userEmail) {
                    await sendWelcomeEmail(userEmail, userName);
                }
            }
        } catch (err: any) {
            console.error("Google login error:", err);
            if (err.code === 'auth/unauthorized-domain') {
                 setUnauthorizedDomain(window.location.hostname);
            } else if (err.code === 'auth/operation-not-allowed') {
                 setError("El inicio de sesión con Google no está habilitado en Firebase Console > Authentication > Sign-in method.");
            } else if (err.code === 'auth/popup-closed-by-user') {
                 setError("Has cerrado la ventana antes de iniciar sesión.");
            } else {
                 setError("Error al iniciar sesión con Google. " + (err.message || ""));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUnauthorizedDomain(null);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                // Send notification
                await sendWelcomeEmail(email);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            console.error("Email auth error:", err);
            let msg = "Error de autenticación.";
            if (err.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
            if (err.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
            if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
            if (err.code === 'auth/weak-password') msg = "La contraseña es muy débil.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
                        <span className="text-3xl font-bold text-white">G</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Gastón</h1>
                    <p className="text-gray-400 mt-2">Tus finanzas, claras y bajo control.</p>
                </div>

                {unauthorizedDomain ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-sm text-yellow-200 text-left">
                        <h3 className="font-bold text-base mb-2 flex items-center">⚠️ Acción Requerida</h3>
                        <p className="mb-3 text-gray-300 leading-relaxed">
                            Firebase ha bloqueado el acceso. Debes autorizar este dominio en tu proyecto:
                        </p>
                        <div className="bg-black/40 p-3 rounded-lg flex justify-between items-center border border-gray-600 mb-3">
                            <code className="text-blue-400 font-mono font-bold">{unauthorizedDomain}</code>
                            <button 
                                onClick={() => navigator.clipboard.writeText(unauthorizedDomain)}
                                className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
                            >
                                <CopyIcon className="w-3 h-3" /> Copiar
                            </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-gray-400 text-xs">
                            <li>Ve a <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">Firebase Console</a> &gt; Authentication.</li>
                            <li>Entra en <strong>Settings</strong> &gt; <strong>Authorized domains</strong>.</li>
                            <li>Pega el dominio copiado y guarda.</li>
                        </ol>
                        <button 
                            onClick={() => setUnauthorizedDomain(null)}
                            className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs font-semibold"
                        >
                            Volver a intentar
                        </button>
                    </div>
                ) : error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {!unauthorizedDomain && (
                    <>
                        <form onSubmit={handleEmailAuth} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Correo electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center"
                            >
                                {loading ? <Spinner /> : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-800 text-gray-400">O continúa con</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Google</span>
                        </button>

                        <div className="text-center pt-4">
                            <button 
                                onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                                {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
