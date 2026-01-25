import { useState } from 'react';
import { MapPin, Check, X, Loader2, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PincodeInfo {
  pincode: string;
  city: string | null;
  state: string | null;
  delivery_days: number | null;
  cod_available: boolean | null;
}

interface PincodeCheckerProps {
  onPincodeVerified: (info: PincodeInfo | null) => void;
  initialPincode?: string;
}

export function PincodeChecker({ onPincodeVerified, initialPincode = '' }: PincodeCheckerProps) {
  const [pincode, setPincode] = useState(initialPincode);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    available: boolean;
    info?: PincodeInfo;
    message: string;
  } | null>(null);

  const checkPincode = async () => {
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      setResult({
        available: false,
        message: 'Please enter a valid 6-digit pincode',
      });
      onPincodeVerified(null);
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('serviceable_pincodes')
        .select('*')
        .eq('pincode', pincode)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setResult({
          available: false,
          message: 'Sorry, delivery is not available to this pincode',
        });
        onPincodeVerified(null);
      } else {
        const info: PincodeInfo = {
          pincode: data.pincode,
          city: data.city,
          state: data.state,
          delivery_days: data.delivery_days,
          cod_available: data.cod_available,
        };
        setResult({
          available: true,
          info,
          message: `Delivery available to ${data.city}, ${data.state}`,
        });
        onPincodeVerified(info);
      }
    } catch (error) {
      console.error('Pincode check error:', error);
      setResult({
        available: false,
        message: 'Error checking pincode. Please try again.',
      });
      onPincodeVerified(null);
    }

    setIsChecking(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
    if (result) {
      setResult(null);
      onPincodeVerified(null);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent" />
        Check Delivery Availability
      </label>
      
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChange={handleInputChange}
          className="flex-1"
          maxLength={6}
        />
        <Button
          type="button"
          onClick={checkPincode}
          disabled={isChecking || pincode.length !== 6}
          className="bg-accent hover:bg-accent/90"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Check'
          )}
        </Button>
      </div>

      {result && (
        <div
          className={cn(
            'p-3 rounded-lg flex items-start gap-3 animate-fade-in',
            result.available
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-destructive/10 border border-destructive/20'
          )}
        >
          {result.available ? (
            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-medium',
                result.available ? 'text-green-600' : 'text-destructive'
              )}
            >
              {result.message}
            </p>
            {result.available && result.info && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>
                    Estimated delivery: <strong className="text-foreground">{result.info.delivery_days} days</strong>
                  </span>
                </div>
                {result.info.cod_available && (
                  <p className="text-xs text-green-600">
                    ✓ Cash on Delivery available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}