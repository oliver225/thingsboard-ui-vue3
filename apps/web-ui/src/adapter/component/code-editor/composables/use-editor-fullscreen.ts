import type { Ref } from 'vue';

import { nextTick, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';

interface FullscreenOptions {
  disabled: () => boolean;
  focus: () => void;
  layout: () => void;
  reportError: (error: unknown) => void;
  root: Ref<HTMLDivElement | undefined>;
}

/** Page-only fullscreen, including dialog top-layer rendering and focus cleanup. */
export function useEditorFullscreen({
  root,
  disabled,
  focus,
  layout,
  reportError,
}: FullscreenOptions) {
  const isFullscreen = ref(false);
  const fullscreenPortal = ref(false);
  let previousBodyOverflow: string | undefined;
  let disposed = false;

  function leaveFullscreen(restoreFocus = true) {
    const element = root.value;
    isFullscreen.value = false;
    if (element?.hasAttribute('popover')) {
      if (element.matches(':popover-open')) element.hidePopover();
      element.removeAttribute('popover');
    }
    fullscreenPortal.value = false;
    if (previousBodyOverflow !== undefined) {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = previousBodyOverflow;
      }
      previousBodyOverflow = undefined;
    }
    if (!disposed) {
      void nextTick(() => {
        layout();
        if (restoreFocus) focus();
      });
    }
  }

  async function toggleFullscreen() {
    if (isFullscreen.value) {
      leaveFullscreen();
      return;
    }
    const element = root.value;
    if (!element || disabled()) return;
    try {
      // Top-layer rendering escapes dialog transforms without moving the model
      // or entering the browser's native screen fullscreen mode.
      if (typeof element.showPopover === 'function') {
        element.setAttribute('popover', 'manual');
        element.showPopover();
      } else {
        fullscreenPortal.value = true;
      }
      if (document.body.style.overflow !== 'hidden') {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      isFullscreen.value = true;
      await nextTick();
      layout();
      focus();
    } catch (error) {
      leaveFullscreen(false);
      reportError(error);
    }
  }

  function fullscreenKeydown(event: KeyboardEvent) {
    if (!isFullscreen.value || !root.value || event.isComposing) return;
    if (event.key === 'Escape') {
      // Run before Reka's window bubble listener so the parent modal stays open.
      event.preventDefault();
      event.stopImmediatePropagation();
      leaveFullscreen();
    } else if (
      event.key === 'Tab' &&
      !(
        event.target instanceof Element &&
        event.target.closest('.monaco-editor')
      )
    ) {
      const items = [
        ...root.value.querySelectorAll<HTMLElement>(
          'button, [tabindex], textarea',
        ),
      ].filter(
        (item) =>
          item.tabIndex >= 0 &&
          !item.hasAttribute('disabled') &&
          item.getClientRects().length > 0,
      );
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  function keepFullscreenFocus(event: FocusEvent) {
    if (isFullscreen.value && !root.value?.contains(event.target as Node))
      focus();
  }

  function popoverToggled() {
    if (
      isFullscreen.value &&
      root.value?.hasAttribute('popover') &&
      !root.value.matches(':popover-open')
    ) {
      leaveFullscreen(false);
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', fullscreenKeydown, true);
    window.addEventListener('focusin', keepFullscreenFocus);
  });
  onDeactivated(() => leaveFullscreen(false));
  onBeforeUnmount(() => {
    disposed = true;
    window.removeEventListener('keydown', fullscreenKeydown, true);
    window.removeEventListener('focusin', keepFullscreenFocus);
    leaveFullscreen(false);
  });

  return {
    fullscreenPortal,
    isFullscreen,
    leaveFullscreen,
    popoverToggled,
    toggleFullscreen,
  };
}
