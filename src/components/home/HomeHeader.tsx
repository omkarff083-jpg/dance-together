import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Search, Mic, Camera, MapPin, ChevronRight, Gift, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImageSearchModal } from './ImageSearchModal';
import { LocationPickerModal } from './LocationPickerModal';
import { supabase } from '@/integrations/supabase/client';

export function HomeHeader() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [location, setLocation] = useState<string>('Detecting...');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const navigate = useNavigate();

  // Load saved location from profile or auto-detect
  useEffect(() => {
    const loadLocation = async () => {
      // First, try to load saved location from profile
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('address')
            .eq('id', user.id)
            .single();

          if (profile?.address) {
            setLocation(profile.address);
            setIsLoadingLocation(false);
            return;
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }

      // If no saved location, auto-detect
      if (!navigator.geolocation) {
        setLocation('Select location');
        setIsLoadingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            
            const address = data.address;
            const city = address.city || address.town || address.village || address.suburb || address.county || '';
            const state = address.state || '';
            const pincode = address.postcode || '';
            
            let detectedLocation = '';
            if (city && pincode) {
              detectedLocation = `${city}, ${pincode}`;
            } else if (city && state) {
              detectedLocation = `${city}, ${state}`;
            } else if (city) {
              detectedLocation = city;
            } else {
              detectedLocation = 'Location detected';
            }

            setLocation(detectedLocation);

            // Save to profile if user is logged in
            if (user) {
              await saveLocationToProfile(detectedLocation);
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            setLocation('Select location');
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocation('Select location');
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    };

    loadLocation();
  }, [user]);

  // Save location to user profile
  const saveLocationToProfile = async (newLocation: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          address: newLocation,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving location:', error);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  // Handle location selection from modal
  const handleLocationSelect = async (newLocation: string) => {
    setLocation(newLocation);
    if (user) {
      await saveLocationToProfile(newLocation);
    }
  };

  // Handle voice search result
  const handleVoiceResult = useCallback((transcript: string) => {
    console.log('Voice search result:', transcript);
    setSearchQuery(transcript);
    toast.success(`Searching for: "${transcript}"`);
    // Auto-navigate after voice search
    if (transcript.trim()) {
      navigate(`/products?search=${encodeURIComponent(transcript)}`);
    }
  }, [navigate]);

  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: handleVoiceResult,
    language: 'en-IN',
  });

  // Update search query while listening
  useEffect(() => {
    if (isListening && transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript, isListening]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleVoiceButtonClick = () => {
    if (!isSupported) {
      toast.error('Voice search is not supported in your browser');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      toast.info('Listening... Speak now');
      startListening();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        {/* Avatar & Refer */}
        <div className="flex items-center gap-2">
          <Link to={user ? '/orders' : '/auth'}>
            <Avatar className="h-9 w-9 border-2 border-accent">
              <AvatarImage src="" />
              <AvatarFallback className="bg-accent/10 text-accent text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'G'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full bg-accent/10 text-accent hover:bg-accent/20 gap-1.5">
            <Gift className="h-4 w-4" />
            <span className="text-xs font-medium">Refer and Earn</span>
          </Button>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-accent text-accent-foreground text-[10px] rounded-full">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <form onSubmit={handleSearch} className="relative">
          <div className={cn(
            "flex items-center bg-secondary/50 rounded-lg border overflow-hidden transition-all duration-300",
            isListening ? "border-accent ring-2 ring-accent/20" : "border-border/50"
          )}>
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input
              type="text"
              placeholder={isListening ? "Listening..." : "Search by Keyword or Product ID"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-sm h-11"
            />
            <div className="flex items-center gap-1 pr-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={handleVoiceButtonClick}
                className={cn(
                  "h-8 w-8 transition-colors",
                  isListening 
                    ? "text-accent bg-accent/10 animate-pulse" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsImageSearchOpen(true)}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>

        {/* Voice Search Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 mt-2 py-2 bg-accent/10 rounded-lg animate-fade-in">
            <div className="flex gap-1">
              <span className="w-1.5 h-4 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-4 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-4 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-accent font-medium">Listening...</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={stopListening}
              className="h-6 px-2 text-xs text-accent hover:bg-accent/20"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Delivery Location */}
      <div className="px-4 pb-2">
        <button 
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center gap-2 text-sm text-foreground hover:text-accent transition-colors"
        >
          <MapPin className={cn("h-4 w-4 text-accent", isLoadingLocation && "animate-pulse")} />
          <span>
            Delivering to <strong>{location}</strong>
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Image Search Modal */}
      <ImageSearchModal
        open={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSearchResult={(query) => {
          setSearchQuery(query);
          navigate(`/products?search=${encodeURIComponent(query)}`);
        }}
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={location}
      />
    </header>
  );
}
