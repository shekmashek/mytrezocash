import React, { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import ProjectSwitcher from './ProjectSwitcher';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Avatar = ({ name }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold border-2 border-white"
      title={name}
    >
      {initials}
    </div>
  );
};

const SubHeader = () => {
  const { state, dispatch } = useBudget();
  const { activeProjectId, users, permissions, displayYear, settings } = state;

  const isConsolidated = activeProjectId === 'consolidated';

  const collaborators = useMemo(() => {
    if (isConsolidated || !activeProjectId) return [];
    return users.filter(user => permissions[user.id]?.[activeProjectId] && permissions[user.id][activeProjectId] !== 'none');
  }, [activeProjectId, users, permissions, isConsolidated]);
  
  const handleYearChange = (newYear) => {
    dispatch({ type: 'SET_DISPLAY_YEAR', payload: newYear });
  };

  const handleSettingsChange = (key, value) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { ...settings, [key]: value } });
  };

  return (
    <div className="bg-gray-100 border-b border-gray-200">
      <div className="container mx-auto px-6 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <ProjectSwitcher />
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-sm">
            <button onClick={() => handleYearChange(displayYear - 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-lg font-semibold text-gray-700 w-12 text-center">{displayYear}</span>
            <button onClick={() => handleYearChange(displayYear + 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Unité:</span>
              <select 
                value={settings.displayUnit || 'standard'} 
                onChange={(e) => handleSettingsChange('displayUnit', e.target.value)} 
                className="text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
              >
                <option value="standard">Standard</option>
                <option value="thousands">Milliers (K)</option>
                <option value="millions">Millions (M)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Décimales:</span>
              <select 
                value={settings.decimalPlaces ?? 2} 
                onChange={(e) => handleSettingsChange('decimalPlaces', Number(e.target.value))} 
                className="text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-1"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
          </div>
          {!isConsolidated && (
            <div className="flex items-center -space-x-2">
              {collaborators.map(user => (
                <Avatar key={user.id} name={user.name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubHeader;
