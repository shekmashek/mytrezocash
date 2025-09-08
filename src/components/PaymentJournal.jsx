import React, { useState, useMemo } from 'react';
import { Search, Filter, Folder, User, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import { useBudget } from '../context/BudgetContext';

const PaymentJournal = () => {
  const { state } = useBudget();
  const { allActuals, projects, userCashAccounts, settings } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [sortBy, setSortBy] = useState('paymentDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const allPayments = useMemo(() => Object.values(allActuals).flat().flatMap(actual => (actual.payments || []).map(payment => {
      const project = projects.find(p => p.id === actual.projectId);
      return { ...payment, actualInfo: actual, projectName: project?.name || 'N/A' };
  })), [allActuals, projects]);

  const filteredAndSortedPayments = useMemo(() => {
    let filtered = allPayments.filter(p => (p.actualInfo.thirdParty.toLowerCase().includes(searchTerm.toLowerCase()) || p.actualInfo.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectName.toLowerCase().includes(searchTerm.toLowerCase())) && (filterProject === 'all' || p.actualInfo.projectId === filterProject));
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'paymentDate': aValue = new Date(a.paymentDate); bValue = new Date(b.paymentDate); break;
        case 'paidAmount': aValue = a.paidAmount; bValue = b.paidAmount; break;
        case 'projectName': aValue = a.projectName.toLowerCase(); bValue = b.projectName.toLowerCase(); break;
        case 'thirdParty': aValue = a.actualInfo.thirdParty.toLowerCase(); bValue = b.actualInfo.thirdParty.toLowerCase(); break;
        case 'category': aValue = a.actualInfo.category.toLowerCase(); bValue = b.actualInfo.category.toLowerCase(); break;
        default: return 0;
      }
      if (aValue === bValue) return 0;
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
    return filtered;
  }, [allPayments, searchTerm, filterProject, sortBy, sortOrder]);

  const totalPaid = filteredAndSortedPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');
  const getCashAccountName = (accountId) => userCashAccounts.find(acc => acc && acc.id === accountId)?.name || accountId || 'Compte Inconnu';

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border"><div className="text-sm text-gray-600">Nombre de Paiements</div><div className="text-2xl font-bold">{filteredAndSortedPayments.length}</div></div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200"><div className="text-sm text-blue-600">Montant Total Payé</div><div className="text-2xl font-bold text-blue-700">{formatCurrency(totalPaid, settings)}</div></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2"><Search className="w-4 h-4 inline mr-1" />Rechercher</label><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tiers, catégorie, projet..." className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2"><Filter className="w-4 h-4 inline mr-1" />Projet</label><select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="all">Tous les projets</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="paymentDate">Date</option><option value="paidAmount">Montant</option><option value="projectName">Projet</option><option value="thirdParty">Tiers</option><option value="category">Catégorie</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-2 border rounded-lg"><option value="desc">Décroissant</option><option value="asc">Croissant</option></select></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr className="text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-6 py-4 text-left">Date Paiement</th><th className="px-6 py-4 text-left">Projet</th><th className="px-6 py-4 text-left">Tiers / Catégorie</th><th className="px-6 py-4 text-right">Montant Payé</th><th className="px-6 py-4 text-left">Compte Trésorerie</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedPayments.map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{formatDate(p.paymentDate)}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><Folder className="w-4 h-4 text-gray-500" />{p.projectName}</div></td><td className="px-6 py-4"><div className="font-medium flex items-center gap-2"><User className="w-4 h-4 text-gray-500" />{p.actualInfo.thirdParty}</div><div className="text-sm text-gray-500 ml-6">{p.actualInfo.category}</div></td><td className="px-6 py-4 text-right font-semibold text-lg text-gray-800">{formatCurrency(p.paidAmount, settings)}</td><td className="px-6 py-4"><div className="flex items-center gap-2 font-medium"><Wallet className="w-4 h-4 text-teal-600" /> {getCashAccountName(p.cashAccount)}</div></td></tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PaymentJournal;
