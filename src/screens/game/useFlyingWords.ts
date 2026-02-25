import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import type { LayoutRect } from '@/components';
import { generateId } from '@/utils';

export interface FlyingWordParticle {
  id: string;
  text: string;
  seed: number;
  from: LayoutRect;
  to: LayoutRect;
}

/**
 * Manages screen-space word particle geometry between card area and bowl targets.
 */
export function useFlyingWords() {
  const [flyingWords, setFlyingWords] = useState<FlyingWordParticle[]>([]);

  const overlayHostRef = useRef<View>(null);
  const cardAreaRef = useRef<View>(null);
  const bowlARef = useRef<View>(null);
  const bowlBRef = useRef<View>(null);

  const pushFlyingWord = useCallback(
    (text: string, targetRef: React.RefObject<View | null>) => {
      requestAnimationFrame(() => {
        const overlayHost = overlayHostRef.current;
        const cardArea = cardAreaRef.current;
        const bowl = targetRef.current;
        if (!overlayHost || !cardArea || !bowl) return;

        cardArea.measureLayout(
          overlayHost,
          (cardX, cardY, cardW, cardH) => {
            bowl.measureLayout(
              overlayHost,
              (bowlX, bowlY, bowlW, bowlH) => {
                // Keep only recent particles for performance on rapid taps.
                setFlyingWords((prev) => [
                  ...prev.slice(-5),
                  {
                    id: generateId(),
                    text,
                    seed: Math.random(),
                    from: { x: cardX, y: cardY, width: cardW, height: cardH },
                    to: { x: bowlX, y: bowlY, width: bowlW, height: bowlH },
                  },
                ]);
              },
              () => {}
            );
          },
          () => {}
        );
      });
    },
    []
  );

  const removeFlyingWord = useCallback((id: string) => {
    setFlyingWords((prev) => prev.filter((word) => word.id !== id));
  }, []);

  return {
    flyingWords,
    overlayHostRef,
    cardAreaRef,
    bowlARef,
    bowlBRef,
    pushFlyingWord,
    removeFlyingWord,
  };
}
