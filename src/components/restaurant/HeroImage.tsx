"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { urlFor } from "@/lib/sanity/client";
import type { GalleryImage } from "@/lib/types";

interface HeroImageProps {
  image: GalleryImage;
  restaurantName: string;
}

export function HeroImage({ image, restaurantName }: HeroImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div ref={ref} className="relative h-[70vh] w-full overflow-hidden md:h-[85vh]">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image
          src={urlFor(image).width(1920).quality(85).url()}
          alt={image.alt || `${restaurantName} star dish`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Title */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-8 md:p-16"
        style={{ opacity }}
      >
        <motion.h1
          className="font-serif text-4xl font-bold leading-tight md:text-7xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {restaurantName}
        </motion.h1>
      </motion.div>
    </div>
  );
}
