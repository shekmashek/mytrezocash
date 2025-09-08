import React, { useMemo, useState } from 'react';
import { PieChart, AlertCircle, Save, Calendar } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';

const categoryDefinitions = {
  'exp-main-1': "Elles assurent le fonctionnement quotidien et la production de vos biens ou services, générant ainsi votre chiffre d'affaires.",
  'exp-main-2': "Elle rémunère et motive vos collaborateurs, qui sont la ressource la plus précieuse pour exécuter votre stratégie et servir vos clients.",
  'exp-main-3': "Elle permet d'acquérir des actifs durables (machines, outils, véhicules) pour accroître votre capacité de production, votre efficacité et votre compétitivité à long terme.",
  'exp-main-4': "Elle couvre le coût de votre capital (intérêts de la dette) et rémunère vos actionnaires, ce qui est essentiel pour maintenir la confiance des investisseurs et assurer la solvabilité de l'entreprise.",
  'exp-main-5': "Elle constitue une réserve de sécurité pour faire face aux imprévus et aux dépenses futures inévitables, garantissant la stabilité financière.",
  'exp-main-6': "Elle permet de gérer les événements ponctuels et imprévisibles (pertes, restructurations) sans perturber le budget normal d'exploitation.",
  'exp-main-7': "Leur paiement est une obligation légale dont le non-respect entraînerait des pénalités financières et juridiques graves pour l'entreprise.",
  'exp-main-8': "Elle maintient et améliore les compétences de vos employés, ce qui est crucial pour l'adaptation, la productivité et l'innovation continue.",
  'exp-main-9': "Elle est le moteur du développement de nouveaux produits ou services, garantissant l'avance concurrentielle et la pérennité de l'entreprise sur le marché."
};

const ExpenseAnalysisView = () => {
  const { state, dispatch } = useBudget();
  const { activeProjectId, projects, categories, allActuals, settings, displayYear } = state;

  const [filterPeriod, setFilterPeriod] = useState('annual'); // 'annual', 'ytd', or month index (0-11)

  const isConsolidated = activeProjectId === 'consolidated';

  const activeProject = useMemo(() => {
    if (isConsolidated) {
      return { id: 'consolidated', name: 'Tous les Projets (Consolidé)' };
    }
    return projects.find(p => p.id === activeProjectId);
  }, [activeProjectId, projects, isConsolidated]);

  const [targets, setTargets] = useState({});

  useState(() => {
    if (activeProject && !isConsolidated && activeProject.expenseTargets) {
      setTargets(activeProject.expenseTargets);
    }
  }, [activeProject, isConsolidated]);

  const actualExpensesForPeriod = useMemo(() => {
    const projectActuals = isConsolidated
      ? Object.values(allActuals).flat()
      : allActuals[activeProjectId] || [];
      
    const paymentsForYear = projectActuals
      .filter(actual => actual.type === 'payable')
      .flatMap(actual => actual.payments || [])
      .filter(payment => new Date(payment.paymentDate).getFullYear() === displayYear);

    if (filterPeriod === 'annual') {
        return paymentsForYear;
    }

    const today = new Date();
    if (filterPeriod === 'ytd') {
        const endDate = today.getFullYear() === displayYear ? today : new Date(displayYear, 11, 31);
        return paymentsForYear.filter(payment => new Date(payment.paymentDate) <= endDate);
    }

    const monthIndex = parseInt(filterPeriod, 10);
    return paymentsForYear.filter(payment => new Date(payment.paymentDate).getMonth() === monthIndex);

  }, [allActuals, activeProjectId, displayYear, isConsolidated, filterPeriod]);

  const totalActualExpenses = useMemo(() => {
    return actualExpensesForPeriod.reduce((sum, payment) => sum + payment.paidAmount, 0);
  }, [actualExpensesForPeriod]);

  const annualExpenseGoal = useMemo(() => {
    if (isConsolidated) {
        return projects.reduce((acc, project) => {
            const projectGoals = project.annualGoals?.[displayYear] || { revenue: 0, expense: 0 };
            return acc + projectGoals.expense;
        }, 0);
    }
    return activeProject?.annualGoals?.[displayYear]?.expense || 0;
  }, [isConsolidated, projects, activeProject, displayYear]);

  const { periodEnvelope, periodLabel } = useMemo(() => {
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    
    if (filterPeriod === 'annual') {
      return {
        periodEnvelope: annualExpenseGoal,
        periodLabel: `Enveloppe Annuelle ${displayYear} (Sorties)`
      };
    }
    
    if (filterPeriod === 'ytd') {
      const today = new Date();
      const currentMonthIndex = today.getFullYear() === displayYear ? today.getMonth() : 11;
      const currentMonthName = months[currentMonthIndex];
      const currentMonthNumber = currentMonthIndex + 1;
      
      return {
        periodEnvelope: (annualExpenseGoal / 12) * currentMonthNumber,
        periodLabel: `Enveloppe Janvier à ${currentMonthName} ${displayYear} (Sorties)`
      };
    }

    const monthIndex = parseInt(filterPeriod, 10);
    return {
      periodEnvelope: annualExpenseGoal / 12,
      periodLabel: `Enveloppe ${months[monthIndex]} ${displayYear} (Sorties)`
    };

  }, [annualExpenseGoal, filterPeriod, displayYear]);


  const analysisData = useMemo(() => {
    if (!categories.expense) return [];
    
    const projectActuals = isConsolidated
        ? Object.values(allActuals).flat()
        : allActuals[activeProjectId] || [];

    return categories.expense.map(mainCat => {
      const actualAmount = actualExpensesForPeriod
        .filter(payment => {
          const actual = projectActuals.find(a => (a.payments || []).some(p => p.id === payment.id));
          return actual && mainCat.subCategories.some(sc => sc.name === actual.category);
        })
        .reduce((sum, payment) => sum + payment.paidAmount, 0);
      
      const actualPercentage = totalActualExpenses > 0 ? (actualAmount / totalActualExpenses) * 100 : 0;
      const targetPercentage = isConsolidated ? null : (targets[mainCat.id] || 0);

      let targetAmount;
      if (isConsolidated) {
          targetAmount = null;
      } else if (filterPeriod === 'annual') {
          targetAmount = annualExpenseGoal * (targetPercentage / 100);
      } else if (filterPeriod === 'ytd') {
          const today = new Date();
          const currentMonthIndex = today.getFullYear() === displayYear ? today.getMonth() : 11;
          const currentMonthNumber = currentMonthIndex + 1;
          targetAmount = (annualExpenseGoal / 12) * currentMonthNumber * (targetPercentage / 100);
      } else { // Specific month
          targetAmount = (annualExpenseGoal / 12) * (targetPercentage / 100);
      }

      return {
        id: mainCat.id,
        name: mainCat.name,
        targetPercentage,
        targetAmount,
        actualAmount,
        actualPercentage
      };
    });
  }, [categories.expense, actualExpensesForPeriod, totalActualExpenses, targets, allActuals, activeProjectId, isConsolidated, annualExpenseGoal, displayYear, filterPeriod]);

  const handleTargetChange = (categoryId, value) => {
    const newTargets = { ...targets, [categoryId]: value };
    
    const exploitationId = 'exp-main-1';
    const otherTargetsSum = Object.entries(newTargets)
      .filter(([id]) => id !== exploitationId)
      .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);
      
    const exploitationTarget = Math.max(0, 100 - otherTargetsSum);
    newTargets[exploitationId] = exploitationTarget;
    
    setTargets(newTargets);
  };
  
  const totalTargetPercentage = useMemo(() => {
    if (isConsolidated) return 100;
    return Object.values(targets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [targets, isConsolidated]);

  const handleSaveChanges = () => {
    if (Math.abs(totalTargetPercentage - 100) > 0.01) {
      alert("La somme des pourcentages cibles doit être exactement de 100%.");
      return;
    }
    dispatch({ type: 'UPDATE_EXPENSE_TARGETS', payload: { projectId: activeProjectId, newTargets: targets } });
    alert("Objectifs de dépenses enregistrés !");
  };

  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  if (!activeProject) {
    return <div className="p-6">Veuillez sélectionner un projet pour voir l'analyse.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-green-600" />
              Analyse de la Répartition des Sorties
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Période d'Analyse
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="annual">Année Complète</option>
              <option value="ytd">Year to Date (YTD)</option>
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          {!isConsolidated && (
            <>
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600">Total Sorties Réelles (Période)</div>
                  <div className="text-2xl font-bold text-red-700">{formatCurrency(totalActualExpenses, settings)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600">{periodLabel}</div>
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(periodEnvelope, settings)}</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <button onClick={handleSaveChanges} disabled={Math.abs(totalTargetPercentage - 100) > 0.01} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <Save className="w-5 h-5" /> Enregistrer
                </button>
              </div>
            </>
          )}
        </div>
        {!isConsolidated && Math.abs(totalTargetPercentage - 100) > 0.01 && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5" />
                La somme des pourcentages cibles doit être exactement de 100%. Total actuel : {totalTargetPercentage.toFixed(2)}%.
            </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Catégorie de Sortie</th>
                <th className="px-6 py-4 text-left">Définition Stratégique</th>
                {!isConsolidated && <th className="px-6 py-4 text-center">Objectif (%)</th>}
                {!isConsolidated && <th className="px-6 py-4 text-right">Montant Objectif</th>}
                <th className="px-6 py-4 text-right">Montant Réel</th>
                <th className="px-6 py-4 text-center">Réel (%)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analysisData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 max-w-sm">{categoryDefinitions[item.id]}</td>
                  {!isConsolidated && (
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        value={item.targetPercentage}
                        onChange={(e) => handleTargetChange(item.id, parseFloat(e.target.value))}
                        disabled={item.id === 'exp-main-1'}
                        className="w-20 text-center font-semibold border rounded-md p-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </td>
                  )}
                  {!isConsolidated && (
                    <td className="px-6 py-4 text-right font-medium text-gray-700">
                      {formatCurrency(item.targetAmount, settings)}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(item.actualAmount, settings)}</td>
                  <td className="px-6 py-4 text-center font-semibold">{item.actualPercentage.toFixed(2)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalysisView;
