import React from 'react';
import { Check, Zap, Shield, Tv, Smartphone, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 19,90',
    description: 'Perfeito para assistir sozinho no seu celular.',
    features: ['Qualidade HD (720p)', '1 Tela simultânea', 'Assista no celular e tablet', 'Sem anúncios'],
    icon: <Smartphone className="w-8 h-8" />,
    color: 'bg-blue-500'
  },
  {
    id: 'standard',
    name: 'Padrão',
    price: 'R$ 39,90',
    description: 'A melhor experiência para casais e famílias pequenas.',
    features: ['Qualidade Full HD (1080p)', '2 Telas simultâneas', 'Assista em todos os dispositivos', 'Downloads ilimitados'],
    icon: <Tv className="w-8 h-8" />,
    color: 'bg-brand',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 54,90',
    description: 'O máximo em qualidade cinematográfica.',
    features: ['Qualidade 4K + HDR', '4 Telas simultâneas', 'Áudio Dolby Atmos', 'Acesso antecipado a lançamentos'],
    icon: <Monitor className="w-8 h-8" />,
    color: 'bg-purple-600'
  }
];

export const Plans: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black mb-6 text-text"
        >
          Escolha o seu <span className="text-brand">Plano</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-text-muted max-w-2xl mx-auto"
        >
          Assine hoje e tenha acesso ilimitado a milhares de filmes, séries e documentários exclusivos.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className={`relative p-8 rounded-3xl border ${
              plan.popular ? 'border-brand bg-brand/5 shadow-2xl shadow-brand/10' : 'border-border bg-surface'
            } flex flex-col h-full group hover:border-brand/50 transition-colors`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                Mais Popular
              </div>
            )}

            <div className={`w-16 h-16 rounded-2xl ${plan.color} flex items-center justify-center mb-6 shadow-lg text-white`}>
              {plan.icon}
            </div>

            <h3 className="text-2xl font-bold mb-2 text-text">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-text">{plan.price}</span>
              <span className="text-text-muted text-sm">/mês</span>
            </div>
            <p className="text-text-muted text-sm mb-8">{plan.description}</p>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  <div className="flex-none w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                  <span className="text-text-muted">{feature}</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all ${
              plan.popular 
                ? 'bg-brand text-white hover:bg-brand/80 shadow-lg shadow-brand/20' 
                : 'bg-surface border border-border text-text hover:bg-bg'
            }`}>
              Começar Agora
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-border pt-20">
        <div className="flex flex-col items-center text-center">
          <Zap className="w-10 h-10 text-brand mb-4" />
          <h4 className="text-lg font-bold mb-2 text-text">Sem Fidelidade</h4>
          <p className="text-text-muted text-sm">Cancele quando quiser, sem taxas ou burocracia.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <Shield className="w-10 h-10 text-brand mb-4" />
          <h4 className="text-lg font-bold mb-2 text-text">Pagamento Seguro</h4>
          <p className="text-text-muted text-sm">Seus dados protegidos com criptografia de ponta.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <Tv className="w-10 h-10 text-brand mb-4" />
          <h4 className="text-lg font-bold mb-2 text-text">Multi-Dispositivo</h4>
          <p className="text-text-muted text-sm">Assista na TV, Celular, Tablet ou Computador.</p>
        </div>
      </div>
    </div>
  );
};
