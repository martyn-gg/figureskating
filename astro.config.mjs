import { defineConfig } from 'astro/config';

/* Registered 30/08/2026. The guide lived under a project path on github.io until
   then, which is why `base` existed at all; on its own domain it is the root and
   the base-path trap goes away with it. Tools read `base` from here rather than
   carrying their own copy — see tools/_rig.mjs. */
export default defineConfig({
  site: 'https://figureskating.guide',
  base: '/',
  build: { format: 'directory' },
});
