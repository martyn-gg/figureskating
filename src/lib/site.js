/* The handful of facts about the guide that are not derivable from the content:
   who to write to, where the money goes, what it costs to keep up. They live here
   so that changing an address is one edit rather than a grep, and so the pages
   that mention them cannot quietly disagree about the number.

   The costs are the real ones and every figure on the site includes VAT, because
   the reader is a skater and not a business: ex-VAT pricing is a thing shown to
   people who can reclaim it. The registrar bills ex VAT, so those are the numbers
   stored and the VAT is added here — once, in one place. */

export const CONTACT = 'hello@figureskating.guide';
export const COACHES = 'coaches@figureskating.guide';

/* Ko-fi, on the free tier: no service fee on tips, and the money lands in a PayPal
   account rather than sitting in a balance somewhere. It was null until the page
   existed and had been loaded — the About page and the footer render the ask
   without a link rather than shipping a dead one, and a broken donate button is a
   worse first impression than no donate button. Set it back to null rather than
   leaving it pointing at a page that has gone. */
export const DONATE = 'https://ko-fi.com/figureskatingguide';

/* Renewed annually. The registrar bills registration and privacy separately, ex
   VAT, which is how 20i quotes them — and both of those are facts about the invoice
   rather than about the reader. A skater's parent wants one number: what it costs to
   keep the site up for a year. So the two line items stay here, unexported, and only
   the total leaves this file — a page cannot print a breakdown it cannot reach.

   Rounded per component and then summed, rather than summing and rounding once. The
   difference is a penny and nobody would see it, but the components are what the
   registrar actually charges and the total should be their sum. */
const VAT = 0.2;
const inc = n => Math.round(n * (1 + VAT) * 100) / 100;
const LINES = [31.99, 3.49];   // registration, WHOIS privacy

export const COSTS = {
  registrar: '20i',
  total: LINES.map(inc).reduce((a, b) => a + b),
};

export const money = n => `£${n.toFixed(2)}`;
