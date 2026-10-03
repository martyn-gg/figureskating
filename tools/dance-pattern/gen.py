"""Measure the pattern-dance diagrams into src/data/patterns/<slug>.json.

Run from the repository root:  python3 tools/dance-pattern/gen.py
Needs pymupdf, numpy, scipy, scikit-image, networkx and Pillow, and the PDFs in
sources/ (not in git; sources/*/MANIFEST.md says where each came from).

THE PATTERN is U.S. Figure Skating's. Its rulebook draws the diagrams as vectors, so
each step is the rulebook's own Bezier curve, mapped onto a 60 x 30 m rink
(extract.py), and filed under the step whose label sits nearest, one stroke to one
label. A step drawn in two strokes (an arc broken at its beat numeral) has the
unlabelled stroke folded into whichever neighbour it continues.

THE CROSS-CHECK is Skate Canada's. Its diagrams are raster images, so the same
dances are traced from the pixels (raster.py), a stroke the drawing joins to the
next is split at the corner between them, and the two are compared step by step
after fitting a scale along and across the rink: the two bodies draw the same
pattern at different sizes, and the scale is recorded with the result.

Each file also records what tools/dance.mjs holds it to: the largest gap between
consecutive steps, how far the diagram's own second half sits from the first
turned through 180 degrees, and the beat numeral printed beside each step.
"""
import json, re, os, numpy as np, sys
sys.path.insert(0, 'tools/dance-pattern')
import pymupdf
from extract import extract, best, page_geometry, pts, bez
from raster import digitise_labelled
RB = 'sources/usfs/2026-27_Rulebook.pdf'
f2 = lambda v: float(f'{v:.2f}')

def bezpath(segs):
    """Cubic Beziers as an SVG path; a new subpath where one stroke ends short of the
    next (a step the diagram draws in two pieces)."""
    d = ''; cur = None
    for a, b, c, e in segs:
        a = np.array(a)
        if cur is None or np.linalg.norm(a - cur) > 0.02:
            d += f' M{f2(a[0])} {f2(a[1])}'
        d += f' C{f2(b[0])} {f2(b[1])} {f2(c[0])} {f2(c[1])} {f2(e[0])} {f2(e[1])}'
        cur = np.array(e)
    return d.strip()

def smooth(P, w=3):
    if len(P) < 2*w+1: return P
    k = np.ones(2*w+1)/(2*w+1)
    Q = np.stack([np.convolve(np.pad(P[:, i], w, mode='edge'), k, 'valid') for i in (0, 1)], 1)
    Q[0], Q[-1] = P[0], P[-1]; return Q

def rdp(P, eps):
    if len(P) < 3: return P
    a, b = P[0], P[-1]; u = b - a; L = np.linalg.norm(u) + 1e-12
    d = np.abs(u[0]*(P[:, 1]-a[1]) - u[1]*(P[:, 0]-a[0])) / L
    i = int(np.argmax(d))
    if d[i] > eps: return np.vstack([rdp(P[:i+1], eps)[:-1], rdp(P[i:], eps)])
    return np.vstack([a, b])

def linepath(P):
    P = rdp(smooth(P), 0.04)
    return 'M' + ' L'.join(f'{f2(x)} {f2(y)}' for x, y in P)

def kink(P):
    """Split a polyline where two steps that touch meet: the sharpest turn."""
    Q = smooth(P, 2); v = np.diff(Q, axis=0); ang = np.arctan2(v[:, 1], v[:, 0])
    w = 4; best, bi = 0, None
    for i in range(w, len(ang) - w):
        d = abs((ang[i+w-1] - ang[i-w] + np.pi) % (2*np.pi) - np.pi)
        if d > best: best, bi = d, i
    return P[:bi+1], P[bi:], np.degrees(best)

def partners(page, own=None):
    p = pymupdf.open(RB)[page-1]; D = p.get_drawings()
    out = []
    strokes, labels, beats, ratio = page_geometry(RB, page)
    fills = [d for d in D if d['type'] == 'f' and d['rect'].width > 200]
    rink = max(fills, key=lambda d: d['rect'].width*d['rect'].height)['rect']
    cx, cy = (rink.x0+rink.x1)/2, (rink.y0+rink.y1)/2; sx, sy = 15/(rink.width/2), 30/(rink.height/2)
    m = lambda pt: np.array([(cy-pt.y)*sy, (pt.x-cx)*sx])
    for d in D:
        if d['type'] != 's' or not d.get('color') or max(d['color']) > 0.5: continue
        if (d.get('dashes') or '[] 0') == '[] 0' or all(it[0] == 'l' for it in d['items']): continue
        segs = []
        for it in d['items']:
            if it[0] == 'c': segs.append([m(it[1]), m(it[2]), m(it[3]), m(it[4])])
            elif it[0] == 'l': a, b = m(it[1]), m(it[2]); segs.append([a, a+(b-a)/3, a+2*(b-a)/3, b])
        if own is not None:
            # a half-circuit diagram dashes the option on both halves; keep the one
            # beside the labelled steps, since the drawing turns those for the repeat
            Q = np.vstack([bez(*map(np.array, g)) for g in segs])
            near = min(np.sqrt(((own - q)**2).sum(1)).min() for q in Q)
            far = min(np.sqrt(((-own - q)**2).sum(1)).min() for q in Q)
            if far < near: continue
        out.append(bezpath(segs))
    return out

def anchor(P, off=1.6):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    i = int(np.searchsorted(d, d[-1]/2)); i = min(max(i, 1), len(P)-2)
    t = P[i+1] - P[i-1]; t = t/np.linalg.norm(t); n = np.array([-t[1], t[0]])
    if np.dot(n, P[i]) < 0: n = -n
    q = P[i] + n*off
    return [f2(q[0]), f2(q[1])]

def chart_of(slug):
    fm = open(f'src/data/elements/{slug}.md').read().split('---')[1]
    import yaml
    D = yaml.safe_load(fm)['dance']
    return D.get('chart')

def same_steps(slug):
    import yaml
    return yaml.safe_load(open(f'src/data/elements/{slug}.md').read().split('---')[1])['dance'].get('sameSteps', False)

def partners_differ(slug):
    import yaml
    D = yaml.safe_load(open(f'src/data/elements/{slug}.md').read().split('---')[1])['dance']
    rows = D.get('chart') or []
    return (not D.get('sameSteps')) and any(r.get('follow') and r.get('follow') != r.get('lead') for r in rows)

def steps_of(R):
    out = []
    for s in R['steps']:
        if s.get('point'):
            # a hop or a toe pick: no tracing, a mark where it happens
            q = np.array(s['segs'][0][0]); n = q / (np.linalg.norm(q) + 1e-9)
            out.append({'n': s['n'], 'label': s['text'], 'd': '', 'point': [f2(q[0]), f2(q[1])],
                        'at': [f2(q[0] + n[0] * 1.6), f2(q[1] + n[1] * 1.6)]})
        else:
            out.append({'n': s['n'], 'label': s['text'], 'd': bezpath(s['segs']), 'at': anchor(pts(s['segs']))})
    return out

def checks(R, slug, chart, circuit, beats_ok):
    return {'method': R['method'], 'diagramFitsTurnedOrDrawn': f2(R['repeat']['maxDev']),
            'maxGap': f2(max(R['gaps'])), 'maxLabelDistance': f2(max(s['labelDist'] for s in R['steps'])),
            # where one diagram numbers both partners' steps, their beat numerals
            # crowd each other and cannot be told apart: none are recorded
            'beats': [[n, v] for n, v, _ in R['beats']] if beats_ok else []}

def usfs(slug, page, label, dashed=None, follow_page=None):
    chart = chart_of(slug)
    R, scores = best(RB, page, chart)
    circuit = R['circuit']
    rec = {'source': f'U.S. Figure Skating 2026-27 Rulebook, {label}', 'measured': 'vector', 'circuit': circuit,
           'steps': steps_of(R)}
    if dashed:
        pp = partners(page, np.vstack([pts(s['segs']) for s in R['steps']]) if circuit == 'half' else None)
        if pp: rec['dashed'] = {'is': dashed, 'd': pp}
    both_numbered = chart and not same_steps(slug) and circuit == 'half'
    rec['check'] = checks(R, slug, chart, circuit, not both_numbered)
    # THE FOLLOW. Where the partners skate different steps, the follow's are read
    # too: off the follow's own diagram where the rulebook gives one, or off the
    # half of a shared diagram that carries the follow's numbers. A follow skates
    # beside the lead, so the follow's sequence is placed where the lead's is.
    if partners_differ(slug):
        fp = follow_page or page
        try:
            F, _ = best(RB, fp, chart, who='follow')
        except Exception:
            F = None
        order = [str(r['n']) for r in chart if r.get('follow')]
        good = F is not None and [s['n'] for s in F['steps']] == order and max(F['gaps']) <= 2.5 \
            and max(s['labelDist'] for s in F['steps']) <= 2.0 and F['repeat']['maxDev'] <= 2.5
        # (the last test is looser than a lead's: a stroke only the lead skates sits
        # off the follow's path, and that is the diagram, not a misreading)
        if good:
            l0 = np.array(R['steps'][0]['segs'][0][0]); f0 = np.array(F['steps'][0]['segs'][0][0])
            if F['circuit'] == 'half' and np.linalg.norm(-f0 - l0) < np.linalg.norm(f0 - l0):
                for o in F['steps']: o['segs'] = [[-np.array(q) for q in sg] for sg in o['segs']]
            flabel = f'page {pymupdf.open(RB)[fp-1].get_text().split(chr(10))[0]}' + (", the follow's diagram" if follow_page else '')
            rec['follow'] = {'source': f'U.S. Figure Skating 2026-27 Rulebook, {flabel}', 'steps': steps_of(F),
                             'check': checks(F, slug, chart, F['circuit'], not both_numbered)}
        else:
            print(f'  {slug}: the follow\'s steps do not read cleanly yet; lead only')
    return rec

SC = 'sources/skate-canada/Pattern-Dance-Competition-Technical-Requirements-2025.pdf'
SC_PAGE = {'canasta': 3, 'fiesta': 6, 'dutch': 2}

def sc_image(img):
    """The diagram is a raster image inside Skate Canada's PDF; take it out whole."""
    out = f'tools/dance-pattern/sc-{img}.png'
    if not os.path.exists(out):
        d = pymupdf.open(SC); p = d[SC_PAGE[img] - 1]
        xref = [im for im in p.get_images(full=True) if im[2] > 300][0][0]
        pymupdf.Pixmap(d, xref).save(out)
    return out

def skate_canada(slug, img, sp, rp, labels, splits, circuit, label):
    S, rest, _, _ = digitise_labelled(sc_image(img), sp, rp)
    pieces = []
    for i, P in enumerate(S):
        if i in splits:
            a, b, deg = kink(P); pieces += [a, b]; print(f'  {slug}: piece {i} split at a {deg:.0f} degree turn')
        else: pieces.append(P)
    assert len(pieces) == len(labels), (slug, len(pieces), len(labels))
    steps = [{'n': str(k+1), 'label': labels[k], 'd': linepath(P), 'at': anchor(P)} for k, P in enumerate(pieces)]
    gaps = [np.linalg.norm(pieces[i][-1] - pieces[i+1][0]) for i in range(len(pieces)-1)]
    return {'source': f'Skate Canada, Pattern Dance Competition Technical Requirements (12/06/2025), {label}',
            'measured': 'raster', 'circuit': circuit, 'steps': steps, 'check': {'maxGap': f2(max(gaps))}}

def cha_cha(page, label):
    """The Cha Cha by hand. Its step 7 is a slalom on both blades, which the diagram
    draws as two tracks side by side, and the right track runs unbroken from step 6
    through the slalom into step 8, so no reading that gives each step its own
    stroke can find the boundaries. They are found here instead, from the drawing:
    step 7 starts where the second track starts (where the other foot goes down),
    and the slalom gives way to step 8 at its share of the track by beats, 4 to
    1.5, because the rulebook draws each step's length in proportion to its beats
    (DD 1.02). Steps 7 and 8 are drawn as both tracks; every other step is one
    stroke, taken in the order the path runs."""
    S, labels, beats, _ = page_geometry(RB, page)
    P = {i: pts(s) for i, s in enumerate(S)}
    def run(i, rev=False): return P[i][::-1] if rev else P[i]
    def arclen(Q): return np.r_[0, np.cumsum(np.linalg.norm(np.diff(Q, axis=0), axis=1))]
    def cut_at(Q, k): return Q[:k+1], Q[k:]
    right, left = P[20][::-1], P[13]          # both run up the rink from their start
    # step 6 | step 7: where the second track begins
    a = int(np.argmin(np.linalg.norm(right - left[0], axis=1)))
    six, rest = cut_at(right, a)
    # step 7 | step 8: by beats along what remains, 4 of 5.5
    L = arclen(rest); b = int(np.searchsorted(L, L[-1] * 4 / 5.5))
    r7, r8 = cut_at(rest, b)
    bl = int(np.argmin(np.linalg.norm(left - rest[b], axis=1)))
    l7, l8 = cut_at(left, bl)
    order = [(15, True), (16, True), (17, True), (18, True), (19, True), None, None, None,
             (21, True), (22, True), (23, True), (24, True), (12, True), (1, True)]
    pieces = []
    for k, o in enumerate(order):
        if k == 5: pieces.append([six])
        elif k == 6: pieces.append([r7, l7])
        elif k == 7: pieces.append([l8, r8])
        else: pieces.append([run(*o)])
    texts = {l['n']: l['text'] for l in labels}
    steps = []
    for k, parts in enumerate(pieces):
        n = str(k + 1)
        d = ' '.join(linepath(Q) for Q in parts)
        steps.append({'n': n, 'label': texts.get(n, ''), 'd': d, 'at': anchor(np.vstack(parts))})
    ends = [(parts[0][0], parts[-1][-1]) for parts in pieces]
    gaps = [float(np.linalg.norm(ends[i][1] - ends[i+1][0])) for i in range(len(ends) - 1)]
    for i, g in enumerate(gaps):
        assert g < 2.5, f'cha-cha: steps {i+1} and {i+2} are {g:.1f} m apart'
    return {'source': f'U.S. Figure Skating 2026-27 Rulebook, {label}', 'measured': 'vector', 'circuit': 'half',
            'steps': steps, 'check': {'method': 'by hand (see cha_cha)', 'maxGap': f2(max(gaps)), 'beats': []}}

def place_labels(layers):
    """Step numbers that do not sit on each other or on a line. For each step, in
    order, candidate spots beside it: either side, at three distances, at three
    points along the step. The first that keeps clear of every number already
    placed (1.5 m, a number's height) and of every drawn line (0.7 m) wins; if
    none does, the one that keeps clearest. Each partner's numbers are placed on
    their own, since the switch never shows both. On a half circuit the faint
    repeat is a line too, and the numbers keep off it."""
    for steps, half in layers:
        polys = [sample_d(s) for s in steps]
        allpts = np.vstack([P for P in polys if len(P)])
        allpts = np.vstack([allpts, -allpts]) if half and len(allpts) else allpts
        placed = []
        for s, P in zip(steps, polys):
            if s.get('point'):
                base = [(np.array(s['point']), None)]
            else:
                d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
                base = []
                for frac in (0.5, 0.3, 0.7, 0.15, 0.85):
                    i = int(np.searchsorted(d, d[-1] * frac)); i = min(max(i, 1), len(P) - 2)
                    t = P[i+1] - P[i-1]; t = t / (np.linalg.norm(t) + 1e-9)
                    base.append((P[i], np.array([-t[1], t[0]])))
            best = None
            for q, nrm in base:
                dirs = [nrm, -nrm] if nrm is not None else [q / (np.linalg.norm(q) + 1e-9), -q / (np.linalg.norm(q) + 1e-9)]
                if nrm is not None and np.dot(nrm, q) < 0: dirs = [-nrm, nrm]
                for off in (1.5, 2.2, 3.0):
                    for dv in dirs:
                        c = q + dv * off
                        if abs(c[0]) > 31 or abs(c[1]) > 16.3: continue
                        dl = min([np.linalg.norm(c - p) for p in placed] or [9])
                        dp = np.sqrt(((allpts - c) ** 2).sum(1)).min() if len(allpts) else 9
                        score = min(dl / 1.5, dp / 0.7)
                        if best is None or score > best[0] + 1e-9: best = (score, c)
                        if score >= 1: break
                    if best and best[0] >= 1: break
                if best and best[0] >= 1: break
            s['at'] = [f2(best[1][0]), f2(best[1][1])]
            placed.append(best[1])

def sample_d(s):
    out = []; cur = None
    for cmd, args in re.findall(r'([MLC])([^MLC]*)', s.get('d') or ''):
        v = list(map(float, args.split()))
        if cmd in 'ML': cur = np.array(v[:2]); out.append(cur)
        else:
            p1, p2, p3 = np.array(v[0:2]), np.array(v[2:4]), np.array(v[4:6])
            for t in np.linspace(0.1, 1, 8):
                u = 1 - t; out.append(u*u*u*cur + 3*u*u*t*p1 + 3*u*t*t*p2 + t**3*p3)
            cur = p3
    return np.array(out) if out else np.zeros((0, 2))

def resample(P, n=30):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    t = np.linspace(0, d[-1], n); return np.stack([np.interp(t, d, P[:, 0]), np.interp(t, d, P[:, 1])], 1)

def cross_check(rec, page, img, sp, rp, splits):
    """Trace the same dance off Skate Canada's diagram and hold it against U.S. Figure
    Skating's, step by step. The two bodies draw the pattern at different sizes, so
    the comparison fits a scale along and across the rink first, and reports it."""
    S, rest, _, _ = digitise_labelled(sc_image(img), sp, rp)
    pieces = []
    for i, P in enumerate(S):
        if i in splits: a, b, _ = kink(P); pieces += [a, b]
        else: pieces.append(P)
    U = best(RB, page, chart_of(rec['slug']))[0]['steps']
    assert len(pieces) == len(U), (img, len(pieces), len(U))
    A = [resample(pts(u['segs'])) for u in U]; B = [resample(P) for P in pieces]
    a, b = np.vstack(A), np.vstack(B); fit = []
    for k in range(2):
        M = np.c_[b[:, k], np.ones(len(b))]; fit.append(np.linalg.lstsq(M, a[:, k], rcond=None)[0])
    T = lambda P: np.stack([P[:, 0]*fit[0][0] + fit[0][1], P[:, 1]*fit[1][0] + fit[1][1]], 1)
    per = [float(np.linalg.norm(x - T(y), axis=1).mean()) for x, y in zip(A, B)]
    rec['check']['crossCheck'] = {
        'source': 'Skate Canada, Pattern Dance Competition Technical Requirements (12/06/2025), page %d' % SC_PAGE[img],
        'scaleAlong': f2(fit[0][0]), 'scaleAcross': f2(fit[1][0]),
        'meanApartAfterScaling': f2(np.mean(per)), 'worstStep': [U[int(np.argmax(per))]['n'], f2(max(per))]}
    return rec

DANCES = [  # slug, rulebook page index (1-based in the PDF), the page's own label, dashed lines
 ('dutch-waltz', 334, 'page Dance-6', None),
 ('canasta-tango', 336, 'page Dance-8', 'step 14 as a cross roll, which the rulebook allows'),
 ('rhythm-blues', 338, 'page Dance-10', 'step 15 crossed behind, which the rulebook allows'),
 ('swing-dance', 340, 'page Dance-12', "the second partner's track where the two skate apart, hand in hand"),
 ('fiesta-tango', 344, 'page Dance-16', None),
 ('hickory-hoedown', 346, 'page Dance-18', None),
 ('willow-waltz', 348, 'page Dance-20', None),
 ('ten-fox', 350, 'page Dance-22', None),
 ('fourteenstep', 353, 'page Dance-25', None),
 ('european-waltz', 356, 'page Dance-28', None),
 ('foxtrot', 359, 'page Dance-31', None),
 ('american-waltz', 362, 'page Dance-34', None),
 ('rocker-foxtrot', 368, 'page Dance-40', None),
 ('kilian', 371, 'page Dance-43', None),
 ('blues', 374, 'page Dance-46', None),
 ('starlight-waltz', 381, 'page Dance-53, the lead\'s diagram', None),
 ('viennese-waltz', 385, 'page Dance-57, the lead\'s diagram', None),
 ('westminster-waltz', 389, 'page Dance-61, the lead\'s diagram', None),
 ('quickstep', 393, 'page Dance-65', None),
 ('argentine-tango', 396, 'page Dance-68, the lead\'s diagram', None),
 ('ravensburger-waltz', 426, 'page Dance-98, the lead\'s diagram', None),
 ('rhumba', 430, 'page Dance-102', None),
 ('paso-doble', 377, "page Dance-49, the lead's diagram", None),
 ('cha-cha-congelado', 406, 'page Dance-78', None),
 ('silver-samba', 433, "page Dance-105, the lead's diagram", None),
 ('yankee-polka', 450, "page Dance-122, the lead's diagram", None),
 ('tango', 365, 'page Dance-37', None),
 ('tango-romantica', 438, "page Dance-110, the lead's diagram", None),
 ('tea-time-foxtrot', 445, "page Dance-117, the lead's diagram", None),
]
CROSS = {'dutch-waltz': ('dutch', [300,562], [58,120], []),
         'canasta-tango': ('canasta', [228,538], [140,140], []),
         'fiesta-tango': ('fiesta', [320,578], [82,136], [1, 8])}
only = set(sys.argv[1:])
out = {}
FOLLOW_PAGE = {'paso-doble': 378, 'starlight-waltz': 382, 'viennese-waltz': 386, 'westminster-waltz': 390,
               'argentine-tango': 397, 'ravensburger-waltz': 427, 'silver-samba': 434, 'yankee-polka': 451,
               'tango-romantica': 439, 'tea-time-foxtrot': 446}
for slug, page, label, dashed in DANCES:
    if only and slug not in only: continue
    rec = usfs(slug, page, label, dashed, FOLLOW_PAGE.get(slug)); rec['slug'] = slug
    if slug in CROSS:
        img, sp, rp, splits = CROSS[slug]; rec = cross_check(rec, page, img, sp, rp, splits)
    del rec['slug']
    out[slug] = rec
if not only or 'cha-cha' in only:
    out['cha-cha'] = cha_cha(342, 'page Dance-14')
for rec in out.values():
    half = rec['circuit'] == 'half'
    place_labels([(rec['steps'], half)] + ([(rec['follow']['steps'], half)] if 'follow' in rec else []))
os.makedirs('src/data/patterns', exist_ok=True)
for k, v in out.items():
    json.dump(v, open(f'src/data/patterns/{k}.json', 'w'), indent=1)
    print(k, len(v['steps']), 'follow' if 'follow' in v else '')
