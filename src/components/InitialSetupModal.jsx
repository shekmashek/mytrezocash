import React, { useState, useMemo } from 'react';
import { Wallet, Edit, Save, X, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import { mainCashAccountCategories } from '../context/BudgetContext';

const InitialSetupModal = ({ projectId, onClose }) => {
  const { state, dispatch } = useBudget();
  const { userCashAccounts, settings, allActuals, projects } = state;

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

  const projectCashAccounts = useMemo(() => {
    return userCashAccounts.filter(acc => acc.projectId === projectId);
  }, [userCashAccounts, projectId]);

  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccountData, setNewAccountData] = useState({});

  const isAccountUsed = (accountId) => {
    return Object.values(allActuals).flat().flatMap(a => a.payments || []).some(p => p.cashAccount === accountId);
  };

  const handleStartEdit = (account) => {
    setEditingAccount({
      id: account.id,
      name: account.name,
      initialBalance: account.initialBalance || '',
      initialBalanceDate: account.initialBalanceDate || new Date().toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => setEditingAccount(null);

  const handleSaveEdit = () => {
    if (!editingAccount.name.trim()) {
      alert("Le nom du compte ne peut pas être vide.");
      return;
    }
    dispatch({
      type: 'UPDATE_USER_CASH_ACCOUNT',
      payload: {
        accountId: editingAccount.id,
        accountData: {
          name: editingAccount.name.trim(),
          initialBalance: parseFloat(editingAccount.initialBalance) || 0,
          initialBalanceDate: editingAccount.initialBalanceDate
        }
      }
    });
    handleCancelEdit();
  };

  const handleAddAccount = (mainCategoryId) => {
    const data = newAccountData[mainCategoryId];
    if (!data || !data.name || !data.name.trim()) {
      alert("Veuillez entrer un nom pour le nouveau compte.");
      return;
    }
    dispatch({
      type: 'ADD_USER_CASH_ACCOUNT',
      payload: {
        mainCategoryId,
        name: data.name.trim(),
        initialBalance: parseFloat(data.initialBalance) || 0,
        initialBalanceDate: data.initialBalanceDate || new Date().toISOString().split('T')[0],
        projectId: projectId,
      }
    });
    setNewAccountData(prev => ({ ...prev, [mainCategoryId]: undefined }));
  };

  const handleDeleteAccount = (accountId) => {
    if (projectCashAccounts.length <= 1) {
      alert("Vous devez conserver au moins un compte de trésorerie pour le projet.");
      return;
    }
    dispatch({ type: 'DELETE_USER_CASH_ACCOUNT', payload: accountId });
  };

  const handleNewAccountChange = (mainCategoryId, field, value) => {
    setNewAccountData(prev => ({
      ...prev,
      [mainCategoryId]: {
        ...(prev[mainCategoryId] || {}),
        [field]: value
      }
    }));
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Configuration Initiale du Projet</h2>
          <p className="text-gray-600 mt-1">
            Bienvenue dans votre nouveau projet "{project.name}" ! Pour commencer, veuillez configurer au moins un compte de trésorerie.
          </p>
        </div>
        
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {mainCashAccountCategories.map(mainCat => (
            <div key={mainCat.id} className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-bold text-lg text-gray-700 mb-3">{mainCat.name}</h3>
              <ul className="divide-y divide-gray-200">
                {projectCashAccounts.filter(acc => acc.mainCategoryId === mainCat.id).map(account => (
                  <li key={account.id} className="py-3">
                    {editingAccount?.id === account.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingAccount.name}
                          onChange={(e) => setEditingAccount(d => ({ ...d, name: e.target.value }))}
                          className="w-full px-3 py-1 border rounded-md font-medium"
                          autoFocus
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Solde initial</label>
                            <input
                              type="number"
                              value={editingAccount.initialBalance}
                              onChange={(e) => setEditingAccount(d => ({ ...d, initialBalance: e.target.value }))}
                              className="w-full px-3 py-1 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Date du solde</label>
                            <input
                              type="date"
                              value={editingAccount.initialBalanceDate}
                              onChange={(e) => setEditingAccount(d => ({ ...d, initialBalanceDate: e.target.value }))}
                              className="w-full px-3 py-1 border rounded-md"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={handleSaveEdit} className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700">Enregistrer</button>
                          <button onClick={handleCancelEdit} className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-teal-600" />
                            <span className="font-medium text-gray-800">{account.name}</span>
                          </div>
                          <div className="text-sm text-gray-500 ml-8 mt-1">
                            Solde initial: <span className="font-semibold">{formatCurrency(account.initialBalance || 0, settings)}</span> le {new Date(account.initialBalanceDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleStartEdit(account)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteAccount(account.id)} disabled={isAccountUsed(account.id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isAccountUsed(account.id) ? "Suppression impossible: compte utilisé" : "Supprimer"}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newAccountData[mainCat.id]?.name || ''}
                    onChange={(e) => handleNewAccountChange(mainCat.id, 'name', e.target.value)}
                    placeholder="Nom du nouveau compte"
                    className="flex-grow px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={newAccountData[mainCat.id]?.initialBalance || ''}
                    onChange={(e) => handleNewAccountChange(mainCat.id, 'initialBalance', e.target.value)}
                    placeholder={`Solde initial`}
                    className="flex-grow px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={newAccountData[mainCat.id]?.initialBalanceDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleNewAccountChange(mainCat.id, 'initialBalanceDate', e.target.value)}
                    className="flex-grow px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={() => handleAddAccount(mainCat.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button 
            onClick={onClose} 
            disabled={projectCashAccounts.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-6 h-6" /> Terminer la Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialSetupModal;
