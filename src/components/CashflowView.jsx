import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Calendar, Layers } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import CashflowDetailDrawer from './CashflowDetailDrawer';
import { formatCurrency } from '../utils/formatting';
import { useBudget } from '../context/BudgetContext';
import { generateScenarioActuals } from '../utils/scenarioCalculations';

const getStartOfWeek = (date) => { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setHours(0, 0, 0, 0); return new Date(d.setDate(diff)); };

const CashflowView = () => {
  const { state } = useBudget();
  const { activeProjectId, projects, allEntries, allActuals, userCashAccounts, settings, scenarios, scenarioEntries } = state;
  const isConsolidated = activeProjectId === 'consolidated';

  const [timeUnit, setTimeUnit] = useState('week'); // 'week', 'month', 'bimonthly', 'quarterly', 'semiannually', 'annually'
  const [horizonLength, setHorizonLength] = useState(6);
  const [drawerData, setDrawerData] = useState({ isOpen: false, transactions: [], title: '' });
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
    if (isConsolidated) return Object.values(allActuals).flat();
    const project = projects.find(p => p.id === activeProjectId) || projects[0];
    return project ? (allActuals[project.id] || []) : [];
  }, [activeProjectId, projects, allActuals, isConsolidated]);

  const calculateCashflowData = (actuals) => {
    const today = new Date();
    const periods = [];
    let chartStartDate;
    
    let initialDate;
    const pastPeriods = 2; // Number of past periods to show

    switch (timeUnit) {
        case 'week':
            initialDate = getStartOfWeek(today);
            chartStartDate = new Date(initialDate);
            chartStartDate.setDate(chartStartDate.getDate() - pastPeriods * 7);
            break;
        case 'month':
            initialDate = new Date(today.getFullYear(), today.getMonth(), 1);
            chartStartDate = new Date(initialDate);
            chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods);
            break;
        case 'bimonthly':
            const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2;
            initialDate = new Date(today.getFullYear(), bimonthStartMonth, 1);
            chartStartDate = new Date(initialDate);
            chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods * 2);
            break;
        case 'quarterly':
            const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
            initialDate = new Date(today.getFullYear(), quarterStartMonth, 1);
            chartStartDate = new Date(initialDate);
            chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods * 3);
            break;
        case 'semiannually':
            const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6;
            initialDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1);
            chartStartDate = new Date(initialDate);
            chartStartDate.setMonth(chartStartDate.getMonth() - pastPeriods * 6);
            break;
        case 'annually':
            initialDate = new Date(today.getFullYear(), 0, 1);
            chartStartDate = new Date(initialDate);
            chartStartDate.setFullYear(chartStartDate.getFullYear() - pastPeriods);
            break;
        default:
            initialDate = getStartOfWeek(today);
            chartStartDate = new Date(initialDate);
            chartStartDate.setDate(chartStartDate.getDate() - pastPeriods * 7);
    }

    for (let i = -pastPeriods; i < horizonLength - pastPeriods; i++) {
        const periodStart = new Date(initialDate);
        switch (timeUnit) {
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
          case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
          case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
          case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
          case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
          case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
          case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
      }

      const inflows = { realized: 0, planned: 0 };
      const outflows = { realized: 0, planned: 0 };
      
      actuals.forEach(actual => {
        (actual.payments || []).forEach(payment => {
          const paymentDate = new Date(payment.paymentDate);
          if (paymentDate >= periodStart && paymentDate < periodEnd) {
            if (actual.type === 'receivable') inflows.realized += payment.paidAmount;
            else if (actual.type === 'payable') outflows.realized += payment.paidAmount;
          }
        });
        const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
        const remainingAmount = actual.amount - totalPaid;
        const dueDate = new Date(actual.date);
        if (remainingAmount > 0 && ['pending', 'partially_paid', 'partially_received'].includes(actual.status) && dueDate >= periodStart && dueDate < periodEnd) {
          if (actual.type === 'receivable') inflows.planned += remainingAmount;
          else if (actual.type === 'payable') outflows.planned += remainingAmount;
        }
      });
      return { period: periodStart, inflows: inflows.realized + inflows.planned, outflows: outflows.realized + outflows.planned };
    });

    let currentBalance = calculatedStartingBalance;
    const balanceData = [];
    for (const flow of periodFlows) { currentBalance = currentBalance + flow.inflows - flow.outflows; balanceData.push(currentBalance.toFixed(2)); }
    
    const labels = periods.map(p => {
        const year = p.toLocaleDateString('fr-FR', { year: '2-digit' });
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        switch (timeUnit) {
            case 'week': return `Sem. du ${p.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
            case 'month': return p.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            case 'bimonthly':
                const startMonth = months[p.getMonth()];
                const endMonth = months[(p.getMonth() + 1) % 12];
                return `Bim. ${startMonth}-${endMonth} '${year}`;
            case 'quarterly':
                const quarter = Math.floor(p.getMonth() / 3) + 1;
                return `T${quarter} '${year}`;
            case 'semiannually':
                const semester = Math.floor(p.getMonth() / 6) + 1;
                return `S${semester} '${year}`;
            case 'annually':
                return p.getFullYear();
            default: return '';
        }
    });
    
    return { labels, periods, inflows: periodFlows.map(w => w.inflows.toFixed(2)), outflows: periodFlows.map(w => w.outflows.toFixed(2)), balance: balanceData };
  };

  const cashflowData = useMemo(() => {
    const baseFlow = calculateCashflowData(baseActuals);
    const visibleScenariosOnChart = projectScenarios.filter(s => selectedScenarios[s.id]);
    const baseEntries = allEntries[activeProjectId] || [];
    const scenarioFlows = visibleScenariosOnChart.map(scenario => {
      const scenarioDeltas = scenarioEntries[scenario.id] || [];
      const scenarioActuals = generateScenarioActuals(baseEntries, baseActuals, scenarioDeltas, activeProjectId, userCashAccounts);
      const flow = calculateCashflowData(scenarioActuals);
      return { id: scenario.id, name: scenario.name, balance: flow.balance };
    });
    return { base: baseFlow, scenarios: scenarioFlows };
  }, [baseActuals, projectScenarios, selectedScenarios, scenarioEntries, activeProjectId, allEntries, horizonLength, timeUnit, userCashAccounts]);
  
  const handleChartClick = (params) => {
    if (params.seriesName !== 'Entrées' && params.seriesName !== 'Sorties') return;
    const periodIndex = params.dataIndex;
    const periodStart = cashflowData.base.periods[periodIndex];
    const periodEnd = new Date(periodStart);
    switch (timeUnit) {
        case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
        case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
        case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
        case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
        case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
        case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
    }
    
    const actualType = params.seriesName === 'Entrées' ? 'receivable' : 'payable';
    const transactionsForDrawer = [];
    baseActuals.forEach(actual => {
      if (actual.type !== actualType) return;
      (actual.payments || []).forEach(payment => {
        const paymentDate = new Date(payment.paymentDate);
        if (paymentDate >= periodStart && paymentDate < periodEnd) transactionsForDrawer.push({ id: payment.id, type: actual.type, thirdParty: actual.thirdParty, category: actual.category, amount: payment.paidAmount, date: payment.paymentDate, status: 'realized', cashAccount: payment.cashAccount });
      });
      const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
      const remainingAmount = actual.amount - totalPaid;
      const dueDate = new Date(actual.date);
      if (remainingAmount > 0 && ['pending', 'partially_paid', 'partially_received'].includes(actual.status) && dueDate >= periodStart && dueDate < periodEnd) transactionsForDrawer.push({ id: actual.id + '-planned', type: actual.type, thirdParty: actual.thirdParty, category: actual.category, amount: remainingAmount, date: actual.date, status: 'planned' });
    });
    setDrawerData({ isOpen: true, transactions: transactionsForDrawer, title: `Détails des ${params.seriesName.toLowerCase()} - ${params.axisValue}` });
  };
  const onEvents = { 'click': handleChartClick };
  
  const getChartOptions = () => {
    const BASE_BALANCE_COLOR = '#3b82f6';
    const SCENARIO_COLORS = ['#14b8a6', '#f97316', '#a855f7'];
    const inflowColor = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(52, 211, 153, 0.8)' }, { offset: 1, color: 'rgba(5, 150, 105, 0.8)' }] };
    const outflowColor = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(248, 113, 113, 0.8)' }, { offset: 1, color: 'rgba(220, 38, 38, 0.8)' }] };
    const inflowFutureColor = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(52, 211, 153, 0.4)' }, { offset: 1, color: 'rgba(5, 150, 105, 0.4)' }] };
    const outflowFutureColor = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(248, 113, 113, 0.4)' }, { offset: 1, color: 'rgba(220, 38, 38, 0.4)' }] };
    const series = [
      { name: 'Entrées', type: 'bar', data: cashflowData.base.inflows, emphasis: { focus: 'series' } },
      { name: 'Sorties', type: 'bar', data: cashflowData.base.outflows, emphasis: { focus: 'series' } },
      { name: 'Solde de trésorerie', type: 'line', smooth: true, data: cashflowData.base.balance, symbolSize: 8, color: BASE_BALANCE_COLOR, lineStyle: { width: 3, shadowColor: 'rgba(0, 0, 0, 0.2)', shadowBlur: 10, shadowOffsetY: 5 }, emphasis: { focus: 'series', scale: 1.2 } },
      ...cashflowData.scenarios.map((scenario, index) => ({ name: scenario.name, type: 'line', smooth: true, data: scenario.balance, symbolSize: 8, color: SCENARIO_COLORS[index % SCENARIO_COLORS.length], lineStyle: { width: 3, type: 'dashed', shadowColor: 'rgba(0, 0, 0, 0.1)', shadowBlur: 8, shadowOffsetY: 3 }, emphasis: { focus: 'series', scale: 1.2 } }))
    ];
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#2d3748' } }, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 8, textStyle: { color: '#1a202c' }, padding: [10, 15], extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); backdrop-filter: blur(4px);', formatter: (params) => { let tooltip = `${params[0].axisValue}<br/>`; params.forEach(param => { tooltip += `${param.marker} ${param.seriesName}: <strong>${formatCurrency(param.value, settings)}</strong><br/>`; }); return tooltip; } },
      legend: { data: series.map(s => s.name), bottom: 10, type: 'scroll', icon: 'circle' },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: [{ type: 'category', boundaryGap: true, data: cashflowData.base.labels, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: '#4a5568' }, markLine: { symbol: 'none', silent: true, lineStyle: { type: 'dashed', color: '#9ca3af' }, data: [{ xAxis: 2, label: { show: true, formatter: 'Aujourd\'hui', position: 'insideStartTop', color: '#4a5568' } }] } }],
      yAxis: [{ type: 'value', axisLabel: { formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' }), color: '#4a5568' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }, axisLine: { show: false } }],
      series,
      visualMap: [
        { show: false, seriesIndex: 0, dimension: 0, pieces: [{ lte: 2, color: inflowColor }, { gt: 2, color: inflowFutureColor }] },
        { show: false, seriesIndex: 1, dimension: 0, pieces: [{ lte: 2, color: outflowColor }, { gt: 2, color: outflowFutureColor }] }
      ],
      animationDurationUpdate: 700,
      animationEasingUpdate: 'cubicInOut',
    };
  };

  const timeUnitOptions = {
    week: 'semaines',
    month: 'mois',
    bimonthly: 'bimestres',
    quarterly: 'trimestres',
    semiannually: 'semestres',
    annually: 'années'
  };

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8 flex justify-between items-start"><div className="flex items-center gap-4"><AreaChart className="w-8 h-8 text-cyan-600" /><div><h1 className="text-3xl font-bold text-gray-900">Prévisions de Trésorerie</h1></div></div></div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 shrink-0">Unité:</label>
              <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="bimonthly">Bimestre</option>
                <option value="quarterly">Trimestre</option>
                <option value="semiannually">Semestre</option>
                <option value="annually">Année</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 shrink-0">Horizon:</label>
              <select value={horizonLength} onChange={(e) => setHorizonLength(Number(e.target.value))} className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option value={6}>6 {timeUnitOptions[timeUnit]}</option>
                <option value={8}>8 {timeUnitOptions[timeUnit]}</option>
                <option value={10}>10 {timeUnitOptions[timeUnit]}</option>
                <option value={12}>12 {timeUnitOptions[timeUnit]}</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-right ml-auto">
            <p className="text-xs font-medium text-blue-700">Solde de départ calculé</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(cashflowData.base.balance[0] - (cashflowData.base.inflows[0] - cashflowData.base.outflows[0]), settings)}</p>
          </div>
        </div>
        {!isConsolidated && projectScenarios.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Layers className="w-4 h-4" /> Afficher les Scénarios</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2">{projectScenarios.map(scenario => (<label key={scenario.id} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!selectedScenarios[scenario.id]} onChange={() => handleScenarioSelectionChange(scenario.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /><span className="text-sm font-medium text-gray-800">{scenario.name}</span></label>))}</div>
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow"><ReactECharts option={getChartOptions()} style={{ height: '500px', width: '100%' }} onEvents={onEvents} /></div>
      <CashflowDetailDrawer isOpen={drawerData.isOpen} onClose={() => setDrawerData({ isOpen: false, transactions: [], title: '' })} transactions={drawerData.transactions} title={drawerData.title} />
    </div>
  );
};

export default CashflowView;
