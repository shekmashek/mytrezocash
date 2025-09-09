import React, { useMemo, useState } from 'react';
import { useBudget } from './context/BudgetContext';
import BudgetTracker from './components/BudgetTracker';
import Header from './components/Header';
import SubHeader from './components/SubHeader';
import SettingsDrawerWrapper from './components/SettingsDrawerWrapper';
import ActualsView from './components/ActualsView';
import ScenarioView from './components/ScenarioView';
import ExpenseAnalysisView from './components/ExpenseAnalysisView';
import JournalsView from './components/JournalsView';
import BudgetModal from './components/BudgetModal';
import DashboardView from './components/DashboardView';
import InfoModal from './components/InfoModal';
import AuthView from './components/AuthView';

function App() {
  const { state, dispatch } = useBudget();
  const { activeProjectId, currentView, activeSettingsDrawer, isBudgetModalOpen, editingEntry, infoModal, isAuthenticated } = state;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { activeProject, activeEntries, activeActuals } = useMemo(() => {
    const { projects, allEntries, allActuals } = state;
    const isConsolidated = activeProjectId === 'consolidated';
    if (isConsolidated) {
      return {
        activeProject: { id: 'consolidated', name: 'Budget Consolidé' },
        activeEntries: Object.entries(allEntries).flatMap(([projectId, entries]) => entries.map(entry => ({ ...entry, projectId }))),
        activeActuals: Object.entries(allActuals).flatMap(([projectId, actuals]) => actuals.map(actual => ({ ...actual, projectId }))),
      };
    } else {
      const project = projects.find(p => p.id === activeProjectId) || projects[0];
      return {
        activeProject: project,
        activeEntries: project ? (allEntries[project.id] || []) : [],
        activeActuals: project ? (allActuals[project.id] || []) : [],
      };
    }
  }, [activeProjectId, state.projects, state.allEntries, state.allActuals]);

  const onOpenSettingsDrawer = (drawer) => {
    dispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: drawer });
  };
  
  const handleSaveEntryWrapper = (entryData) => {
    dispatch({ type: 'SAVE_ENTRY', payload: { entryData, editingEntry } });
  };
  
  const handleDeleteEntryWrapper = (entryId) => {
    const entryToDelete = editingEntry || activeEntries.find(e => e.id === entryId);
    dispatch({ type: 'DELETE_ENTRY', payload: { entryId, entryProjectId: entryToDelete?.projectId } });
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'budget':
        return activeProject ? <BudgetTracker activeProject={activeProject} budgetEntries={activeEntries} actualTransactions={activeActuals} /> : <div>Chargement...</div>;
      case 'journals':
        return <JournalsView />;
      case 'payables':
        return <ActualsView type="payable" />;
      case 'receivables':
        return <ActualsView type="receivable" />;
      case 'scenarios':
        return <ScenarioView />;
      case 'expenseAnalysis':
        return <ExpenseAnalysisView />;
      default:
        return <div>Vue non trouvée</div>;
    }
  };

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Header 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onOpenSettingsDrawer={onOpenSettingsDrawer} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SubHeader />
        <main className="flex-grow overflow-y-auto bg-gray-50">
            {renderCurrentView()}
        </main>
      </div>
      <SettingsDrawerWrapper activeDrawer={activeSettingsDrawer} onClose={() => dispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: null })} />
      {isBudgetModalOpen && (
        <BudgetModal 
          isOpen={isBudgetModalOpen} 
          onClose={() => dispatch({ type: 'CLOSE_BUDGET_MODAL' })} 
          onSave={handleSaveEntryWrapper} 
          onDelete={handleDeleteEntryWrapper} 
          editingData={editingEntry} 
        />
      )}
      {infoModal.isOpen && (
        <InfoModal
          isOpen={infoModal.isOpen}
          onClose={() => dispatch({ type: 'CLOSE_INFO_MODAL' })}
          title={infoModal.title}
          message={infoModal.message}
        />
      )}
    </div>
  );
}

export default App;
