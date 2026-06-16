"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export interface HeroSlide {
  id: number;
  title: string;
  bannerImage: string | null;
  coverImage: string | null;
  genres: string[];
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const INTERVAL_MS = 6000;

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <section
      className="hero-section relative w-full overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Trending now"
    >
      <div
        className="flex h-full hero-carousel-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => {
          const bg = slide.bannerImage ?? slide.coverImage;
          return (
            <div
              key={slide.id}
              className="relative h-full w-full shrink-0 min-w-full"
              aria-hidden={i !== index}
            >
              {bg ? (
                <Image
                  src={bg}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover object-top"
                />
              ) : (
                <div className="absolute inset-0" style={{ background: "var(--bg-card)" }} />
              )}

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(15,15,18,0.1) 0%, rgba(15,15,18,0.5) 50%, rgba(15,15,18,0.95) 100%)",
                }}
              />

              <Link
                href={`/anime/${slide.id}`}
                className="absolute bottom-0 left-0 right-0 px-5 pb-8 md:px-10 md:pb-9 block"
              >
                <p className="text-label mb-1.5" style={{ color: "var(--primary)" }}>
                  TRENDING NOW
                </p>

                {slide.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {slide.genres.slice(0, 3).map((g) => (
                      <span key={g} className="genre-chip">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="text-headline-lg line-clamp-2 max-w-xl">{slide.title}</h1>
              </Link>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div
          className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1 px-4"
          role="tablist"
          aria-label="Trending slides"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to ${s.title}`}
              onClick={() => setIndex(i)}
              className="hero-carousel-dot"
              data-active={i === index ? "true" : "false"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
