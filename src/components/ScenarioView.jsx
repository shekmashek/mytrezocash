import React, { useState } from 'react';
import { Plus, Edit, Trash2, Layers, Eye, EyeOff } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import ScenarioModal from './ScenarioModal';
import ScenarioComparisonTable from './ScenarioComparisonTable';
import BudgetModal from './BudgetModal';
import ScenarioEntryDetailDrawer from './ScenarioEntryDetailDrawer';

const ScenarioView = () => {
  const { state, dispatch } = useBudget();
  const { activeProjectId, projects, scenarios } = state;

  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);

  const [entryDrawerData, setEntryDrawerData] = useState({ isOpen: false, scenarioId: null, entryId: null });

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectScenarios = scenarios.filter(s => s.projectId === activeProjectId);

  const handleOpenScenarioModal = (scenario = null) => {
    setEditingScenario(scenario);
    setIsScenarioModalOpen(true);
  };

  const handleSaveScenario = (scenarioData) => {
    if (editingScenario) {
      dispatch({ type: 'UPDATE_SCENARIO', payload: { ...editingScenario, ...scenarioData } });
    } else {
      dispatch({ type: 'ADD_SCENARIO', payload: { ...scenarioData, projectId: activeProjectId } });
    }
  };

  const handleDeleteScenario = (scenarioId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce scénario ?")) {
      dispatch({ type: 'DELETE_SCENARIO', payload: scenarioId });
    }
  };

  const handleAddEntryToScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
    setEditingEntry(null);
    setIsBudgetModalOpen(true);
  };

  const handleEditScenarioEntry = (scenarioId, entry) => {
    setActiveScenarioId(scenarioId);
    setEditingEntry(entry);
    setIsBudgetModalOpen(true);
    setEntryDrawerData({ isOpen: false, scenarioId: null, entryId: null });
  };

  const handleDeleteScenarioEntry = (scenarioId, entryId) => {
    if (window.confirm("Supprimer cette entrée du scénario ?")) {
      dispatch({ type: 'DELETE_SCENARIO_ENTRY', payload: { scenarioId, entryId } });
      setEntryDrawerData({ isOpen: false, scenarioId: null, entryId: null });
    }
  };

  const handleSaveScenarioEntry = (entryData) => {
    dispatch({
      type: 'SAVE_SCENARIO_ENTRY',
      payload: {
        scenarioId: activeScenarioId,
        entryData,
        editingEntry
      }
    });
    setIsBudgetModalOpen(false);
    setActiveScenarioId(null);
  };

  const handleEntryClick = (scenarioId, entryId) => {
    setEntryDrawerData({ isOpen: true, scenarioId, entryId });
  };

  const handleToggleVisibility = (scenarioId) => {
    dispatch({ type: 'TOGGLE_SCENARIO_VISIBILITY', payload: scenarioId });
  };

  if (!activeProject) {
    return <div className="p-6">Veuillez sélectionner un projet.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Layers className="w-8 h-8 text-purple-600" />
              Gestion de Scénarios
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Vos Scénarios</h2>
          {projectScenarios.length < 3 && (
            <button
              onClick={() => handleOpenScenarioModal()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" /> Nouveau Scénario
            </button>
          )}
        </div>
        <div className="space-y-3">
          {projectScenarios.length > 0 ? (
            projectScenarios.map(scenario => (
              <div key={scenario.id} className="p-4 border rounded-lg flex justify-between items-center bg-purple-50">
                <div>
                  <h3 className="font-bold text-purple-800">{scenario.name}</h3>
                  <p className="text-sm text-purple-700">{scenario.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisibility(scenario.id)}
                    className="p-2 text-gray-500 hover:text-gray-800"
                    title={scenario.isVisible ? "Masquer dans le tableau" : "Afficher dans le tableau"}
                  >
                    {scenario.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                   <button onClick={() => handleAddEntryToScenario(scenario.id)} className="p-2 text-sm bg-purple-200 text-purple-800 rounded-md hover:bg-purple-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Ajouter une entrée
                  </button>
                  <button onClick={() => handleOpenScenarioModal(scenario)} className="p-2 text-blue-600 hover:text-blue-800">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteScenario(scenario.id)} className="p-2 text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              Aucun scénario créé. Cliquez sur "Nouveau Scénario" pour commencer une simulation.
            </p>
          )}
        </div>
      </div>

      <ScenarioComparisonTable 
        projectScenarios={projectScenarios} 
        onScenarioEntryClick={handleEntryClick}
      />

      {isScenarioModalOpen && (
        <ScenarioModal
          isOpen={isScenarioModalOpen}
          onClose={() => setIsScenarioModalOpen(false)}
          onSave={handleSaveScenario}
          scenario={editingScenario}
        />
      )}
      {isBudgetModalOpen && (
        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => { setIsBudgetModalOpen(false); setActiveScenarioId(null); }}
          onSave={handleSaveScenarioEntry}
          editingData={editingEntry}
        />
      )}
      <ScenarioEntryDetailDrawer
        isOpen={entryDrawerData.isOpen}
        onClose={() => setEntryDrawerData({ isOpen: false, scenarioId: null, entryId: null })}
        scenarioId={entryDrawerData.scenarioId}
        entryId={entryDrawerData.entryId}
        onEdit={handleEditScenarioEntry}
        onDelete={handleDeleteScenarioEntry}
      />
    </div>
  );
};

export default ScenarioView;
