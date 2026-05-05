import { useState, useEffect } from 'react';

export function useModalTransition(isOpen: boolean, delay: number = 200) {
  const [shouldRender, setShouldRender] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setClosing(false);
    } else if (shouldRender) {
      setClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, delay]);

  return { shouldRender, closing };
}