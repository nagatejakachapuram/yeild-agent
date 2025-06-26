// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',
  clean: true,
  dts: false,
  platform: 'node',
  external: ['axios'], // <--- CHANGE THIS LINE
});