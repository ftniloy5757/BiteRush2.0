"use client";

import { useEffect, useState } from "react";

export const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
  pizza: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop",
  pasta: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop",
  dessert: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=450&fit=crop",
  drink: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop",
  other: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
  default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
};

export const isValidImage = (img?: string | null): boolean => {
  if (!img || typeof img !== "string") return false;
  const trimmed = img.trim();
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  );
};

interface DishImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  name?: string;
  className?: string;
  fill?: boolean;
}

export default function DishImage({
  src,
  alt,
  category = "default",
  className = "object-cover",
  fill = true,
}: DishImageProps) {
  const defaultFallback =
    FALLBACK_CATEGORY_IMAGES[category?.toLowerCase() || "default"] ||
    FALLBACK_CATEGORY_IMAGES.default;

  const [imageSrc, setImageSrc] = useState<string>(() => {
    return isValidImage(src) ? (src as string) : defaultFallback;
  });

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isValidImage(src)) {
      setImageSrc(src as string);
      setHasError(false);
    } else {
      setImageSrc(defaultFallback);
    }
  }, [src, defaultFallback]);

  const handleImageError = () => {
    if (!hasError && imageSrc !== defaultFallback) {
      setHasError(true);
      setImageSrc(defaultFallback);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt || "Dish"}
      loading="lazy"
      onError={handleImageError}
      className={
        fill
          ? `w-full h-full object-cover transition-transform duration-300 ${className}`
          : className
      }
    />
  );
}
