import { useState, useEffect } from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

export interface CloudinaryImage {
  src: string;
  srcSet: string;
}

export const useCloudinaryImages = (tag: string | undefined) => {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag) {
      setImages([]);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      try {
        // Cloudinary Resource List API (requires "Resource List" to be enabled in settings)
        // URL format: https://res.cloudinary.com/{cloud_name}/image/list/{tag}.json
        const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`);

        if (response.ok) {
          const data = await response.json();
          // Sort resources by public_id (name) using natural numeric sorting
          const sortedResources = [...data.resources].sort((a: any, b: any) =>
            a.public_id.localeCompare(b.public_id, undefined, { numeric: true, sensitivity: 'base' })
          );

          const urls = sortedResources.map((res: any) => {
            const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v${res.version}/${res.public_id}.${res.format}`;
            return {
              src: `${baseUrl}?f_auto,q_auto,w_800`,
              srcSet: [
                `${baseUrl}?f_auto,q_auto,w_400 400w`,
                `${baseUrl}?f_auto,q_auto,w_800 800w`,
                `${baseUrl}?f_auto,q_auto,w_1200 1200w`,
              ].join(', '),
            };
          });

          // Preload the first image immediately before setting state,
          // so the browser cache has it ready by the time <img> renders
          if (urls.length > 0) {
            const preloadImg = new Image();
            preloadImg.src = urls[0].src;
            preloadImg.srcset = urls[0].srcSet;
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
  }, [tag]);

  return { images, loading };
};