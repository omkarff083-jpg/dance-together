import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearchResult: (searchQuery: string) => void;
}

export function ImageSearchModal({ open, onClose, onSearchResult }: ImageSearchModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setPreviewImage(null);
    onClose();
  }, [stopCamera, onClose]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Please select an image under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!previewImage) return;

    setIsAnalyzing(true);
    try {
      console.log('Sending image for analysis...');
      
      const { data, error } = await supabase.functions.invoke('image-search', {
        body: { imageBase64: previewImage }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to analyze image');
      }

      console.log('Analysis result:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const searchQuery = data.primaryKeyword || data.searchTerms?.[0] || '';
      
      if (searchQuery) {
        toast.success(`Found: ${data.description || searchQuery}`);
        onSearchResult(searchQuery);
        handleClose();
      } else {
        toast.error('Could not identify the product. Try another image.');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent" />
            Search by Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview or Camera View */}
          {previewImage ? (
            <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80"
                onClick={resetPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : isCameraActive ? (
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={stopCamera}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="rounded-full bg-accent hover:bg-accent/90"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-secondary/50 rounded-lg flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border">
              <div className="p-4 rounded-full bg-accent/10">
                <ImageIcon className="h-12 w-12 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground text-center px-4">
                Take a photo or upload an image to find similar products
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!previewImage && !isCameraActive && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={startCamera}
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Analyze Button */}
          {previewImage && (
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Search Similar Products
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            AI will analyze your image to find similar products
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
