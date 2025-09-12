import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getEntryAmountForMonth } from '../utils/budgetCalculations';

// --- Initial State Definition ---
const getDefaultExpenseTargets = () => ({
  'exp-main-1': 20, // Exploitation (le reste, calculé)
  'exp-main-2': 35, // Masse Salariale
  'exp-main-3': 10, // Investissement
  'exp-main-4': 0,  // Financement
  'exp-main-5': 10, // Épargne et Provision
  'exp-main-6': 5,  // Exceptionnel
  'exp-main-7': 10, // Impôts et Taxes
  'exp-main-8': 5,  // Formation
  'exp-main-9': 5,  // Innovation, Recherche et développement
  'exp-main-10': 0, // Famille
});

const initialProjects = [
  { 
    id: 'proj-1', 
    name: 'Mon Entreprise 2025', 
    expenseTargets: getDefaultExpenseTargets(),
    annualGoals: { '2025': { revenue: 60000, expense: 45000 } },
    isArchived: false,
  },
  { 
    id: 'proj-2', 
    name: 'Budget Personnel', 
    expenseTargets: getDefaultExpenseTargets(),
    annualGoals: { '2025': { revenue: 0, expense: 0 } },
    isArchived: false,
  },
];

const initialCategories = {
  revenue: [
    { id: 'rev-main-1', name: 'Entrées des Ventes', isFixed: false, subCategories: [{ id: uuidv4(), name: 'Ventes de produits' }, { id: uuidv4(), name: 'Ventes de services' }] },
    { id: 'rev-main-2', name: 'Entrées Financières', isFixed: false, subCategories: [{ id: uuidv4(), name: 'Intérêts perçus' }] },
    { id: 'rev-main-3', name: 'Autres Entrées', isFixed: false, subCategories: [{ id: uuidv4(), name: 'Subventions' }, { id: uuidv4(), name: 'Revenus Exceptionnels'}] },
  ],
  expense: [
    { id: 'exp-main-1', name: 'Exploitation', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Loyer et charges' }, { id: uuidv4(), name: 'Fournitures de bureau' }, { id: uuidv4(), name: 'Marketing et publicité' }, { id: uuidv4(), name: 'Frais de déplacement' }] },
    { id: 'exp-main-2', name: 'Masse Salariale', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Salaires et traitements' }, { id: uuidv4(), name: 'Charges sociales' }] },
    { id: 'exp-main-3', name: 'Investissement', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Achat de matériel' }, { id: uuidv4(), name: 'Logiciels' }] },
    { id: 'exp-main-4', name: 'Financement', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Remboursement d\'emprunt' }, { id: uuidv4(), name: 'Intérêts d\'emprunt' }] },
    { id: 'exp-main-5', name: 'Épargne et Provision', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Provision pour risques' }] },
    { id: 'exp-main-6', name: 'Exceptionnel', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Amendes' }, { id: uuidv4(), name: 'Dons' }] },
    { id: 'exp-main-7', name: 'Impôts et Taxes', isFixed: true, subCategories: [{ id: uuidv4(), name: 'Impôt sur les sociétés' }, { id: uuidv4(), name: 'TVA' }, { id: uuidv4(), name: 'Autres taxes'}] },
    { id: 'exp-main-8', name: 'Formation', isFixed: true, subCategories: [] },
    { id: 'exp-main-9', name: 'Innovation, Recherche et développement', isFixed: true, subCategories: [] },
    { id: 'exp-main-10', name: 'Famille', isFixed: false, subCategories: [{ id: uuidv4(), name: 'Logement' }, { id: uuidv4(), name: 'Alimentation' }, { id: uuidv4(), name: 'Transport' }, { id: uuidv4(), name: 'Santé' }, { id: uuidv4(), name: 'Loisirs' }, { id: uuidv4(), name: 'Enfant et education' }] },
  ]
};

const initialEntries = {
  'proj-1': [
    { id: 'budget-expense-1', type: 'depense', category: 'Loyer et charges', frequency: 'mensuel', amount: 1200, startDate: '2025-01-01', endDate: null, supplier: 'Agence Immo', description: 'Loyer bureaux' },
    { id: 'budget-revenue-1', type: 'revenu', category: 'Ventes de services', frequency: 'mensuel', amount: 5000, startDate: '2025-01-01', endDate: null, supplier: 'Client Principal', description: 'Contrat de maintenance' }
  ],
  'proj-2': [],
};

const initialActuals = {
  'proj-1': [],
  'proj-2': [],
};

export const mainCashAccountCategories = [
  { id: 'bank', name: 'Comptes Bancaires' },
  { id: 'cash', name: 'Cash / Espèce' },
  { id: 'mobileMoney', name: 'Mobile Money' },
  { id: 'savings', name: 'Épargne' },
  { id: 'provisions', name: 'Provisions' },
];

const initialUserCashAccounts = [
  { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Principal Pro', initialBalance: 10000, initialBalanceDate: '2025-01-01' },
  { id: uuidv4(), mainCategoryId: 'cash', name: 'Caisse Bureau', initialBalance: 500, initialBalanceDate: '2025-01-01' },
  { id: uuidv4(), mainCategoryId: 'mobileMoney', name: 'Orange Money', initialBalance: 200, initialBalanceDate: '2025-01-01' },
  { id: uuidv4(), mainCategoryId: 'savings', name: 'Compte Épargne A', initialBalance: 2000, initialBalanceDate: '2025-01-01' },
  { id: uuidv4(), mainCategoryId: 'provisions', name: 'Provision Impôts', initialBalance: 0, initialBalanceDate: '2025-01-01' },
];

const initialTiers = [];
const initialSettings = { 
  displayUnit: 'standard',
  decimalPlaces: 2,
  currency: '€'
};

const initialScenarios = [];
const initialScenarioEntries = {};

const CONSOLIDATED_PROJECT_ID = 'consolidated';

// --- Reducer Function ---
const budgetReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_ACTIVE_PROJECT': {
      const newProjectId = action.payload;
      const isSwitchingToConsolidated = newProjectId === CONSOLIDATED_PROJECT_ID;
      
      const consolidatedDisabledViews = ['payables', 'receivables', 'scenarios'];
      
      let newCurrentView = state.currentView;
      
      if (isSwitchingToConsolidated && consolidatedDisabledViews.includes(state.currentView)) {
        newCurrentView = 'dashboard';
      }
      
      return { 
        ...state, 
        activeProjectId: newProjectId, 
        currentView: newCurrentView 
      };
    }
    case 'SET_ACTIVE_SETTINGS_DRAWER':
      return { ...state, activeSettingsDrawer: action.payload };
    case 'SET_DISPLAY_YEAR':
      return { ...state, displayYear: action.payload };
    
    // --- Info Modal ---
    case 'OPEN_INFO_MODAL':
      return { ...state, infoModal: { isOpen: true, ...action.payload } };
    case 'CLOSE_INFO_MODAL':
      return { ...state, infoModal: { isOpen: false, title: '', message: '' } };

    // --- Scenarios ---
    case 'ADD_SCENARIO': {
      const { name, description, projectId } = action.payload;
      const projectScenarios = state.scenarios.filter(s => s.projectId === projectId);
      if (projectScenarios.length >= 3) {
        alert("Vous ne pouvez pas créer plus de 3 scénarios par projet.");
        return state;
      }
      const newScenario = { id: uuidv4(), name, description, projectId, isVisible: true };
      const newScenarioEntries = { ...state.scenarioEntries, [newScenario.id]: [] };
      return { ...state, scenarios: [...state.scenarios, newScenario], scenarioEntries: newScenarioEntries };
    }
    case 'UPDATE_SCENARIO': {
      const { id, name, description } = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s => s.id === id ? { ...s, name, description } : s),
      };
    }
    case 'TOGGLE_SCENARIO_VISIBILITY': {
      const scenarioId = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s =>
          s.id === scenarioId ? { ...s, isVisible: !s.isVisible } : s
        ),
      };
    }
    case 'DELETE_SCENARIO': {
      const scenarioId = action.payload;
      const newScenarios = state.scenarios.filter(s => s.id !== scenarioId);
      const newScenarioEntries = { ...state.scenarioEntries };
      delete newScenarioEntries[scenarioId];
      return { ...state, scenarios: newScenarios, scenarioEntries: newScenarioEntries };
    }
    case 'SAVE_SCENARIO_ENTRY': {
      const { scenarioId, entryData, editingEntry } = action.payload;
      const newScenarioEntries = JSON.parse(JSON.stringify(state.scenarioEntries));
      const scenarioDeltas = newScenarioEntries[scenarioId] || [];

      const newEntry = { ...entryData, id: editingEntry ? editingEntry.id : uuidv4() };

      const index = scenarioDeltas.findIndex(e => e.id === newEntry.id);
      if (index > -1) {
        scenarioDeltas[index] = newEntry;
      } else {
        scenarioDeltas.push(newEntry);
      }
      
      newScenarioEntries[scenarioId] = scenarioDeltas;
      return { ...state, scenarioEntries: newScenarioEntries };
    }
    case 'DELETE_SCENARIO_ENTRY': {
      const { scenarioId, entryId } = action.payload;
      const newScenarioEntries = { ...state.scenarioEntries };
      const scenarioDeltas = newScenarioEntries[scenarioId] || [];

      const isEntryInBase = state.allEntries[state.activeProjectId]?.some(e => e.id === entryId);

      if (isEntryInBase) {
        const otherDeltas = scenarioDeltas.filter(e => e.id !== entryId);
        otherDeltas.push({ id: entryId, isDeleted: true });
        newScenarioEntries[scenarioId] = otherDeltas;
      } else {
        newScenarioEntries[scenarioId] = scenarioDeltas.filter(e => e.id !== entryId);
      }
      
      return { ...state, scenarioEntries: newScenarioEntries };
    }

    case 'ADD_PROJECT': {
      const newProject = { 
        id: uuidv4(), 
        name: action.payload, 
        expenseTargets: getDefaultExpenseTargets(),
        annualGoals: { [new Date().getFullYear()]: { revenue: 0, expense: 0 } },
        isArchived: false,
      };
      return {
        ...state,
        projects: [...state.projects, newProject],
        allEntries: { ...state.allEntries, [newProject.id]: [] },
        allActuals: { ...state.allActuals, [newProject.id]: [] },
        activeProjectId: newProject.id,
      };
    }
    case 'UPDATE_PROJECT': {
      const { projectId, newName } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p => p.id === projectId ? { ...p, name: newName } : p),
      };
    }
    case 'ARCHIVE_PROJECT': {
      const projectId = action.payload;
      return {
        ...state,
        projects: state.projects.map(p => p.id === projectId ? { ...p, isArchived: true } : p),
        activeProjectId: state.activeProjectId === projectId ? CONSOLIDATED_PROJECT_ID : state.activeProjectId,
      };
    }
    case 'RESTORE_PROJECT': {
      const projectId = action.payload;
      return {
        ...state,
        projects: state.projects.map(p => p.id === projectId ? { ...p, isArchived: false } : p),
      };
    }
    case 'UPDATE_ANNUAL_GOALS': {
        const { projectId, year, type, value } = action.payload;
        return {
            ...state,
            projects: state.projects.map(p => {
                if (p.id === projectId) {
                    const updatedProject = { ...p };
                    if (!updatedProject.annualGoals) updatedProject.annualGoals = {};
                    if (!updatedProject.annualGoals[year]) updatedProject.annualGoals[year] = { revenue: 0, expense: 0 };
                    updatedProject.annualGoals[year][type] = value;
                    return updatedProject;
                }
                return p;
            }),
        };
    }
    case 'UPDATE_EXPENSE_TARGETS': {
      const { projectId, newTargets } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p => p.id === projectId ? { ...p, expenseTargets: newTargets } : p),
      };
    }
    case 'DELETE_PROJECT': {
      const projectId = action.payload;
      if (state.projects.filter(p => !p.isArchived).length <= 1) {
        alert("Vous ne pouvez pas supprimer le dernier projet actif.");
        return state;
      }
      if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet et toutes ses données ? Cette action est irréversible. Pour conserver les données, vous pouvez l'archiver.")) {
        const remainingProjects = state.projects.filter(p => p.id !== projectId);
        const newEntries = { ...state.allEntries };
        delete newEntries[projectId];
        const newActuals = { ...state.allActuals };
        delete newActuals[projectId];
        const newScenarios = state.scenarios.filter(s => s.projectId !== projectId);
        const newScenarioEntries = { ...state.scenarioEntries };
        state.scenarios.forEach(s => {
          if (s.projectId === projectId) {
            delete newScenarioEntries[s.id];
          }
        });

        return {
          ...state,
          projects: remainingProjects,
          allEntries: newEntries,
          allActuals: newActuals,
          scenarios: newScenarios,
          scenarioEntries: newScenarioEntries,
          activeProjectId: CONSOLIDATED_PROJECT_ID,
        };
      }
      return state;
    }

    case 'ADD_TIER': {
      const newTier = { ...action.payload, id: uuidv4() };
      return { ...state, tiers: [...state.tiers, newTier] };
    }
    case 'UPDATE_TIER': {
      const { tierId, newName } = action.payload;
      const tierToUpdate = state.tiers.find(t => t.id === tierId);
      if (!tierToUpdate) return state;
      const oldName = tierToUpdate.name;

      const newTiers = state.tiers.map(t => t.id === tierId ? { ...t, name: newName } : t);
      
      const updateItemsTier = (items) => {
        const newItems = { ...items };
        for (const projId in newItems) {
          newItems[projId] = newItems[projId].map(item => {
            if (item.supplier === oldName) return { ...item, supplier: newName };
            if (item.thirdParty === oldName) return { ...item, thirdParty: newName };
            return item;
          });
        }
        return newItems;
      };

      return {
        ...state,
        tiers: newTiers,
        allEntries: updateItemsTier(state.allEntries),
        allActuals: updateItemsTier(state.allActuals),
      };
    }
    case 'DELETE_TIER': {
      const tierId = action.payload;
      const tierToDelete = state.tiers.find(t => t.id === tierId);
      if (!tierToDelete) return state;

      const isUsed = Object.values(state.allEntries).flat().some(e => e.supplier === tierToDelete.name) ||
                     Object.values(state.allActuals).flat().some(a => a.thirdParty === tierToDelete.name);

      if (isUsed) {
        alert("Ce tiers ne peut pas être supprimé car il est utilisé dans des budgets ou transactions.");
        return state;
      }

      if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${tierToDelete.name}" ?`)) {
        return { ...state, tiers: state.tiers.filter(t => t.id !== tierId) };
      }
      return state;
    }

    case 'ADD_SUB_CATEGORY': {
        const { type, mainCategoryId, subCategoryName } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        const mainCat = newCategories[type]?.find(mc => mc.id === mainCategoryId);
        if (mainCat) {
            mainCat.subCategories.push({ id: uuidv4(), name: subCategoryName });
        }
        return { ...state, categories: newCategories };
    }
    case 'UPDATE_SUB_CATEGORY': {
        const { type, mainCategoryId, subCategoryId, newName } = action.payload;
        const mainCatForName = state.categories[type]?.find(mc => mc.id === mainCategoryId);
        const subCatForName = mainCatForName?.subCategories?.find(sc => sc.id === subCategoryId);
        if (!subCatForName) return state;
        const oldName = subCatForName.name;

        const newCategories = JSON.parse(JSON.stringify(state.categories));
        const mainCat = newCategories[type]?.find(mc => mc.id === mainCategoryId);
        if (mainCat) {
            const subCat = mainCat.subCategories.find(sc => sc.id === subCategoryId);
            if (subCat) subCat.name = newName;
        }

        const updateItemsCategory = (items) => {
            const newItems = { ...items };
            for (const projId in newItems) {
                newItems[projId] = newItems[projId].map(item =>
                    (item.category === oldName) ? { ...item, category: newName } : item
                );
            }
            return newItems;
        };

        return {
            ...state,
            categories: newCategories,
            allEntries: updateItemsCategory(state.allEntries),
            allActuals: updateItemsCategory(state.allActuals),
        };
    }
    case 'DELETE_SUB_CATEGORY': {
        const { type, mainCategoryId, subCategoryId } = action.payload;
        const mainCatForName = state.categories[type]?.find(mc => mc.id === mainCategoryId);
        const subCatForName = mainCatForName?.subCategories?.find(sc => sc.id === subCategoryId);
        if (!subCatForName) return state;

        const isUsed = Object.values(state.allEntries).flat().some(e => e.category === subCatForName.name) ||
                       Object.values(state.allActuals).flat().some(a => a.category === subCatForName.name);

        if (isUsed) {
            alert("Cette sous-catégorie ne peut pas être supprimée car elle est utilisée.");
            return state;
        }

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la sous-catégorie "${subCatForName.name}" ?`)) {
            const newCategories = JSON.parse(JSON.stringify(state.categories));
            const mainCat = newCategories[type]?.find(mc => mc.id === mainCategoryId);
            if (mainCat) {
                mainCat.subCategories = mainCat.subCategories.filter(sc => sc.id !== subCategoryId);
            }
            return { ...state, categories: newCategories };
        }
        return state;
    }

    case 'ADD_USER_CASH_ACCOUNT': {
      const newAccount = { ...action.payload, id: uuidv4() };
      return { ...state, userCashAccounts: [...state.userCashAccounts, newAccount] };
    }
    case 'UPDATE_USER_CASH_ACCOUNT': {
      const { accountId, accountData } = action.payload;
      return {
        ...state,
        userCashAccounts: state.userCashAccounts.map(acc => acc.id === accountId ? { ...acc, ...accountData } : acc),
      };
    }
    case 'DELETE_USER_CASH_ACCOUNT': {
      const accountId = action.payload;
      const isUsed = Object.values(state.allActuals).flat().flatMap(a => a.payments || []).some(p => p.cashAccount === accountId);
      if (isUsed) {
        alert("Ce compte ne peut pas être supprimé car il est utilisé dans des transactions.");
        return state;
      }
      if (window.confirm("Êtes-vous sûr de vouloir supprimer ce compte de trésorerie ?")) {
        return { ...state, userCashAccounts: state.userCashAccounts.filter(acc => acc.id !== accountId) };
      }
      return state;
    }
    
    case 'OPEN_BUDGET_MODAL':
      return { ...state, isBudgetModalOpen: true, editingEntry: action.payload };
    case 'CLOSE_BUDGET_MODAL':
      return { ...state, isBudgetModalOpen: false, editingEntry: null };
    
    case 'OPEN_ACTUAL_EDITOR_DRAWER':
      return { ...state, isActualEditorDrawerOpen: true, editingActualId: action.payload };
    case 'CLOSE_ACTUAL_EDITOR_DRAWER':
      return { ...state, isActualEditorDrawerOpen: false, editingActualId: null };

    case 'SAVE_ENTRY': {
        const { entryData, editingEntry } = action.payload;
        let newState = { ...state };

        const tierName = entryData.supplier?.trim();
        if (tierName) {
            const tierType = entryData.type === 'revenu' ? 'client' : 'fournisseur';
            const tierExists = state.tiers.some(t => t.name.toLowerCase() === tierName.toLowerCase() && t.type === tierType);
            if (!tierExists) {
                const newTier = { name: tierName, type: tierType, id: uuidv4() };
                newState = { ...newState, tiers: [...newState.tiers, newTier] };
            }
        }

        const targetProjectId = state.isConsolidated ? entryData.projectId : state.activeProjectId;
        const newEntryId = editingEntry ? editingEntry.id : uuidv4();
        const finalEntryData = { ...entryData, id: newEntryId };

        const updatedAllEntries = { ...newState.allEntries };
        const projectEntries = [...(updatedAllEntries[targetProjectId] || [])];
        if (editingEntry) {
            const index = projectEntries.findIndex(e => e.id === editingEntry.id);
            if (index > -1) projectEntries[index] = finalEntryData;
        } else {
            projectEntries.push(finalEntryData);
        }
        updatedAllEntries[targetProjectId] = projectEntries;
        
        newState = { ...newState, allEntries: updatedAllEntries };
        
        let newAllActuals = { ...newState.allActuals };
        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        let projectActuals = (newAllActuals[targetProjectId] || []).filter(actual => 
            !(actual.budgetId === finalEntryData.id && unsettledStatuses.includes(actual.status))
        );

        if (finalEntryData.type === 'depense' || finalEntryData.type === 'revenu') {
            const newActualsList = [];
            const actualType = finalEntryData.type === 'depense' ? 'payable' : 'receivable';
            
            if (finalEntryData.frequency === 'provision') {
                // Create monthly provision actuals
                finalEntryData.payments.forEach(payment => {
                    newActualsList.push({
                        id: uuidv4(),
                        budgetId: finalEntryData.id,
                        projectId: targetProjectId,
                        type: 'payable',
                        category: 'Épargne et Provision',
                        date: payment.date,
                        amount: parseFloat(payment.amount),
                        thirdParty: `Provision vers ${state.userCashAccounts.find(acc => acc.id === finalEntryData.provisionDetails.provisionAccountId)?.name || 'Compte Provision'}`,
                        description: `Provision pour: ${finalEntryData.description}`,
                        status: 'pending',
                        payments: [],
                        isProvision: true,
                        provisionDetails: {
                            ...finalEntryData.provisionDetails,
                            sourceAccountId: null,
                            destinationAccountId: finalEntryData.provisionDetails.provisionAccountId
                        }
                    });
                });
                // Create final payable actual
                newActualsList.push({
                    id: uuidv4(),
                    budgetId: finalEntryData.id,
                    projectId: targetProjectId,
                    type: 'payable',
                    category: finalEntryData.category,
                    date: finalEntryData.provisionDetails.finalPaymentDate,
                    amount: finalEntryData.amount,
                    thirdParty: finalEntryData.supplier,
                    description: `Paiement final pour: ${finalEntryData.description}`,
                    status: 'pending',
                    payments: [],
isFinalProvisionPayment: true,
                    provisionDetails: finalEntryData.provisionDetails
                });

            } else {
                const startYear = finalEntryData.startDate ? new Date(finalEntryData.startDate).getFullYear() : new Date().getFullYear();
                const endYear = finalEntryData.endDate ? new Date(finalEntryData.endDate).getFullYear() : startYear + 5;

                for (let year = startYear; year <= endYear; year++) {
                    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                        const amountForMonth = getEntryAmountForMonth(finalEntryData, monthIndex, year);
                        if (amountForMonth > 0) {
                            const actualExists = projectActuals.some(p => 
                                p.budgetId === finalEntryData.id && 
                                new Date(p.date).getFullYear() === year &&
                                new Date(p.date).getMonth() === monthIndex
                            );
                            if (!actualExists) {
                                newActualsList.push({
                                    id: uuidv4(),
                                    budgetId: finalEntryData.id,
                                    projectId: targetProjectId,
                                    type: actualType,
                                    category: finalEntryData.category,
                                    date: new Date(year, monthIndex, 1).toISOString().split('T')[0],
                                    amount: amountForMonth,
                                    thirdParty: finalEntryData.supplier,
                                    description: `Budget: ${finalEntryData.description || finalEntryData.category}`,
                                    status: 'pending',
                                    payments: []
                                });
                            }
                        }
                    }
                }
            }
            projectActuals = [...projectActuals, ...newActualsList];
        }
        newAllActuals[targetProjectId] = projectActuals;

        return { ...newState, allActuals: newAllActuals, isBudgetModalOpen: false, editingEntry: null };
    }
    case 'DELETE_ENTRY': {
        const { entryId, entryProjectId } = action.payload;
        const targetProjectId = entryProjectId || state.activeProjectId;
        if (!targetProjectId || targetProjectId === CONSOLIDATED_PROJECT_ID) return state;

        const newAllEntries = { ...state.allEntries };
        newAllEntries[targetProjectId] = (newAllEntries[targetProjectId] || []).filter(e => e.id !== entryId);

        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        const newAllActuals = { ...state.allActuals };
        newAllActuals[targetProjectId] = (newAllActuals[targetProjectId] || []).filter(actual => 
            !(actual.budgetId === entryId && unsettledStatuses.includes(actual.status))
        );

        return { ...state, allEntries: newAllEntries, allActuals: newAllActuals, isBudgetModalOpen: false, editingEntry: null };
    }
    
    case 'SAVE_ACTUAL': {
      const { actualData, editingActual } = action.payload;
      let newState = { ...state };
      
      const targetProjectId = editingActual ? editingActual.projectId : state.activeProjectId;
      if (!targetProjectId || targetProjectId === CONSOLIDATED_PROJECT_ID) {
          console.error("Cannot save actual without a specific project.");
          return state;
      }

      const tierName = actualData.thirdParty?.trim();
      if (tierName) {
          const tierType = actualData.type === 'receivable' ? 'client' : 'fournisseur';
          const tierExists = state.tiers.some(t => t.name.toLowerCase() === tierName.toLowerCase() && t.type === tierType);
          if (!tierExists) {
               const newTier = { name: tierName, type: tierType, id: uuidv4() };
               newState = { ...newState, tiers: [...newState.tiers, newTier] };
          }
      }
      
      let newAllEntries = { ...newState.allEntries };
      let finalActualData = { ...actualData };

      if (!editingActual && !actualData.budgetId) {
          const newBudgetId = uuidv4();
          const newBudgetEntry = {
              id: newBudgetId,
              type: actualData.type === 'payable' ? 'depense' : 'revenu',
              category: actualData.category,
              frequency: 'ponctuel',
              amount: actualData.amount,
              date: actualData.date,
              startDate: actualData.date,
              endDate: null,
              supplier: actualData.thirdParty,
              description: actualData.type === 'payable' ? 'Sortie hors budget' : 'Entrée hors budget',
              isOffBudget: true,
              payments: []
          };
          const projectEntries = [...(newAllEntries[targetProjectId] || [])];
          projectEntries.push(newBudgetEntry);
          newAllEntries[targetProjectId] = projectEntries;
          finalActualData.budgetId = newBudgetId;
      }
      
      const newAllActuals = { ...newState.allActuals };
      const projectActuals = [...(newAllActuals[targetProjectId] || [])];
      if (editingActual) {
          const index = projectActuals.findIndex(a => a.id === editingActual.id);
          if (index > -1) {
            const existingPayments = projectActuals[index].payments || [];
            projectActuals[index] = { ...editingActual, ...finalActualData, payments: existingPayments };
          }
      } else {
          projectActuals.push({ ...finalActualData, id: uuidv4(), projectId: targetProjectId, payments: [] });
      }
      newAllActuals[targetProjectId] = projectActuals;

      return { ...newState, allEntries: newAllEntries, allActuals: newAllActuals };
    }
    case 'DELETE_ACTUAL': {
      const actualId = action.payload;
      const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
      let wasDeleted = false;
      for (const projId in newAllActuals) {
          const originalLength = newAllActuals[projId].length;
          newAllActuals[projId] = newAllActuals[projId].filter(a => a.id !== actualId);
          if (newAllActuals[projId].length < originalLength) {
              wasDeleted = true;
              break;
          }
      }
      return wasDeleted ? { ...state, allActuals: newAllActuals } : state;
    }
    case 'DELETE_PAYMENT': {
      const { actualId, paymentId } = action.payload;
      const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
      let actualFound = false;

      for (const projectId in newAllActuals) {
        const projectActuals = newAllActuals[projectId];
        const actualIndex = projectActuals.findIndex(a => a.id === actualId);

        if (actualIndex > -1) {
          const actual = projectActuals[actualIndex];
          actual.payments = actual.payments.filter(p => p.id !== paymentId);

          const totalPaid = actual.payments.reduce((sum, p) => sum + p.paidAmount, 0);
          if (totalPaid === 0) {
            actual.status = 'pending';
          } else if (totalPaid < actual.amount) {
            actual.status = actual.type === 'payable' ? 'partially_paid' : 'partially_received';
          } else {
            actual.status = actual.type === 'payable' ? 'paid' : 'received';
          }
          actualFound = true;
          break;
        }
      }
      
      return actualFound ? { ...state, allActuals: newAllActuals } : state;
    }
    case 'RECORD_PAYMENT': {
        const { actualId, paymentData } = action.payload;
        const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
        let nextState = { ...state };
        let actualFound = false;

        for (const projectId in newAllActuals) {
            const projectActuals = newAllActuals[projectId];
            const index = projectActuals.findIndex(a => a.id === actualId);

            if (index > -1) {
                const actual = projectActuals[index];
                actual.payments = [...(actual.payments || []), { ...paymentData, id: uuidv4() }];
                const totalPaid = actual.payments.reduce((sum, p) => sum + p.paidAmount, 0);

                if (paymentData.isFinalPayment || totalPaid >= actual.amount) {
                    actual.status = actual.type === 'payable' || actual.type === 'internal_transfer' ? 'paid' : 'received';
                } else {
                    actual.status = actual.type === 'payable' || actual.type === 'internal_transfer' ? 'partially_paid' : 'partially_received';
                }
                
                actualFound = true;
                nextState = { ...state, allActuals: newAllActuals };

                if (actual.isProvision && actual.status === 'paid') {
                    const allProvisionsForBudget = projectActuals.filter(a => a.budgetId === actual.budgetId && a.isProvision);
                    const allProvisionsPaid = allProvisionsForBudget.every(p => p.status === 'paid');

                    if (allProvisionsPaid) {
                        const finalPaymentActual = projectActuals.find(a => a.budgetId === actual.budgetId && a.isFinalProvisionPayment);
                        if (finalPaymentActual) {
                            nextState.infoModal = {
                                isOpen: true,
                                title: 'Provision Terminée !',
                                message: `La provision pour "${finalPaymentActual.description.replace('Paiement final pour: ', '')}" est maintenant complète. Vous pouvez procéder au paiement final auprès de ${finalPaymentActual.thirdParty}.`
                            };
                        }
                    }
                }
                break; 
            }
        }
        return nextState;
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };

    default:
      return state;
  }
};

// --- Context and Provider ---
const BudgetContext = createContext();

const loadInitialState = () => {
    try {
        const savedState = localStorage.getItem('budgetAppState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            if (parsedState.categories && parsedState.categories.revenue) {
                const nameMapping = {
                    'Revenus des Ventes': 'Entrées des Ventes',
                    'Revenus Financiers': 'Entrées Financières',
                    'Autres Revenus': 'Autres Entrées',
                };
                parsedState.categories.revenue.forEach(cat => {
                    if (nameMapping[cat.name]) {
                        cat.name = nameMapping[cat.name];
                    }
                });
            }

            if (!parsedState.scenarios) {
              parsedState.scenarios = initialScenarios;
            } else {
              parsedState.scenarios = parsedState.scenarios.map(s => ({
                ...s,
                isVisible: s.isVisible === undefined ? true : s.isVisible,
              }));
            }
            if (!parsedState.scenarioEntries) parsedState.scenarioEntries = initialScenarioEntries;
            if (!parsedState.infoModal) parsedState.infoModal = { isOpen: false, title: '', message: '' };

            if (parsedState.categories && parsedState.categories.expense) {
                const initialExpenseCategories = initialCategories.expense;
                initialExpenseCategories.forEach(initialCat => {
                    const exists = parsedState.categories.expense.some(savedCat => savedCat.id === initialCat.id);
                    if (!exists) parsedState.categories.expense.push(initialCat);
                });
            }

            if (!parsedState.userCashAccounts || !Array.isArray(parsedState.userCashAccounts)) {
                parsedState.userCashAccounts = initialUserCashAccounts;
            } else {
                const migrationMapping = {
                    'proCurrent': 'bank',
                    'persoCurrent': 'bank',
                    'savings': 'savings',
                    'blocked': 'provisions',
                    'investment': 'savings',
                    'cash': 'cash',
                    'other': 'savings',
                };
                const validCategories = mainCashAccountCategories.map(c => c.id);
                parsedState.userCashAccounts.forEach(acc => {
                    if (migrationMapping[acc.mainCategoryId]) {
                        acc.mainCategoryId = migrationMapping[acc.mainCategoryId];
                    } else if (!validCategories.includes(acc.mainCategoryId)) {
                        acc.mainCategoryId = 'savings';
                    }
                });
            }

            if (parsedState.projects && Array.isArray(parsedState.projects)) {
                parsedState.projects.forEach(p => {
                    if (!p.expenseTargets) p.expenseTargets = getDefaultExpenseTargets();
                    if (!p.annualGoals) p.annualGoals = {};
                    if (p.isArchived === undefined) p.isArchived = false;
                    delete p.currency;
                });
            }
            
            if (!parsedState.currentView) {
                parsedState.currentView = 'dashboard';
            }
            
            if (parsedState.settings && !parsedState.settings.currency) {
                parsedState.settings.currency = '€';
            }
            
            if (!parsedState.displayYear) {
                parsedState.displayYear = new Date().getFullYear();
            }

            delete parsedState.users;
            delete parsedState.permissions;
            delete parsedState.isAuthenticated;

            return {
              ...parsedState,
              isActualEditorDrawerOpen: false,
              editingActualId: null,
            };
        }
    } catch (e) {
        console.error("Failed to load state from localStorage", e);
    }
    
    return {
        projects: initialProjects,
        categories: initialCategories,
        allEntries: initialEntries,
        allActuals: initialActuals,
        userCashAccounts: initialUserCashAccounts,
        tiers: initialTiers,
        settings: initialSettings,
        scenarios: initialScenarios,
        scenarioEntries: initialScenarioEntries,
        infoModal: { isOpen: false, title: '', message: '' },
        activeProjectId: initialProjects[0]?.id,
        currentView: 'dashboard',
        displayYear: new Date().getFullYear(),
        activeSettingsDrawer: null,
        isBudgetModalOpen: false,
        editingEntry: null,
        isActualEditorDrawerOpen: false,
        editingActualId: null,
    };
};

export const BudgetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, undefined, loadInitialState);

  useEffect(() => {
    try {
        const stateToSave = { ...state };
        delete stateToSave.isAuthenticated; // Ensure auth state is never saved
        localStorage.setItem('budgetAppState', JSON.stringify(stateToSave));
    } catch (e) {
        console.error("Failed to save state to localStorage", e);
    }
  }, [state]);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
