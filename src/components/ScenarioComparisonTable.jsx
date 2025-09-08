import React, { useMemo, useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { getEntryAmountForMonth } from '../utils/budgetCalculations';
import { formatCurrency } from '../utils/formatting';
import { Building, Calendar, ChevronDown, User } from 'lucide-react';

const ScenarioComparisonTable = ({ projectScenarios, onScenarioEntryClick }) => {
  const { state } = useBudget();
  const { activeProjectId, allEntries, scenarioEntries, categories, settings, displayYear } = state;

  const [collapsedItems, setCollapsedItems] = useState({});

  const toggleCollapse = (id) => setCollapsedItems(prev => ({ ...prev, [id]: !prev[id] }));

  const baseBudgetEntries = allEntries[activeProjectId] || [];

  const visibleScenarios = useMemo(() => {
    return projectScenarios.filter(s => s.isVisible);
  }, [projectScenarios]);

  const resolveScenarioEntries = (baseEntries, scenarioDeltas) => {
    if (!scenarioDeltas || scenarioDeltas.length === 0) {
      return baseEntries;
    }

    const deltaMap = new Map(scenarioDeltas.map(delta => [delta.id, delta]));
    
    let resolvedEntries = baseEntries.filter(baseEntry => {
      const delta = deltaMap.get(baseEntry.id);
      return !(delta && delta.isDeleted);
    });

    resolvedEntries = resolvedEntries.map(baseEntry => {
      const delta = deltaMap.get(baseEntry.id);
      return delta ? { ...baseEntry, ...delta } : baseEntry;
    });

    const newEntries = scenarioDeltas.filter(delta => 
        !delta.isDeleted && !baseEntries.some(baseEntry => baseEntry.id === delta.id)
    );

    return [...resolvedEntries, ...newEntries];
  };

  const scenariosData = useMemo(() => {
    return visibleScenarios.map(scenario => ({
      ...scenario,
      entries: resolveScenarioEntries(baseBudgetEntries, scenarioEntries[scenario.id] || [])
    }));
  }, [visibleScenarios, baseBudgetEntries, scenarioEntries]);

  const allVisibleEntries = useMemo(() => {
    const entryMap = new Map();
    baseBudgetEntries.forEach(entry => entryMap.set(entry.id, { ...entry }));
    scenariosData.forEach(scenario => {
      scenario.entries.forEach(entry => {
        if (!entryMap.has(entry.id)) entryMap.set(entry.id, { ...entry });
      });
    });
    return Array.from(entryMap.values());
  }, [baseBudgetEntries, scenariosData]);

  const groupedData = useMemo(() => {
    const groupByType = (type) => {
      if (!categories || !categories[type]) return [];
      return categories[type].map(mainCat => {
        const entriesForMainCat = allVisibleEntries.filter(entry => mainCat.subCategories.some(sc => sc.name === entry.category));
        return entriesForMainCat.length > 0 ? { ...mainCat, entries: entriesForMainCat } : null;
      }).filter(Boolean);
    };
    return { revenu: groupByType('revenue'), depense: groupByType('expense') };
  }, [allVisibleEntries, categories]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const calculateTotalsForType = (entries, type, monthIndex) => {
    return entries
      .filter(entry => entry.type === type)
      .reduce((sum, entry) => sum + getEntryAmountForMonth(entry, monthIndex, displayYear), 0);
  };
  
  const monthlyTotalsByDataset = useMemo(() => {
    const datasets = [
      { id: 'base', name: 'Base', entries: baseBudgetEntries },
      ...scenariosData
    ];
    return datasets.map(ds => {
      const monthlyRevenues = months.map((_, monthIndex) => calculateTotalsForType(ds.entries, 'revenu', monthIndex));
      const monthlyExpenses = months.map((_, monthIndex) => calculateTotalsForType(ds.entries, 'depense', monthIndex));
      const monthlyNetResults = monthlyRevenues.map((rev, i) => rev - monthlyExpenses[i]);
      const cumulativeNetResults = monthlyNetResults.reduce((acc, current, i) => {
        acc.push((acc[i - 1] || 0) + current);
        return acc;
      }, []);
      return { id: ds.id, name: ds.name, monthlyRevenues, monthlyExpenses, monthlyNetResults, cumulativeNetResults };
    });
  }, [baseBudgetEntries, scenariosData, displayYear]);

  const calculateTotalsForDataSet = (entries, monthIndex) => {
    return entries.reduce((sum, entry) => sum + getEntryAmountForMonth(entry, monthIndex, displayYear), 0);
  };

  const renderBudgetRows = (type) => {
    const mainCategories = groupedData[type];
    if (!mainCategories) return null;
    const totalRowDataKey = type === 'revenu' ? 'monthlyRevenues' : 'monthlyExpenses';

    return (
      <>
        <tr className="sticky top-0 z-20 bg-gray-200">
          <th colSpan={3 + months.length} scope="colgroup" className="px-4 py-2 font-bold text-left text-gray-800">
            <div className="flex items-center gap-2">{type === 'revenu' ? <Building className="w-4 h-4" /> : <Calendar className="w-4 h-4" />} {type === 'revenu' ? 'REVENUS' : 'DÉPENSES'}</div>
          </th>
        </tr>
        {mainCategories.map(mainCategory => {
          const isMainCollapsed = collapsedItems[mainCategory.id];
          return (
            <React.Fragment key={mainCategory.id}>
              <tr onClick={() => toggleCollapse(mainCategory.id)} className="bg-gray-100 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200">
                <td colSpan={3} className="px-4 py-2 sticky left-0 z-10 bg-gray-100">
                  <div className="flex items-center gap-2"><ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />{mainCategory.name}</div>
                </td>
                {months.map((_, monthIndex) => (
                  <td key={monthIndex} className="px-2 py-2 border-l">
                    <div className="flex justify-around text-sm font-semibold">
                      <div className="flex-1 text-center">{formatCurrency(calculateTotalsForDataSet(baseBudgetEntries.filter(e => mainCategory.entries.some(me => me.id === e.id && e.type === type)), monthIndex), settings)}</div>
                      {scenariosData.map(scenario => (
                        <div key={scenario.id} className="flex-1 text-center text-purple-700">{formatCurrency(calculateTotalsForDataSet(scenario.entries.filter(e => mainCategory.entries.some(me => me.id === e.id && e.type === type)), monthIndex), settings)}</div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              {!isMainCollapsed && mainCategory.entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-1 font-normal text-gray-800 sticky left-0 bg-white z-10">{entry.category}</td>
                  <td className="px-4 py-1 text-gray-700 sticky left-[128px] bg-white z-10"><div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" />{entry.supplier}</div></td>
                  <td className="px-4 py-1 text-gray-600 sticky left-[288px] bg-white z-10"><div className="text-sm truncate">{entry.description || '-'}</div></td>
                  {months.map((_, monthIndex) => (
                    <td key={monthIndex} className="px-2 py-1 border-l">
                      <div className="flex justify-around items-center">
                        <div className="flex-1 text-center text-xs text-gray-600">{formatCurrency(getEntryAmountForMonth(baseBudgetEntries.find(e => e.id === entry.id) || {}, monthIndex, displayYear), settings)}</div>
                        {scenariosData.map(scenario => {
                          const amount = getEntryAmountForMonth(scenario.entries.find(e => e.id === entry.id) || {}, monthIndex, displayYear);
                          return (
                            <button 
                              key={scenario.id} 
                              onClick={() => amount > 0 && typeof onScenarioEntryClick === 'function' && onScenarioEntryClick(scenario.id, entry.id)}
                              disabled={amount === 0}
                              className="flex-1 text-center text-xs text-purple-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
                            >
                              {formatCurrency(amount, settings)}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          );
        })}
        <tr className="bg-gray-200 border-y-2 border-gray-300">
          <td colSpan={3} className="px-4 py-2 font-bold text-gray-900 bg-gray-200 sticky left-0 z-10">TOTAL {type === 'revenu' ? 'REVENUS' : 'DÉPENSES'}</td>
          {months.map((_, monthIndex) => (
            <td key={monthIndex} className="px-2 py-2 border-l">
              <div className="flex justify-around text-sm font-bold">
                {monthlyTotalsByDataset.map(dataset => (
                  <div key={dataset.id} className={`flex-1 text-center ${dataset.id !== 'base' ? 'text-purple-700' : 'text-gray-900'}`}>
                    {formatCurrency(dataset[totalRowDataKey][monthIndex], settings)}
                  </div>
                ))}
              </div>
            </td>
          ))}
        </tr>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-gray-100 sticky top-0 z-30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-gray-100 border-b-2 border-r sticky left-0 z-40 w-32">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-gray-100 border-b-2 border-r sticky left-[128px] z-20 w-40">Fournisseur/Client</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 bg-gray-100 border-b-2 border-r sticky left-[288px] z-20 w-64">Description</th>
              {months.map(month => (
                <th key={month} className="px-2 py-2 text-center font-semibold text-gray-900 border-b-2 border-l" style={{ minWidth: `${(1 + visibleScenarios.length) * 90}px` }}>
                  <div className="text-base mb-1">{`${month} '${String(displayYear).slice(-2)}`}</div>
                  <div className="flex justify-around text-xs font-medium text-gray-600">
                    <div className="flex-1">Base</div>
                    {visibleScenarios.map(s => <div key={s.id} className="flex-1 text-purple-700">{s.name}</div>)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderBudgetRows('revenu')}
            {renderBudgetRows('depense')}
            <tr className="bg-gray-300 border-y-2 border-gray-400">
              <td colSpan={3} className="px-4 py-2 font-bold text-gray-900 bg-gray-300 sticky left-0 z-10">RÉSULTAT NET MENSUEL</td>
              {months.map((_, monthIndex) => (
                <td key={monthIndex} className="px-2 py-2 border-l">
                  <div className="flex justify-around text-sm font-bold">
                    {monthlyTotalsByDataset.map(dataset => (
                      <div key={dataset.id} className={`flex-1 text-center ${dataset.id !== 'base' ? 'text-purple-700' : 'text-gray-900'}`}>
                        {formatCurrency(dataset.monthlyNetResults[monthIndex], settings)}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            <tr className="bg-gray-300 border-b-2 border-gray-400">
              <td colSpan={3} className="px-4 py-2 font-bold text-gray-900 bg-gray-300 sticky left-0 z-10">RÉSULTAT NET CUMULÉ</td>
              {months.map((_, monthIndex) => (
                <td key={monthIndex} className="px-2 py-2 border-l">
                  <div className="flex justify-around text-sm font-bold">
                    {monthlyTotalsByDataset.map(dataset => (
                      <div key={dataset.id} className={`flex-1 text-center ${dataset.id !== 'base' ? 'text-purple-700' : 'text-gray-900'}`}>
                        {formatCurrency(dataset.cumulativeNetResults[monthIndex], settings)}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScenarioComparisonTable;
