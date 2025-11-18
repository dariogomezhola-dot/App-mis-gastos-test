
import React, { useState } from 'react';
import { Card } from './common/Card';
import { Spinner } from './common/Spinner';

interface Entity {
  id: string;
  name: string;
}

interface EntitySelectorProps {
  entities: Entity[];
  onSelectEntity: (id: string) => void;
  onCreateEntity: (name: string) => Promise<void>;
  loading: boolean;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({ entities, onSelectEntity, onCreateEntity, loading }) => {
  const [newEntityName, setNewEntityName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    setIsCreating(true);
    await onCreateEntity(newEntityName);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Seleccionar Entidad</h1>
        {loading ? (
          <div className="flex justify-center"><Spinner /></div>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {entities.length > 0 ? (
                entities.map(entity => (
                  <button
                    key={entity.id}
                    onClick={() => onSelectEntity(entity.id)}
                    className="w-full py-3 px-4 bg-gray-700 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors text-left"
                  >
                    {entity.name}
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500">No hay entidades. Crea una para empezar.</p>
              )}
            </div>
            <div className="pt-4 border-t border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-3">Crear Nueva Entidad</h2>
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  value={newEntityName}
                  onChange={e => setNewEntityName(e.target.value)}
                  placeholder="Nombre de la persona o empresa"
                  className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center w-24"
                  disabled={isCreating || !newEntityName.trim()}
                >
                  {isCreating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Crear'}
                </button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
