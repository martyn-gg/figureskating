"""Read a pattern-dance diagram page (vector) into metres on a 60 x 30 m rink.

Frame: x along the long axis (-30..30), y across (-15..15), with +y the side the
pattern starts on (the judges' side) and +x the direction of travel along it.
On the USFS portrait pages the start is the lower right, travelling up the page,
so x = up the page and y = to the right of the page.
"""
import sys, json, re, math
import pymupdf
import numpy as np
from scipy.optimize import linear_sum_assignment

STRAIGHT = {}  # (pdf, page) -> index of the first ruled line in the stroke list
LABEL = re.compile(r'^(\d+[a-z]?)\s*([A-Z]\S.*)$')


def bez(p0, p1, p2, p3, n=12):
    t = np.linspace(0, 1, n)[:, None]
    return ((1-t)**3)*p0 + 3*((1-t)**2)*t*p1 + 3*(1-t)*t*t*p2 + t**3*p3


def page_geometry(pdf, pageno):
    p = pymupdf.open(pdf)[pageno-1]
    D = p.get_drawings()
    fills = [d for d in D if d['type'] == 'f' and d['rect'].width > 200]
    rink = max(fills, key=lambda d: d['rect'].width*d['rect'].height)['rect']
    cx, cy = (rink.x0+rink.x1)/2, (rink.y0+rink.y1)/2
    sx, sy = 15/(rink.width/2), 30/(rink.height/2)  # metres per point across, along
    def m(pt):  # page point -> metres (x along, y across)
        return np.array([(cy-pt.y)*sy, (pt.x-cx)*sx])
    strokes = []; straight = []
    for d in D:
        if d['type'] != 's' or not d.get('color') or max(d['color']) > 0.5: continue
        if (d.get('width') or 0) < 0.8 or (d.get('dashes') or '[] 0') != '[] 0': continue
        segs = []
        for it in d['items']:
            if it[0] == 'l':
                a, b = m(it[1]), m(it[2]); segs.append([a, a+(b-a)/3, a+2*(b-a)/3, b])
            elif it[0] == 'c':
                segs.append([m(it[1]), m(it[2]), m(it[3]), m(it[4])])
        if not segs: continue
        if all(it[0] == 'l' for it in d['items']):
            # a ruled line: an arrow's shaft, or a flat (a slip step on both blades,
            # "RF-Lff"), which the diagrams draw straight. Kept apart, and offered
            # only to a label that names no edge.
            straight.append(segs)
        else: strokes.append(segs)
    labels = []
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            txt = ''.join(s['text'] for s in l['spans'])
            if not LABEL.match(txt.strip()): continue
            # two labels set on one line ("13 XB-LFI12 RFO") are split, each taking
            # its share of the line's box by character position
            bb = l['bbox']; L = max(len(txt), 1)
            parts = list(re.finditer(r'(\d+[a-z]?)\s*([A-Z][^0-9]*?(?:\d(?![0-9a-z]*\s*[A-Z][A-Z-])[^0-9]*?)*)\s*(?=\d+[a-z]?\s*[A-Z]|$)', txt))
            for mm in parts or [LABEL.match(txt.strip())]:
                a, b_ = (mm.start(), mm.end()) if parts else (0, L)
                x0 = bb[0] + (bb[2]-bb[0]) * a / L; x1 = bb[0] + (bb[2]-bb[0]) * b_ / L
                labels.append({'n': mm.group(1), 'text': mm.group(2).strip(),
                               'box': [m(pymupdf.Point(x0, bb[3])), m(pymupdf.Point(x1, bb[1]))]})
    beats = []
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if re.fullmatch(r'\d', s['text'].strip()):
                    bb = s['bbox']; beats.append((int(s['text']), m(pymupdf.Point((bb[0]+bb[2])/2, (bb[1]+bb[3])/2))))
    ratio = rink.height/rink.width
    STRAIGHT[(pdf, pageno)] = len(strokes)
    return strokes + straight, labels, beats, ratio


def pts(segs):
    return np.vstack([bez(*map(np.array, s)) for s in segs])


def boxdist(P, box):
    lo = np.minimum(box[0], box[1]); hi = np.maximum(box[0], box[1])
    d = np.maximum(np.maximum(lo-P, 0), P-hi)
    return np.sqrt((d**2).sum(1)).min()


EDGE = re.compile(r'[LR][FB](?:OI|IO|O|I)')
def bare(c): m = EDGE.search(c or ''); return m.group(0) if m else ''


def lead_labels(labels, chart, who='lead'):
    """Where a diagram labels both partners (U.S. Figure Skating often puts the
    lead's numbers on one half and the follow's on the other), keep the lead's, by
    the step chart: a label stays if an edge it names is one the lead's step of
    that number names (a cell may hold two, "LFO XF-RFI"), or if it names no edge
    at all (a slalom, a flat). A number the chart splits (19a, 19b) where only one
    part is the lead's takes that part's name."""
    rows = {str(r['n']): r for r in chart}
    edges = lambda c: set(EDGE.findall(c or ''))
    def fits(L, r):
        e = edges(L['text'])
        return (not e) or bool(e & edges(r.get(who))) or 'OPT' in L['text'].upper()
    out = []
    for L in labels:
        n = L['n']
        if n not in rows or not rows[n].get(who):
            leads = [k for k in (n + 'a', n + 'b', n + 'c') if k in rows and rows[k].get(who)]
            hit = [k for k in leads if fits(L, rows[k])]
            if len(hit) == 1: L = {**L, 'n': hit[0]}
            else: continue
        if fits(L, rows[L['n']]): out.append(L)
    return out


def extract(pdf, pageno, circuit=None, chart=None, who='lead'):
    """The steps of one diagram, in order, in metres.

    A half-circuit diagram (one side and one end, repeated) draws every stroke twice,
    the second time turned through 180 degrees, and may put a step's label beside
    either copy: U.S. Figure Skating labels the lead's steps on one half and the
    follow's on the other. So each stroke is offered twice, as drawn and turned, a
    label may claim either, and the steps are then chained so each starts where the
    last one ended, whichever copy that takes."""
    strokes, labels, beats, ratio = page_geometry(pdf, pageno)
    for L in labels: L['text'] = L['text'].replace('C h', 'Ch').replace('RF I', 'RFI').replace('LF I', 'LFI')
    nums = {L['n'] for L in labels}
    if circuit is None:
        circuit = 'half' if len(strokes) >= 1.6 * len(nums) else 'full'
    def ends(segs): return np.array(segs[0][0]), np.array(segs[-1][3])
    def flip(segs): return [[s[3], s[2], s[1], s[0]] for s in reversed(segs)]
    def rot(segs): return [[-np.array(p) for p in s] for s in segs]
    SP = [pts(s) for s in strokes]
    cand = [(i, False, s) for i, s in enumerate(strokes)]
    if circuit == 'half':
        # a turned copy that lands on a stroke already drawn there IS that stroke, and
        # is not offered again: two labels may not claim one place on the ice
        for i, s in enumerate(strokes):
            R_ = -SP[i]
            d = [np.sqrt(((R_[:, None, :] - Q[None, :, :])**2).sum(2)).min(1).mean() for Q in SP]
            if min(d) > 0.6: cand.append((i, True, rot(s)))
    CP = [pts(c[2]) for c in cand]
    # an optional variant drawn beside a step is labelled with the step's number too;
    # it never claims a stroke while a plain label for that number exists
    if chart:
        labels = lead_labels(labels, chart, who)
    plainN = {L['n'] for L in labels if 'OPT' not in L['text'].upper()}
    plain = [L for L in labels if 'OPT' not in L['text'].upper() or L['n'] not in plainN]
    first_straight = STRAIGHT.get((pdf, pageno), len(strokes))
    flat = lambda L: not EDGE.search(L['text'])
    C = np.array([[boxdist(Q, L['box']) + (3.0 if c[0] >= first_straight and not flat(L) else 0)
                   for Q, c in zip(CP, cand)] for L in plain])
    # a label may not take a turned copy while its own half has the stroke: turned
    # copies are for labels whose stroke is drawn only on the other half
    r, c = linear_sum_assignment(C)
    byn = {}
    for li, ci in zip(r, c):
        L = plain[li]; k = L['n']
        rec = {'n': k, 'text': L['text'], 'cand': ci, 'labelDist': C[li, ci], 'texts': [L['text']]}
        if k in byn:
            keep = byn[k] if byn[k]['labelDist'] <= rec['labelDist'] else rec
            keep['texts'] = sorted(set(byn[k]['texts'] + rec['texts'])); byn[k] = keep
        else: byn[k] = rec
    key = lambda s: (int(re.match(r'\d+', s['n']).group()), s['n'])
    steps = sorted(byn.values(), key=key)
    # chain: each step takes whichever copy (drawn or turned) and direction starts
    # nearest the previous step's end
    out = []
    for i, s in enumerate(steps):
        base = cand[s['cand']][2]
        opts = [base, flip(base)]
        if circuit == 'half': opts += [rot(base), flip(rot(base))]
        if i == 0:
            nxt = cand[steps[1]['cand']][2] if len(steps) > 1 else base
            nE = [ends(nxt)[0], ends(nxt)[1]] + ([-ends(nxt)[0], -ends(nxt)[1]] if circuit == 'half' else [])
            segs = min(opts, key=lambda o: min(np.linalg.norm(ends(o)[1] - q) for q in nE))
        else:
            e = np.array(out[-1]['segs'][-1][3])
            segs = min(opts, key=lambda o: np.linalg.norm(ends(o)[0] - e))
        out.append({**s, 'segs': segs})
    # start in the lower half of the page (x < 0), as the diagrams do
    if circuit == 'half' and ends(out[0]['segs'])[0][0] > 0:
        for o in out: o['segs'] = rot(o['segs'])
    # a step drawn in more than one stroke (an arc broken at its beat numeral): fold
    # unlabelled strokes that bridge a gap into the step whose curve they continue
    def tang(segs, end):
        s = segs[-1] if end else segs[0]
        v = np.array(s[3]) - np.array(s[2]) if end else np.array(s[1]) - np.array(s[0])
        return v / (np.linalg.norm(v) + 1e-9)
    def turn(segs):
        Q = pts(segs); a = np.diff(Q, axis=0); c = a[:-1, 0]*a[1:, 1] - a[:-1, 1]*a[1:, 0]
        return np.sign(c.sum())
    def covered(segs):
        Q = pts(segs)[::3]; A = np.vstack([pts(o['segs']) for o in out])
        return np.sqrt(((Q[:, None, :] - A[None, :, :])**2).sum(2)).min(1).max() < 0.3
    pool = [s for s in strokes] + ([rot(s) for s in strokes] if circuit == 'half' else [])
    changed = True
    while changed:
        changed = False
        for i in range(len(out) - 1):
            e = np.array(out[i]['segs'][-1][3]); st = np.array(out[i+1]['segs'][0][0])
            if np.linalg.norm(e - st) < 1.0: continue
            best = None
            for segs in pool:
                if covered(segs): continue
                for cnd in (segs, flip(segs)):
                    a, b = ends(cnd)
                    if np.linalg.norm(a - e) < 1.0 and np.linalg.norm(b - st) < np.linalg.norm(e - st):
                        best = cnd
            if best is not None:
                cnd = best; changed = True
                prevMatch = turn(cnd) == turn(out[i]['segs']); nextMatch = turn(cnd) == turn(out[i+1]['segs'])
                if nextMatch and not prevMatch: out[i+1]['segs'] = cnd + out[i+1]['segs']
                elif prevMatch and not nextMatch: out[i]['segs'] = out[i]['segs'] + cnd
                else:
                    da = np.dot(tang(out[i]['segs'], True), tang(cnd, False))
                    db = np.dot(tang(cnd, True), tang(out[i+1]['segs'], False))
                    if db >= da: out[i+1]['segs'] = cnd + out[i+1]['segs']
                    else: out[i]['segs'] = out[i]['segs'] + cnd
    gaps = [float(np.linalg.norm(np.array(out[i]['segs'][-1][3]) - np.array(out[i+1]['segs'][0][0]))) for i in range(len(out)-1)]
    # every stroke on the page should lie on a step or, for a half circuit, on a step
    # turned through 180 degrees: how far the furthest one sits off is the check
    A = np.vstack([pts(o['segs']) for o in out]); A = np.vstack([A, -A]) if circuit == 'half' else A
    nfs = STRAIGHT.get((pdf, pageno), len(strokes))
    dev = [float(np.sqrt(((P[::2, None, :] - A[None, :, :])**2).sum(2)).min(1).max()) for P in (pts(s) for s in strokes[:nfs])]
    rep = {'maxDev': max(dev), 'meanDev': float(np.mean(dev)), 'off': int(sum(d > 1.0 for d in dev))}
    bt = []
    if beats:
        OP = [pts(o['segs']) for o in out]
        B = np.array([[min(np.sqrt(((Q-q)**2).sum(1)).min(), np.sqrt(((-Q-q)**2).sum(1)).min() if circuit == 'half' else 1e9) for Q in OP] for v, q in beats])
        rr, cc = linear_sum_assignment(B)
        bt = []
        for j, k in zip(rr, cc):
            others = np.delete(B[j], k)
            if B[j, k] < 1.6 and (others.size == 0 or others.min() > 2 * B[j, k]):
                bt.append((out[k]['n'], beats[j][0], float(B[j, k])))
        bt.sort(key=lambda t: key({'n': t[0]}))
    return {'ratio': ratio, 'steps': out, 'gaps': gaps, 'repeat': rep, 'beats': bt, 'nStrokes': len(strokes), 'circuit': circuit}


if __name__ == '__main__':
    pdf, page = sys.argv[1], int(sys.argv[2])
    R = extract(pdf, page)
    print('rink ratio', round(R['ratio'], 3), 'strokes', R['nStrokes'], 'steps', len(R['steps']))
    for s, g in zip(R['steps'], R['gaps'] + [None]):
        print(f"{s['n']:>4} {s['text']:<14} label {s['labelDist']:.2f} m  segs {len(s['segs'])}  gap-to-next {g if g is None else round(g,2)}")
    print('repeat', R['repeat'])
    print('beats', R['beats'])


def chain_strokes(strokes, start_idx, flipped, maxgap=2.5):
    """Follow the drawn path stroke to stroke: from each stroke's end, the stroke
    whose nearer end is closest, weighed by how sharply the line would turn."""
    def ends(segs): return np.array(segs[0][0]), np.array(segs[-1][3])
    def flip(segs): return [[s[3], s[2], s[1], s[0]] for s in reversed(segs)]
    def t0(segs):
        v = np.array(segs[0][1]) - np.array(segs[0][0]); n = np.linalg.norm(v)
        if n < 1e-6: v = np.array(segs[0][3]) - np.array(segs[0][0]); n = np.linalg.norm(v)
        return v / (n + 1e-9)
    def t1(segs):
        v = np.array(segs[-1][3]) - np.array(segs[-1][2]); n = np.linalg.norm(v)
        if n < 1e-6: v = np.array(segs[-1][3]) - np.array(segs[-1][0]); n = np.linalg.norm(v)
        return v / (n + 1e-9)
    cur = flip(strokes[start_idx]) if flipped else strokes[start_idx]
    out = [(start_idx, cur)]; used = {start_idx}
    while True:
        e = ends(cur)[1]; t = t1(cur); best = None
        for j, s in enumerate(strokes):
            if j in used: continue
            for c in (s, flip(s)):
                a = ends(c)[0]; d = np.linalg.norm(a - e)
                if d > maxgap: continue
                u = (a - e) / (d + 1e-9) if d > 0.05 else t
                turn = (1 - np.dot(t, t0(c))) + 0.5 * (1 - np.dot(t, u))
                score = d + 3.0 * turn
                if best is None or score < best[0]: best = (score, j, c)
        if best is None: break
        _, j, cur = best; used.add(j); out.append((j, cur))
    return out


def align(pieces, steps_labels, rot_ok, endcost=0):
    """Give consecutive pieces to consecutive steps, every step at least one piece,
    trailing pieces left over, minimising how far each step's label sits from its
    pieces. steps_labels: per step, a list of label boxes (any may be used)."""
    M, N = len(pieces), len(steps_labels)
    PP = [pts(p) for p in pieces]
    def dist(i, k):
        best = 1e9
        for box in steps_labels[k]:
            best = min(best, boxdist(PP[i], box))
            if rot_ok: best = min(best, boxdist(-PP[i], box))
        return best
    D = np.array([[dist(i, k) for k in range(N)] for i in range(M)])
    INF = 1e18
    # f[i][k]: pieces 0..i used, piece i in step k, best cost; a step's cost is the
    # smallest distance of any of its pieces, so extra pieces cost a small penalty
    f = np.full((M, N), INF); arg = np.zeros((M, N), int)
    f[0][0] = D[0][0]
    for i in range(1, M):
        for k in range(N):
            # piece i joins step k (continuing) or starts step k
            cont = f[i-1][k] + 0.3 + 0.2 * min(D[i][k], 3)
            start = f[i-1][k-1] + D[i][k] if k > 0 else INF
            if start <= cont: f[i][k], arg[i][k] = start, 1
            else: f[i][k], arg[i][k] = cont, 0
    # end: any i with step N-1; trailing pieces unassigned
    iend = int(np.argmin(f[:, N-1] + endcost))
    assign = [None] * M; i, k = iend, N - 1
    while i >= 0:
        assign[i] = k
        if arg[i][k] == 1: k -= 1
        i -= 1
        if k < 0: break
    return assign, D


def extract_chain(pdf, pageno, chart=None, circuit=None, who='lead'):
    """Steps by following the drawn path, with the labels placing the boundaries
    between steps (see align). Robust where a label sits nearer a neighbouring
    stroke than its own, which nearest-label assignment is not."""
    strokes, labels, beats, ratio = page_geometry(pdf, pageno)
    for L in labels: L['text'] = L['text'].replace('C h', 'Ch').replace('RF I', 'RFI').replace('LF I', 'LFI')
    if chart: labels = lead_labels(labels, chart, who)
    if chart:
        order = [str(r['n']) for r in chart if r.get(who)]
    else:
        key = lambda n: (int(re.match(r'\d+', n).group()), n)
        order = sorted({L['n'] for L in labels}, key=key)
    if circuit is None:
        circuit = 'half' if len(strokes) >= 1.6 * len(order) else 'full'
    half = circuit == 'half'
    boxes = {n: [L['box'] for L in labels if L['n'] == n and 'OPT' not in L['text'].upper()]
                or [L['box'] for L in labels if L['n'] == n] for n in order}
    text = {}
    for L in labels:
        if L['n'] in boxes and (L['n'] not in text or 'OPT' in text[L['n']].upper()): text[L['n']] = L['text']
    missing = [n for n in order if not boxes[n]]
    lab = [boxes[n] for n in order]
    SP = [pts(s) for s in strokes]
    def d1(i, bl):
        return min([boxdist(SP[i], b) for b in bl] + ([boxdist(-SP[i], b) for b in bl] if half else []) or [1e9])
    cands = sorted(range(len(strokes)), key=lambda i: d1(i, lab[0]))[:3]
    best = None
    for si in cands:
        for fl in (False, True):
            ch = chain_strokes(strokes, si, fl)
            pieces = [c for _, c in ch]
            if len(pieces) < len(order): continue
            st = np.array(pieces[0][0][0]); tgt = -st if half else st
            endc = np.array([np.linalg.norm(np.array(p[-1][3]) - tgt) for p in pieces]) * 1.0
            assign, D = align(pieces, lab, half, endc)
            if any(a is None for a in assign[:1]): continue
            cost = sum(D[i][a] for i, a in enumerate(assign) if a is not None and (i == 0 or assign[i-1] != a))
            if best is None or cost < best[0]: best = (cost, pieces, assign, D)
    if best is None: raise ValueError('no chain long enough')
    cost, pieces, assign, D = best
    out = []
    for k, n in enumerate(order):
        segs = [sg for p, a in zip(pieces, assign) if a == k for sg in p]
        first = next(i for i, a in enumerate(assign) if a == k)
        out.append({'n': n, 'text': text.get(n, ''), 'segs': segs, 'labelDist': float(D[first][k])})
    # draw the sequence on the half of the rink where the diagram labels it, so the
    # picture is the rulebook's own way round
    if half:
        direct = sum(min(boxdist(pts(o['segs']), b) for b in boxes[o['n']]) for o in out if boxes[o['n']])
        turned = sum(min(boxdist(-pts(o['segs']), b) for b in boxes[o['n']]) for o in out if boxes[o['n']])
        if turned < direct:
            for o in out: o['segs'] = [[-np.array(p) for p in sg] for sg in o['segs']]
    gaps = [float(np.linalg.norm(np.array(out[i]['segs'][-1][3]) - np.array(out[i+1]['segs'][0][0]))) for i in range(len(out)-1)]
    A = np.vstack([pts(o['segs']) for o in out]); A = np.vstack([A, -A]) if half else A
    nfs = STRAIGHT.get((pdf, pageno), len(strokes))
    dev = [float(np.sqrt(((P[::2, None, :] - A[None, :, :])**2).sum(2)).min(1).max()) for P in SP[:nfs]]
    rep = {'maxDev': max(dev), 'meanDev': float(np.mean(dev)), 'off': int(sum(d > 1.0 for d in dev))}
    bt = []
    if beats:
        OP = [pts(o['segs']) for o in out]
        B = np.array([[min(np.sqrt(((Q-q)**2).sum(1)).min(), np.sqrt(((-Q-q)**2).sum(1)).min() if half else 1e9) for Q in OP] for v, q in beats])
        rr, cc = linear_sum_assignment(B)
        # only a numeral that is plainly one step's: near it, and twice as far from
        # any other (a diagram printing both partners' counts crowds them)
        bt = []
        for j, k in zip(rr, cc):
            others = np.delete(B[j], k)
            if B[j, k] < 1.6 and (others.size == 0 or others.min() > 2 * B[j, k]):
                bt.append((out[k]['n'], beats[j][0], float(B[j, k])))
        bt.sort(key=lambda t: order.index(t[0]))
    maxLabel = max(o['labelDist'] for o in out)
    return {'ratio': ratio, 'steps': out, 'gaps': gaps, 'repeat': rep, 'beats': bt, 'nStrokes': len(strokes),
            'circuit': circuit, 'missingLabels': missing, 'maxLabel': maxLabel, 'unused': sum(a is None for a in assign)}


def quality(R, order):
    got = [s['n'] for s in R['steps']]
    if got != order: return 1e6 + sum(n not in got for n in order)
    return max(R['gaps'] or [0]) + max(s['labelDist'] for s in R['steps']) + 0.5 * R['repeat']['maxDev']


def best(pdf, pageno, chart=None, who='lead'):
    """Both readings, the nearest-label one and the follow-the-path one; the one whose
    steps join up best, sit nearest their labels and leave no stroke unexplained."""
    order = [str(r['n']) for r in chart if r.get(who)] if chart else None
    out = []
    for f in (extract, extract_chain):
        try:
            R = f(pdf, pageno, chart=chart, who=who)
            R['method'] = f.__name__
            out.append((quality(R, order or [s['n'] for s in R['steps']]), R))
        except Exception as e:
            pass
    out.sort(key=lambda t: t[0])
    return out[0][1], [(R['method'], round(q, 2)) for q, R in out]
