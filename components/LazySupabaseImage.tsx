import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface LazySupabaseImageProps {
  id: string;
  table: 'events' | 'testimonials';
  column: 'image' | 'media';
  alt?: string;
  className?: string;
  fallbackImage?: string;
  onLoad?: () => void;
}

/**
 * LazySupabaseImage
 * 
 * High-performance image component that fetches Base64 image data from Supabase
 * ONLY when it enters the viewport. This dramatically reduces egress bandwidth
 * because users only download images they actually scroll to.
 */
const LazySupabaseImage: React.FC<LazySupabaseImageProps> = ({
  id,
  table,
  column,
  alt = "",
  className = "",
  fallbackImage = "",
  onLoad
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Load slightly before it comes into view
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || src || loading || error) return;

    const fetchImage = async () => {
      setLoading(true);
      try {
        const { data, error: supabaseError } = await supabase
          .from(table)
          .select(column)
          .eq('id', id)
          .single();

        if (supabaseError || !data) {
          console.error(`Error loading lazy image for ${table}:${id}`, supabaseError);
          setError(true);
          return;
        }

        const imageData = data[column];
        if (imageData) {
          setSrc(imageData);
          if (onLoad) onLoad();
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Lazy fetch catch:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [isVisible, id, table, column, src, loading, error, onLoad]);

  const displaySrc = src || fallbackImage;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-30' : 'opacity-100'} ${error ? 'grayscale' : ''}`}
          loading="lazy"
        />
      )}
      
      {!src && !error && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin opacity-20" />
        </div>
      )}

      {error && !src && (
         <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
             <span className="text-[10px] text-slate-400 font-bold uppercase">Image unavailable</span>
         </div>
      )}
    </div>
  );
};

export default LazySupabaseImage;
