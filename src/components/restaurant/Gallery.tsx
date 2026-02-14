"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/lib/sanity/client";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/lib/types";

interface GalleryProps {
  images: GalleryImage[];
}

export function Gallery({ images }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    document.body.style.overflow = "";
  }, []);

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (lightboxIndex === null) return;
      const next = lightboxIndex + direction;
      if (next >= 0 && next < images.length) {
        setLightboxIndex(next);
      }
    },
    [lightboxIndex, images.length]
  );

  return (
    <>
      {/* Masonry Grid */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, i) => (
          <motion.div
            key={image._key || i}
            className="mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-lg"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.05 }}
            onClick={() => openLightbox(i)}
            whileHover={{ scale: 1.02 }}
          >
            <Image
              src={urlFor(image).width(800).quality(80).url()}
              alt={image.alt || image.caption || "Restaurant photo"}
              width={800}
              height={600}
              className="h-auto w-full object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {image.caption && (
              <p className="mt-2 px-1 text-xs text-muted">{image.caption}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/60 transition-colors hover:text-white"
              aria-label="Close lightbox"
            >
              <X size={24} />
            </button>

            {/* Main image */}
            <div
              className="flex flex-1 items-center justify-center px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => navigate(-1)}
                className={cn(
                  "absolute left-4 rounded-full p-2 text-white/60 transition-colors hover:text-white",
                  lightboxIndex === 0 && "invisible"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative max-h-[80vh] max-w-[90vw]"
                >
                  <Image
                    src={urlFor(images[lightboxIndex]).width(1600).quality(90).url()}
                    alt={
                      images[lightboxIndex].alt ||
                      images[lightboxIndex].caption ||
                      "Restaurant photo"
                    }
                    width={1600}
                    height={1200}
                    className="max-h-[80vh] w-auto rounded-lg object-contain"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() => navigate(1)}
                className={cn(
                  "absolute right-4 rounded-full p-2 text-white/60 transition-colors hover:text-white",
                  lightboxIndex === images.length - 1 && "invisible"
                )}
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            {/* Caption */}
            {images[lightboxIndex].caption && (
              <p className="px-8 py-2 text-center text-sm text-white/60">
                {images[lightboxIndex].caption}
              </p>
            )}

            {/* Film strip */}
            <div
              className="flex items-center gap-2 overflow-x-auto px-4 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((image, i) => (
                <button
                  key={image._key || i}
                  onClick={() => setLightboxIndex(i)}
                  className={cn(
                    "relative h-16 w-20 flex-shrink-0 overflow-hidden rounded transition-all",
                    i === lightboxIndex
                      ? "ring-2 ring-white"
                      : "opacity-40 hover:opacity-70"
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={urlFor(image).width(160).height(128).quality(60).url()}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
