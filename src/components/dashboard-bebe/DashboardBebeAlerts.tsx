import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardBebeAlertsProps {
  alerts: string[];
}

export const DashboardBebeAlerts = ({ alerts }: DashboardBebeAlertsProps) => {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map((alert, index) => (
        <Alert key={index} className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {alert}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
