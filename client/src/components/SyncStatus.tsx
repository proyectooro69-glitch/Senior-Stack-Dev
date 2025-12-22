import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { SyncStatus as SyncStatusType } from "@shared/schema";

interface SyncStatusProps {
  status: SyncStatusType;
}

export function SyncStatus({ status }: SyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Cloud,
          text: 'Conectado',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          dotColor: 'bg-emerald-500',
        };
      case 'offline':
        return {
          icon: CloudOff,
          text: 'Sin conexión',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-400',
          iconColor: 'text-red-600 dark:text-red-400',
          dotColor: 'bg-red-500',
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          text: 'Sincronizando',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-400',
          iconColor: 'text-amber-600 dark:text-amber-400',
          dotColor: 'bg-amber-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${config.bgColor}`}
      data-testid="sync-status"
    >
      <motion.div
        className={`h-2 w-2 rounded-full ${config.dotColor}`}
        animate={status === 'syncing' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {status === 'syncing' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </motion.div>
      ) : (
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
      )}
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}
