/**
 * Type stub for @testing-library/react
 * This file provides type definitions when @testing-library/react is not installed
 * Install @testing-library/react for testing: npm install --save-dev @testing-library/react
 */

declare module '@testing-library/react' {
  import { ReactElement } from 'react';
  export function render(component: ReactElement): {
    container: HTMLElement;
    rerender: (component: ReactElement) => void;
    unmount: () => void;
    [key: string]: unknown;
  };
  export const screen: {
    getByText: (text: string) => HTMLElement;
    getByRole: (role: string) => HTMLElement;
    queryByText: (text: string) => HTMLElement | null;
    [key: string]: unknown;
  };
}

