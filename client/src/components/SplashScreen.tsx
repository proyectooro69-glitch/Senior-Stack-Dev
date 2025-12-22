import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ShoppingBag } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10"
          data-testid="splash-screen"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            {/* Illustration container */}
            <div className="relative mb-8">
              {/* Background circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="absolute inset-0 -m-4 rounded-full bg-primary/10"
                style={{ width: 160, height: 160 }}
              />
              
              {/* Icons composition */}
              <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="absolute"
                >
                  <ShoppingBag className="h-16 w-16 text-primary/40" strokeWidth={1.5} />
                </motion.div>
                
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="absolute -top-2 -right-2"
                >
                  <TrendingUp className="h-12 w-12 text-primary" strokeWidth={2} />
                </motion.div>
              </div>
            </div>

            {/* App name */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-3xl font-bold text-foreground tracking-tight"
            >
              VentaFácil
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-2 text-base text-muted-foreground"
            >
              Tu inventario siempre disponible
            </motion.p>
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="absolute bottom-16"
          >
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
