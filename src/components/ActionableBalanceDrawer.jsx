import React, { useMemo } from 'react';
import { X, Wallet, Lock, CheckCircle, Landmark, PiggyBank, Smartphone } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import { mainCashAccountCategories } from '../context/BudgetContext';

const ActionableBalanceDrawer = ({ isOpen, onClose, balances, selectedGroupId }) => {
  const { state } = useBudget();
  const { settings } = state;

  const groupIcons = {
      bank: Landmark,
      cash: Wallet,
      mobileMoney: Smartphone,
      savings: PiggyBank,
      provisions: Lock,
  };

  const displayedGroup = useMemo(() => {
    if (!selectedGroupId) return null;

    const groupInfo = mainCashAccountCategories.find(g => g.id === selectedGroupId);
    if (!groupInfo) return null;
    
    const accountsInGroup = balances.filter(acc => acc.mainCategoryId === selectedGroupId);
    const totalActionable = accountsInGroup.reduce((sum, acc) => sum + acc.actionableBalance, 0);

    return {
      ...groupInfo,
      accounts: accountsInGroup,
      totalActionable,
    };
  }, [balances, selectedGroupId]);

  if (!isOpen || !displayedGroup) return null;

  const Icon = groupIcons[displayedGroup.id] || Wallet;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      ></div>
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Icon className="w-5 h-5 text-teal-500" />
              Détail - {displayedGroup.name}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            {displayedGroup.accounts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun compte dans ce groupe.</p>
            ) : (
              <ul className="space-y-3">
                {displayedGroup.accounts.map(acc => (
                  <li key={acc.id} className="p-3 bg-white rounded-lg border text-sm">
                    <div className="font-semibold text-gray-800 mb-2">{acc.name}</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-gray-600"><Wallet className="w-4 h-4" /> Solde Total Actuel</span>
                        <span className="font-medium text-gray-800">{formatCurrency(acc.balance, settings)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-orange-600"><Lock className="w-4 h-4" /> Provisions Bloquées</span>
                        <span className="font-medium text-orange-700">-{formatCurrency(acc.blockedForProvision, settings)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <span className="flex items-center gap-2 font-bold text-green-600"><CheckCircle className="w-4 h-4" /> Solde Actionnable</span>
                        <span className="font-bold text-lg text-green-700">{formatCurrency(acc.actionableBalance, settings)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t bg-gray-100 space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-800">Total Actionnable ({displayedGroup.name})</span>
              <span className="font-bold text-2xl text-green-700">{formatCurrency(displayedGroup.totalActionable, settings)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActionableBalanceDrawer;
