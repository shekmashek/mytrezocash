import React, { useState, useRef, useEffect } from 'react';
import { User, BarChart3, ArrowDownUp, HandCoins, LayoutDashboard, Cog, Globe, Users, FolderKanban, Wallet, Layers, PieChart, BookOpen, Table, UserCog, Archive, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';

const NavLink = ({ item, isCollapsed, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <li title={isCollapsed ? item.label : ''}>
      <button 
        onClick={onClick} 
        disabled={item.disabled}
        className={`flex items-center w-full h-12 px-4 rounded-lg text-sm font-semibold transition-colors ${
          isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className={`ml-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {item.label}
        </span>
      </button>
    </li>
  );
};

const SettingsLink = ({ item, isCollapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <li title={isCollapsed ? item.label : ''}>
      <button 
        onClick={onClick} 
        disabled={item.disabled}
        className={`flex items-center w-full h-10 px-4 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${item.color}`} />
        <span className={`ml-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {item.label}
        </span>
      </button>
    </li>
  );
};

const Header = ({ isCollapsed, onToggleCollapse, onOpenSettingsDrawer }) => {
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
    { id: 'userManagement', label: 'Utilisateurs', icon: UserCog, color: 'text-cyan-500', disabled: false },
    { id: 'categoryManagement', label: 'Catégories', icon: FolderKanban, color: 'text-orange-500', disabled: false },
    { id: 'tiersManagement', label: 'Tiers', icon: Users, color: 'text-pink-500', disabled: false },
    { id: 'cashAccounts', label: 'Comptes', icon: Wallet, color: 'text-teal-500', disabled: false },
    { id: 'currency', label: 'Devise', icon: Globe, color: 'text-blue-500', disabled: false },
    { id: 'archives', label: 'Archives', icon: Archive, color: 'text-slate-500', disabled: false },
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
    <aside className={`flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <div className={`flex items-center gap-2 overflow-hidden`}>
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold text-gray-800 tracking-tight transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            Trezocash
          </span>
        </div>
        {!isCollapsed && (
          <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-gray-100">
            <PanelLeftClose className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
      
      {isCollapsed && (
        <div className="flex items-center justify-center h-16 border-b">
          <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-gray-100">
            <PanelLeftOpen className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      <nav className="flex-1 px-2 py-4 space-y-2">
        <ul>
          {navItems.map(item => (
            <NavLink 
              key={item.id} 
              item={item} 
              isCollapsed={isCollapsed} 
              isActive={currentView === item.id} 
              onClick={() => handleNavigate(item.id)} 
            />
          ))}
        </ul>
      </nav>

      <div className="px-2 py-4 border-t">
        <div ref={settingsRef} className={`${isCollapsed ? 'relative' : ''}`}>
          <button title={isCollapsed ? 'Paramètres' : ''} onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`flex items-center w-full h-12 px-4 rounded-lg text-sm font-semibold transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900`}>
            <Cog className="w-5 h-5 shrink-0" />
            <span className={`ml-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Paramètres
            </span>
          </button>
          {isSettingsOpen && (
            <div className={`bg-white border rounded-lg shadow-xl z-10 ${isCollapsed ? 'absolute bottom-0 left-full ml-2 w-56' : 'relative bottom-full mb-2 w-full'}`}>
              <ul className="py-2">
                {settingsItems.map(item => (
                  <SettingsLink 
                    key={item.id} 
                    item={item} 
                    isCollapsed={false}
                    onClick={() => handleSettingsItemClick(item.id)} 
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className={`${isCollapsed ? 'relative' : ''}`}>
          <button title={isCollapsed ? 'Mon Compte' : ''} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={`flex items-center w-full h-12 px-4 rounded-lg text-sm font-semibold transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900`}>
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <span className={`ml-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Mon Compte
            </span>
          </button>
          {isUserMenuOpen && (
            <div className={`bg-white border rounded-lg shadow-xl z-10 ${isCollapsed ? 'absolute bottom-0 left-full ml-2 w-48' : 'relative bottom-full mb-2 w-full'}`}>
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
    </aside>
  );
};

export default Header;
