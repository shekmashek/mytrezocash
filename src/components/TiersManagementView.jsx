import React, { useState } from 'react';
import { Users, UserPlus, Edit, Trash2, Save, X, Plus } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';

const TiersManagementView = () => {
  const { state, dispatch } = useBudget();
  const { tiers, allEntries, allActuals } = state;

  const [newTierName, setNewTierName] = useState('');
  const [newTierType, setNewTierType] = useState('fournisseur');
  const [editingTier, setEditingTier] = useState(null);

  const handleAddTier = (e) => {
    e.preventDefault();
    if (newTierName.trim()) {
      dispatch({ type: 'ADD_TIER', payload: { name: newTierName.trim(), type: newTierType } });
      setNewTierName('');
    }
  };
  const handleStartEdit = (tier) => setEditingTier({ ...tier });
  const handleCancelEdit = () => setEditingTier(null);
  const handleSaveEdit = () => {
    if (editingTier.name.trim()) {
      dispatch({ type: 'UPDATE_TIER', payload: { tierId: editingTier.id, newName: editingTier.name.trim() } });
      handleCancelEdit();
    }
  };
  const handleDeleteTier = (tierId) => dispatch({ type: 'DELETE_TIER', payload: tierId });
  const isTierUsed = (tierName) => {
    const entries = Object.values(allEntries).flat() || [];
    const actuals = Object.values(allActuals).flat() || [];
    return entries.some(e => e.supplier === tierName) || actuals.some(a => a.thirdParty === tierName);
  };

  const renderTiersList = (type, title) => {
    const filteredTiers = tiers.filter(t => t.type === type);
    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">{title}</h3>
        <ul className="divide-y divide-gray-200">
          {filteredTiers.map(tier => (
            <li key={tier.id} className="py-3 flex items-center justify-between">
              {editingTier?.id === tier.id ? (<input type="text" value={editingTier.name} onChange={(e) => setEditingTier(prev => ({...prev, name: e.target.value}))} className="px-2 py-1 border rounded-md" autoFocus/>) : (<span className="text-gray-800">{tier.name}</span>)}
              <div className="flex items-center gap-2">
                {editingTier?.id === tier.id ? (<><button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button><button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button></>) : (<><button onClick={() => handleStartEdit(tier)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteTier(tier.id)} disabled={isTierUsed(tier.name)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isTierUsed(tier.name) ? "Suppression impossible: tiers utilisé" : "Supprimer"}><Trash2 className="w-4 h-4" /></button></>)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> Ajouter un nouveau tiers</h2>
        <form onSubmit={handleAddTier} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nom du Tiers</label><input type="text" value={newTierName} onChange={(e) => setNewTierName(e.target.value)} placeholder="Ex: Client A, Fournisseur B..." className="w-full px-4 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={newTierType} onChange={(e) => setNewTierType(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="fournisseur">Fournisseur</option><option value="client">Client</option></select></div>
          <button type="submit" className="md:col-start-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Ajouter</button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">{renderTiersList('fournisseur', 'Fournisseurs')}</div>
        <div className="bg-white p-6 rounded-lg shadow">{renderTiersList('client', 'Clients')}</div>
      </div>
    </>
  );
};

export default TiersManagementView;
