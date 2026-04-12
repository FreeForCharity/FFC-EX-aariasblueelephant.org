import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/database';
import { STOCK_INCLUSIVE_IMAGES } from '../constants';

interface ResilientImageProps {
  id: string;
  table: 'events' | 'testimonials';
  column: 'image' | 'media';
  alt?: string;
  className?: string;
  fallbackImage?: string;
  onLoad?: () => void;
}

/**
 * ResilientImage
 * 
 * High-performance image component that fetches image data from the active 
 * database provider ONLY when it enters the viewport. 
 * Supports both Supabase (Base64/URL) and Appwrite (Storage).
 */
const ResilientImage: React.FC<ResilientImageProps> = ({
  id,
  table,
  column,
  alt = "",
  className = "",
  fallbackImage = "",
  onLoad
}) => {
  const [dbSrc, setDbSrc] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Get stock fallback based on ID seed
  const getStockFallback = (seedId: string) => {
    if (!seedId) return STOCK_INCLUSIVE_IMAGES[0];
    const hash = seedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return STOCK_INCLUSIVE_IMAGES[hash % STOCK_INCLUSIVE_IMAGES.length];
  };

  const defaultFallback = fallbackImage || getStockFallback(id);

  useEffect(() => {
    // Reset state when ID or target changes
    setDbSrc(null);
    setIsFetchingData(false);
    setIsImageLoading(false);
    setHasError(false);
    setIsVisible(false);
  }, [id, table, column]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [id, table, column]);

  useEffect(() => {
    if (!isVisible || dbSrc || isFetchingData || hasError) return;

    const fetchImageData = async () => {
      setIsFetchingData(true);
      try {
        let imageData: string | null = null;
        
        if (table === 'events') {
          const event = await db.getEventById(id);
          imageData = event?.image || null;
        } else {
          imageData = await db.getTestimonialMedia(id);
        }

        // Validate image data (ignore truncated Base64)
        if (imageData && imageData.length > 0) {
          if (imageData.startsWith('data:') && imageData.length < 1000) {
            imageData = null;
          } else if (imageData.length < 50 && !imageData.startsWith('http') && !imageData.startsWith('data:')) {
            // New custom image from Appwrite, trigger browser load spinner
            setIsImageLoading(true);
            imageData = await db.getMediaUrl(imageData);
          }
        }
        
        if (imageData) {
          setDbSrc(imageData);
        } else {
          setDbSrc(null);
          setIsImageLoading(false);
        }
      } catch (err) {
        console.error("ResilientImage data fetch failed:", err);
        setHasError(true);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchImageData();
  }, [isVisible, id, table, column, dbSrc, isFetchingData, hasError]);

  const handleImageLoad = () => {
    setIsImageLoading(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setHasError(true);
    setDbSrc(null);
    setIsImageLoading(false);
  };

  // The source we actually try to render
  const currentSrc = (hasError || !dbSrc) ? defaultFallback : dbSrc;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isImageLoading ? 'opacity-30' : 'opacity-100'}`}
          loading="lazy"
        />
      )}
      
      {isImageLoading && !hasError && (
        <div className="absolute inset-0 bg-slate-100/30 dark:bg-slate-800/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ResilientImage;




