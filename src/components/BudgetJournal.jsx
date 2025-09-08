import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, User, Building, Edit, Trash2, Clock, Repeat, ArrowRight, ListChecks, Folder, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import { useBudget } from '../context/BudgetContext';

const BudgetJournal = ({ onEditEntry }) => {
  const { state, dispatch } = useBudget();
  const { allEntries, activeProjectId, projects, settings } = state;

  const { activeProject, budgetEntries, isConsolidated } = useMemo(() => {
    const isConsolidatedView = activeProjectId === 'consolidated';
    if (isConsolidatedView) {
      return {
        activeProject: { id: 'consolidated', name: 'Budget Consolidé' },
        budgetEntries: Object.entries(allEntries).flatMap(([projectId, entries]) => 
          entries.map(entry => ({ ...entry, projectId }))
        ),
        isConsolidated: true,
      };
    } else {
      const project = projects.find(p => p.id === activeProjectId) || projects[0];
      return {
        activeProject: project,
        budgetEntries: project ? (allEntries[project.id] || []) : [],
        isConsolidated: false,
      };
    }
  }, [activeProjectId, projects, allEntries]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFrequency, setFilterFrequency] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '...';
  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'ponctuel': return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'hebdomadaire': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'irregulier': return <ListChecks className="w-4 h-4 text-purple-600" />;
      case 'provision': return <PiggyBank className="w-4 h-4 text-indigo-600" />;
      case 'annuel': return <Calendar className="w-4 h-4 text-teal-600" />;
      default: return <Repeat className="w-4 h-4 text-green-600" />;
    }
  };
  const getFrequencyLabel = (frequency) => {
    if (frequency === 'irregulier') return 'Irrégulier';
    if (frequency === 'provision') return 'Provisionné';
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const filteredAndSortedEntries = () => {
    let filtered = budgetEntries.filter(entry => {
      const projectName = isConsolidated ? (projects.find(p => p.id === entry.projectId)?.name || '') : '';
      const matchesSearch = entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || entry.category.toLowerCase().includes(searchTerm.toLowerCase()) || (entry.description && entry.description.toLowerCase().includes(searchTerm.toLowerCase())) || (isConsolidated && projectName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || entry.type === filterType;
      const matchesFrequency = filterFrequency === 'all' || entry.frequency === filterFrequency;
      return matchesSearch && matchesType && matchesFrequency;
    });
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'date': aValue = new Date(a.frequency === 'ponctuel' ? a.date : a.startDate); bValue = new Date(b.frequency === 'ponctuel' ? b.date : b.startDate); break;
        case 'amount': aValue = a.amount; bValue = b.amount; break;
        case 'project': aValue = (projects.find(p => p.id === a.projectId)?.name || '').toLowerCase(); bValue = (projects.find(p => p.id === b.projectId)?.name || '').toLowerCase(); break;
        case 'supplier': aValue = a.supplier.toLowerCase(); bValue = b.supplier.toLowerCase(); break;
        case 'category': aValue = a.category.toLowerCase(); bValue = b.category.toLowerCase(); break;
        default: return 0;
      }
      if (aValue === bValue) return 0;
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
    return filtered;
  };

  const calculateTotals = (entries) => ({
    revenueTotal: entries.filter(e => e.type === 'revenu').reduce((sum, e) => sum + e.amount, 0),
    expenseTotal: entries.filter(e => e.type === 'depense').reduce((sum, e) => sum + e.amount, 0)
  });

  const processedEntries = filteredAndSortedEntries();
  const totals = calculateTotals(processedEntries);

  const handleDeleteEntry = (entryId, entryProjectId) => {
    if (window.confirm('Supprimer cette entrée ?')) {
      dispatch({ type: 'DELETE_ENTRY', payload: { entryId, entryProjectId } });
    }
  };
  
  if (!activeProject) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border"><div className="text-sm text-gray-600">Total Entrées</div><div className="text-2xl font-bold">{processedEntries.length}</div></div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200"><div className="text-sm text-green-600">Total Entrées de Base</div><div className="text-2xl font-bold text-green-700">{formatCurrency(totals.revenueTotal, settings)}</div></div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200"><div className="text-sm text-red-600">Total Sorties de Base</div><div className="text-2xl font-bold text-red-700">{formatCurrency(totals.expenseTotal, settings)}</div></div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200"><div className="text-sm text-blue-600">Solde de Base</div><div className={`text-2xl font-bold ${totals.revenueTotal - totals.expenseTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(totals.revenueTotal - totals.expenseTotal, settings)}</div></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2"><Search className="w-4 h-4 inline mr-1" />Rechercher</label><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Fournisseur, catégorie, projet..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2"><Filter className="w-4 h-4 inline mr-1" />Type</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="all">Tous</option><option value="revenu">Entrées</option><option value="depense">Sorties</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Fréquence</label><select value={filterFrequency} onChange={(e) => setFilterFrequency(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="all">Toutes</option><option value="ponctuel">Ponctuel</option><option value="mensuel">Mensuel</option><option value="hebdomadaire">Hebdomadaire</option><option value="bimestriel">Bimestriel</option><option value="trimestriel">Trimestriel</option><option value="annuel">Annuel</option><option value="irregulier">Irrégulier</option><option value="provision">Provisionné</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="date">Date</option><option value="amount">Montant</option>{isConsolidated && <option value="project">Projet</option>}<option value="supplier">Fournisseur</option><option value="category">Catégorie</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="desc">Décroissant</option><option value="asc">Croissant</option></select></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">{processedEntries.length === 0 ? (<div className="p-8 text-center text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Aucune entrée trouvée.</p></div>) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr className="text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-6 py-4 text-left">Type / Catégorie</th>{isConsolidated && <th className="px-6 py-4 text-left">Projet</th>}<th className="px-6 py-4 text-left">Fournisseur/Client</th><th className="px-6 py-4 text-left">Fréquence / Période</th><th className="px-6 py-4 text-left">Montant de Base / Total</th><th className="px-6 py-4 text-left">Actions</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedEntries.map((entry) => {
                  const isRevenue = entry.type === 'revenu';
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="flex items-center">{isRevenue ? <Building className="w-5 h-5 text-green-600 mr-3" /> : <Calendar className="w-5 h-5 text-red-600 mr-3" />}<div><div className={`text-sm font-medium ${isRevenue ? 'text-green-700' : 'text-red-700'}`}>{isRevenue ? 'Entrée' : 'Sortie'}</div><div className="text-sm text-gray-500">{entry.category}</div></div></div></td>
                      {isConsolidated && (<td className="px-6 py-4"><div className="flex items-center gap-2"><Folder className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-gray-800">{projects.find(p => p.id === entry.projectId)?.name || 'N/A'}</span></div></td>)}
                      <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{entry.supplier}</div>{entry.description && <div className="text-sm text-gray-500 truncate max-w-xs">{entry.description}</div>}</td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-900">{getFrequencyIcon(entry.frequency)}<span>{getFrequencyLabel(entry.frequency)}</span></div><div className="text-xs text-gray-500 mt-1 flex items-center gap-1">{entry.frequency === 'ponctuel' ? (<span>{formatDate(entry.date)}</span>) : (entry.frequency === 'irregulier' || entry.frequency === 'provision') ? (<span>{entry.payments?.length || 0} paiements</span>) : (<><span>{formatDate(entry.startDate)}</span><ArrowRight className="w-3 h-3" /><span>{formatDate(entry.endDate)}</span></>)}</div></td>
                      <td className="px-6 py-4"><div className={`text-lg font-semibold ${isRevenue ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(entry.amount, settings)}</div>{entry.frequency === 'hebdomadaire' && <div className="text-xs text-gray-500">par semaine</div>}{(entry.frequency === 'irregulier' || entry.frequency === 'provision') && <div className="text-xs text-gray-500">Total</div>}</td>
                      <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => onEditEntry(entry)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteEntry(entry.id, entry.projectId)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}</div>
      </div>
    </>
  );
};

export default BudgetJournal;
