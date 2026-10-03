"""Digitise a raster pattern-dance diagram (Skate Canada style): the rink outline, and
the unlabelled half of the pattern, which is the labelled half turned through 180
degrees and carries no text. Output strokes in metres, same frame as extract.py,
already turned back onto the labelled half."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import skeletonize
import networkx as nx


def load(path, thr=140):
    a = np.array(Image.open(path).convert('L')).astype(int)
    return a < thr


def rink_box(mask):
    lab, n = ndi.label(mask, structure=np.ones((3, 3)))
    sl = ndi.find_objects(lab)
    def score(s):
        h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
        return h * w if 1.8 < h / max(w, 1) < 2.1 else 0
    k = int(np.argmax([score(s) for s in sl]))
    s = sl[k]
    return lab == k + 1, (s[1].start, s[0].start, s[1].stop - 1, s[0].stop - 1)


def order_skeleton(comp):
    sk = skeletonize(comp)
    ys, xs = np.nonzero(sk)
    G = nx.Graph()
    idx = {(y, x): i for i, (y, x) in enumerate(zip(ys, xs))}
    for (y, x), i in idx.items():
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                j = idx.get((y + dy, x + dx))
                if j is not None and j != i: G.add_edge(i, j, weight=np.hypot(dy, dx))
    if G.number_of_nodes() < 2: return None
    # longest shortest path: double sweep
    a = next(iter(G.nodes))
    d = nx.single_source_dijkstra_path_length(G, a); b = max(d, key=d.get)
    d2, paths = nx.single_source_dijkstra(G, b); c = max(d2, key=d2.get)
    P = np.array([[xs[i], ys[i]] for i in paths[c]], float)
    return P


def digitise(path, thr=140, minlen=10, tol=4):
    mask = load(path, thr)
    border, (x0, y0, x1, y1) = rink_box(mask)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    sx, sy = 15 / ((x1 - x0) / 2), 30 / ((y1 - y0) / 2)
    m = mask & ~ndi.binary_dilation(border, iterations=2)
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    # rotate the whole mask 180 degrees about the rink centre
    H, W = m.shape
    yy, xx = np.nonzero(m)
    ry, rx = np.round(2 * cy - yy).astype(int), np.round(2 * cx - xx).astype(int)
    rot = np.zeros_like(m)
    ok = (ry >= 0) & (ry < H) & (rx >= 0) & (rx < W)
    rot[ry[ok], rx[ok]] = True
    near = ndi.binary_dilation(rot, iterations=tol)
    comps = []
    for k, s in enumerate(ndi.find_objects(lab)):
        c = lab == k + 1
        h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
        if max(h, w) < minlen: continue
        frac = (c & near).sum() / c.sum()
        comps.append({'k': k + 1, 'frac': frac, 'size': max(h, w), 'cx': (s[1].start + s[1].stop) / 2})
    curves = [c for c in comps if c['frac'] > 0.85]
    # of each matched pair keep the one in the unlabelled half: the left of the page
    keep = [c for c in curves if c['cx'] < cx]
    strokes = []
    for c in keep:
        P = order_skeleton(lab == c['k'])
        if P is None or len(P) < minlen: continue
        # pixels -> metres, then turn through 180 degrees onto the labelled half
        Mx = (cy - P[:, 1]) * sy; My = (P[:, 0] - cx) * sx
        strokes.append(np.stack([-Mx, -My], 1))
    return strokes, (x1 - x0, y1 - y0), comps


def chain(strokes, start_hint):
    """Order strokes along the path from the one nearest start_hint, orienting each."""
    rest = list(range(len(strokes)))
    def endsd(P, q): return min(np.linalg.norm(P[0] - q), np.linalg.norm(P[-1] - q))
    i = min(rest, key=lambda j: endsd(strokes[j], start_hint)); rest.remove(i)
    P = strokes[i]
    if np.linalg.norm(P[-1] - start_hint) < np.linalg.norm(P[0] - start_hint): P = P[::-1]
    out = [P]
    while rest:
        e = out[-1][-1]
        j = min(rest, key=lambda j: endsd(strokes[j], e))
        if endsd(strokes[j], e) > 4: break
        rest.remove(j); Q = strokes[j]
        if np.linalg.norm(Q[-1] - e) < np.linalg.norm(Q[0] - e): Q = Q[::-1]
        out.append(Q)
    return out, rest


if __name__ == '__main__':
    S, box, comps = digitise(sys.argv[1])
    print('rink px', box, 'ratio', round(box[1] / box[0], 3), 'strokes', len(S))


def digitise_half(path, start_px, repeat_px, thr=140, minlen=10):
    """Strokes on the unlabelled side of the start-repeat line, turned through 180
    degrees onto the labelled half, in metres, chained from the start."""
    mask = load(path, thr)
    border, (x0, y0, x1, y1) = rink_box(mask)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    sx, sy = 15 / ((x1 - x0) / 2), 30 / ((y1 - y0) / 2)
    m = mask & ~ndi.binary_dilation(border, iterations=2)
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    a, b = np.array(start_px, float), np.array(repeat_px, float)
    d = b - a; nrm = np.array([d[1], -d[0]])
    probe = np.array([x0 + 5, y1 - 5])        # lower-left corner: the unlabelled side
    side = np.sign(np.dot(probe - a, nrm))
    strokes = []
    for k, s in enumerate(ndi.find_objects(lab)):
        h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
        if max(h, w) < minlen: continue
        c = np.array([(s[1].start + s[1].stop) / 2, (s[0].start + s[0].stop) / 2])
        if np.sign(np.dot(c - a, nrm)) != side: continue
        P = order_skeleton(lab == k + 1)
        if P is None or len(P) < minlen: continue
        Mx = (cy - P[:, 1]) * sy; My = (P[:, 0] - cx) * sx
        strokes.append(np.stack([-Mx, -My], 1))
    rep = np.array([(cy - b[1]) * sy, (b[0] - cx) * sx]) * -1   # the repeat point, turned: the start
    S, rest = chain(strokes, rep)
    return S, rest, strokes, (x1 - x0, y1 - y0)


def digitise_labelled(path, start_px, repeat_px, thr=140, minlen=12):
    """Strokes on the labelled side of the start-repeat line, in metres, chained
    from the start. Letters are separate small components and drop out on size;
    where a label touches a stroke, the longest skeleton path follows the stroke."""
    mask = load(path, thr)
    border, (x0, y0, x1, y1) = rink_box(mask)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    sx, sy = 15 / ((x1 - x0) / 2), 30 / ((y1 - y0) / 2)
    m = mask & ~ndi.binary_dilation(border, iterations=2)
    lab, n = ndi.label(m, structure=np.ones((3, 3)))
    a, b = np.array(start_px, float), np.array(repeat_px, float)
    d = b - a; nrm = np.array([d[1], -d[0]])
    side = -np.sign(np.dot(np.array([x0 + 5, y1 - 5]) - a, nrm))
    strokes = []
    for k, s in enumerate(ndi.find_objects(lab)):
        h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
        if max(h, w) < minlen: continue
        c = np.array([(s[1].start + s[1].stop) / 2, (s[0].start + s[0].stop) / 2])
        if np.sign(np.dot(c - a, nrm)) != side: continue
        if c[0] > x1 or c[0] < x0: continue
        P = order_skeleton(lab == k + 1)
        if P is None or len(P) < minlen: continue
        # a ruled line (a table border, an arrow shaft) is no step
        ch = np.linalg.norm(P[-1] - P[0]); L = np.linalg.norm(np.diff(P, axis=0), axis=1).sum()
        u = P[-1] - P[0]; v = P - P[0]; dev = np.abs(u[0]*v[:, 1] - u[1]*v[:, 0]) / max(ch, 1e-9)
        if dev.max() < 1.5 and L > 60: continue
        strokes.append(np.stack([(cy - P[:, 1]) * sy, (P[:, 0] - cx) * sx], 1))
    st = np.array([(cy - a[1]) * sy, (a[0] - cx) * sx])
    S, rest = chain(strokes, st)
    return S, rest, strokes, (cx, cy, sx, sy)
