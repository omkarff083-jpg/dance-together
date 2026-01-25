import { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: string) => void;
  currentLocation: string;
}

export function LocationPickerModal({
  open,
  onClose,
  onLocationSelect,
  currentLocation,
}: LocationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const popularLocations = [
    'Mumbai, Maharashtra',
    'Delhi, NCR',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Pune, Maharashtra',
    'Ahmedabad, Gujarat',
  ];

  // Search for locations using Nominatim API
  useEffect(() => {
    const searchLocations = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`
        );
        const data = await response.json();
        const locations = data.map((item: any) => item.display_name.split(',').slice(0, 3).join(','));
        setSearchResults(locations);
      } catch (error) {
        console.error('Search error:', error);
      }
      setIsSearching(false);
    };

    const debounce = setTimeout(searchLocations, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);

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
          
          let locationString = '';
          if (city && pincode) {
            locationString = `${city}, ${pincode}`;
          } else if (city && state) {
            locationString = `${city}, ${state}`;
          } else if (city) {
            locationString = city;
          } else {
            locationString = 'Location detected';
          }

          onLocationSelect(locationString);
          toast.success('Location detected successfully');
          onClose();
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Failed to detect location');
        }
        setIsDetecting(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to detect location. Please enable location access.');
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSelectLocation = (location: string) => {
    onLocationSelect(location);
    onClose();
    toast.success('Delivery location updated');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Select Delivery Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location */}
          {currentLocation && currentLocation !== 'Detecting...' && (
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Current Location</p>
              <p className="text-sm font-medium text-foreground">{currentLocation}</p>
            </div>
          )}

          {/* Detect Location Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={detectCurrentLocation}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            ) : (
              <Navigation className="h-5 w-5 text-accent" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium">
                {isDetecting ? 'Detecting...' : 'Use Current Location'}
              </p>
              <p className="text-xs text-muted-foreground">Using GPS</p>
            </div>
          </Button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for area, city, pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{location}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Popular Locations */}
          {!searchQuery && searchResults.length === 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Popular Cities
              </p>
              <div className="grid grid-cols-2 gap-2">
                {popularLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleSelectLocation(location)}
                    className="text-left px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}