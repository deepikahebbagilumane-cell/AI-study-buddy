import { useUser } from "./hooks/useUser";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const { user, login, loginWithGoogle, register, updateOnboarding, logout, loading, error } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Auth 
              onLogin={login} 
              onGoogleLogin={loginWithGoogle}
              onRegister={register} 
              error={error} 
            />
          </motion.div>
        ) : !user.onboarded ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Onboarding onComplete={updateOnboarding} error={error} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard user={user} onLogout={logout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

