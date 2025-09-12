import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import { getEntryAmountForMonth } from '../utils/budgetCalculations';

const AnnualGoalsTracker = ({ activeProject, budgetEntries, displayYear }) => {
  const { state, dispatch } = useBudget();
  const { settings } = state;
  const isConsolidated = activeProject.id === 'consolidated';

  const annualGoals = useMemo(() => {
    if (isConsolidated) {
      return state.projects.reduce((acc, project) => {
        const projectGoals = project.annualGoals?.[displayYear] || { revenue: 0, expense: 0 };
        acc.revenue += projectGoals.revenue;
        acc.expense += projectGoals.expense;
        return acc;
      }, { revenue: 0, expense: 0 });
    }
    return activeProject?.annualGoals?.[displayYear] || { revenue: 0, expense: 0 };
  }, [activeProject, displayYear, isConsolidated, state.projects]);

  const totalBudgeted = useMemo(() => {
    const totals = { revenue: 0, expense: 0 };
    budgetEntries.forEach(entry => {
      for (let i = 0; i < 12; i++) {
        const amount = getEntryAmountForMonth(entry, i, displayYear);
        if (entry.type === 'revenu') {
          totals.revenue += amount;
        } else if (entry.type === 'depense') {
          totals.expense += amount;
        }
      }
    });
    return totals;
  }, [budgetEntries, displayYear]);

  const handleGoalChange = (type, value) => {
    if (isConsolidated) return;
    const numericValue = parseFloat(value) || 0;
    dispatch({
      type: 'UPDATE_ANNUAL_GOALS',
      payload: {
        projectId: activeProject.id,
        year: displayYear,
        type,
        value: numericValue,
      },
    });
  };

  const cashFlow = annualGoals.revenue - annualGoals.expense;
  const isCashFlowPositive = cashFlow >= 0;

  const renderGoalCard = (type) => {
    const isRevenue = type === 'revenue';
    const title = isRevenue ? 'Entrées' : 'Sorties';
    const Icon = isRevenue ? TrendingUp : TrendingDown;
    
    const gradientClasses = isRevenue 
      ? 'from-emerald-400 to-teal-600' 
      : 'from-rose-400 to-red-600';
    const textColor = isRevenue ? 'text-teal-600' : 'text-red-600';

    const goal = annualGoals[type];
    const budgeted = totalBudgeted[type];
    const remaining = goal - budgeted;
    const progress = goal > 0 ? (budgeted / goal) * 100 : 0;
    const textThreshold = 30; // Percentage threshold to switch text position

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-base font-bold text-gray-700 flex items-center gap-2`}>
            <Icon className={`w-5 h-5 ${textColor}`} />
            Objectif Annuel - {title}
          </h3>
          <div className="flex items-center gap-1">
            <label htmlFor={`goal-input-${type}`} className="text-xs text-gray-500">Objectif:</label>
            <input
              id={`goal-input-${type}`}
              type="number"
              value={goal}
              onChange={(e) => handleGoalChange(type, e.target.value)}
              className="w-32 p-1 border-b text-right font-semibold text-gray-800 bg-transparent focus:outline-none focus:border-blue-500 disabled:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md"
              placeholder="0"
              disabled={isConsolidated}
            />
          </div>
        </div>

        <div className="relative h-5 w-full bg-gray-200 rounded-lg overflow-hidden shadow-inner flex items-center">
            <div 
                className={`h-full rounded-lg bg-gradient-to-r ${gradientClasses} transition-all duration-700 ease-out flex items-center justify-center`}
                style={{ width: `${Math.min(progress, 100)}%` }}
            >
                {progress >= textThreshold && (
                    <span className="text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                        {progress.toFixed(0)}%
                    </span>
                )}
            </div>
            {progress < textThreshold && (
                <span className={`pl-2 text-sm font-bold ${textColor}`}>
                    {progress.toFixed(0)}%
                </span>
            )}
        </div>

        <div className="flex justify-between items-center text-xs mt-2">
          <div className="text-gray-600">
            Budgétisé: <span className="font-semibold text-gray-800">{formatCurrency(budgeted, settings)}</span>
          </div>
          <div className="text-gray-600">
            Restant: <span className={`font-semibold ${remaining < 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {formatCurrency(remaining, settings)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderGoalCard('revenue')}
      {renderGoalCard('expense')}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-base font-bold text-gray-700 flex items-center gap-2`}>
            <ArrowRightLeft className={`w-5 h-5 ${isCashFlowPositive ? 'text-green-600' : 'text-red-600'}`} />
            Flux de Trésorerie
          </h3>
        </div>
        <div className={`flex-grow flex items-center justify-center rounded-lg p-4 ${isCashFlowPositive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <span className={`text-3xl font-bold ${isCashFlowPositive ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(cashFlow, settings)}
            </span>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
            Objectif Entrées - Objectif Sorties
        </div>
      </div>
    </div>
  );
};

export default AnnualGoalsTracker;
