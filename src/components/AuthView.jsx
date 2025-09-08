import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { BarChart3, Lock } from 'lucide-react';

const AuthView = () => {
  const { login } = useBudget();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(password)) {
      setError('');
    } else {
      setError('Mot de passe incorrect.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center items-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Trezocash</h1>
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-2">Accès Sécurisé</h2>
          <p className="text-center text-gray-500 mb-6">Veuillez entrer votre mot de passe pour accéder à vos données.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Mot de passe"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Se connecter
              </button>
            </div>
          </form>
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          Toutes les données sont stockées localement sur votre appareil.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
