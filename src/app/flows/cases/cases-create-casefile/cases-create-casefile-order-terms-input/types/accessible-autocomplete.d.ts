// The installed dependency has no declarations. Describe only this feature's integration surface.
declare module 'accessible-autocomplete' {
  export default function accessibleAutocomplete<T>(options: {
    element: HTMLElement;
    id: string;
    name: string;
    defaultValue: string;
    showAllValues: boolean;
    confirmOnBlur: boolean;
    source: (query: string, populate: (items: T[]) => void) => void;
    onConfirm: (option: T | string | undefined) => void;
    templates: {
      inputValue: (option: T | string | undefined) => string;
      suggestion: (option: T | string | undefined) => string;
    };
    ref: (instance: { componentWillUnmount: () => void } | null) => void;
  }): void;
}
