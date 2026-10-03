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
    strokes = []
    for d in D:
        if d['type'] != 's' or not d.get('color') or max(d['color']) > 0.5: continue
        if (d.get('width') or 0) < 0.8 or (d.get('dashes') or '[] 0') != '[] 0': continue
        segs = []
        for it in d['items']:
            if it[0] == 'l':
                a, b = m(it[1]), m(it[2]); segs.append([a, a+(b-a)/3, a+2*(b-a)/3, b])
            elif it[0] == 'c':
                segs.append([m(it[1]), m(it[2]), m(it[3]), m(it[4])])
        if segs and not all(it[0] == 'l' for it in d['items']): strokes.append(segs)
    labels = []
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            txt = ''.join(s['text'] for s in l['spans']).strip()
            mm = LABEL.match(txt)
            if mm:
                bb = l['bbox']
                labels.append({'n': mm.group(1), 'text': mm.group(2),
                               'box': [m(pymupdf.Point(bb[0], bb[3])), m(pymupdf.Point(bb[2], bb[1]))]})
    beats = []
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if re.fullmatch(r'\d', s['text'].strip()):
                    bb = s['bbox']; beats.append((int(s['text']), m(pymupdf.Point((bb[0]+bb[2])/2, (bb[1]+bb[3])/2))))
    ratio = rink.height/rink.width
    return strokes, labels, beats, ratio


def pts(segs):
    return np.vstack([bez(*map(np.array, s)) for s in segs])


def boxdist(P, box):
    lo = np.minimum(box[0], box[1]); hi = np.maximum(box[0], box[1])
    d = np.maximum(np.maximum(lo-P, 0), P-hi)
    return np.sqrt((d**2).sum(1)).min()


def extract(pdf, pageno):
    strokes, labels, beats, ratio = page_geometry(pdf, pageno)
    # one label per step: where a step is labelled twice (an optional variant drawn
    # beside it), keep the plain one
    byn = {}
    for L in labels:
        k = L['n']; opt = 'OPTION' in L['text'].upper() or 'OPT.' in L['text'].upper()
        if k not in byn or (byn[k][1] and not opt): byn[k] = (L, opt)
    labels = [v[0] for v in byn.values()]
    for L in labels: L['text'] = L['text'].replace('C h', 'Ch')
    P = [pts(s) for s in strokes]
    C = np.array([[boxdist(Pi, L['box']) for Pi in P] for L in labels])
    r, c = linear_sum_assignment(C)
    steps = []
    for li, si in zip(r, c):
        steps.append({'n': labels[li]['n'], 'text': labels[li]['text'], 'stroke': si, 'labelDist': C[li, si]})
    key = lambda s: (int(re.match(r'\d+', s['n']).group()), s['n'])
    steps.sort(key=key)
    # orient: each stroke runs from the end nearer the previous step's end
    def ends(segs): return np.array(segs[0][0]), np.array(segs[-1][3])
    def flip(segs): return [[s[3], s[2], s[1], s[0]] for s in reversed(segs)]
    out = []
    for i, s in enumerate(steps):
        segs = strokes[s['stroke']]
        if i + 1 < len(steps):
            nxt = strokes[steps[i+1]['stroke']]
            a, b = ends(segs); na, nb = ends(nxt)
            if min(np.linalg.norm(a-na), np.linalg.norm(a-nb)) < min(np.linalg.norm(b-na), np.linalg.norm(b-nb)):
                segs = flip(segs)
        else:
            prev = out[-1]['segs']
            a, b = ends(segs)
            if np.linalg.norm(b-np.array(prev[-1][3])) < np.linalg.norm(a-np.array(prev[-1][3])):
                segs = flip(segs)
        out.append({**s, 'segs': segs})
    # a step drawn in more than one stroke (an arc broken at its beat count): fold
    # unlabelled strokes that bridge a gap into the step whose curve they continue
    used = set(s['stroke'] for s in steps)
    def tang(segs, end):
        s = segs[-1] if end else segs[0]
        v = np.array(s[3]) - np.array(s[2]) if end else np.array(s[1]) - np.array(s[0])
        return v / (np.linalg.norm(v) + 1e-9)
    def turn(segs):
        Q = pts(segs); a = np.diff(Q, axis=0); c = a[:-1, 0]*a[1:, 1] - a[:-1, 1]*a[1:, 0]
        return np.sign(c.sum())
    changed = True
    while changed:
        changed = False
        for i in range(len(out) - 1):
            e = np.array(out[i]['segs'][-1][3]); st = np.array(out[i+1]['segs'][0][0])
            if np.linalg.norm(e - st) < 1.0: continue
            best = None
            for j in range(len(strokes)):
                if j in used: continue
                segs = strokes[j]; a, b = ends(segs)
                for cand in (segs, flip(segs)):
                    a, b = ends(cand)
                    if np.linalg.norm(a - e) < 1.0 and np.linalg.norm(b - st) < np.linalg.norm(e - st):
                        best = (j, cand)
            if best:
                j, cand = best; used.add(j); changed = True
                prevMatch = turn(cand) == turn(out[i]['segs'])
                nextMatch = turn(cand) == turn(out[i+1]['segs'])
                if nextMatch and not prevMatch:
                    out[i+1]['segs'] = cand + out[i+1]['segs']
                elif prevMatch and not nextMatch:
                    out[i]['segs'] = out[i]['segs'] + cand
                else:
                    da = np.dot(tang(out[i]['segs'], True), tang(cand, False))
                    db = np.dot(tang(cand, True), tang(out[i+1]['segs'], False))
                    if db >= da: out[i+1]['segs'] = cand + out[i+1]['segs']
                    else: out[i]['segs'] = out[i]['segs'] + cand
                out[i].setdefault('bridged', 0)
    gaps = [float(np.linalg.norm(np.array(out[i]['segs'][-1][3]) - np.array(out[i+1]['segs'][0][0]))) for i in range(len(out)-1)]
    rest = [i for i in range(len(strokes)) if i not in used]
    # does the unlabelled half repeat the labelled one turned through 180 degrees?
    rep = None
    if rest:
        L = np.vstack([pts(o['segs']) for o in out]); R = np.vstack([P[i] for i in rest])
        Lr = -L
        d1 = np.array([np.sqrt(((R - q)**2).sum(1)).min() for q in Lr])
        d2 = np.array([np.sqrt(((Lr - q)**2).sum(1)).min() for q in R])
        rep = {'strokes': len(rest), 'maxDev': float(max(d1.max(), d2.max())), 'meanDev': float((d1.mean()+d2.mean())/2)}
    # beat numerals: nearest step to each
    bt = []
    if beats:
        OP = [pts(o['segs']) for o in out]
        B = np.array([[np.sqrt(((Q-q)**2).sum(1)).min() for Q in OP] for v, q in beats])
        rr, cc = linear_sum_assignment(B)
        bt = sorted([(out[k]['n'], beats[j][0], float(B[j, k])) for j, k in zip(rr, cc)], key=lambda t: int(re.match(r'\d+', t[0]).group()))
    return {'ratio': ratio, 'steps': out, 'gaps': gaps, 'repeat': rep, 'beats': bt, 'nStrokes': len(strokes)}


if __name__ == '__main__':
    pdf, page = sys.argv[1], int(sys.argv[2])
    R = extract(pdf, page)
    print('rink ratio', round(R['ratio'], 3), 'strokes', R['nStrokes'], 'steps', len(R['steps']))
    for s, g in zip(R['steps'], R['gaps'] + [None]):
        print(f"{s['n']:>4} {s['text']:<14} label {s['labelDist']:.2f} m  segs {len(s['segs'])}  gap-to-next {g if g is None else round(g,2)}")
    print('repeat', R['repeat'])
    print('beats', R['beats'])
