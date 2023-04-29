export {};

declare global {
  interface Window {
    howdjuFramePanelToggle?: () => void;
    howdjuFramePanelShow?: () => void;
    HowdjuDidLoad?: boolean;
  }
}
