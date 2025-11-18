import React, { useState } from 'react';
// FIX: The Firebase auth services are imported from 'firebase/auth' instead of '@firebase/auth'.
import { 
    signInWithPopup, 
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    AuthError
} from 'firebase/auth';
import { auth, appId } from '../services/firebaseService';
import { CopyIcon, CheckIcon } from './Icons';

interface AuthErrorState {
    code: string;
    message: string;
    hostname?: string;
    context?: 'google' | 'email';
}

const Login: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<AuthErrorState | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        if (!navigator.clipboard) {
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy!', err);
        });
    };

    const handleAuthError = (authError: AuthError, context: 'google' | 'email') => {
        console.error(`Firebase Auth Error (${context}):`, authError.code, authError.message);
        let errorState: AuthErrorState = {
            code: authError.code,
            message: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
            context,
        };

        switch (authError.code) {
            case 'auth/unauthorized-domain':
                errorState.message = 'Dominio no autorizado.';
                errorState.hostname = window.location.hostname;
                break;
            case 'auth/operation-not-allowed':
                 errorState.message = 'Método de inicio de sesión deshabilitado.';
                break;
            case 'auth/email-already-in-use':
                errorState.message = 'Este correo ya está en uso. Intenta iniciar sesión.';
                break;
            case 'auth/weak-password':
                errorState.message = 'La contraseña debe tener al menos 6 caracteres.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorState.message = 'Correo o contraseña incorrectos.';
                break;
        }
        setError(errorState);
    };
    
    const handleGoogleSignIn = () => {
        setError(null);
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .catch((error) => {
                if (error.code) {
                    handleAuthError(error as AuthError, 'google');
                } else {
                    console.error("Google Sign-In Error (raw):", error);
                    setError({ code: 'unknown', message: 'No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.', context: 'google' });
                }
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (!email || !password) {
            setError({ code: 'form-incomplete', message: 'Por favor, ingresa correo y contraseña.'});
            return;
        }

        if (isSignUp) {
            // Sign up
            createUserWithEmailAndPassword(auth, email, password)
                .catch((authError: AuthError) => {
                    handleAuthError(authError, 'email');
                });
        } else {
            // Sign in
            signInWithEmailAndPassword(auth, email, password)
                .catch((authError: AuthError) => {
                    handleAuthError(authError, 'email');
                });
        }
    };

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setEmail('');
        setPassword('');
    };
    
    const renderError = () => {
        if (!error) return null;
        
        if (error.code === 'auth/unauthorized-domain') {
            const settingsUrl = `https://console.firebase.google.com/project/${appId}/authentication/settings`;
            return (
                <div className="text-sm text-yellow-300 bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/30 space-y-4">
                    <h4 className="font-bold text-lg text-white">¡Casi listo! Un último paso.</h4>
                    <p className="text-gray-300">
                        Firebase necesita saber desde qué 'dominio' (dirección web) se conecta tu app para funcionar de forma segura.
                    </p>
                    
                    <div>
                        <p className="text-xs text-gray-400 mb-1">El dominio para esta sesión es:</p>
                        <div className="p-3 bg-gray-700 rounded-md flex items-center justify-between">
                            <code className="font-mono text-xl text-white">{error.hostname}</code>
                            <button type="button" onClick={() => handleCopy(error.hostname || '')} title="Copiar dominio" className="p-2 bg-gray-600 rounded-md text-gray-300 hover:text-white flex items-center gap-2">
                                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                <span className="text-xs">{copied ? 'Copiado' : 'Copiar'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 text-left">
                        <p><strong>PASO 1:</strong> Haz clic en este botón para ir a tus ajustes de Firebase.</p>
                        <a href={settingsUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                            Abrir Ajustes de Firebase
                        </a>

                        <p><strong>PASO 2:</strong> En la página de Firebase, busca "Dominios autorizados", haz clic en "Añadir dominio" y pega el que acabas de copiar.</p>
                    </div>
                     <p className="text-xs text-gray-400 pt-2 text-center">
                        Después de añadirlo, refresca esta página e intenta iniciar sesión de nuevo.
                    </p>
                </div>
            )
        }

        if (error.code === 'auth/operation-not-allowed') {
            const providerName = error.context === 'google' 
                ? 'el inicio de sesión con Google' 
                : 'el inicio de sesión con Correo/Contraseña';
            
            return (
                 <div className="text-sm text-red-300 text-center bg-red-900/20 p-3 rounded-md border border-red-500/30">
                    <strong>Error: {error.message}</strong>
                     <p className="mt-2 text-left text-sm">
                        Parece que <strong>{providerName}</strong> no está habilitado en tu proyecto de Firebase.
                     </p>
                    <p className="mt-2 text-left text-sm"><strong>Para solucionarlo:</strong></p>
                    <ol className="list-decimal list-inside text-left mt-1 text-sm">
                         <li>Ve a tu <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Consola de Firebase</a>.</li>
                        <li>Navega a: Authentication &rarr; Sign-in method.</li>
                        <li>
                            Habilita el proveedor de 
                            <strong>{error.context === 'google' ? ' Google' : ' Email/Password'}</strong>.
                        </li>
                    </ol>
                </div>
            )
        }

        return (
            <div className="text-sm text-red-300 text-center bg-red-900/20 p-3 rounded-md border border-red-500/30">
                {error.message}
            </div>
        )
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-800 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">{isSignUp ? 'Crear Cuenta' : 'Bienvenido'}</h1>
                    <p className="text-gray-400">{isSignUp ? 'Ingresa tus datos para registrarte.' : 'Inicia sesión para gestionar tus finanzas.'}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="sr-only">Correo electrónico</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Correo electrónico"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contraseña"
                        />
                    </div>
                    {renderError()}
                    <div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                        >
                            {isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button onClick={toggleForm} className="text-sm text-blue-400 hover:underline">
                        {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
                    </button>
                </div>
                
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500">O</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <button 
                    onClick={handleGoogleSignIn}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center w-full transition-colors"
                >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                        <path fill="#4285F4" d="M24 9.5c3.23 0 6.13 1.11 8.4 3.29l6.58-6.58C34.54 2.27 29.63 0 24 0 14.52 0 6.46 5.67 3.25 13.79l7.32 5.69C12.04 13.57 17.53 9.5 24 9.5z"></path>
                        <path fill="#34A853" d="M46.75 24.5c0-1.66-.15-3.28-.43-4.85H24v9.16h12.8c-.55 2.97-2.16 5.49-4.57 7.22l7.07 5.48c4.15-3.83 6.45-9.44 6.45-16.01z"></path>
                        <path fill="#FBBC05" d="M12.04 19.48c-.62-1.87-.97-3.87-.97-5.98s.35-4.11.97-5.98l-7.32-5.69C2.06 6.94 0 12.24 0 18.5c0 6.26 2.06 11.56 5.25 15.71l7.32-5.69c-.53-1.78-.53-3.84-.53-5.04z"></path>
                        <path fill="#EA4335" d="M24 48c6.48 0 12-2.13 16-5.64l-7.07-5.48c-2.11 1.42-4.78 2.27-7.93 2.27-6.47 0-11.96-4.07-13.96-9.62l-7.32 5.69C6.46 42.33 14.52 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Continuar con Google
                </button>
            </div>
        </div>
    );
};

export default Login;