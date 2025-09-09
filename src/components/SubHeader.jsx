import React, { useMemo, useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import ProjectSwitcher from './ProjectSwitcher';
import { ChevronLeft, ChevronRight, Wallet, Landmark, PiggyBank, Smartphone, Lock } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import ActionableBalanceDrawer from './ActionableBalanceDrawer';
import { mainCashAccountCategories } from '../context/BudgetContext';

const Avatar = ({ name }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold border-2 border-white"
      title={name}
    >
      {initials}
    </div>
  );
};

const SubHeader = () => {
  const { state, dispatch } = useBudget();
  const { activeProjectId, users, permissions, displayYear, settings, allActuals, userCashAccounts } = state;

  const [isBalanceDrawerOpen, setIsBalanceDrawerOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const isConsolidated = activeProjectId === 'consolidated';

  const relevantActuals = useMemo(() => {
    return isConsolidated
      ? Object.values(allActuals).flat()
      : allActuals[activeProjectId] || [];
  }, [activeProjectId, allActuals, isConsolidated]);

  const accountBalances = useMemo(() => {
    return userCashAccounts.map(account => {
      let currentBalance = parseFloat(account.initialBalance) || 0;
      const accountPayments = relevantActuals
        .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));
      
      for (const payment of accountPayments) {
        if (payment.type === 'receivable') {
          currentBalance += payment.paidAmount;
        } else if (payment.type === 'payable') {
          currentBalance -= payment.paidAmount;
        }
      }

      const blockedForProvision = relevantActuals
        .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
        .reduce((sum, actual) => {
          const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
          return sum + (actual.amount - paidAmount);
        }, 0);

      return { 
        id: account.id, 
        name: account.name,
        mainCategoryId: account.mainCategoryId,
        balance: currentBalance, 
        blockedForProvision, 
        actionableBalance: currentBalance - blockedForProvision 
      };
    });
  }, [userCashAccounts, relevantActuals]);

  const balancesByGroup = useMemo(() => {
    const grouped = mainCashAccountCategories.reduce((acc, cat) => {
        acc[cat.id] = { ...cat, balance: 0 };
        return acc;
    }, {});
    
    accountBalances.forEach(acc => {
        if (grouped[acc.mainCategoryId]) {
            grouped[acc.mainCategoryId].balance += acc.actionableBalance;
        }
    });

    return Object.values(grouped).filter(g => g.balance > 0 || userCashAccounts.some(acc => acc.mainCategoryId === g.id));
  }, [accountBalances, userCashAccounts]);

  const collaborators = useMemo(() => {
    if (isConsolidated || !activeProjectId) return [];
    return users.filter(user => permissions[user.id]?.[activeProjectId] && permissions[user.id][activeProjectId] !== 'none');
  }, [activeProjectId, users, permissions, isConsolidated]);
  
  const handleYearChange = (newYear) => {
    dispatch({ type: 'SET_DISPLAY_YEAR', payload: newYear });
  };

  const handleWalletClick = (groupId) => {
    setSelectedGroupId(groupId);
    setIsBalanceDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsBalanceDrawerOpen(false);
    setSelectedGroupId(null);
  };

  const groupIcons = {
      bank: Landmark,
      cash: Wallet,
      mobileMoney: Smartphone,
      savings: PiggyBank,
      provisions: Lock,
  };

  const groupColors = {
      bank: 'text-blue-500',
      cash: 'text-green-500',
      mobileMoney: 'text-cyan-500',
      savings: 'text-purple-500',
      provisions: 'text-orange-500',
  }

  return (
    <>
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-6 py-2 flex justify-between items-center">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <ProjectSwitcher />
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-sm">
              <button onClick={() => handleYearChange(displayYear - 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-lg font-semibold text-gray-700 w-12 text-center">{displayYear}</span>
              <button onClick={() => handleYearChange(displayYear + 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                {balancesByGroup.map(group => {
                    const Icon = groupIcons[group.id] || Wallet;
                    return (
                        <button 
                          key={group.id}
                          onClick={() => handleWalletClick(group.id)}
                          className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 transition-colors"
                          title={`Voir le détail de: ${group.name}`}
                        >
                          <Icon className={`w-5 h-5 ${groupColors[group.id]}`} />
                          <div className="text-left">
                            <div className="text-xs text-gray-500 font-medium">{group.name}</div>
                            <div className="font-bold text-gray-800">{formatCurrency(group.balance, settings)}</div>
                          </div>
                        </button>
                    )
                })}
            </div>
            {!isConsolidated && (
              <div className="flex items-center -space-x-2">
                {collaborators.map(user => (
                  <Avatar key={user.id} name={user.name} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ActionableBalanceDrawer 
        isOpen={isBalanceDrawerOpen}
        onClose={handleCloseDrawer}
        balances={accountBalances}
        selectedGroupId={selectedGroupId}
      />
    </>
  );
};

export default SubHeader;
