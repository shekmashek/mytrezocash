import React from 'react';
import { Archive, ArchiveRestore, Folder } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';

const ArchiveManagementView = () => {
  const { state, dispatch } = useBudget();
  const { projects } = state;

  const archivedProjects = projects.filter(p => p.isArchived);

  const handleRestoreProject = (projectId) => {
    dispatch({ type: 'RESTORE_PROJECT', payload: projectId });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Archive className="w-5 h-5 text-slate-600" />
          Projets Archivés
        </h2>
        {archivedProjects.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {archivedProjects.map(project => (
              <li key={project.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-700">{project.name}</span>
                </div>
                <button
                  onClick={() => handleRestoreProject(project.id)}
                  className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md font-medium flex items-center gap-2 text-sm"
                >
                  <ArchiveRestore className="w-4 h-4" />
                  Restaurer
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">
            Aucun projet n'a été archivé pour le moment.
          </p>
        )}
      </div>
    </div>
  );
};

export default ArchiveManagementView;
