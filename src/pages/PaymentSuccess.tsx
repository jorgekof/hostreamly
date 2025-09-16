import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Receipt } from "lucide-react";
import api, { apiClient } from '@/lib/api';
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const updatePaymentStatus = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.post('/payments/confirm', { session_id: sessionId });
        const data = response.data;
        
        if (data) {
          setPaymentDetails(data);
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    updatePaymentStatus();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            ¡Pago Exitoso!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Tu pago por uso adicional ha sido procesado correctamente.</p>
          </div>

          {paymentDetails && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Detalles del Pago</span>
              </div>
              
              {paymentDetails.storage_overage_gb > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Almacenamiento adicional:</span>
                  <span>{paymentDetails.storage_overage_gb} GB - ${paymentDetails.storage_charge}</span>
                </div>
              )}
              
              {paymentDetails.bandwidth_overage_gb > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Transferencia adicional:</span>
                  <span>{paymentDetails.bandwidth_overage_gb} GB - ${paymentDetails.bandwidth_charge}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${paymentDetails.total_charge}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/dashboard">
                Ir al Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Inicio
              </Link>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>
              Recibirás un email de confirmación con los detalles de tu pago.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
