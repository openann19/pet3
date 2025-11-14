/**
 * Type stub for fs-extra
 * This file provides type definitions when fs-extra is not installed
 * Install fs-extra for file system utilities: npm install --save-dev fs-extra
 */

declare module 'fs-extra' {
  import { promises as fs } from 'fs';
  export * from 'fs';
  export const ensureDir: (path: string) => Promise<void>;
  export const readFile: typeof fs.readFile;
  export const writeFile: typeof fs.writeFile;
  export const readJson: (path: string) => Promise<unknown>;
  export const writeJson: (path: string, data: unknown) => Promise<void>;
  export const copy: (src: string, dest: string) => Promise<void>;
  export const remove: (path: string) => Promise<void>;
  export const pathExists: (path: string) => Promise<boolean>;
  [key: string]: unknown;
}

