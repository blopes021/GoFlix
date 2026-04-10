import React, { useState } from 'react';
import { Plus, User, Trash2, ShieldCheck, Baby } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, createProfile, deleteProfile } from '../firebase';

interface ProfileSelectorProps {
  userId: string;
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
}

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Casper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
];

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ userId, profiles, onSelect }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isKids, setIsKids] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await createProfile(userId, {
      name: newName,
      avatar: selectedAvatar,
      isKids
    });

    setNewName('');
    setIsAdding(false);
    setIsKids(false);
  };

  const handleDelete = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este perfil?')) {
      await deleteProfile(userId, profileId);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black mb-12 text-text"
        >
          Quem está assistindo?
        </motion.h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group cursor-pointer relative"
              onClick={() => onSelect(profile)}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-transparent group-hover:border-brand transition-all shadow-xl">
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {profile.isKids && (
                  <div className="absolute top-2 right-2 bg-brand text-white p-1 rounded-lg shadow-lg">
                    <Baby className="w-4 h-4" />
                  </div>
                )}
                {isDeleting && (
                  <button
                    onClick={(e) => handleDelete(e, profile.id)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-10 h-10" />
                  </button>
                )}
              </div>
              <p className="mt-4 text-text-muted group-hover:text-text font-bold transition-colors">
                {profile.name}
              </p>
            </motion.div>
          ))}

          {profiles.length < 5 && !isAdding && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="group"
            >
              <div className="aspect-square rounded-2xl border-4 border-dashed border-border group-hover:border-brand group-hover:bg-brand/5 flex items-center justify-center transition-all">
                <Plus className="w-12 h-12 text-border group-hover:text-brand" />
              </div>
              <p className="mt-4 text-text-muted group-hover:text-text font-bold transition-colors">
                Adicionar Perfil
              </p>
            </motion.button>
          )}
        </div>

        <div className="mt-16 flex justify-center gap-4">
          <button
            onClick={() => setIsDeleting(!isDeleting)}
            className={`px-8 py-2 rounded-full font-bold border transition-all ${
              isDeleting 
                ? 'bg-red-500 border-red-500 text-white' 
                : 'border-border text-text-muted hover:text-text hover:border-text'
            }`}
          >
            {isDeleting ? 'Concluído' : 'Gerenciar Perfis'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-surface p-8 rounded-3xl max-w-md w-full border border-border"
            >
              <h2 className="text-2xl font-black mb-6 text-text">Novo Perfil</h2>
              <form onSubmit={handleAddProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                    Nome do Perfil
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: João, Maria..."
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:ring-2 focus:ring-brand/50"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
                    Escolha um Avatar
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                          selectedAvatar === avatar ? 'border-brand scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/10 rounded-lg text-brand">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">Modo Kids</p>
                      <p className="text-[10px] text-text-muted">Apenas conteúdo infantil</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKids(!isKids)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isKids ? 'bg-brand' : 'bg-border'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isKids ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-text-muted hover:text-text transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/80 transition-all shadow-lg shadow-brand/20"
                  >
                    Criar Perfil
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
