import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanLimitWarningProps {
  message: string;
  showUpgrade?: boolean;
  variant?: "default" | "destructive";
}

export const PlanLimitWarning = ({ 
  message, 
  showUpgrade = true, 
  variant = "destructive" 
}: PlanLimitWarningProps) => {
  const navigate = useNavigate();

  return (
    <Alert variant={variant} className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {showUpgrade && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/#pricing')}
            className="ml-4"
          >
            <Zap className="w-4 h-4 mr-2" />
            Actualizar Plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
