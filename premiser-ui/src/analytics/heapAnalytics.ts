// https://docs.heapanalytics.com/v1.0/reference

declare global {
  interface Window {
    heap?: {
      track(eventName: string, properties: Properties): void;
      identify(id: string): void;
      resetIdentity(): void;
    };
  }
}

interface Properties {
  label?: string;
  value?: string;
}

export const track = (eventName: string, label?: string, value?: string) => {
  if (window.heap) {
    const properties: Properties = {};
    properties.label = label;
    properties.value = value;
    window.heap.track(eventName, properties);
  }
};

export const identify = (id: string) => {
  if (window.heap) {
    window.heap.identify(id);
  }
};

export const resetIdentity = () => {
  if (window.heap) {
    window.heap.resetIdentity();
  }
};
