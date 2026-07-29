// Tailwind v4 is run through PostCSS (not the @tailwindcss/vite plugin) because
// Vite 8's rolldown build pipeline invokes PostCSS on CSS but does not fire the
// Vite plugin's CSS transform, so `@import "tailwindcss"` reached PostCSS raw
// and the build failed with "@layer base ... no @tailwind base". Routing
// Tailwind through PostCSS — which rolldown already runs — fixes both dev and
// build with one consistent pipeline.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
