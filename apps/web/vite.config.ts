import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env['PROJECT_ROOT'] ?? __dirname;

const loadOptionalPlugin = async (specifier: string): Promise<PluginOption | null> => {
  try {
    const module = (await import(specifier)) as { default?: () => PluginOption };
    return typeof module.default === 'function' ? module.default() : null;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    // Optional plugins: only handle module not found errors gracefully
    // Other errors propagate to fail the build
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      return null;
    }
    // Re-throw unexpected errors to fail fast
    throw error;
  }
};

// Plugin to transform JSX in .js files before import analysis
const transformJSXInJSPlugin = (): PluginOption => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  shouldTransformCachedModule({ id }) {
    // Ensure react-native-reanimated .js files are always transformed
    return id.includes('react-native-reanimated') && id.endsWith('.js');
  },
  transform(code, id) {
    // Transform JSX in .js files from react-native-reanimated BEFORE import analysis
    if (
      id.includes('react-native-reanimated') &&
      id.endsWith('.js') &&
      code.includes('<') &&
      code.includes('>')
    ) {
      // Return null to let React plugin handle it, but ensure it runs before import analysis
      return null;
    }
    return null;
  },
});

// Plugin to handle JSX in .js files during import analysis
const handleJSXImportAnalysisPlugin = (): PluginOption => ({
  name: 'handle-jsx-import-analysis',
  enforce: 'pre',
  resolveId(id) {
    // Skip problematic react-native files
    if (id.includes('/node_modules/react-native/') && !id.includes('react-native-reanimated')) {
      return { id, external: true };
    }
    return null;
  },
  load(id) {
    // During import analysis, return empty for react-native files only
    if (id.includes('/node_modules/react-native/') && !id.includes('react-native-reanimated')) {
      return 'export default {};';
    }
    return null;
  },
});

export default defineConfig(async () => {
  const plugins: PluginOption[] = [
    react({
      jsxRuntime: 'automatic',
    }),
    transformJSXInJSPlugin(),
    handleJSXImportAnalysisPlugin(),
    tailwindcss(),
  ];

  const optionalPlugins = await Promise.all([
    loadOptionalPlugin('@github/spark/vitePhosphorIconProxyPlugin'),
    loadOptionalPlugin('@github/spark/spark-vite-plugin'),
  ]);

  for (const plugin of optionalPlugins) {
    if (plugin) {
      plugins.push(plugin);
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
        'react-native-reanimated': path.resolve(projectRoot, './src/lib/reanimated-web-polyfill.ts'),
      },
      conditions: ['import', 'module', 'browser', 'default'],
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.jsx', '.js', '.tsx', '.ts', '.json'],
      dedupe: ['react', 'react-dom'],
    },
    esbuild: {
      include: /node_modules\/react-native-reanimated\/.*\.js$/,
      loader: 'jsx',
      jsx: 'automatic',
    },
    server: {
      hmr: {
        overlay: true,
      },
      watch: {
        ignored: ['**/node_modules/react-native/**', '**/.git/**'],
      },
      fs: {
        allow: ['..'],
        strict: false,
      },
    },
    optimizeDeps: {
      exclude: ['react-native', 'react-native-reanimated'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
        resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.jsx', '.json', '.ts', '.tsx'],
      },
      entries: [],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
      },
      rollupOptions: {
        external: (id: string) => {
          // Externalize optional tensorflow dependencies
          return id === '@tensorflow/tfjs' || 
                 id === '@tensorflow/tfjs-core' || 
                 id === '@tensorflow/tfjs-converter' ||
                 id.startsWith('@tensorflow/tfjs/') ||
                 id.startsWith('@tensorflow/tfjs-core/') ||
                 id.startsWith('@tensorflow/tfjs-converter/');
        },
      },
    },
  };
});
