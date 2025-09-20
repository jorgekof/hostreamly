import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Pago Cancelado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>
              El proceso de pago fue cancelado. No se realizó ningún cargo a tu cuenta.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-2">¿Qué puedes hacer ahora?</p>
              <ul className="space-y-1 text-xs">
                <li>• Revisar los detalles del pago en tu dashboard</li>
                <li>• Intentar el pago nuevamente</li>
                <li>• Contactar soporte si necesitas ayuda</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/dashboard" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Intentar Nuevamente
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
              Si continúas teniendo problemas, contacta a nuestro equipo de soporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
