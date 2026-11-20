import sys, numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageDraw
src, out = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(7)
W, H = 640, 400
im = Image.open(src).convert('RGB')
w, h = im.size; s = max(W / w, H / h)
im = im.resize((int(w * s), int(h * s)), Image.LANCZOS)
im = im.crop(((im.width - W)//2, im.height - H, (im.width - W)//2 + W, im.height))
a = np.asarray(im).astype(np.int16)
def save(n, arr): Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(f'{out}/{n}.jpg', quality=88)
# datamosh: P-frame style block smear (motion vectors copy blocks along a drift)
d = a.copy(); B = 16
for y in range(0, H, B):
    for x in range(0, W, B):
        if rng.random() < .55:
            dx = int(np.clip(x - 3*B + rng.integers(-B, B), 0, W - B)); dy = int(np.clip(y - B, 0, H - B))
            d[y:y+B, x:x+B] = d[dy:dy+B, dx:dx+B]
save('datamosh', d)
# chromatic aberration
c = a.copy(); c[..., 0] = np.roll(a[..., 0], 12, 1); c[..., 2] = np.roll(a[..., 2], -12, 1); save('aberration', c)
# pixel sort: sort bright spans per row by luminance
p = a.copy(); L = a.mean(2)
for y in range(H):
    m = L[y] > 110; idx = np.where(m)[0]
    if len(idx) > 4:
        seg = p[y, idx]; p[y, idx] = seg[np.argsort(seg.mean(1))]
save('pixelsort', p)
# CRT scanlines + rgb mask
crt = a.astype(float); crt[::3] *= .35
mask = np.zeros((H, W, 3)); 
for k in range(3): mask[:, k::3, k] = 1
crt = crt * (.55 + .6 * mask); save('crt', crt * 1.25)
# 1-bit Bayer dither
g = np.asarray(im.convert('L'), float) / 255
b4 = np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]) / 16
t = np.tile(b4, (H//4 + 1, W//4 + 1))[:H, :W]
dd = ((g > t) * 255)[..., None].repeat(3, 2); save('dither', dd)
# slit-scan: each column offset vertically by a wave (time displacement)
sl = a.copy()
for x in range(W): sl[:, x] = np.roll(a[:, x], int(40 * np.sin(x / 60)), 0)
save('slitscan', sl)
# VHS: horizontal jitter, chroma bleed, noise
v = a.copy().astype(float)
for y in range(H): v[y] = np.roll(v[y], int(rng.normal(0, 2) + (8 if 180 < y < 200 else 0)), 0)
v[..., 0] = np.asarray(Image.fromarray(v[..., 0].astype(np.uint8)).filter(ImageFilter.BoxBlur(4)))
v += rng.normal(0, 14, v.shape); save('vhs', v * [1.05, .95, 1.1])
# blob tracking: threshold bright regions, connected components, boxes
from collections import deque
gm = np.asarray(im.convert('L').resize((W//4, H//4)), float); m = gm > np.percentile(gm, 88)
seen = np.zeros_like(m); boxes = []
for y0 in range(m.shape[0]):
    for x0 in range(m.shape[1]):
        if m[y0, x0] and not seen[y0, x0]:
            q = deque([(y0, x0)]); seen[y0, x0] = 1; ys = [y0]; xs = [x0]
            while q:
                y, x = q.popleft()
                for yy, xx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
                    if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = 1; q.append((yy, xx)); ys.append(yy); xs.append(xx)
            if len(ys) > 6: boxes.append((min(xs)*4, min(ys)*4, max(xs)*4+4, max(ys)*4+4))
bt = Image.fromarray(np.uint8(np.asarray(im.convert('L'))*.6)).convert('RGB'); dr = ImageDraw.Draw(bt)
boxes = sorted(boxes, key=lambda b: -(b[2]-b[0])*(b[3]-b[1]))[:9]
for i, b in enumerate(boxes):
    dr.rectangle(b, outline=(255,255,255), width=2); dr.text((b[0]+3, b[1]-12), f'#{i:02d}', fill=(255,255,255))
bt.save(f'{out}/blob.jpg', quality=88)
# feedback: previous frames zoomed and faded under the current one
fb = np.zeros_like(a, float); cur = Image.fromarray(a.astype(np.uint8))
for k in range(8, -1, -1):
    z = 1 + .06 * k; fr = cur.resize((int(W*z), int(H*z))); ox, oy = (fr.width-W)//2, (fr.height-H)//2
    f = np.asarray(fr.crop((ox, oy, ox+W, oy+H)), float) * (.85 ** k) * [1, .8 + .02*k, 1.1]
    fb = np.maximum(fb * .9, f)
save('feedback', fb)
