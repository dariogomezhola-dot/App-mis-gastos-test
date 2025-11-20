
import React, { useState } from 'react';

const Login: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Login functionality is disabled.");
    };

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-800 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-900 rounded-lg shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Login Disabled</h1>
                    <p className="text-gray-400">Authentication has been replaced by an entity selector. Please reload the page.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 opacity-50 cursor-not-allowed">
                    <div>
                        <label htmlFor="email" className="sr-only">Correo electrónico</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            disabled
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                            placeholder="Correo electrónico"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            disabled
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
                            placeholder="Contraseña"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled
                            className="w-full py-2 px-4 bg-gray-600 text-white font-bold rounded-lg"
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
            </div>
        </div>
    );
};

export default Login;
