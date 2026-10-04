/* The kit pages, once: the hub lists them and the search index records them from here.
   04/10/2026, Session 28. */
export const KIT = [
  { slug: 'blade', name: 'The blade', summary: 'The rocker, where on it each element sits, the toe pick, and the hollow that makes two edges.' },
  { slug: 'boots', name: 'The boot', summary: 'Fit, stiffness, lacing, and why a boot that is too stiff stops the knee bending.' },
  { slug: 'care', name: 'Looking after skates', summary: 'Guards, soakers, drying, and when and where to have the blades sharpened.' },
];
export const kitPage = slug => KIT.find(k => k.slug === slug);
