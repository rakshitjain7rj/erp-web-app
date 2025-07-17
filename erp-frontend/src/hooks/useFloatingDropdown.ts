import { useRef, useState, useEffect } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  hide,
  arrow,
  size,
  FloatingPortal,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingArrow,
} from '@floating-ui/react';

interface UseFloatingDropdownProps {
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'bottom' | 'top';
  offset?: number;
  onOpenChange?: (open: boolean) => void;
}

export const useFloatingDropdown = ({
  placement = 'bottom-start',
  offset: offsetValue = 8,
  onOpenChange,
}: UseFloatingDropdownProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);

  const {
    refs,
    floatingStyles,
    context,
    middlewareData,
    update,
  } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    placement,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: 'start',
        crossAxis: false,
      }),
      shift({
        padding: 8,
      }),
      hide({
        strategy: 'referenceHidden',
      }),
      arrow({
        element: arrowRef,
      }),
      size({
        apply({ availableWidth, availableHeight, elements }) {
          // Ensure dropdown doesn't exceed viewport bounds
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.max(200, Math.min(300, availableWidth - 16))}px`,
            maxHeight: `${Math.max(150, Math.min(400, availableHeight - 16))}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true,
    ancestorScroll: true,
  });
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  // Handle scroll events for additional robustness
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (update) {
        update();
      }
    };

    const handleResize = () => {
      if (update) {
        update();
      }
    };

    // Add scroll listeners to all scrollable ancestors
    const scrollableElements: (Element | Window)[] = [];
    const referenceElement = refs.reference.current;
    
    if (referenceElement && 'parentElement' in referenceElement) {
      let element = referenceElement.parentElement;
      
      while (element) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.overflow !== 'visible' || 
            computedStyle.overflowX !== 'visible' || 
            computedStyle.overflowY !== 'visible') {
          scrollableElements.push(element);
        }
        element = element.parentElement;
      }
    }

    // Always include window for viewport scrolling
    scrollableElements.push(window);

    scrollableElements.forEach(el => {
      if (el instanceof Window) {
        el.addEventListener('scroll', handleScroll, { passive: true });
        el.addEventListener('resize', handleResize, { passive: true });
      } else {
        el.addEventListener('scroll', handleScroll, { passive: true });
      }
    });

    return () => {
      scrollableElements.forEach(el => {
        if (el instanceof Window) {
          el.removeEventListener('scroll', handleScroll);
          el.removeEventListener('resize', handleResize);
        } else {
          el.removeEventListener('scroll', handleScroll);
        }
      });
    };
  }, [isOpen, update, refs.reference]);

  const isHidden = middlewareData.hide?.referenceHidden;

  return {
    isOpen,
    setIsOpen,
    refs,
    floatingStyles: {
      ...floatingStyles,
      visibility: isHidden ? 'hidden' : 'visible',
    },
    getReferenceProps,
    getFloatingProps,
    arrowRef,
    middlewareData,
    context,
    FloatingPortal,
    FloatingArrow,
  };
};

export default useFloatingDropdown;
