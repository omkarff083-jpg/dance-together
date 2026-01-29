import { useState, useRef, TouchEvent } from 'react';

interface SwipeableImageGalleryProps {
  images: string[];
  productName: string;
  onImageChange?: (index: number) => void;
}

export function SwipeableImageGallery({ images, productName, onImageChange }: SwipeableImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
    }
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    onImageChange?.(index);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-secondary flex items-center justify-center">
        <span className="text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Image Container with Swipe */}
      <div
        ref={containerRef}
        className="aspect-square overflow-hidden bg-white touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${productName} - Image ${index + 1}`}
              className="w-full h-full object-contain flex-shrink-0"
              draggable={false}
            />
          ))}
        </div>
      </div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 py-3 bg-white">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentIndex === index ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
