import React from 'react';
import { X, Mail, Lock, Github, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle } from '../firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-bg/50 text-text hover:bg-brand hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand/20">
                <Chrome className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-text mb-2">Bem-vindo de volta</h2>
              <p className="text-text-muted">Entre para sincronizar sua lista em todos os dispositivos.</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Entrar com Google
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-text-muted font-bold tracking-widest">Ou continue com</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="password"
                    placeholder="Senha"
                    className="w-full bg-bg border border-border rounded-2xl py-4 pl-12 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                  />
                </div>
              </div>

              <button className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-brand/80 transition-all shadow-lg shadow-brand/20 mt-4">
                Entrar
              </button>

              <p className="text-center text-sm text-text-muted mt-6">
                Não tem uma conta? <button className="text-brand font-bold hover:underline">Cadastre-se</button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
