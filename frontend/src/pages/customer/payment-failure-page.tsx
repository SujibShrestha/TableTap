import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentFailurePage() {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-2xl shadow-card p-8 text-center">
          <div className="mx-auto size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <XCircle className="size-8 text-destructive" strokeWidth={2} aria-hidden="true" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
            Payment Not Completed
          </h1>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant mb-8 leading-relaxed">
            Your payment was not completed. No charges have been made.
            Return to the menu and try again, or choose a different payment method.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleRetry}
            >
              <ArrowLeft className="size-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
