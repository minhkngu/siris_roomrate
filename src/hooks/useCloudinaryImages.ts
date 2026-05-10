import { useState, useEffect, useRef } from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

export interface CloudinaryImage {
  src: string;
  srcSet: string;
}

export const useCloudinaryImages = (tag: string | undefined) => {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const preloadLinkRef = useRef<HTMLLinkElement | null>(null);

  // Inject/update a <link rel="preload"> in <head> for the first image
  const setPreloadLink = (href: string, srcSet: string) => {
    // Remove old preload link if exists
    if (preloadLinkRef.current) {
      preloadLinkRef.current.remove();
    }
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.imageSrcset = srcSet;
    document.head.appendChild(link);
    preloadLinkRef.current = link;
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (preloadLinkRef.current) {
        preloadLinkRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!tag) {
      setImages([]);
      return;
    }

    const controller = new AbortController();

    const fetchImages = async () => {
      setLoading(true);
      try {
        // Cloudinary Resource List API (requires "Resource List" to be enabled in settings)
        // URL format: https://res.cloudinary.com/{cloud_name}/image/list/{tag}.json
        const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          // Sort resources by public_id (name) using natural numeric sorting
          const sortedResources = [...data.resources].sort((a: any, b: any) =>
            a.public_id.localeCompare(b.public_id, undefined, { numeric: true, sensitivity: 'base' })
          );

          const urls = sortedResources.map((res: any) => {
            const transBase = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto`;
            const verPath = `v${res.version}/${res.public_id}.${res.format}`;
            return {
              src: `${transBase},w_800/${verPath}`,
              srcSet: [
                `${transBase},w_400/${verPath} 400w`,
                `${transBase},w_800/${verPath} 800w`,
                `${transBase},w_1200/${verPath} 1200w`,
              ].join(', '),
            };
          });

          // Inject preload link for the first image immediately
          // (before React re-renders — the browser starts fetching right away)
          if (urls.length > 0) {
            setPreloadLink(urls[0].src, urls[0].srcSet);
          }

          setImages(urls);
        } else {
          console.warn(`Cloudinary resource list for tag "${tag}" not found or restricted.`);
          setImages([]);
        }
      } catch (error) {
        console.error('Error fetching Cloudinary images:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();

    return () => {
      controller.abort();
    };
  }, [tag]);

  return { images, loading };
};
