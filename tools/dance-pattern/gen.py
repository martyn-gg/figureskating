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

def usfs(slug, page, label, dashed=None):
    chart = chart_of(slug)
    R, scores = best(RB, page, chart)
    circuit = R['circuit']
    steps = [{'n': s['n'], 'label': s['text'], 'd': bezpath(s['segs']), 'at': anchor(pts(s['segs']))} for s in R['steps']]
    rec = {'source': f'U.S. Figure Skating 2026-27 Rulebook, {label}', 'measured': 'vector', 'circuit': circuit, 'steps': steps}
    if dashed:
        pp = partners(page, np.vstack([pts(s['segs']) for s in R['steps']]) if circuit == 'half' else None)
        if pp: rec['dashed'] = {'is': dashed, 'd': pp}
    rec['check'] = {'method': R['method'], 'diagramFitsTurnedOrDrawn': f2(R['repeat']['maxDev']),
                    'maxGap': f2(max(R['gaps'])), 'maxLabelDistance': f2(max(s['labelDist'] for s in R['steps'])),
                    # where one diagram numbers both partners' steps, their beat numerals
                    # crowd each other and cannot be told apart: none are recorded
                    'beats': [] if (chart and not same_steps(slug) and circuit == 'half')
                             else [[n, v] for n, v, _ in R['beats']]}
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
]
CROSS = {'dutch-waltz': ('dutch', [300,562], [58,120], []),
         'canasta-tango': ('canasta', [228,538], [140,140], []),
         'fiesta-tango': ('fiesta', [320,578], [82,136], [1, 8])}
only = set(sys.argv[1:])
out = {}
for slug, page, label, dashed in DANCES:
    if only and slug not in only: continue
    rec = usfs(slug, page, label, dashed); rec['slug'] = slug
    if slug in CROSS:
        img, sp, rp, splits = CROSS[slug]; rec = cross_check(rec, page, img, sp, rp, splits)
    del rec['slug']
    out[slug] = rec
os.makedirs('src/data/patterns', exist_ok=True)
for k, v in out.items():
    json.dump(v, open(f'src/data/patterns/{k}.json', 'w'), indent=1)
    print(k, len(v['steps']), v['check'].get('repeatMaxDev'), v['check']['maxGap'], len(v.get('dashed', {}).get('d', [])), v['check'].get('crossCheck'))
