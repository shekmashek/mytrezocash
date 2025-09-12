import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit, Eye, Search, Gem, Info, Table, LogIn, Flag, ChevronDown, User, Folder, TrendingUp, TrendingDown, Target, AreaChart, Layers } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import CashflowDetailDrawer from './CashflowDetailDrawer';
import ResizableTh from './ResizableTh';
import { getEntryAmountForMonth } from '../utils/budgetCalculations';
import { formatCurrency } from '../utils/formatting';
import { useBudget } from '../context/BudgetContext';
import AnnualGoalsTracker from './AnnualGoalsTracker';
import { generateScenarioActuals } from '../utils/scenarioCalculations';
const getStartOfWeek = (date) => { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setHours(0, 0, 0, 0); return new Date(d.setDate(diff)); };

const BudgetTracker = ({ activeProject, budgetEntries, actualTransactions }) => {
  const { state, dispatch } = useBudget();
  const { projects, categories, settings, displayYear, userCashAccounts, scenarios, allEntries, allActuals, scenarioEntries, activeProjectId } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    budget: true,
    actual: true,
    ecart: true,
    netResultRow: false,
    cumulativeNetResultRow: false,
  });
  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
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
  
  const handleNewEntry = (type) => {
    if (!isConsolidated) {
      dispatch({ type: 'OPEN_BUDGET_MODAL', payload: { type } });
    }
  };

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
  
  const handleEditActual = (entryId, monthIndex, year) => {
    const actual = actualTransactions.find(t => 
      t.budgetId === entryId && 
      new Date(t.date).getFullYear() === year && 
      new Date(t.date).getMonth() === monthIndex
    );

    if (actual) {
      dispatch({ type: 'OPEN_ACTUAL_EDITOR_DRAWER', payload: actual.id });
    } else {
      console.warn("No corresponding actual found for this budget cell. This may happen if the budget entry was just created. Try refreshing.");
    }
  };

  const getActualAmountForEntry = (entryId, monthIndex, year) => {
    const entry = budgetEntries.find(e => e.id === entryId);
    if (!entry) return 0;
    const relevantActual = actualTransactions.find(t => t.budgetId === entryId && new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === monthIndex);
    if (!relevantActual) return 0;
    return (relevantActual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
  };
  
  const hasOffBudgetRevenues = () => budgetEntries.some(e => e.isOffBudget && e.type === 'revenu');
  const hasOffBudgetExpenses = () => budgetEntries.some(e => e.isOffBudget && e.type === 'depense');
  
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
  
  const handleGeneralActualClick = (context) => {
    const { monthIndex, year } = context;
    let payments = [];
    let title = '';
    if (context.mainCategory) {
        payments = getPaymentsForMainCategoryAndMonth(context.mainCategory, monthIndex, year);
        title = `Détails pour ${context.mainCategory.name}`;
    } else if (context.category === 'Sorties Hors Budget' || context.category === 'Entrées Hors Budget') {
        payments = getPaymentsForCategoryAndMonth(context.category, monthIndex, year);
        title = `Détails pour ${context.category}`;
    } else if (context.type) {
      if (context.type === 'entree') {
        payments = categories.revenue.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetRevenues()) payments.push(...getPaymentsForCategoryAndMonth('Entrées Hors Budget', monthIndex, year));
        title = 'Détails des Entrées';
      } else if (context.type === 'sortie') {
        payments = categories.expense.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetExpenses()) payments.push(...getPaymentsForCategoryAndMonth('Sorties Hors Budget', monthIndex, year));
        title = 'Détails des Sorties';
      } else if (context.type === 'net') {
        const revenuePayments = categories.revenue.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetRevenues()) revenuePayments.push(...getPaymentsForCategoryAndMonth('Entrées Hors Budget', monthIndex, year));
        let expensePayments = categories.expense.flatMap(mc => getPaymentsForMainCategoryAndMonth(mc, monthIndex, year));
        if (hasOffBudgetExpenses()) expensePayments.push(...getPaymentsForCategoryAndMonth('Sorties Hors Budget', monthIndex, year));
        payments = [...revenuePayments, ...expensePayments];
        title = 'Détails des Transactions';
      }
    }
    if (payments.length > 0) {
      // This is a temporary solution to show details. The new drawer is for single entries.
      alert(`Total de ${payments.length} paiements pour ${title} - ${months[monthIndex]} ${year}. Montant total: ${formatCurrency(payments.reduce((s,p)=>s+p.paidAmount,0), settings)}`);
    }
  };

  const groupedData = useMemo(() => {
    const groupEntries = (entries, categoryList) => {
        if (!categoryList) return [];
        return categoryList
            .map(mainCat => {
                if (!mainCat.subCategories) return null;
                const entriesForMainCat = entries.filter(entry =>
                    mainCat.subCategories.some(sc => sc.name === entry.category)
                );
                return entriesForMainCat.length > 0 ? { ...mainCat, entries: entriesForMainCat } : null;
            })
            .filter(Boolean);
    };

    const revenues = filteredBudgetEntries.filter(e => !e.isOffBudget && e.type === 'revenu');
    const expenses = filteredBudgetEntries.filter(e => !e.isOffBudget && e.type === 'depense');

    return {
        entree: groupEntries(revenues, categories.revenue),
        sortie: groupEntries(expenses, categories.expense),
    };
  }, [filteredBudgetEntries, categories]);
  
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
    if (type === 'entree' && hasOffBudgetRevenues()) {
        const offBudgetTotals = calculateOffBudgetTotalsForMonth('revenu', monthIndex);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    } else if (type === 'sortie' && hasOffBudgetExpenses()) {
        const offBudgetTotals = calculateOffBudgetTotalsForMonth('depense', monthIndex);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    }
    return totals;
  };
  const monthlyPositions = useMemo(() => {
    const yearStart = new Date(displayYear, 0, 1);
    const initialBalanceSum = userCashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.initialBalance) || 0), 0);
    const netFlowBeforeYear = actualTransactions
      .flatMap(actual => actual.payments || [])
      .filter(p => new Date(p.paymentDate) < yearStart)
      .reduce((sum, p) => {
        const actual = actualTransactions.find(a => (a.payments || []).some(payment => payment.id === p.id));
        return actual.type === 'receivable' ? sum + p.paidAmount : sum - p.paidAmount;
      }, 0);
    const totalBalanceAtYearStart = initialBalanceSum + netFlowBeforeYear;
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
  const numVisibleCols = Object.values(visibleColumns).filter(v => typeof v === 'boolean' && v && !v.toString().includes('Row')).length;
  const monthColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
  const separatorWidth = 4;
  const fixedColsWidth = columnWidths.category + columnWidths.supplier + (isConsolidated ? columnWidths.project : 0) + columnWidths.description;
  const totalTableWidth = fixedColsWidth + separatorWidth + (months.length * (monthColumnWidth + separatorWidth));
  const supplierColLeft = columnWidths.category;
  const projectColLeft = supplierColLeft + columnWidths.supplier;
  const descriptionColLeft = isConsolidated ? projectColLeft + columnWidths.project : supplierColLeft + columnWidths.supplier;
  const totalCols = (isConsolidated ? 4 : 3) + 1 + (months.length * 2);

  // --- Start of logic moved from CashflowView.jsx ---
  const [timeUnit, setTimeUnit] = useState('week');
  const [horizonLength, setHorizonLength] = useState(6);
  const [cashflowDrawerData, setCashflowDrawerData] = useState({ isOpen: false, transactions: [], title: '', timeUnit: 'week' });
  const [selectedScenarios, setSelectedScenarios] = useState({});
  const projectScenarios = useMemo(() => {
    if (isConsolidated) return [];
    return scenarios.filter(s => s.projectId === activeProjectId);
  }, [scenarios, activeProjectId, isConsolidated]);
  useEffect(() => {
    const initialSelection = {};
    projectScenarios.forEach(s => { initialSelection[s.id] = true; });
    setSelectedScenarios(initialSelection);
  }, [projectScenarios]);
  const handleScenarioSelectionChange = (scenarioId) => {
    setSelectedScenarios(prev => ({ ...prev, [scenarioId]: !prev[scenarioId] }));
  };
  const baseActuals = useMemo(() => {
    return actualTransactions;
  }, [actualTransactions]);
  const calculateCashflowData = (actualsForCalc) => {
    const today = new Date();
    const periods = [];
    let chartStartDate;
    let initialDate;
    const pastPeriods = 2;
    switch (timeUnit) {
        case 'day': initialDate = new Date(today); chartStartDate = new Date(initialDate); chartStartDate.setDate(chartStartDate.getDate() - pastPeriods * 1); break;
        case 'week': initialDate = getStartOfWeek(today); chartStartDate = new Date(initialDate); chartStartDate.setDate(chartStartDate.getDate() - pastPeriods * 7); break;
        case 'month': initialDate = new Date(today.getFullYear(), today.getMonth(), 1); chartStartDate = new Date(initialDate); chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods); break;
        case 'bimonthly': const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2; initialDate = new Date(today.getFullYear(), bimonthStartMonth, 1); chartStartDate = new Date(initialDate); chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods * 2); break;
        case 'quarterly': const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3; initialDate = new Date(today.getFullYear(), quarterStartMonth, 1); chartStartDate = new Date(initialDate); chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods * 3); break;
        case 'semiannually': const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6; initialDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1); chartStartDate = new Date(initialDate); chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods * 6); break;
        case 'annually': initialDate = new Date(today.getFullYear(), 0, 1); chartStartDate = new Date(initialDate); chartStartDate.setFullYear(chartStartDate.getFullYear() - pastPeriods); break;
        default: initialDate = getStartOfWeek(today); chartStartDate = new Date(initialDate); chartStartDate.setDate(chartStartDate.getDate() - pastPeriods * 7);
    }
    for (let i = -pastPeriods; i < horizonLength - pastPeriods; i++) {
        const periodStart = new Date(initialDate);
        switch (timeUnit) {
            case 'day': periodStart.setDate(periodStart.getDate() + i); break;
            case 'week': periodStart.setDate(periodStart.getDate() + i * 7); break;
            case 'month': periodStart.setMonth(periodStart.getMonth() + i); break;
            case 'bimonthly': periodStart.setMonth(periodStart.getMonth() + i * 2); break;
            case 'quarterly': periodStart.setMonth(periodStart.getMonth() + i * 3); break;
            case 'semiannually': periodStart.setMonth(periodStart.getMonth() + i * 6); break;
            case 'annually': periodStart.setFullYear(periodStart.getFullYear() + i); break;
        }
        periods.push(periodStart);
    }
    const initialBalancesSum = userCashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.initialBalance) || 0), 0);
    const pastPayments = Object.values(allActuals).flat().flatMap(actual => actual.payments || []).filter(p => new Date(p.paymentDate) < chartStartDate);
    const netFlowOfPastPayments = pastPayments.reduce((sum, p) => {
      const actual = Object.values(allActuals).flat().find(a => (a.payments || []).some(payment => payment.id === p.id));
      if (!actual) return sum;
      return actual.type === 'receivable' ? sum + p.paidAmount : sum - p.paidAmount;
    }, 0);
    const calculatedStartingBalance = initialBalancesSum + netFlowOfPastPayments;

    const periodFlows = periods.map(periodStart => {
      const periodEnd = new Date(periodStart);
      switch (timeUnit) {
          case 'day': periodEnd.setDate(periodEnd.getDate() + 1); break;
          case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
          case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
          case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
          case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
          case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
          case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
      }
      const inflows = { realized: 0, planned: 0 };
      const outflows = { realized: 0, planned: 0 };
      actualsForCalc.forEach(actual => {
        const dueDate = new Date(actual.date);
        if (dueDate >= periodStart && dueDate < periodEnd) {
          if (actual.type === 'receivable') inflows.planned += actual.amount;
          else if (actual.type === 'payable') outflows.planned += actual.amount;
        }
        (actual.payments || []).forEach(payment => {
          const paymentDate = new Date(payment.paymentDate);
          if (paymentDate >= periodStart && paymentDate < periodEnd) {
            if (actual.type === 'receivable') inflows.realized += payment.paidAmount;
            else if (actual.type === 'payable') outflows.realized += payment.paidAmount;
          }
        });
      });
      return {
        period: periodStart,
        plannedInflow: inflows.planned,
        actualInflow: inflows.realized,
        remainingInflow: Math.max(0, inflows.planned - inflows.realized),
        plannedOutflow: outflows.planned,
        actualOutflow: outflows.realized,
        remainingOutflow: Math.max(0, outflows.planned - outflows.realized),
      };
    });

    let currentBalance = calculatedStartingBalance;
    const balanceData = [];
    const todayForBalance = new Date();
    todayForBalance.setHours(0,0,0,0);

    for (const flow of periodFlows) {
      let netFlow;
      if (flow.period < todayForBalance) {
        netFlow = flow.actualInflow - flow.actualOutflow;
      } else {
        netFlow = flow.plannedInflow - flow.plannedOutflow;
      }
      currentBalance += netFlow;
      balanceData.push(currentBalance.toFixed(2));
    }
    
    const labels = periods.map(p => {
        const year = p.toLocaleDateString('fr-FR', { year: '2-digit' });
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        switch (timeUnit) {
            case 'day': return p.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            case 'week': return `Sem. du ${p.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
            case 'month': return p.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            case 'bimonthly': const startMonthB = months[p.getMonth()]; const endMonthB = months[(p.getMonth() + 1) % 12]; return `Bim. ${startMonthB}-${endMonthB} '${year}`;
            case 'quarterly': const quarter = Math.floor(p.getMonth() / 3) + 1; return `T${quarter} '${year}`;
            case 'semiannually': const semester = Math.floor(p.getMonth() / 6) + 1; return `S${semester} '${year}`;
            case 'annually': return p.getFullYear();
            default: return '';
        }
    });
    return {
      labels,
      periods,
      actualInflows: periodFlows.map(f => f.actualInflow.toFixed(2)),
      remainingInflows: periodFlows.map(f => f.remainingInflow.toFixed(2)),
      actualOutflows: periodFlows.map(f => f.actualOutflow.toFixed(2)),
      remainingOutflows: periodFlows.map(f => f.remainingOutflow.toFixed(2)),
      balance: balanceData,
      startingBalance: calculatedStartingBalance,
    };
  };
  const cashflowData = useMemo(() => {
    const baseFlow = calculateCashflowData(baseActuals);
    const visibleScenariosOnChart = projectScenarios.filter(s => selectedScenarios[s.id]);
    const currentProjectEntries = allEntries[activeProjectId] || [];
    const scenarioFlows = visibleScenariosOnChart.map(scenario => {
      const scenarioDeltas = scenarioEntries[scenario.id] || [];
      const scenarioActuals = generateScenarioActuals(currentProjectEntries, baseActuals, scenarioDeltas, activeProjectId, userCashAccounts);
      const flow = calculateCashflowData(scenarioActuals);
      return { id: scenario.id, name: scenario.name, balance: flow.balance };
    });
    return { base: baseFlow, scenarios: scenarioFlows };
  }, [baseActuals, projectScenarios, selectedScenarios, scenarioEntries, activeProjectId, allEntries, horizonLength, timeUnit, userCashAccounts]);
  
  const handleCashflowChartClick = (params) => {
    const { seriesName, dataIndex, axisValue } = params;
    
    const isIncome = seriesName.includes('Entrées') || seriesName.includes('recevoir');
    const isExpense = seriesName.includes('Sorties') || seriesName.includes('payer');
    
    if (!isIncome && !isExpense) return;

    const periodStart = cashflowData.base.periods[dataIndex];
    const periodEnd = new Date(periodStart);
    switch (timeUnit) {
        case 'day': periodEnd.setDate(periodEnd.getDate() + 1); break;
        case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
        case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
        case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
        case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
        case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
        case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
    }

    let transactionsForDrawer = [];
    const title = `Détails pour ${seriesName} - ${axisValue}`;

    const isActual = seriesName.includes('Réalisé');
    const isPlanned = seriesName.includes('Reste à');
    const actualType = isIncome ? 'receivable' : 'payable';
    
    if (isActual) {
        baseActuals.forEach(actual => {
            if (actual.type !== actualType) return;
            (actual.payments || []).forEach(payment => {
                const paymentDate = new Date(payment.paymentDate);
                if (paymentDate >= periodStart && paymentDate < periodEnd) {
                    transactionsForDrawer.push({
                        id: payment.id,
                        type: actual.type,
                        thirdParty: actual.thirdParty,
                        category: actual.category,
                        amount: payment.paidAmount,
                        date: payment.paymentDate,
                        status: 'realized',
                        cashAccount: payment.cashAccount
                    });
                }
            });
        });
    } else if (isPlanned) {
        baseActuals.forEach(actual => {
            if (actual.type !== actualType) return;
            const dueDate = new Date(actual.date);
            if (dueDate >= periodStart && dueDate < periodEnd) {
                const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
                const remainingAmount = actual.amount - totalPaid;
                if (remainingAmount > 0) {
                    transactionsForDrawer.push({
                        id: actual.id + '-planned',
                        type: actual.type,
                        thirdParty: actual.thirdParty,
                        category: actual.category,
                        amount: remainingAmount,
                        date: actual.date,
                        status: 'planned'
                    });
                }
            }
        });
    }

    setCashflowDrawerData({
        isOpen: true,
        transactions: transactionsForDrawer,
        title: title,
        timeUnit: timeUnit
    });
  };

  const onCashflowEvents = { 'click': handleCashflowChartClick };
  const getCashflowChartOptions = () => {
    const BASE_BALANCE_COLOR = '#3b82f6';
    const SCENARIO_COLORS = ['#14b8a6', '#f97316', '#a855f7'];
    
    const series = [
      { name: 'Réalisé (Entrées)', type: 'bar', stack: 'Entrées', emphasis: { focus: 'series' }, itemStyle: { color: '#22c55e' }, data: cashflowData.base.actualInflows },
      { name: 'Reste à recevoir', type: 'bar', stack: 'Entrées', emphasis: { focus: 'series' }, itemStyle: { color: '#a7f3d0', decal: { symbol: 'rect', symbolSize: 1, color: 'rgba(0, 0, 0, 0.15)', dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: Math.PI / 4 } }, data: cashflowData.base.remainingInflows },
      { name: 'Réalisé (Sorties)', type: 'bar', stack: 'Sorties', emphasis: { focus: 'series' }, itemStyle: { color: '#ef4444' }, data: cashflowData.base.actualOutflows },
      { name: 'Reste à payer', type: 'bar', stack: 'Sorties', emphasis: { focus: 'series' }, itemStyle: { color: '#fecaca', decal: { symbol: 'rect', symbolSize: 1, color: 'rgba(0, 0, 0, 0.15)', dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: Math.PI / 4 } }, data: cashflowData.base.remainingOutflows },
      { name: 'Solde de trésorerie', type: 'line', yAxisIndex: 1, smooth: true, data: cashflowData.base.balance, symbolSize: 8, color: BASE_BALANCE_COLOR, lineStyle: { width: 3, shadowColor: 'rgba(0, 0, 0, 0.2)', shadowBlur: 10, shadowOffsetY: 5 }, emphasis: { focus: 'series', scale: 1.2 } },
      ...cashflowData.scenarios.map((scenario, index) => ({ name: scenario.name, type: 'line', yAxisIndex: 1, smooth: true, data: scenario.balance, symbolSize: 8, color: SCENARIO_COLORS[index % SCENARIO_COLORS.length], lineStyle: { width: 3, type: 'dashed', shadowColor: 'rgba(0, 0, 0, 0.1)', shadowBlur: 8, shadowOffsetY: 3 }, emphasis: { focus: 'series', scale: 1.2 } }))
    ];
    const markLineData = timeUnit === 'day' ? [{ xAxis: 2, label: { show: true, formatter: 'Aujourd\'hui', position: 'insideStartTop', color: '#4a5568' } }] : [{ xAxis: 2, label: { show: true, formatter: 'Aujourd\'hui', position: 'insideStartTop', color: '#4a5568' } }];
    return {
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' }, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderColor: '#e2e8f0', 
        borderWidth: 1, 
        borderRadius: 8, 
        textStyle: { color: '#1a202c' }, 
        padding: [10, 15], 
        extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); backdrop-filter: blur(4px);', 
        formatter: (params) => {
          const data = {};
          params.forEach(p => {
              data[p.seriesName] = parseFloat(p.value || 0);
          });
      
          const entreeReel = data['Réalisé (Entrées)'] || 0;
          const entreeReste = data['Reste à recevoir'] || 0;
          const entreePrev = entreeReel + entreeReste;
      
          const sortieReel = data['Réalisé (Sorties)'] || 0;
          const sortieReste = data['Reste à payer'] || 0;
          const sortiePrev = sortieReel + sortieReste;
      
          const tresorerieFin = data['Solde de trésorerie'] || 0;
          
          const periodIndex = params[0].dataIndex;
          const tresorerieDebut = periodIndex > 0 
            ? parseFloat(cashflowData.base.balance[periodIndex - 1] || 0)
            : cashflowData.base.startingBalance;
      
          const renderRow = (label, value) => {
              return `<div style="display: flex; justify-content: space-between; clear: both;"><span>${label}</span><strong style="margin-left: 16px;">${formatCurrency(value, settings)}</strong></div>`;
          };
          
          let tooltip = `<div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`;
          
          tooltip += `<div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">`;
          tooltip += renderRow('Trésorerie Début', tresorerieDebut);
          tooltip += `</div>`;

          tooltip += `<div style="margin-bottom: 10px;">`;
          tooltip += `<div style="font-weight: bold; color: #16a34a; margin-bottom: 4px;">ENTRÉES</div>`;
          tooltip += renderRow('Entrée prév.', entreePrev);
          tooltip += renderRow('Entrée Réel', entreeReel);
          tooltip += renderRow('Reste à recevoir', entreeReste);
          tooltip += `</div>`;
      
          tooltip += `<div style="margin-bottom: 10px;">`;
          tooltip += `<div style="font-weight: bold; color: #dc2626; margin-bottom: 4px;">SORTIES</div>`;
          tooltip += renderRow('Sorties prév.', sortiePrev);
          tooltip += renderRow('Sortie Réel', sortieReel);
          tooltip += renderRow('Sorties à faire', sortieReste);
          tooltip += `</div>`;
          
          tooltip += `<div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">`;
          tooltip += `<div style="display: flex; justify-content: space-between; font-weight: bold; color: #2563eb;"><span>TRÉSORERIE FIN</span><strong>${formatCurrency(tresorerieFin, settings)}</strong></div>`;
          tooltip += `</div>`;
      
          const scenarioParams = params.filter(p => p.seriesName !== 'Réalisé (Entrées)' && p.seriesName !== 'Reste à recevoir' && p.seriesName !== 'Réalisé (Sorties)' && p.seriesName !== 'Reste à payer' && p.seriesName !== 'Solde de trésorerie');
          if(scenarioParams.length > 0) {
              tooltip += `<div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">`;
              scenarioParams.forEach(p => {
                  tooltip += `<div style="display: flex; justify-content: space-between; color: ${p.color};"><span>${p.seriesName}</span><strong>${formatCurrency(p.value, settings)}</strong></div>`;
              });
              tooltip += `</div>`;
          }
      
          return tooltip;
        } 
      },
      legend: { data: series.map(s => s.name), bottom: 10, type: 'scroll', icon: 'circle' },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: [{ type: 'category', data: cashflowData.base.labels, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: '#4a5568' }, markLine: { symbol: 'none', silent: true, lineStyle: { type: 'dashed', color: '#9ca3af' }, data: markLineData } }],
      yAxis: [
        { type: 'value', name: 'Flux (Entrées/Sorties)', axisLabel: { formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' }), color: '#4a5568' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, axisLine: { show: false } },
        { type: 'value', name: 'Solde', axisLabel: { formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' }), color: '#4a5568' }, splitLine: { show: false }, axisLine: { show: false } }
      ],
      series,
      animationDurationUpdate: 700,
      animationEasingUpdate: 'cubicInOut',
    };
  };
  const timeUnitOptions = { day: 'jours', week: 'semaines', month: 'mois', bimonthly: 'bimestres', quarterly: 'trimestres', semiannually: 'semestres', annually: 'années' };
  // --- End of logic moved from CashflowView.jsx ---

  const renderBudgetRows = (type) => {
    const mainCategories = groupedData[type];
    if (!mainCategories) return null;
    const offBudgetVisible = type === 'entree' ? hasOffBudgetRevenues() : hasOffBudgetExpenses();
    
    return (
      <>
        <tr className="sticky top-[57px] z-20 bg-gray-200 border-y-2 border-gray-300">
          <th colSpan={isConsolidated ? 4 : 3} scope="colgroup" className="px-4 py-2 font-bold text-left text-gray-900 bg-transparent sticky left-0 z-10">
            <div className="flex items-center gap-2">{type === 'entree' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}{type === 'entree' ? 'ENTRÉES' : 'SORTIES'}</div>
          </th>
          <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
          {months.flatMap((_, monthIndex) => {
            const totals = calculateGeneralTotals(mainCategories, monthIndex, type);
            return [<td key={monthIndex} className="px-2 py-2">{numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-bold">{visibleColumns.budget && <div className="flex-1 text-center text-gray-900">{formatCurrency(totals.budget, settings)}</div>}{visibleColumns.actual && <button onClick={(e) => { e.stopPropagation(); if (totals.actual > 0) handleGeneralActualClick({ type: type, monthIndex, year: displayYear }); }} disabled={totals.actual === 0} className="flex-1 text-center text-gray-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60">{formatCurrency(totals.actual, settings)}</button>}{visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(totals.actual - totals.budget, type === 'entree')}`}>{formatCurrency(totals.actual - totals.budget, settings)}</div>}</div>}</td>, <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>];
          })}
        </tr>
        {mainCategories.map(mainCategory => {
          return (
            <React.Fragment key={mainCategory.id}>
              <tr className="bg-gray-100 font-semibold text-gray-700">
                <td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 bg-gray-100 sticky left-0 z-10"><div className="flex items-center gap-2">{mainCategory.name}</div></td>
                <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                {months.flatMap((_, monthIndex) => {
                  const totals = calculateMainCategoryTotals(mainCategory.entries, monthIndex);
                  return [<td key={monthIndex} className="px-2 py-2">{numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-semibold">{visibleColumns.budget && <div className="flex-1 text-center">{formatCurrency(totals.budget, settings)}</div>}{visibleColumns.actual && <div className="flex-1 text-center">{formatCurrency(totals.actual, settings)}</div>}{visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(totals.ecart, type === 'entree')}`}>{formatCurrency(totals.ecart, settings)}</div>}</div>}</td>, <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>];
                })}
              </tr>
              {mainCategory.entries.map((entry) => {
                const isProvisionEntry = entry.frequency === 'provision';
                return (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="pl-12 pr-4 py-1 font-normal text-gray-800 bg-white hover:bg-gray-50 sticky left-0 z-10" style={{ width: `${columnWidths.category}px` }}>{entry.category}</td>
                  <td className="px-4 py-1 text-gray-700 bg-white hover:bg-gray-50 sticky z-10" style={{ width: `${columnWidths.supplier}px`, left: `${supplierColLeft}px` }}><div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" />{entry.supplier}</div></td>
                  {isConsolidated && (<td className="px-4 py-1 text-gray-700 bg-white hover:bg-gray-50 sticky z-10" style={{ width: `${columnWidths.project}px`, left: `${projectColLeft}px` }}><div className="flex items-center gap-2"><Folder className="w-4 h-4 text-gray-500" />{projects.find(p => p.id === entry.projectId)?.name || 'N/A'}</div></td>)}
                  <td className="px-4 py-1 text-gray-600 bg-white hover:bg-gray-50 sticky z-10" style={{ width: `${columnWidths.description}px`, left: `${descriptionColLeft}px` }}><div className="flex items-center justify-between"><span className="text-sm truncate" title={getFrequencyTitle(entry)}>{entry.description || '-'}</span><button onClick={() => handleEditEntry(entry)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed" disabled={isConsolidated || isProvisionEntry}><Edit className="w-4 h-4" /></button></div></td>
                  <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
                  {months.flatMap((_, monthIndex) => {
                    const budget = getEntryAmountForMonth(entry, monthIndex, displayYear);
                    const actualAmount = getActualAmountForEntry(entry.id, monthIndex, displayYear);
                    const canClick = budget > 0;
                    return [<td key={monthIndex} className="px-2 py-1">{numVisibleCols > 0 && <div className="flex gap-2 justify-around items-center">{visibleColumns.budget && (<div className="flex-1 text-center text-xs">{isProvisionEntry && budget > 0 ? (<span className="flex items-center justify-center gap-1 text-indigo-600 font-semibold" title="Montant provisionné"><Gem className="w-3 h-3" />{formatCurrency(budget, settings)}</span>) : (<span className="text-gray-600">{budget > 0 ? formatCurrency(budget, settings) : '-'}</span>)}</div>)}{visibleColumns.actual && <button onClick={() => handleEditActual(entry.id, monthIndex, displayYear)} disabled={!canClick || isProvisionEntry} className="flex-1 text-center text-xs font-semibold text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:underline">{actualAmount > 0 ? formatCurrency(actualAmount, settings) : '-'}</button>}{visibleColumns.ecart && <div className={`flex-1 text-center text-xs font-semibold ${getEcartColor(actualAmount - budget, type === 'entree')}`}>{budget > 0 || actualAmount > 0 ? formatCurrency(actualAmount - budget, settings) : '-'}</div>}</div>}</td>, <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>];
                  })}
                </tr>
              )})}
            </React.Fragment>
          );
        })}
        {offBudgetVisible && (
          <tr className={`bg-${type === 'entree' ? 'green' : 'orange'}-50 border-t border-b border-${type === 'entree' ? 'green' : 'orange'}-200`}>
            <td colSpan={isConsolidated ? 4 : 3} className={`px-4 py-2 font-semibold text-${type === 'entree' ? 'green' : 'orange'}-700 bg-${type === 'entree' ? 'green' : 'orange'}-50 sticky left-0 z-10`}>{type === 'entree' ? 'Entrées' : 'Sorties'} Hors Budget</td>
            <td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>
            {months.flatMap((_, monthIndex) => {
              const totals = calculateOffBudgetTotalsForMonth(type === 'entree' ? 'revenu' : 'depense', monthIndex);
              return [<td key={monthIndex} className="px-2 py-2">{numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-semibold">{visibleColumns.budget && <div className={`flex-1 text-center text-${type === 'entree' ? 'green' : 'orange'}-700`}>{formatCurrency(totals.budget, settings)}</div>}{visibleColumns.actual && <button onClick={() => totals.actual > 0 && handleGeneralActualClick({ category: `${type === 'entree' ? 'Entrées' : 'Sorties'} Hors Budget`, monthIndex, year: displayYear })} disabled={totals.actual === 0} className={`flex-1 text-center text-${type === 'entree' ? 'green' : 'orange'}-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60`}>{formatCurrency(totals.actual, settings)}</button>}{visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(totals.ecart, type === 'entree')}`}>{formatCurrency(totals.ecart, settings)}</div>}</div>}</td>, <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>];
            })}
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-full">
      <AnnualGoalsTracker activeProject={activeProject} budgetEntries={budgetEntries} displayYear={displayYear} />
      
      <div className="bg-gray-100 p-3 rounded-lg mb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Unité:</label>
              <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="px-2 py-1 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="bimonthly">Bimestre</option>
                <option value="quarterly">Trimestre</option>
                <option value="semiannually">Semestre</option>
                <option value="annually">Année</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Horizon:</label>
              <select value={horizonLength} onChange={(e) => setHorizonLength(Number(e.target.value))} className="px-2 py-1 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm">
                <option value={6}>6 {timeUnitOptions[timeUnit]}</option>
                <option value={8}>8 {timeUnitOptions[timeUnit]}</option>
                <option value={10}>10 {timeUnitOptions[timeUnit]}</option>
                <option value={12}>12 {timeUnitOptions[timeUnit]}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <span className="font-medium text-gray-600">Solde de départ calculé:</span>
            <span className="font-bold text-lg text-blue-700">
              {formatCurrency(cashflowData.base.startingBalance, settings)}
            </span>
          </div>
        </div>
        {!isConsolidated && projectScenarios.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Layers className="w-4 h-4" /> Afficher les Scénarios</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {projectScenarios.map(scenario => (
                <label key={scenario.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!selectedScenarios[scenario.id]} onChange={() => handleScenarioSelectionChange(scenario.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm font-medium text-gray-800">{scenario.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-8"><ReactECharts option={getCashflowChartOptions()} style={{ height: '500px', width: '100%' }} onEvents={onCashflowEvents} /></div>

      <div className="mt-8 mb-4 p-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm flex items-start gap-3">
        <Table className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-500" /><p>Comparez votre budget au réel, analysez les écarts, et cliquez sur les montants "Réel" pour voir le détail.</p>
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4"/>Colonnes:</span><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.budget} onChange={() => setVisibleColumns(prev => ({ ...prev, budget: !prev.budget }))} /> Prévisionnel</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.actual} onChange={() => setVisibleColumns(prev => ({ ...prev, actual: !prev.actual }))} /> Réel</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.ecart} onChange={() => setVisibleColumns(prev => ({ ...prev, ecart: !prev.ecart }))} /> Reste à payer</label></div>
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Eye className="w-4 h-4"/>Lignes:</span><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.netResultRow} onChange={() => setVisibleColumns(prev => ({ ...prev, netResultRow: !prev.netResultRow }))} /> Variation de trésorerie</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={visibleColumns.cumulativeNetResultRow} onChange={() => setVisibleColumns(prev => ({ ...prev, cumulativeNetResultRow: !prev.cumulativeNetResultRow }))} /> Résultat Cumulé</label></div>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="search-supplier" className="relative text-gray-400 focus-within:text-gray-600 block">
              <Search className="pointer-events-none w-5 h-5 absolute top-1/2 transform -translate-y-1/2 left-3" />
              <input type="text" id="search-supplier" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par Tiers..." className="form-input block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm" />
          </label>
          <div className="flex items-center gap-2">
              <button onClick={() => handleNewEntry('depense')} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed" disabled={isConsolidated}>
                  <TrendingDown className="w-5 h-5" /> Nouvelle Sortie
              </button>
              <button onClick={() => handleNewEntry('revenu')} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed" disabled={isConsolidated}>
                  <TrendingUp className="w-5 h-5" /> Nouvelle Entrée
              </button>
          </div>
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
                {months.flatMap(month => [<th key={month} className="px-2 py-2 text-center font-semibold text-gray-900 border-b-2" style={{ minWidth: `${monthColumnWidth}px` }}><div className="text-base mb-1">{`${month} '${String(displayYear).slice(-2)}`}</div>{numVisibleCols > 0 && <div className="flex gap-2 justify-around text-xs font-medium text-gray-600">{visibleColumns.budget && <div className="flex-1">Prév.</div>}{visibleColumns.actual && <div className="flex-1">Réel</div>}{visibleColumns.ecart && <div className="flex-1">Reste</div>}</div>}</th>, <th key={`${month}-sep`} className="bg-white border-b-2" style={{ width: `${separatorWidth}px` }}></th>])}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-100 font-bold text-blue-800"><td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 bg-blue-100 sticky left-0 z-10"><div className="flex items-center gap-2"><LogIn className="w-4 h-4" />Trésorerie au début du mois</div></td><td className="bg-white"></td>{months.flatMap((_, monthIndex) => (<React.Fragment key={monthIndex}><td className="px-2 py-2 text-center" colSpan={1}>{formatCurrency(monthlyPositions[monthIndex].initial, settings)}</td><td className="bg-white"></td></React.Fragment>))}</tr>
              <tr className="bg-white"><td colSpan={totalCols} className="py-2"></td></tr>
              {renderBudgetRows('entree')}
              <tr className="bg-white"><td colSpan={totalCols} className="py-2"></td></tr>
              {renderBudgetRows('sortie')}
              <tr className="bg-white"><td colSpan={totalCols} className="py-2"></td></tr>
              {visibleColumns.netResultRow && (<tr className="bg-gray-300 border-t-2 border-gray-400"><td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 font-bold text-gray-900 bg-gray-300 sticky left-0 z-10">Variation de trésorerie</td><td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>{months.flatMap((_, monthIndex) => { const revenueTotals = calculateGeneralTotals(groupedData.entree || [], monthIndex, 'entree'); const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], monthIndex, 'sortie'); const netBudget = revenueTotals.budget - expenseTotals.budget; const netActual = revenueTotals.actual - expenseTotals.actual; return [<td key={monthIndex} className="px-2 py-2">{numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-bold">{visibleColumns.budget && <div className="flex-1 text-center text-gray-900">{formatCurrency(netBudget, settings)}</div>}{visibleColumns.actual && <button onClick={() => netActual !== 0 && handleGeneralActualClick({ type: 'net', monthIndex, year: displayYear })} disabled={netActual === 0} className="flex-1 text-center text-gray-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60">{formatCurrency(netActual, settings)}</button>}{visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(netActual - netBudget, true)}`}>{formatCurrency(netActual - netBudget, settings)}</div>}</div>}</td>, <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>]; })}</tr>)}
              {visibleColumns.netResultRow && visibleColumns.cumulativeNetResultRow && (<tr className="bg-white"><td colSpan={totalCols} className="py-1"></td></tr>)}
              {visibleColumns.cumulativeNetResultRow && (<tr className={`bg-gray-300 border-b-2 border-gray-400 ${!visibleColumns.netResultRow ? 'border-t-2' : ''}`}><td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 font-bold text-gray-900 bg-gray-300 sticky left-0 z-10">RÉSULTAT NET CUMULÉ</td><td className="bg-white" style={{ width: `${separatorWidth}px` }}></td>{months.flatMap((_, monthIndex) => { const cumulativeResult = calculateCumulativeResult(monthIndex); return [<td key={monthIndex} className="px-2 py-2">{numVisibleCols > 0 && <div className="flex gap-2 justify-around text-sm font-bold">{visibleColumns.budget && <div className="flex-1 text-center text-gray-900">{formatCurrency(cumulativeResult.budget, settings)}</div>}{visibleColumns.actual && <div className="flex-1 text-center text-gray-900">{formatCurrency(cumulativeResult.actual, settings)}</div>}{visibleColumns.ecart && <div className={`flex-1 text-center ${getEcartColor(cumulativeResult.ecart, true)}`}>{formatCurrency(cumulativeResult.ecart, settings)}</div>}</div>}</td>, <td key={`${monthIndex}-sep`} className="bg-white" style={{ width: `${separatorWidth}px` }}></td>]; })}</tr>)}
              <tr className="bg-white"><td colSpan={totalCols} className="py-1"></td></tr>
              <tr className="bg-green-200 font-bold text-green-900"><td colSpan={isConsolidated ? 4 : 3} className="px-4 py-2 bg-green-200 sticky left-0 z-10"><div className="flex items-center gap-2"><Flag className="w-4 h-4" />Trésorerie fin de mois</div></td><td className="bg-white"></td>{months.flatMap((_, monthIndex) => (<React.Fragment key={monthIndex}><td className="px-2 py-2 text-center" colSpan={1}>{formatCurrency(monthlyPositions[monthIndex].final, settings)}</td><td className="bg-white"></td></React.Fragment>))}</tr>
            </tbody>
          </table>
        </div>
      </div>
      <CashflowDetailDrawer 
        isOpen={cashflowDrawerData.isOpen} 
        onClose={() => setCashflowDrawerData({ isOpen: false, transactions: [], title: '', timeUnit: 'week' })} 
        transactions={cashflowDrawerData.transactions} 
        title={cashflowDrawerData.title}
        timeUnit={cashflowDrawerData.timeUnit}
      />
    </div>
  );
};

export default BudgetTracker;
