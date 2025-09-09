import React, { useState, useRef, useEffect } from 'react';
import { User, BarChart3, ArrowDownUp, HandCoins, LayoutDashboard, Cog, Globe, Users, FolderKanban, Wallet, Layers, PieChart, BookOpen, Table, UserCog, Archive, LogOut } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';

const Header = ({ onOpenSettingsDrawer }) => {
  const { state, dispatch, logout } = useBudget();
  const { currentView, activeProjectId } = state;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const settingsRef = useRef(null);
  const userMenuRef = useRef(null);

  const isConsolidated = activeProjectId === 'consolidated';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) setIsSettingsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: false },
    { id: 'budget', label: 'Budget', icon: Table, disabled: false },
    { id: 'payables', label: 'Sorties', icon: ArrowDownUp, disabled: isConsolidated },
    { id: 'receivables', label: 'Entrées', icon: HandCoins, disabled: isConsolidated },
    { id: 'expenseAnalysis', label: 'Analyse Sorties', icon: PieChart, disabled: false },
    { id: 'scenarios', label: 'Scénarios', icon: Layers, disabled: isConsolidated },
    { id: 'journals', label: 'Journaux', icon: BookOpen, disabled: false },
  ];

  const settingsItems = [
    { id: 'userManagement', label: 'Gérer les Utilisateurs', icon: UserCog, color: 'text-cyan-500', disabled: false },
    { id: 'categoryManagement', label: 'Gérer les Catégories', icon: FolderKanban, color: 'text-orange-500', disabled: false },
    { id: 'tiersManagement', label: 'Gérer les Tiers', icon: Users, color: 'text-pink-500', disabled: false },
    { id: 'cashAccounts', label: 'Gérer les Comptes', icon: Wallet, color: 'text-teal-500', disabled: false },
    { id: 'currency', label: 'Devise', icon: Globe, color: 'text-blue-500', disabled: false },
    { id: 'archives', label: 'Gérer les Archives', icon: Archive, color: 'text-slate-500', disabled: false },
  ];

  const handleNavigate = (view) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };

  const handleSettingsItemClick = (itemId) => {
    if (typeof onOpenSettingsDrawer === 'function') {
      onOpenSettingsDrawer(itemId);
    }
    setIsSettingsOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg"><BarChart3 className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">Trezocash</span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button key={item.id} onClick={() => handleNavigate(item.id)} disabled={item.disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Icon className="w-4 h-4" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"><Cog className="w-5 h-5" /></button>
            {isSettingsOpen && (
              <div className="absolute z-50 right-0 mt-2 w-64 bg-white border rounded-lg shadow-xl">
                <ul className="py-2">
                  {settingsItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button onClick={() => handleSettingsItemClick(item.id)} disabled={item.disabled} className="w-full text-left flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icon className={`w-5 h-5 ${item.color}`} />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"><User className="w-5 h-5" /></button>
            {isUserMenuOpen && (
              <div className="absolute z-50 right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl">
                <ul className="py-2">
                  <li>
                    <button onClick={logout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
