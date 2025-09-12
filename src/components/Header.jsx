import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, ArrowDownUp, HandCoins, LayoutDashboard, Cog, Globe, Users, FolderKanban, Wallet, Layers, PieChart, BookOpen, Table, Archive, PanelLeftClose, PanelLeftOpen, Clock, Calendar } from 'lucide-react';
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
  const { state, dispatch } = useBudget();
  const { currentView, activeProjectId, settings } = state;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const isConsolidated = activeProjectId === 'consolidated';

  const [currency, setCurrency] = useState(settings.currency);
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const predefinedCurrencies = ['€', '$', '£', 'Ar'];

  const timeUnitOptions = { day: 'jours', week: 'semaines', month: 'mois', bimonthly: 'bimestres', quarterly: 'trimestres', semiannually: 'semestres', annually: 'années' };

  useEffect(() => {
    if (predefinedCurrencies.includes(settings.currency)) {
      setCurrency(settings.currency);
      setIsCustom(false);
      setCustomCurrency('');
    } else {
      setCurrency('custom');
      setCustomCurrency(settings.currency);
      setIsCustom(true);
    }
  }, [settings.currency]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) setIsSettingsOpen(false);
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
    { id: 'categoryManagement', label: 'Catégories', icon: FolderKanban, color: 'text-orange-500', disabled: false },
    { id: 'tiersManagement', label: 'Tiers', icon: Users, color: 'text-pink-500', disabled: false },
    { id: 'cashAccounts', label: 'Comptes', icon: Wallet, color: 'text-teal-500', disabled: false },
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
  
  const handleSettingsChange = (key, value) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...settings, [key]: value } });
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    setCurrency(value);
    if (value === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      handleSettingsChange('currency', value);
    }
  };

  const handleCustomCurrencyChange = (e) => {
    const newCustomCurrency = e.target.value;
    setCustomCurrency(newCustomCurrency);
    if (newCustomCurrency.trim()) {
      handleSettingsChange('currency', newCustomCurrency.trim());
    }
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

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
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
        
        <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            <hr className="my-2 mx-2 border-gray-200" />
            <div className="px-4 pt-2 pb-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paramètres</h3>
            </div>
            <ul className="space-y-1 px-2 mt-1">
                <li className="text-sm px-2 py-2">
                    <label className="block font-medium text-gray-600 mb-1 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Devise
                    </label>
                    <select 
                      value={currency} 
                      onChange={handleCurrencyChange} 
                      className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
                    >
                      {predefinedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="custom">Personnalisé...</option>
                    </select>
                    {isCustom && (
                        <input
                            type="text"
                            value={customCurrency}
                            onChange={handleCustomCurrencyChange}
                            placeholder="Symbole"
                            className="w-full text-sm mt-2 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
                            maxLength="5"
                        />
                    )}
                </li>
                <li className="text-sm px-2 py-2">
                    <label className="block font-medium text-gray-600 mb-1">Unité d'affichage</label>
                    <select 
                      value={settings.displayUnit || 'standard'} 
                      onChange={(e) => handleSettingsChange('displayUnit', e.target.value)} 
                      className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
                    >
                      <option value="standard">Standard</option>
                      <option value="thousands">Milliers (K)</option>
                      <option value="millions">Millions (M)</option>
                    </select>
                </li>
                <li className="text-sm px-2 py-2">
                    <label className="block font-medium text-gray-600 mb-1">Décimales</label>
                    <select 
                      value={settings.decimalPlaces ?? 2} 
                      onChange={(e) => handleSettingsChange('decimalPlaces', Number(e.target.value))} 
                      className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                </li>
                <li className="text-sm px-2 py-2">
                    <label className="block font-medium text-gray-600 mb-1 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        Unité d'analyse
                    </label>
                    <select 
                        value={settings.timeUnit || 'month'} 
                        onChange={(e) => handleSettingsChange('timeUnit', e.target.value)} 
                        className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
                    >
                        <option value="day">Jour</option>
                        <option value="week">Semaine</option>
                        <option value="month">Mois</option>
                        <option value="bimonthly">Bimestre</option>
                        <option value="quarterly">Trimestre</option>
                        <option value="semiannually">Semestre</option>
                        <option value="annually">Année</option>
                    </select>
                </li>
                <li className="text-sm px-2 py-2">
                    <label className="block font-medium text-gray-600 mb-1 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Horizon d'analyse
                    </label>
                    <select 
                        value={settings.horizonLength || 12} 
                        onChange={(e) => handleSettingsChange('horizonLength', Number(e.target.value))} 
                        className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
                    >
                        <option value={6}>6 {timeUnitOptions[settings.timeUnit]}</option>
                        <option value={8}>8 {timeUnitOptions[settings.timeUnit]}</option>
                        <option value={10}>10 {timeUnitOptions[settings.timeUnit]}</option>
                        <option value={12}>12 {timeUnitOptions[settings.timeUnit]}</option>
                    </select>
                </li>
            </ul>
        </div>
      </nav>

      <div className="px-2 py-4 border-t">
        <div ref={settingsRef} className={`${isCollapsed ? 'relative' : ''}`}>
          <button title={isCollapsed ? 'Paramètres avancés' : ''} onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`flex items-center w-full h-12 px-4 rounded-lg text-sm font-semibold transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900`}>
            <Cog className="w-5 h-5 shrink-0" />
            <span className={`ml-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Avancés
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
      </div>
    </aside>
  );
};

export default Header;
