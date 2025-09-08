import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit, Eye, Search, Gem, Info, Table } from 'lucide-react';
import TransactionDetailDrawer from './TransactionDetailDrawer';
import ResizableTh from './ResizableTh';
import { getEntryAmountForMonth } from '../utils/budgetCalculations';
import { formatCurrency } from '../utils/formatting';
import { useBudget } from '../context/BudgetContext';
import { Building, Calendar, ChevronDown, User, Folder, TrendingUp, Target } from 'lucide-react';
import AnnualGoalsTracker from './AnnualGoalsTracker';

const BudgetTracker = ({ activeProject, budgetEntries, actualTransactions }) => {
  const { state, dispatch } = useBudget();
  const { projects, categories, settings, displayYear, userCashAccounts } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({ budget: true, actual: true, ecart: true });
  const [drawerData, setDrawerData] = useState({ isOpen: false, transactions: [], title: '' });
  const [collapsedItems, setCollapsedItems] = useState({});

  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);

  const toggleCollapse = (id) => setCollapsedItems(prev => ({ ...prev, [id]: !prev[id] }));
  
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const savedWidths = localStorage.getItem('budgetAppColumnWidths');
      if (savedWidths) return JSON.parse(savedWidths);
    } catch (error) {
      console.error("Failed to parse column widths from localStorage", error);
    }
    return { category: 192, supplier: 160, project: 192, description: 256 };
  });

  useEffect(() => localStorage.setItem('budgetAppColumnWidths', JSON.stringify(columnWidths)), [columnWidths]);

  useEffect(() => {
    const topEl = topScrollRef.current;
    const mainEl = mainScrollRef.current;
    if (!topEl || !mainEl) return;
    let isSyncing = false;
    const syncTopToMain = () => { if (!isSyncing) { isSyncing = true; mainEl.scrollLeft = topEl.scrollLeft; requestAnimationFrame(() => { isSyncing = false; }); } };
    const syncMainToTop = () => { if (!isSyncing) { isSyncing = true; topEl.scrollLeft = mainEl.scrollLeft; requestAnimationFrame(() => { isSyncing = false; }); } };
    topEl.addEventListener('scroll', syncTopToMain);
    mainEl.addEventListener('scroll', syncMainToTop);
    return () => { topEl.removeEventListener('scroll', syncTopToMain); mainEl.removeEventListener('scroll', syncMainToTop); };
  }, []);

  const handleResize = (columnId, newWidth) => setColumnWidths(prev => ({ ...prev, [columnId]: Math.max(newWidth, 80) }));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const isConsolidated = activeProject.id === 'consolidated';

  const filteredBudgetEntries = useMemo(() => {
    if (!searchTerm) return budgetEntries;
    return budgetEntries.filter(entry => entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [budgetEntries, searchTerm]);

  const handleNewBudget = () => { if (!isConsolidated) { dispatch({ type: 'OPEN_BUDGET_MODAL', payload: null }); } };
  const handleEditEntry = (entry) => { dispatch({ type: 'OPEN_BUDGET_MODAL', payload: entry }); };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const getFrequencyTitle = (entry) => {
    const freq = entry.frequency.charAt(0).toUpperCase() + entry.frequency.slice(1);
    if (entry.frequency === 'ponctuel') return `Ponctuel: ${formatDate(entry.date)}`;
    if (entry.frequency === 'irregulier') return `Irrégulier: ${entry.payments?.length || 0} paiements`;
    const period = `De ${formatDate(entry.startDate)} à ${entry.endDate ? formatDate(entry.endDate) : '...'}`;
    return `${freq} | ${period}`;
  };
  const getEcartColor = (ecart, isEntree) => ecart === 0 ? 'text-gray-600' : isEntree ? (ecart >= 0 ? 'text-green-600' : 'text-red-600') : (ecart > 0 ? 'text-red-600' : 'text-green-600');
  
  const getActualAmountForEntry = (entryId, monthIndex, year) => {
    const entry = budgetEntries.find(e => e.id === entryId);
    if (!entry) return 0;
    
    // Find all actuals linked to this budget entry
    const linkedActuals = actualTransactions.filter(t => t.budgetId === entryId);
    
    // Sum payments that occurred for this entry, regardless of payment date
    return linkedActuals.reduce((sum, actual) => {
        // The budget is for a specific month, so we only count payments for that month's commitment
        const budgetDate = new Date(actual.date);
        if (budgetDate.getFullYear() === year && budgetDate.getMonth() === monthIndex) {
            return sum + (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
        }
        return sum;
    }, 0);
  };
  
  const isRowVisibleForYear = (entry, year) => {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      if (getEntryAmountForMonth(entry, monthIndex, year) > 0 || getActualAmountForEntry(entry.id, monthIndex, year) > 0) return true;
    }
    return false;
  };
  
  const hasOffBudgetRevenuesForYear = (year) => budgetEntries.some(e => e.isOffBudget && e.type === 'revenu' && isRowVisibleForYear(e, year));
  const hasOffBudgetExpensesForYear = (year) => budgetEntries.some(e => e.isOffBudget && e.type === 'depense' && isRowVisibleForYear(e, year));

  const getPaymentsForCategoryAndMonth = (subCategoryName, monthIndex, year) => {
    let relevantActuals;
    if (subCategoryName === 'Sorties Hors Budget' || subCategoryName === 'Entrées Hors Budget') {
        const type = subCategoryName === 'Sorties Hors Budget' ? 'depense' : 'revenu';
        const offBudgetEntryIds = budgetEntries.filter(e => e.isOffBudget && e.type === type).map(e => e.id);
        relevantActuals = actualTransactions.filter(t => offBudgetEntryIds.includes(t.budgetId));
    } else {
        relevantActuals = actualTransactions.filter(t => {
            if (t.category !== subCategoryName || !t.budgetId) return false;
            const budgetEntry = budgetEntries.find(e => e.id === t.budgetId);
            if (!budgetEntry || budgetEntry.isOffBudget) return false;
            const budgetDate = new Date(t.date);
            return budgetDate.getFullYear() === year && budgetDate.getMonth() === monthIndex;
        });
    }
    return relevantActuals.flatMap(t => (t.payments || []).map(p => ({ ...p, thirdParty: t.thirdParty, type: t.type })));
  };
  
  const getPaymentsForMainCategoryAndMonth = (mainCategory, monthIndex, year) => mainCategory.subCategories.flatMap(sc => getPaymentsForCategoryAndMonth(sc.name, monthIndex, year));

  const handleActualClick = (context) => {
    const { monthIndex, year } = context;
    let payments = [];
    let title = '';
    if (context.entryId) {
      const entry = budgetEntries.find(e => e.id === context.entryId);
      const relevantActual = actualTransactions.find(t => t.budgetId === context.entryId && new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === monthIndex);
      if (relevantActual?.payments) payments = relevantActual.payments.map(p => ({ ...p, thirdParty: relevantActual.thirdParty, type: relevantActual.type }));
      title = `Détails pour ${entry.supplier}`;
    } else if (context.mainCategory) {
        payments = getPaymentsForMainCategoryAndMonth(context.mainCategory, monthIndex, year);
        title = `Détails pour ${context.mainCategory.name}`;
    } else if (context.category === 'Sorties Hors Budget' || context.category === 'Entrées Hors Budget') {
        payments = getPaymentsForCategoryAndMonth(context.category, monthIndex, year);
        title = `Détails pour ${context.category}`;
    } else if (context.type) {
      if (context.type === 'entree') {
        payments = categories.revenue.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetRevenuesForYear(year)) payments.push(...getPaymentsForCategoryAndMonth('Entrées Hors Budget', monthIndex, year));
        title = 'Détails des Entrées';
      } else if (context.type === 'sortie') {
        payments = categories.expense.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetExpensesForYear(year)) payments.push(...getPaymentsForCategoryAndMonth('Sorties Hors Budget', monthIndex, year));
        title = 'Détails des Sorties';
      } else if (context.type === 'net') {
        const revenuePayments = categories.revenue.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetRevenuesForYear(year)) revenuePayments.push(...getPaymentsForCategoryAndMonth('Entrées Hors Budget', monthIndex, year));
        let expensePayments = categories.expense.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetExpensesForYear(year)) expensePayments.push(...getPaymentsForCategoryAndMonth('Sorties Hors Budget', monthIndex, year));
        payments = [...revenuePayments, ...expensePayments];
        title = 'Détails des Transactions';
      }
    }
    if (payments.length > 0) setDrawerData({ isOpen: true, transactions: payments, title: `${title} - ${months[monthIndex]} ${year}` });
  };
  const handleCloseDrawer = () => setDrawerData({ isOpen: false, transactions: [], title: '' });

  const groupedData = useMemo(() => {
    const entriesToGroup = filteredBudgetEntries.filter(e => !e.isOffBudget);
    const groupByType = (type) => {
      const catType = type === 'entree' ? 'revenue' : 'expense';
      if (!categories || !categories[catType]) return [];
      return categories[catType].map(mainCat => {
        if (!mainCat.subCategories) return null;
        const entriesForMainCat = entriesToGroup.filter(entry => mainCat.subCategories.some(sc => sc.name === entry.category) && isRowVisibleForYear(entry, displayYear));
        return entriesForMainCat.length > 0 ? { ...mainCat, entries: entriesForMainCat } : null;
      }).filter(Boolean);
    };
    return { entree: groupByType('entree'), sortie: groupByType('sortie') };
  }, [filteredBudgetEntries, categories, displayYear]);

  const calculateMainCategoryTotals = (entries, monthIndex) => {
    const budget = entries.reduce((sum, entry) => sum + getEntryAmountForMonth(entry, monthIndex, displayYear), 0);
    const actual = entries.reduce((sum, entry) => sum + getActualAmountForEntry(entry.id, monthIndex, displayYear), 0);
    return { budget, actual, ecart: actual - budget };
  };
  
  const calculateOffBudgetTotalsForMonth = (type, monthIndex) => {
      const offBudgetEntries = filteredBudgetEntries.filter(e => e.isOffBudget && e.type === type);
      const budget = offBudgetEntries.reduce((sum, entry) => sum + getEntryAmountForMonth(entry, monthIndex, displayYear), 0);
      const actual = offBudgetEntries.reduce((sum, entry) => sum + getActualAmountForEntry(entry.id, monthIndex, displayYear), 0);
      return { budget, actual, ecart: actual - budget };
  };

  const calculateGeneralTotals = (mainCategories, monthIndex, type) => {
    const totals = mainCategories.reduce((acc, mainCategory) => {
      const categoryTotals = calculateMainCategoryTotals(mainCategory.entries, monthIndex);
      acc.budget += categoryTotals.budget;
      acc.actual += categoryTotals.actual;
      return acc;
    }, { budget: 0, actual: 0 });
    if (type === 'entree' && hasOffBudgetRevenuesForYear(displayYear)) {
        const offBudgetTotals = calculateOffBudgetTotalsForMonth('revenu', monthIndex);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    } else if (type === 'sortie' && hasOffBudgetExpensesForYear(displayYear)) {
        const offBudgetTotals = calculateOffBudgetTotalsForMonth('depense', monthIndex);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    }
    return totals;
  };

  const monthlyPositions = useMemo(() => {
    const yearStart = new Date(displayYear, 0, 1);
    
    // Calculate total balance at the start of the year
    const initialBalanceSum = userCashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.initialBalance) || 0), 0);
    const netFlowBeforeYear = actualTransactions
      .flatMap(actual => actual.payments || [])
      .filter(p => new Date(p.paymentDate) < yearStart)
      .reduce((sum, p) => {
        const actual = actualTransactions.find(a => (a.payments || []).some(payment => payment.id === p.id));
        return actual.type === 'receivable' ? sum + p.paidAmount : sum - p.paidAmount;
      }, 0);
    const totalBalanceAtYearStart = initialBalanceSum + netFlowBeforeYear;

    // Calculate provisions blocked at the start of the year
    const provisionsBlockedAtYearStart = actualTransactions
      .filter(actual => actual.isProvision && new Date(actual.date) < yearStart && actual.status !== 'paid')
      .reduce((sum, actual) => {
        const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
        return sum + (actual.amount - paidAmount);
      }, 0);
    
    const initialActionableBalance = totalBalanceAtYearStart - provisionsBlockedAtYearStart;

    const positions = [];
    let lastMonthFinalPosition = initialActionableBalance;

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const revenueTotals = calculateGeneralTotals(groupedData.entree || [], monthIndex, 'entree');
      const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], monthIndex, 'sortie');
      const netActual = revenueTotals.actual - expenseTotals.actual;

      const initialPosition = lastMonthFinalPosition;
      const finalPosition = initialPosition + netActual;
      
      positions.push({ initial: initialPosition, final: finalPosition });
      lastMonthFinalPosition = finalPosition;
    }
    return positions;
  }, [displayYear, userCashAccounts, actualTransactions, groupedData]);


  const calculateCumulativeResult = (monthIndex) => {
    let cumulativeBudget = 0, cumulativeActual = 0;
    for (let i = 0; i <= monthIndex; i++) {
      const revenueTotals = calculateGeneralTotals(groupedData.entree || [], i, 'entree');
      const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], i, 'sortie');
      cumulativeBudget += revenueTotals.budget - expenseTotals.budget;
      cumulativeActual += revenueTotals.actual - expenseTotals.actual;
    }
    return { budget: cumulativeBudget, actual: cumulativeActual, ecart: cumulativeActual - cumulativeBudget };
  };

  const numVisibleCols = Object.values(visibleColumns).filter(Boolean).length;
  const monthColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
  const separatorWidth = 4;
  const fixedColsWidth = columnWidths.category + columnWidths.supplier + (isConsolidated ? columnWidths.project : 0) + columnWidths.description;
  const totalTableWidth = fixedColsWidth + separatorWidth + (months.length * (monthColumnWidth + separatorWidth));
  
  const supplierColLeft = columnWidths.category;
  const projectColLeft = supplierColLeft + columnWidths.supplier;
  const descriptionColLeft = isConsolidated ? projectColLeft + columnWidths.project : supplierColLeft + columnWidths.supplier;
  const totalCols = (isConsolidated ? 4 : 3) + 1 + (months.length * 2);

  const renderBudgetRows = (type) => {
    const mainCategories = groupedData[type];
    if (!mainCategories) return null;

    const offBudgetVisible = type === 'entree' ? hasOffBudgetRevenuesForYear(displayYear) : hasOffBudgetExpensesForYear(displayYear);
    const offBudgetEntries = filteredBudgetEntries.filter(e => e.isOffBudget && e.type === (type === 'entree' ? 'revenu' : 'depense'));

    return (
      <>
        <tr className="sticky top-[57px] z-20">
          <th colSpan={totalCols} scope="colgroup" className="px-4 py-2 font-bold text-left text-gray-800 bg-gray-200">
            <div className="flex items-center gap-2">{type === 'entree' ? <Building className="w-4 h-4" /> : <Calendar className="w-4 h-4" />} {type === 'entree' ? 'ENTRÉES' : 'SORTIES'}</div>
          </th>
        </tr>
        {mainCategories.map(mainCategory => {
          const isMainCollapsed = collapsedItems[mainCategory.id];
          return (
            <React.Fragment key={mainCategory.id}>
              <tr onClick={() => toggleCollapse(mainCategory.id)} className="bg-gray-100 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200">
                <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 bg-gray-100 sticky left-0 z-10">
                  <div className="flex items-center gap-2"><ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />{mainCategory.name}</div>
                </td>
                <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                {months.flatMap((_, monthIndex) => {
                  const totals = calculateMainCategoryTotals(mainCategory.entries, monthIndex);
                  return [
                    <td key={monthIndex} className="px-2 py-2">
                      {numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-semibold">
                        {visibleColumns.budget && <div className="flex-1 text-center">{formatCurrency(totals.budget, settings)}</div>}
                        {visibleColumns.actual && <div className="flex-1 text-center">{formatCurrency(totals.actual, settings)}</div>}
                        {visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(totals.ecart, type === 'entree')}`}>{formatCurrency(totals.ecart, settings)}</div>}
                      </div>}
                    </td>,
                    <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                  ];
                })}
              </tr>
              {!isMainCollapsed && mainCategory.entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="pl-12 pr-4 py-1 font-normal text-gray-800 bg-white hover:bg-gray-50 sticky left-0 z-10" style={{ width: `${columnWidths.category}px` }}>{entry.category}</td>
                  <td className="px-4 py-1 text-gray-700 bg-white hover:bg-gray-50 sticky z-10" style={{ width: `${columnWidths.supplier}px`, left: `${supplierColLeft}px` }}><div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" />{entry.supplier}</div></td>
                  {isConsolidated && (<td className="px-4 py-1 text-gray-700 bg-white hover:bg-gray-50 sticky z-10" style={{ width: `${columnWidths.project}px`, left: `${projectColLeft}px` }}><div className="flex items-center gap-2"><Folder className="w-4 h-4 text-gray-500" />{projects.find(p => p.id === entry.projectId)?.name || 'N/A'}</div></td>)}
                  <td className="px-4 py-1 text-gray-600 bg-white hover:bg-gray-50 sticky z-10" style={{ width: `${columnWidths.description}px`, left: `${descriptionColLeft}px` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate" title={getFrequencyTitle(entry)}>{entry.description || '-'}</span>
                      <button onClick={() => handleEditEntry(entry)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed" disabled={isConsolidated}><Edit className="w-4 h-4" /></button>
                    </div>
                  </td>
                  <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                  {months.flatMap((_, monthIndex) => {
                    const budget = getEntryAmountForMonth(entry, monthIndex, displayYear);
                    const actual = getActualAmountForEntry(entry.id, monthIndex, displayYear);
                    const isProvisionEntry = entry.frequency === 'provision';
                    return [
                      <td key={monthIndex} className="px-2 py-1">
                        {numVisibleCols > 0 && <div className="flex gap-2 justify-around items-center">
                          {visibleColumns.budget && (
                            <div className="flex-1 text-center text-xs">
                              {isProvisionEntry && budget > 0 ? (
                                <span className="flex items-center justify-center gap-1 text-indigo-600 font-semibold" title="Montant provisionné">
                                  <Gem className="w-3 h-3" />
                                  {formatCurrency(budget, settings)}
                                </span>
                              ) : (
                                <span className="text-gray-600">{budget > 0 ? formatCurrency(budget, settings) : '-'}</span>
                              )}
                            </div>
                          )}
                          {visibleColumns.actual && <button onClick={() => actual > 0 && handleActualClick({ entryId: entry.id, monthIndex, year: displayYear })} disabled={actual === 0} className="flex-1 text-center text-xs font-semibold text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:underline">{actual > 0 ? formatCurrency(actual, settings) : '-'}</button>}
                          {visibleColumns.ecart && <div className={`flex-1 text-center text-xs font-semibold ${getEcartColor(actual - budget, type === 'entree')}`}>{budget > 0 || actual > 0 ? formatCurrency(actual - budget, settings) : '-'}</div>}
                        </div>}
                      </td>,
                      <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                    ];
                  })}
                </tr>
              ))}
            </React.Fragment>
          );
        })}
        {offBudgetVisible && (
          <tr className={`bg-${type === 'entree' ? 'green' : 'orange'}-50 border-t border-b border-${type === 'entree' ? 'green' : 'orange'}-200`}>
            <td colSpan={isConsolidated ? 4 : 3} className={`px-4 py-2 font-semibold text-${type === 'entree' ? 'green' : 'orange'}-700 bg-${type === 'entree' ? 'green' : 'orange'}-50 sticky left-0 z-10`}>{type === 'entree' ? 'Entrées' : 'Sorties'} Hors Budget</td>
            <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
            {months.flatMap((_, monthIndex) => {
              const totals = calculateOffBudgetTotalsForMonth(type === 'entree' ? 'revenu' : 'depense', monthIndex);
              return [
                <td key={monthIndex} className="px-2 py-2">
                  {numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-semibold">
                    {visibleColumns.budget && <div className={`flex-1 text-center text-${type === 'entree' ? 'green' : 'orange'}-700`}>{formatCurrency(totals.budget, settings)}</div>}
                    {visibleColumns.actual && <button onClick={() => totals.actual > 0 && handleActualClick({ category: `${type === 'entree' ? 'Entrées' : 'Sorties'} Hors Budget`, monthIndex, year: displayYear })} disabled={totals.actual === 0} className={`flex-1 text-center text-${type === 'entree' ? 'green' : 'orange'}-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60`}>{formatCurrency(totals.actual, settings)}</button>}
                    {visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(totals.ecart, type === 'entree')}`}>{formatCurrency(totals.ecart, settings)}</div>}
                  </div>}
                </td>,
                <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
              ];
            })}
          </tr>
        )}
        <tr className="bg-gray-200 border-y-2 border-gray-300">
          <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 font-bold text-gray-900 bg-gray-200 sticky left-0 z-10">TOTAL {type === 'entree' ? 'ENTRÉES' : 'SORTIES'}</td>
          <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
          {months.flatMap((_, monthIndex) => {
            const totals = calculateGeneralTotals(mainCategories, monthIndex, type);
            return [
              <td key={monthIndex} className="px-2 py-2">
                {numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-bold">
                  {visibleColumns.budget && <div className="flex-1 text-center text-gray-900">{formatCurrency(totals.budget, settings)}</div>}
                  {visibleColumns.actual && <button onClick={() => totals.actual > 0 && handleActualClick({ type: type, monthIndex, year: displayYear })} disabled={totals.actual === 0} className="flex-1 text-center text-gray-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60">{formatCurrency(totals.actual, settings)}</button>}
                  {visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(totals.actual - totals.budget, type === 'entree')}`}>{formatCurrency(totals.actual - totals.budget, settings)}</div>}
                </div>}
              </td>,
              <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
            ];
          })}
        </tr>
      </>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold mb-1">Définissez vos Objectifs Annuels</h4>
          <p>
            Commencez par définir vos grandes enveloppes annuelles pour les entrées et les sorties. Cela vous permettra de suivre la progression de votre budget par rapport à vos objectifs stratégiques tout au long de l'année.
          </p>
        </div>
      </div>

      <AnnualGoalsTracker 
        activeProject={activeProject}
        budgetEntries={budgetEntries}
        displayYear={displayYear}
      />
      
      <div className="mt-8 mb-4 p-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm flex items-start gap-3">
        <Table className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-500" />
        <div>
            <h4 className="font-bold mb-1">Budget Détaillé</h4>
            <p>
            Voici le cœur de votre outil. Comparez votre budget prévisionnel au réel, analysez les écarts mois par mois, et cliquez sur les montants "Réel" pour voir le détail des transactions.
            </p>
        </div>
      </div>

      <div className="my-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4"/>Colonnes:</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.budget} onChange={() => setVisibleColumns(prev => ({ ...prev, budget: !prev.budget }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/> Budget</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.actual} onChange={() => setVisibleColumns(prev => ({ ...prev, actual: !prev.actual }))} className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-600"/> Réel</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.ecart} onChange={() => setVisibleColumns(prev => ({ ...prev, ecart: !prev.ecart }))} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"/> Écart</label>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="search-supplier" className="relative text-gray-400 focus-within:text-gray-600 block">
            <Search className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3" />
            <input type="text" id="search-supplier" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par Fournisseur/Client..." className="form-input block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm" />
          </label>
          <button onClick={handleNewBudget} className="text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed" disabled={isConsolidated}><Plus className="w-5 h-5" /> Nouveau Budget</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden custom-scrollbar"><div style={{ width: `${totalTableWidth}px`, height: '1px' }}></div></div>
        <div ref={mainScrollRef} className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-gray-100 sticky top-0 z-30">
              <tr>
                <ResizableTh id="category" width={columnWidths.category} onResize={handleResize} className="sticky left-0 z-40">Catégorie</ResizableTh>
                <ResizableTh id="supplier" width={columnWidths.supplier} onResize={handleResize} className="sticky z-20" style={{ left: `${supplierColLeft}px` }}>Fournisseur/Client</ResizableTh>
                {isConsolidated && (<ResizableTh id="project" width={columnWidths.project} onResize={handleResize} className="sticky z-20" style={{ left: `${projectColLeft}px` }}>Projet</ResizableTh>)}
                <ResizableTh id="description" width={columnWidths.description} onResize={handleResize} className="sticky z-20" style={{ left: `${descriptionColLeft}px` }}>Description</ResizableTh>
                <th className="bg-white border-b-2" style={{ width: `${separatorWidth}px` }}></th>
                {months.flatMap(month => [
                  <th key={month} className="px-2 py-2 text-center font-semibold text-gray-900 border-b-2" style={{ minWidth: `${monthColumnWidth}px` }}>
                    <div className="text-base mb-1">{`${month} '${String(displayYear).slice(-2)}`}</div>
                    {numVisibleCols > 0 && <div className="flex gap-2 justify-around text-xs font-medium text-gray-600">
                      {visibleColumns.budget && <div className="flex-1">Budget</div>}
                      {visibleColumns.actual && <div className="flex-1">Réel</div>}
                      {visibleColumns.ecart && <div className="flex-1">Écart</div>}
                    </div>}
                  </th>,
                  <th key={`${month}-sep`} className="bg-white border-b-2" style={{ width: `${separatorWidth}px` }}></th>
                ])}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-100 font-bold text-blue-800">
                <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 bg-blue-100 sticky left-0 z-10">Position Initiale Disponible</td>
                <td className="bg-white"></td>
                {months.flatMap((_, monthIndex) => (
                    <React.Fragment key={monthIndex}>
                        <td className="px-2 py-2 text-center" colSpan={1}>{formatCurrency(monthlyPositions[monthIndex].initial, settings)}</td>
                        <td className="bg-white"></td>
                    </React.Fragment>
                ))}
              </tr>

              <tr className="bg-white">
                <td colSpan={totalCols} className="py-2"></td>
              </tr>

              {renderBudgetRows('entree')}
              
              <tr className="bg-white">
                <td colSpan={totalCols} className="py-2"></td>
              </tr>
              
              {renderBudgetRows('sortie')}

              <tr className="bg-white">
                <td colSpan={totalCols} className="py-2"></td>
              </tr>
              
              <tr className="bg-gray-300 border-t-2 border-gray-400">
                <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 font-bold text-gray-900 bg-gray-300 sticky left-0 z-10">RÉSULTAT NET MENSUEL</td>
                <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                {months.flatMap((_, monthIndex) => {
                  const revenueTotals = calculateGeneralTotals(groupedData.entree || [], monthIndex, 'entree');
                  const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], monthIndex, 'sortie');
                  const netBudget = revenueTotals.budget - expenseTotals.budget;
                  const netActual = revenueTotals.actual - expenseTotals.actual;
                  return [
                    <td key={monthIndex} className="px-2 py-2">
                      {numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-bold">
                        {visibleColumns.budget && <div className="flex-1 text-center text-gray-900">{formatCurrency(netBudget, settings)}</div>}
                        {visibleColumns.actual && <button onClick={() => netActual !== 0 && handleActualClick({ type: 'net', monthIndex, year: displayYear })} disabled={netActual === 0} className="flex-1 text-center text-gray-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60">{formatCurrency(netActual, settings)}</button>}
                        {visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(netActual - netBudget, true)}`}>{formatCurrency(netActual - netBudget, settings)}</div>}
                      </div>}
                    </td>,
                    <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                  ];
                })}
              </tr>
              <tr className="bg-white">
                <td colSpan={totalCols} className="py-1"></td>
              </tr>
              <tr className="bg-gray-300 border-b-2 border-gray-400">
                <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 font-bold text-gray-900 bg-gray-300 sticky left-0 z-10">RÉSULTAT NET CUMULÉ</td>
                <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                {months.flatMap((_, monthIndex) => {
                  const cumulativeResult = calculateCumulativeResult(monthIndex);
                  return [
                    <td key={monthIndex} className="px-2 py-2">
                      {numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-bold">
                        {visibleColumns.budget && <div className="flex-1 text-center text-gray-900">{formatCurrency(cumulativeResult.budget, settings)}</div>}
                        {visibleColumns.actual && <div className="flex-1 text-center text-gray-900">{formatCurrency(cumulativeResult.actual, settings)}</div>}
                        {visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(cumulativeResult.ecart, true)}`}>{formatCurrency(cumulativeResult.ecart, settings)}</div>}
                      </div>}
                    </td>,
                    <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                  ];
                })}
              </tr>
              <tr className="bg-white">
                <td colSpan={totalCols} className="py-1"></td>
              </tr>
              <tr className="bg-green-200 font-bold text-green-900">
                <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 bg-green-200 sticky left-0 z-10">Position Finale Disponible</td>
                <td className="bg-white"></td>
                {months.flatMap((_, monthIndex) => (
                    <React.Fragment key={monthIndex}>
                        <td className="px-2 py-2 text-center" colSpan={1}>{formatCurrency(monthlyPositions[monthIndex].final, settings)}</td>
                        <td className="bg-white"></td>
                    </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <TransactionDetailDrawer isOpen={drawerData.isOpen} onClose={handleCloseDrawer} transactions={drawerData.transactions} title={drawerData.title} />
    </div>
  );
};

export default BudgetTracker;
