import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Plus, Edit, Trash2, Folder, Layers, Archive } from 'lucide-react';
import ProjectModal from './ProjectModal';
import { useBudget } from '../context/BudgetContext';

const ProjectSwitcher = () => {
  const { state, dispatch } = useBudget();
  const { projects, activeProjectId } = state;
  const activeProjects = projects.filter(p => !p.isArchived);
  const activeProject = projects.find(p => p.id === activeProjectId) || { id: 'consolidated', name: 'Budget Consolidé' };

  const [isListOpen, setIsListOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingProject, setEditingProject] = useState(null);
  
  const listRef = useRef(null);

  const isConsolidated = activeProject.id === 'consolidated';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) setIsListOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProject = (projectId) => {
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: projectId });
    setIsListOpen(false);
  };

  const handleOpenModal = (mode, project = null) => {
    setModalMode(mode);
    setEditingProject(project);
    setIsModalOpen(true);
    setIsListOpen(false);
  };

  const handleSaveProject = (projectName) => {
    if (modalMode === 'add') {
      dispatch({ type: 'ADD_PROJECT', payload: projectName });
    } else if (editingProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: { projectId: editingProject.id, newName: projectName } });
    }
  };

  const handleDeleteProject = (projectId) => {
    dispatch({ type: 'DELETE_PROJECT', payload: projectId });
  };
  
  const handleArchiveProject = (projectId) => {
    dispatch({ type: 'ARCHIVE_PROJECT', payload: projectId });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={listRef}>
        <button onClick={() => setIsListOpen(!isListOpen)} className="flex items-center justify-between w-64 px-4 py-2 text-left bg-white border rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <span className="flex items-center gap-2">{isConsolidated ? <Layers className="w-5 h-5 text-purple-600" /> : <Folder className="w-5 h-5 text-blue-600" />}<span className="font-semibold text-gray-800 truncate">{activeProject.name}</span></span>
          <ChevronsUpDown className="w-4 h-4 text-gray-500" />
        </button>
        {isListOpen && (
          <div className="absolute z-30 w-full mt-1 bg-white border rounded-lg shadow-lg">
            <ul className="py-1 max-h-60 overflow-y-auto">
              <li><button onClick={() => handleSelectProject('consolidated')} className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 hover:bg-purple-50"><span className="flex items-center gap-2"><Layers className="w-4 h-4 mr-2 text-purple-600" /><span className="font-semibold">Budget Consolidé</span></span>{isConsolidated && <Check className="w-4 h-4 text-purple-600" />}</button></li>
              <li><hr className="my-1" /></li>
              {activeProjects.map(project => (
                <li key={project.id} className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 group">
                    <button onClick={() => handleSelectProject(project.id)} className="flex items-center gap-2 flex-grow truncate">
                        <Folder className="w-4 h-4 text-blue-500" />
                        <span className="truncate">{project.name}</span>
                    </button>
                    <div className="flex items-center gap-1 pl-2">
                        {project.id === activeProject.id && <Check className="w-4 h-4 text-blue-600" />}
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal('rename', project); }} className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Renommer"><Edit className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }} className="p-1 text-gray-400 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Archiver"><Archive className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </li>
              ))}
              <li><hr className="my-1" /></li>
              <li><button onClick={() => handleOpenModal('add')} className="flex items-center w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50"><Plus className="w-4 h-4 mr-2" />Nouveau projet</button></li>
            </ul>
          </div>
        )}
      </div>
      {isModalOpen && (<ProjectModal mode={modalMode} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProject} projectName={modalMode === 'rename' && editingProject ? editingProject.name : ''} />)}
    </div>
  );
};

export default ProjectSwitcher;
