"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type Episode = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  externalUrl: string | null;
  publishedAt: Date | null;
};

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;

  const match = url.match(
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11})/,
  );

  return match?.[1] ?? null;
}

export function PodcastGrid({ episodes }: { episodes: Episode[] }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeVideoId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveVideoId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeVideoId]);

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {episodes.map((episode) => {
          const ytId = getYouTubeId(episode.externalUrl);
          const thumbUrl = ytId
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
            : null;

          return (
            <div
              key={episode.id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-elevated transition-all hover:border-accent/40"
            >
              <div>
                {thumbUrl ? (
                  <button
                    type="button"
                    onClick={() => ytId && setActiveVideoId(ytId)}
                    className="relative aspect-video w-full overflow-hidden bg-neutral-900 focus:outline-none"
                  >
                    <Image
                      src={thumbUrl}
                      alt={episode.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-90 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg transition-transform group-hover:scale-110">
                        <Play className="ml-1 h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </button>
                ) : null}

                <div className="p-5">
                  <span className="text-xs text-muted">
                    {episode.publishedAt &&
                      new Date(episode.publishedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                  </span>

                  <h3 className="mt-1 font-display text-lg text-primary">
                    {episode.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-secondary">
                    {episode.description || episode.body}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <a
                  href={episode.externalUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Watch on YouTube ?
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {activeVideoId ? (
        <div
          onClick={() => setActiveVideoId(null)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl cursor-default overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveVideoId(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black"
              aria-label="Close video modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="Podcast Episode"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
