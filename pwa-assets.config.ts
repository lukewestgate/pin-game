import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// One source SVG makes every icon: `pnpm icons` writes them into public/ (committed).
// The source's Pin head has radius 150/512, inside the maskable 40% safe zone.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
  },
  images: ['public/icon-source.svg'],
});
