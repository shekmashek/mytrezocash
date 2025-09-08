import React, { useState } from 'react';
import { UserPlus, Trash2, ShieldQuestion } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';

const UserManagementView = () => {
  const { state, dispatch } = useBudget();
  const { users, projects, permissions } = state;

  const [newUserEmail, setNewUserEmail] = useState('');

  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUserEmail.trim()) {
      dispatch({ type: 'ADD_USER', payload: { email: newUserEmail.trim() } });
      setNewUserEmail('');
    }
  };

  const handleDeleteUser = (userId) => {
    dispatch({ type: 'DELETE_USER', payload: userId });
  };

  const handlePermissionChange = (userId, projectId, role) => {
    dispatch({ type: 'UPDATE_USER_PERMISSIONS', payload: { userId, projectId, role } });
  };

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'editor', label: 'Éditeur' },
    { value: 'viewer', label: 'Lecteur' },
    { value: 'none', label: 'Aucun accès' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Inviter un nouveau collaborateur
        </h2>
        <form onSubmit={handleAddUser} className="flex gap-2">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Adresse e-mail du collaborateur"
            className="flex-grow px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            Inviter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-6 flex items-center gap-2">
          <ShieldQuestion className="w-5 h-5 text-gray-600" />
          Matrice des Permissions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-gray-500 uppercase tracking-wider">Collaborateur</th>
                {projects.map(project => (
                  <th key={project.id} className="px-6 py-4 text-center font-medium text-gray-500 uppercase tracking-wider truncate" title={project.name}>
                    {project.name}
                  </th>
                ))}
                <th className="px-6 py-4 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  {projects.map(project => (
                    <td key={project.id} className="px-6 py-4 text-center">
                      <select
                        value={permissions[user.id]?.[project.id] || 'none'}
                        onChange={(e) => handlePermissionChange(user.id, project.id, e.target.value)}
                        disabled={user.isOwner}
                        className="px-2 py-1 border rounded-md text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    {!user.isOwner && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
