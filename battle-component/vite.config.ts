import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PokemonBattleComponent',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || 'asset';
        },
      },
    },
    sourcemap: true,
  },
});
