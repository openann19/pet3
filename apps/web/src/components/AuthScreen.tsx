import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Translate } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import SignInForm from './auth/SignInForm';
import SignUpForm from './auth/SignUpForm';

type AuthMode = 'signin' | 'signup';

interface AuthScreenProps {
  initialMode?: AuthMode;
  onBack: () => void;
  onSuccess: () => void;
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
};

const languageButtonVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

const formVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

export default function AuthScreen({ initialMode = 'signup', onBack, onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { t, language, toggleLanguage } = useApp();
  const reducedMotion = useReducedMotion();

  const handleModeSwitch = (newMode: AuthMode) => {
    haptics.trigger('selection');
    setMode(newMode);
  };

  const handleBack = () => {
    haptics.trigger('light');
    onBack();
  };

  return (
    <div className="fixed inset-0 bg-(--background-cream) overflow-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header with back button and language toggle */}
        <motion.div 
          variants={reducedMotion ? {} : headerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 flex items-center justify-between"
        >
          <button
            onClick={handleBack}
            className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={t.common.back}
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <motion.div 
            variants={reducedMotion ? {} : languageButtonVariants}
            initial="hidden"
            animate="visible"
          >
            <button
              onClick={() => {
                haptics.trigger('selection');
                toggleLanguage();
              }}
              className="h-11 px-4 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-pressed={language === 'bg'}
              aria-label={language === 'en' ? 'Switch to Bulgarian' : 'Превключи на English'}
            >
              <Translate size={18} weight="regular" aria-hidden />
              <span>{language === 'en' ? 'БГ' : 'EN'}</span>
            </button>
          </motion.div>
        </motion.div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {mode === 'signin' && (
                <motion.div
                  key="signin"
                  variants={reducedMotion ? {} : formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <SignInForm
                    onSuccess={onSuccess}
                    onSwitchToSignUp={() => { handleModeSwitch('signup'); }}
                  />
                </motion.div>
              )}
              {mode === 'signup' && (
                <motion.div
                  key="signup"
                  variants={reducedMotion ? {} : formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <SignUpForm
                    onSuccess={onSuccess}
                    onSwitchToSignIn={() => { handleModeSwitch('signin'); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
