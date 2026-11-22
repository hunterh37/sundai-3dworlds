import segno, io, re, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
REPO = "https://github.com/hunterh37/sundai-3dworlds/blob/main/RESOURCES.md"
S = [
 ("Three.js toolkit", "https://github.com/AxiomeCG/awesome-threejs", "awesome-threejs", [
  ("polyhaven","Poly Haven","CC0 models, HDRIs, textures","polyhaven.com"),
  ("ambientcg","ambientCG","CC0 PBR materials","ambientcg.com"),
  ("matcaps","Matcaps","600+ matcap textures","github.com/nidorx/matcaps"),
  ("drei","drei","R3F helpers, ready to use","drei.docs.pmnd.rs"),
  ("rapier","Rapier","Fast WASM physics","rapier.rs"),
  ("bvh","three-mesh-bvh","Fast raycasts + collisions","github.com/gkjohnson"),
  ("lygia","LYGIA","Drop-in shader functions","lygia.xyz"),
  ("bookofshaders","Book of Shaders","Learn GLSL, free","thebookofshaders.com"),
  ("spline","Spline","3D design, export to web","spline.design"),
  ("examples","three.js examples","Copy a working start","threejs.org/examples"),
 ]),
 ("UI + motion", None, "RESOURCES.md", [
  ("horizonx","HorizonX","UI, motion, Three.js blocks","horizonx.so"),
  ("reactbits","React Bits","Animated React components","reactbits.dev"),
  ("magicui","Magic UI","Animated shadcn components","magicui.design"),
  ("aceternity","Aceternity UI","Landing page effects","ui.aceternity.com"),
  ("21st","21st.dev","Community UI marketplace","21st.dev"),
  ("motiondev","Motion","React animation library","motion.dev"),
  ("dithercn","dithercn","Dither effects, shadcn style","dithercn.dev"),
  ("codrops","Codrops","Creative coding tutorials","tympanus.net/codrops"),
  ("compgallery","Component Gallery","How design systems build UI","component.gallery"),
  ("animationsdev","animations.dev","Web animation course","animations.dev"),
  ("animejs","Anime.js easing","Design custom easings","animejs.com/easing-editor"),
  ("cubicbezier","cubic-bezier","Drag to tune curves","cubic-bezier.com"),
 ]),
 ("Design inspiration", None, "RESOURCES.md", [
  ("godly","Godly","Award-level websites","godly.website"),
  ("mobbin","Mobbin","Real app screens","mobbin.com"),
  ("landdding","Landdding","Top landing pages","landdding.com"),
  ("motionin","Motionin","1 prompt, 1 website","motionin.design"),
  ("recent","Recent","Next level design","recent.design"),
  ("60fps","60fps","Mobile UI animations","60fps.design"),
  ("backgrounds","Backgrounds","Backgrounds for projects","backgrounds.supply"),
  ("modulify","Modulify","Free site templates","modulify.ai/templates"),
  ("iconly","Iconly","App icon gallery","iconly.design"),
  ("fontinlogo","Font in Logo","Fonts behind brands","fontinlogo.com"),
  ("logotouse","Logo to Use","Premium SVG logos","logotouse.com"),
  ("footer","Footer","Footer inspiration","footer.design"),
  ("ondesign","On.design","Design community","on.design"),
  ("wonderlist","Wonderlist","Figma web designs","wonderlist.design"),
  ("paperanim","Paper Animation","Paper style animation","paperanimation.ai"),
 ]),
]
def qr(url):
    b = io.BytesIO(); segno.make(url, error="m").save(b, kind="svg", scale=10, border=0, dark="#f2f2f2", light=None, xmldecl=False, svgns=True)
    return re.sub(r'<svg ', '<svg style="width:100%;height:auto;display:block" ', b.getvalue().decode())
html, md = [], ["# Resources\n"]
start, total = 12, 14
for i,(title,url,label,items) in enumerate(S):
    n = start+i; cols = 5 if len(items)<=10 else 6
    tiles = "".join(f'<a class="rt" href="https://{u}"><img src="assets/res/{k}.jpg"><b>{t}</b><span>{d}</span><i>{u}</i></a>' for k,t,d,u in items)
    html.append(f'<section class="s"><div class="top m"><span>Resources</span><span>{n} / {total}</span></div>\n<h2 class="ab sm" style="margin:26px 0 34px">{title}</h2>\n<div class="rtiles c{cols}">{tiles}</div>\n<div class="qr5">{qr(url or REPO)}<span>{label}</span></div>\n</section>')
    md.append(f"\n## {title}\n" + (f"\nFrom {url}\n" if url else "") + "".join(f"\n- [{t}](https://{u}): {d}" for k,t,d,u in items) + "\n")
(R/"scripts/resources.html").write_text("\n".join(html)+"\n")
(R/"RESOURCES.md").write_text("".join(md))
