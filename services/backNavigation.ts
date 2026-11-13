/** Back actions are ordered by UI layer, then by the time that layer opened. */
export function createBackNavigation() {
  const handlers: { priority: number; action: () => void }[] = [];
  return {
    register(action: () => void, priority = 0) {
      const entry = { priority, action };
      handlers.push(entry);
      return () => {
        const index = handlers.indexOf(entry);
        if (index !== -1) handlers.splice(index, 1);
      };
    },
    goBack() {
      let top: (typeof handlers)[number] | undefined;
      for (const entry of handlers) {
        if (!top || entry.priority >= top.priority) top = entry;
      }
      if (!top) return false;
      top.action();
      return true;
    },
  };
}

export const backNavigation = createBackNavigation();

interface BackButtonSource {
  addListener(event: 'backButton', listener: () => void): Promise<{ remove(): Promise<void> }>;
}

/** Also removes a listener whose asynchronous registration finishes after unmount. */
export function subscribeToAndroidBack(source: BackButtonSource, onBack: () => void) {
  let disposed = false;
  let handle: { remove(): Promise<void> } | undefined;
  void source.addListener('backButton', () => {
    if (!disposed) onBack();
  }).then(listener => {
    if (disposed) void listener.remove().catch(console.error);
    else handle = listener;
  }).catch(console.error);
  return () => {
    disposed = true;
    if (handle) {
      void handle.remove().catch(console.error);
      handle = undefined;
    }
  };
}
