import React, { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import { LayoutDashboard, Wallet, Landmark, PiggyBank, FileWarning, HandCoins } from 'lucide-react';

const DashboardView = () => {
  const { state } = useBudget();
  const { activeProjectId, projects, allActuals, userCashAccounts, settings } = state;
  
  const isConsolidated = activeProjectId === 'consolidated';

  const relevantActuals = useMemo(() => {
    return isConsolidated
      ? Object.values(allActuals).flat()
      : allActuals[activeProjectId] || [];
  }, [activeProjectId, allActuals, isConsolidated]);

  const accountBalances = useMemo(() => {
    const accountsForProject = isConsolidated
      ? userCashAccounts
      : userCashAccounts.filter(acc => acc.projectId === activeProjectId);

    return accountsForProject.map(account => {
      let currentBalance = parseFloat(account.initialBalance) || 0;
      const accountPayments = relevantActuals
        .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));
      
      for (const payment of accountPayments) {
        if (payment.type === 'receivable') {
          currentBalance += payment.paidAmount;
        } else if (payment.type === 'payable') {
          currentBalance -= payment.paidAmount;
        }
      }

      const blockedForProvision = relevantActuals
        .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
        .reduce((sum, actual) => {
          const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
          return sum + (actual.amount - paidAmount);
        }, 0);

      return { id: account.id, name: account.name, balance: currentBalance, blockedForProvision, actionableBalance: currentBalance - blockedForProvision };
    });
  }, [userCashAccounts, relevantActuals, isConsolidated, activeProjectId]);

  const inProgressProvisions = useMemo(() => {
    const finalPaymentEntries = relevantActuals.filter(
      actual => actual.isFinalProvisionPayment && actual.status !== 'paid'
    );

    return finalPaymentEntries.map(finalPayment => {
      const provisionTransfers = relevantActuals.filter(
        actual => actual.isProvision && actual.budgetId === finalPayment.budgetId
      );

      const totalProvisioned = provisionTransfers.reduce((sum, transfer) => {
        const paidInTransfer = (transfer.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
        return sum + paidInTransfer;
      }, 0);

      return {
        id: finalPayment.id,
        goal: finalPayment.description.replace('Paiement final pour: ', ''),
        description: finalPayment.description,
        supplier: finalPayment.thirdParty,
        totalAmount: finalPayment.amount,
        finalDate: finalPayment.date,
        provisionedAmount: totalProvisioned,
      };
    });
  }, [relevantActuals]);

  const overduePayables = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return relevantActuals
      .filter(actual => {
        const dueDate = new Date(actual.date);
        return (
          actual.type === 'payable' &&
          ['pending', 'partially_paid'].includes(actual.status) &&
          dueDate < today
        );
      })
      .map(actual => {
        const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
        const remainingAmount = actual.amount - totalPaid;
        return { ...actual, remainingAmount };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [relevantActuals]);

  const overdueReceivables = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return relevantActuals
      .filter(actual => {
        const dueDate = new Date(actual.date);
        return (
          actual.type === 'receivable' &&
          ['pending', 'partially_received'].includes(actual.status) &&
          dueDate < today
        );
      })
      .map(actual => {
        const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
        const remainingAmount = actual.amount - totalPaid;
        return { ...actual, remainingAmount };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [relevantActuals]);

  const totalActionableBalance = accountBalances.reduce((sum, acc) => sum + acc.actionableBalance, 0);

  const provisionTotals = useMemo(() => {
    const totalGoal = inProgressProvisions.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalProvisioned = inProgressProvisions.reduce((sum, p) => sum + p.provisionedAmount, 0);
    const totalProgressPercentage = totalGoal > 0 ? (totalProvisioned / totalGoal) * 100 : 0;
    return { totalGoal, totalProvisioned, totalProgressPercentage };
  }, [inProgressProvisions]);

  const overduePayablesTotals = useMemo(() => {
    return overduePayables.reduce((acc, payable) => {
      acc.totalDue += payable.amount;
      acc.totalRemaining += payable.remainingAmount;
      return acc;
    }, { totalDue: 0, totalRemaining: 0 });
  }, [overduePayables]);

  const overdueReceivablesTotals = useMemo(() => {
    return overdueReceivables.reduce((acc, receivable) => {
      acc.totalDue += receivable.amount;
      acc.totalRemaining += receivable.remainingAmount;
      return acc;
    }, { totalDue: 0, totalRemaining: 0 });
  }, [overdueReceivables]);

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          Tableau de Bord
        </h1>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Soldes Actuels par Compte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-lg text-green-800">Trésorerie Actionnable Totale</h3>
            </div>
            <p className="text-3xl font-bold text-green-900 mt-2">{formatCurrency(totalActionableBalance, settings)}</p>
            <p className="text-xs text-green-600 mt-1">C'est le montant réellement disponible après déduction des provisions bloquées.</p>
          </div>
          {accountBalances.map(account => (
            <div key={account.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3 mb-3">
                <Landmark className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">{account.name}</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Total Actuel</span>
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(account.balance, settings)}</p>
                </div>
                <div>
                  <span className="text-xs text-orange-500">Provisions Bloquées</span>
                  <p className="text-lg font-semibold text-orange-600">{formatCurrency(account.blockedForProvision, settings)}</p>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs font-bold text-green-600">SOLDE ACTIONNABLE</span>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(account.actionableBalance, settings)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Provisions en Cours</h2>
        {inProgressProvisions.length === 0 ? (
          <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-sm border">
            <PiggyBank className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune provision en cours.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Objectif / Fournisseur</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Date Échéance</th>
                    <th className="px-6 py-4 text-right">Montant Total</th>
                    <th className="px-6 py-4 text-right">Provision Effectuée</th>
                    <th className="px-6 py-4 text-left w-48">Progression</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inProgressProvisions.map(provision => {
                    const progressPercentage = provision.totalAmount > 0 ? (provision.provisionedAmount / provision.totalAmount) * 100 : 0;
                    return (
                      <tr key={provision.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{provision.goal}</div>
                          <div className="text-sm text-gray-500">{provision.supplier}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={provision.description}>
                          {provision.description}
                        </td>
                        <td className="px-6 py-4 font-medium">{new Date(provision.finalDate).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-right font-semibold text-lg text-gray-800">{formatCurrency(provision.totalAmount, settings)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-lg text-indigo-600">{formatCurrency(provision.provisionedAmount, settings)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <span className="font-semibold text-sm">{progressPercentage.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold border-t-2">
                  <tr>
                    <td className="px-6 py-4 text-left" colSpan={3}>Total des Provisions</td>
                    <td className="px-6 py-4 text-right text-lg">{formatCurrency(provisionTotals.totalGoal, settings)}</td>
                    <td className="px-6 py-4 text-right text-lg text-indigo-700">{formatCurrency(provisionTotals.totalProvisioned, settings)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-300 rounded-full h-2.5">
                          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${provisionTotals.totalProgressPercentage}%` }}></div>
                        </div>
                        <span className="font-semibold text-sm">{provisionTotals.totalProgressPercentage.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dettes Impayées (Arriérés)</h2>
        {overduePayables.length === 0 ? (
          <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-sm border">
            <FileWarning className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune dette en arriéré. Félicitations !</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Date Échéance</th>
                    <th className="px-6 py-4 text-left">Fournisseur</th>
                    <th className="px-6 py-4 text-left">Catégorie</th>
                    <th className="px-6 py-4 text-right">Montant Dû</th>
                    <th className="px-6 py-4 text-right">Montant Restant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overduePayables.map(payable => (
                    <tr key={payable.id} className="hover:bg-red-50">
                      <td className="px-6 py-4 font-medium text-red-600">{new Date(payable.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{payable.thirdParty}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payable.category}</td>
                      <td className="px-6 py-4 text-right font-semibold text-lg text-gray-800">{formatCurrency(payable.amount, settings)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-lg text-red-600">{formatCurrency(payable.remainingAmount, settings)}</td>
                    </tr>

                  ))}
                </tbody>
                <tfoot className="bg-red-100 font-bold border-t-2 border-red-200">
                  <tr>
                    <td className="px-6 py-4 text-left text-red-800" colSpan={3}>Total des Arriérés</td>
                    <td className="px-6 py-4 text-right text-lg text-red-800">{formatCurrency(overduePayablesTotals.totalDue, settings)}</td>
                    <td className="px-6 py-4 text-right text-lg text-red-800">{formatCurrency(overduePayablesTotals.totalRemaining, settings)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Créances Échues (Arriérés)</h2>
        {overdueReceivables.length === 0 ? (
          <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-sm border">
            <HandCoins className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune créance en arriéré. Excellent !</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Date Échéance</th>
                    <th className="px-6 py-4 text-left">Client</th>
                    <th className="px-6 py-4 text-left">Catégorie</th>
                    <th className="px-6 py-4 text-right">Montant Dû</th>
                    <th className="px-6 py-4 text-right">Montant Restant</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overdueReceivables.map(receivable => (
                    <tr key={receivable.id} className="hover:bg-green-50">
                      <td className="px-6 py-4 font-medium text-green-600">{new Date(receivable.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{receivable.thirdParty}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{receivable.category}</td>
                      <td className="px-6 py-4 text-right font-semibold text-lg text-gray-800">{formatCurrency(receivable.amount, settings)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-lg text-green-600">{formatCurrency(receivable.remainingAmount, settings)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-green-100 font-bold border-t-2 border-green-200">
                  <tr>
                    <td className="px-6 py-4 text-left text-green-800" colSpan={3}>Total des Créances Échues</td>
                    <td className="px-6 py-4 text-right text-lg text-green-800">{formatCurrency(overdueReceivablesTotals.totalDue, settings)}</td>
                    <td className="px-6 py-4 text-right text-lg text-green-800">{formatCurrency(overdueReceivablesTotals.totalRemaining, settings)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
