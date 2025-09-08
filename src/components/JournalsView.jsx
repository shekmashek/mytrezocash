import React, { useState } from 'react';
import { BookOpen, Receipt } from 'lucide-react';
import BudgetJournal from './BudgetJournal';
import PaymentJournal from './PaymentJournal';
import { useBudget } from '../context/BudgetContext';

const JournalsView = () => {
  const { dispatch } = useBudget();
  const [activeTab, setActiveTab] = useState('budget'); // 'budget' or 'payment'

  const handleEditEntry = (entry) => {
    // Dispatch both actions to switch view and open the modal
    dispatch({ type: 'OPEN_BUDGET_MODAL', payload: entry });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'budget' });
  };

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-yellow-600" />
              Journaux
            </h1>
            <p className="text-gray-600">Consultez l'historique de vos budgets et paiements.</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('budget')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'budget'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Journal du Budget
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Receipt className="w-5 h-5" />
            Journal des Paiements
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'budget' && <BudgetJournal onEditEntry={handleEditEntry} />}
        {activeTab === 'payment' && <PaymentJournal />}
      </div>
    </div>
  );
};

export default JournalsView;
