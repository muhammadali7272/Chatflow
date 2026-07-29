import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to a bottom sentinel element and calls
 * onLoadMore whenever it scrolls into view (and more pages are available).
 */
export const useInfiniteScroll = ({ hasMore, loading, onLoadMore }) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return sentinelRef;
};
