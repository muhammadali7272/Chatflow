import { useEffect, useRef, useCallback } from 'react';

export const useAutoScroll = (dependencies = []) => {
  const scrollRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    // Auto-scroll if user is near the bottom (within 100px)
    shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    const element = scrollRef.current;
    if (!element) return;

    if (force || shouldAutoScrollRef.current) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    scrollToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { scrollRef, scrollToBottom };
};
