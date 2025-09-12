import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Wallet, Calendar } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import PaymentModal from './PaymentModal';

const ActualEditorDrawer = ({ isOpen, onClose, actualId }) => {
  const { state, dispatch } = useBudget();
  const { allActuals, userCashAccounts, settings } = state;

  const [actual, setActual] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    description: '',
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && actualId) {
      const activeProjectActuals = Object.values(allActuals).flat();
      const foundActual = activeProjectActuals.find(a => a.id === actualId);
      setActual(foundActual);
      if (foundActual) {
        setFormData({
          date: foundActual.date || '',
          amount: foundActual.amount ?? '',
          description: foundActual.description || '',
        });
      }
    } else {
      setActual(null);
      setFormData({ date: '', amount: '', description: '' });
    }
  }, [isOpen, actualId, allActuals]);

  const handleSaveActual = () => {
    dispatch({
      type: 'SAVE_ACTUAL',
      payload: {
        actualData: { ...actual, ...formData, amount: parseFloat(formData.amount) },
        editingActual: actual,
      }
    });
    onClose();
  };
  
  const handleDeletePayment = (paymentId) => {
    if (window.confirm("Supprimer ce paiement ?")) {
      dispatch({ type: 'DELETE_PAYMENT', payload: { actualId: actual.id, paymentId } });
    }
  }

  const handleRecordPaymentWrapper = (paymentData) => {
    dispatch({ type: 'RECORD_PAYMENT', payload: { actualId, paymentData } });
    setIsPaymentModalOpen(false);
  };

  const getCashAccountName = (accountId) => userCashAccounts.find(acc => acc && acc.id === accountId)?.name || accountId || 'N/A';
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');

  if (!isOpen || !actual) return null;

  const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
  const remainingAmount = formData.amount - totalPaid;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      ></div>
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Gérer la Transaction Réelle</h2>
            <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-grow p-6 overflow-y-auto bg-gray-50 space-y-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">Détails de la transaction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiers</label>
                  <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-md">{actual.thirdParty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-md">{actual.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant Total ({settings.currency})</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="2" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={handleSaveActual} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Save size={16}/> Enregistrer les Modifications
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">Paiements Enregistrés</h3>
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Payé:</span> <span className="font-bold">{formatCurrency(totalPaid, settings)}</span></div>
                <div className="flex justify-between"><span>Reste à payer:</span> <span className="font-bold">{formatCurrency(remainingAmount, settings)}</span></div>
              </div>
              
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {(actual.payments || []).map(p => (
                  <li key={p.id} className="p-2 border rounded-md bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{formatCurrency(p.paidAmount, settings)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5"><Calendar size={12}/> {formatDate(p.paymentDate)} <Wallet size={12}/> {getCashAccountName(p.cashAccount)}</p>
                    </div>
                    <button onClick={() => handleDeletePayment(p.id)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
                {(!actual.payments || actual.payments.length === 0) && <p className="text-center text-gray-400 text-sm py-4">Aucun paiement enregistré.</p>}
              </ul>

              <div className="mt-4 pt-4 border-t">
                <button onClick={() => setIsPaymentModalOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Ajouter un paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isPaymentModalOpen && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleRecordPaymentWrapper} actualToPay={{...actual, amount: formData.amount}} type={actual.type} />}
    </>
  );
};

export default ActualEditorDrawer;
