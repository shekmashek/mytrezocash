import { v4 as uuidv4 } from 'uuid';
import { getEntryAmountForMonth } from './budgetCalculations';

export const deriveActualsFromEntry = (entry, projectId, userCashAccounts = []) => {
  const newActualsList = [];
  const actualType = entry.type === 'depense' ? 'payable' : 'receivable';

  if (entry.frequency === 'provision') {
    if (!entry.provisionDetails || !entry.payments) return [];
    
    // Create monthly provision transfer actuals
    entry.payments.forEach(payment => {
      newActualsList.push({
        id: uuidv4(),
        budgetId: entry.id,
        projectId: projectId,
        type: 'payable', // Internal transfer is a payable from one perspective
        category: 'Épargne et Provision',
        date: payment.date,
        amount: parseFloat(payment.amount),
        thirdParty: `Provision vers ${userCashAccounts.find(acc => acc.id === entry.provisionDetails.provisionAccountId)?.name || 'Compte Provision'}`,
        description: `Provision pour: ${entry.description}`,
        status: 'pending',
        payments: [],
        isProvision: true,
        provisionDetails: {
          ...entry.provisionDetails,
          sourceAccountId: null, // To be defined at payment time
          destinationAccountId: entry.provisionDetails.provisionAccountId
        }
      });
    });

    // Create final payable actual for the supplier
    newActualsList.push({
      id: uuidv4(),
      budgetId: entry.id,
      projectId: projectId,
      type: 'payable',
      category: entry.category,
      date: entry.provisionDetails.finalPaymentDate,
      amount: entry.amount,
      thirdParty: entry.supplier,
      description: `Paiement final pour: ${entry.description}`,
      status: 'pending',
      payments: [],
      isFinalProvisionPayment: true,
      provisionDetails: entry.provisionDetails
    });

  } else {
    const startYear = entry.startDate ? new Date(entry.startDate).getFullYear() : new Date().getFullYear();
    // Look ahead 5 years for recurring entries without an end date
    const endYear = entry.endDate ? new Date(entry.endDate).getFullYear() : startYear + 5;

    for (let year = startYear; year <= endYear; year++) {
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const amountForMonth = getEntryAmountForMonth(entry, monthIndex, year);
        if (amountForMonth > 0) {
          newActualsList.push({
            id: uuidv4(),
            budgetId: entry.id,
            projectId: projectId,
            type: actualType,
            category: entry.category,
            date: new Date(year, monthIndex, 1).toISOString().split('T')[0],
            amount: amountForMonth,
            thirdParty: entry.supplier,
            description: `Budget: ${entry.description || entry.category}`,
            status: 'pending',
            payments: []
          });
        }
      }
    }
  }
  return newActualsList;
};


export const generateScenarioActuals = (baseEntries, baseActuals, scenarioDeltas, projectId, userCashAccounts) => {
  const baseEntryMap = new Map(baseEntries.map(e => [e.id, e]));
  let scenarioActuals = [...baseActuals];
  const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];

  const deltasMap = new Map(scenarioDeltas.map(d => [d.id, d]));

  deltasMap.forEach((delta, entryId) => {
    // Remove all existing unsettled actuals related to this budgetId
    scenarioActuals = scenarioActuals.filter(a => !(a.budgetId === entryId && unsettledStatuses.includes(a.status)));

    if (!delta.isDeleted) {
      // It's a modification or a new entry that was modified
      const baseEntry = baseEntryMap.get(entryId);
      const modifiedEntry = { ...(baseEntry || {}), ...delta, projectId }; // Ensure projectId is set
      const newGeneratedActuals = deriveActualsFromEntry(modifiedEntry, projectId, userCashAccounts);
      scenarioActuals.push(...newGeneratedActuals);
    }
    // If it isDeleted, they are already removed and we don't add them back.
  });
  
  return scenarioActuals;
};
