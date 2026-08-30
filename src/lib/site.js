/* The handful of facts about the guide that are not derivable from the content:
   who to write to, where the money goes, what it costs to keep up. They live here
   so that changing an address is one edit rather than a grep, and so the pages
   that mention them cannot quietly disagree about the number.

   The costs are the real ones, stated ex VAT and inc VAT, because a page that
   asks for money and is vague about what it needs has not earned the ask. */

export const CONTACT = 'hello@figureskating.guide';
export const COACHES = 'coaches@figureskating.guide';

/* Set this to the donation page once it exists — https://buymeacoffee.com/<handle>
   or similar. Left null deliberately: the About page and the footer render the
   ask without a link rather than shipping a dead one, and a broken donate button
   is a worse first impression than no donate button. */
export const DONATE = null;

/* Renewed annually. Registration and privacy are billed separately by the
   registrar; hosting is GitHub Pages, which is free for a public repository. */
export const COSTS = {
  registrar: '20i',
  domain: 31.99,
  privacy: 3.49,
  get exVat() { return this.domain + this.privacy; },
  get incVat() { return Math.round(this.exVat * 1.2 * 100) / 100; },
};

export const money = n => `£${n.toFixed(2)}`;
