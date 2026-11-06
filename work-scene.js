import {
  WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, ShaderMaterial,
  Mesh, Texture, Vector2, SRGBColorSpace, LinearFilter
} from 'three';
import { gsap } from 'gsap';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uHover;
  uniform vec2 uPointer;
  void main() {
    vUv = uv;
    vec3 p = position;
    float envelope = sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265);
    p.z += envelope * uHover * 10.0 * (uPointer.x - 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uImageSize;
  uniform vec2 uPlaneSize;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform float uVelocity;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRadius;
  void main() {
    vec2 corner = abs((vUv - 0.5) * uPlaneSize) - (uPlaneSize * 0.5 - uRadius);
    float distanceToEdge = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - uRadius;
    float alpha = (1.0 - smoothstep(-0.6, 0.6, distanceToEdge)) * uOpacity;
    if (alpha < 0.001) discard;
    float imageAspect = uImageSize.x / uImageSize.y;
    float planeAspect = uPlaneSize.x / uPlaneSize.y;
    vec2 fit = vec2(min(1.0, imageAspect / planeAspect), min(1.0, planeAspect / imageAspect));
    vec2 uv = (vUv - 0.5) / fit + 0.5;
    vec2 delta = vUv - uPointer;
    float wave = sin(length(delta) * 18.0 - uTime * 2.0);
    uv += delta * wave * uVelocity * uHover * 0.002;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
    vec4 picture = texture2D(uTexture, uv);
    float lightLine = abs(dot(vUv - uPointer, vec2(0.8, 0.45)));
    float sheen = pow(max(0.0, 1.0 - lightLine / 0.3), 4.0) * uHover * 0.065;
    picture.rgb += (1.0 - picture.rgb) * sheen;
    gl_FragColor = vec4(picture.rgb, picture.a * alpha);
    #include <colorspace_fragment>
  }
`;

// One shared scene, with GPU resources only for the cards near the viewport.
// It renders on movement and scroll; a stationary gallery does not redraw.
export function createWorkScene(main) {
  const canvas = document.createElement('canvas');
  canvas.className = 'work-webgl-stage';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!context) return null;
    renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x282828, 0);
  let shaderFailed = false;
  renderer.debug.onShaderError = () => { shaderFailed = true; };
  document.body.append(canvas);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, .1, 10000);
  const geometry = new PlaneGeometry(1, 1, 32, 20);
  const records = [...main.querySelectorAll('.project-card')].map(card => ({
    card, image: card.querySelector('img'), near: false, mesh: null, generation: 0,
    state: { hover: 0, rx: 0, ry: 0, px: .5, py: .5, velocity: 0 }
  }));
  let dirty = true;
  let disposed = false;
  let hovered;
  const invalidate = () => { dirty = true; };
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.position.z = innerHeight / (2 * Math.tan(35 * Math.PI / 360));
    camera.updateProjectionMatrix();
    invalidate();
  }
  function release(record) {
    record.generation++;
    if (!record.mesh) return;
    scene.remove(record.mesh);
    record.mesh.material.uniforms.uTexture.value.dispose();
    record.bitmap?.close(); record.bitmap = null;
    record.mesh.material.dispose(); record.mesh = null;
    record.image.style.removeProperty('opacity');
    delete record.card.dataset.enhanced;
    invalidate();
  }
  async function prepare(record) {
    if (disposed || !record.near || !record.image.complete || !record.image.naturalWidth) return;
    const version = ++record.generation;
    // A decoded bitmap has actual pixel dimensions, independent of srcset's
    // density-corrected naturalWidth and the HTML image's width attributes.
    let bitmap;
    try { bitmap = await createImageBitmap(record.image, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); }
    catch { return; }
    if (disposed || !record.near || version !== record.generation) { bitmap.close(); return; }
    release(record);
    record.bitmap = bitmap;
    const texture = new Texture(bitmap);
    texture.flipY = false;
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter; texture.magFilter = LinearFilter;
    texture.generateMipmaps = false; texture.needsUpdate = true;
    const material = new ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTexture: { value: texture },
        uImageSize: { value: new Vector2(bitmap.width, bitmap.height) },
        uPlaneSize: { value: new Vector2(1, 1) }, uPointer: { value: new Vector2(.5, .5) },
        uHover: { value: 0 }, uVelocity: { value: 0 }, uTime: { value: 0 },
        uOpacity: { value: 1 }, uRadius: { value: 12 }
      }
    });
    record.mesh = new Mesh(geometry, material);
    record.mesh.frustumCulled = false;
    scene.add(record.mesh); invalidate();
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const record = records.find(item => item.card === entry.target);
      record.near = entry.isIntersecting;
      if (record.near) prepare(record); else release(record);
    });
  }, { rootMargin: '250px' });
  records.forEach(record => {
    record.load = () => prepare(record);
    record.image.addEventListener('load', record.load);
    observer.observe(record.card);
  });
  function reset(record) {
    if (!record) return;
    gsap.to(record.state, { hover: 0, rx: 0, ry: 0, velocity: 0, duration: .7, ease: 'power3.out', overwrite: true, onUpdate: invalidate });
  }
  function pointer(event) {
    const card = event.target.closest?.('.project-card');
    const record = card && records.find(item => item.card === card);
    if (hovered !== record) { reset(hovered); hovered = record; }
    if (!record?.mesh) return;
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    const velocity = Math.min(1, Math.hypot(x - record.state.px, 1 - y - record.state.py) * 5);
    gsap.to(record.state, {
      hover: 1, rx: (y - .5) * .025, ry: (x - .5) * .035,
      px: x, py: 1 - y, velocity, duration: .55, ease: 'power3.out', overwrite: true, onUpdate: invalidate
    });
  }
  const leave = () => { reset(hovered); hovered = null; };
  function draw() {
    if (disposed || !dirty || document.hidden) return;
    dirty = false;
    const active = records.filter(record => record.mesh);
    active.forEach(record => {
      const rect = record.card.getBoundingClientRect();
      const { mesh, state } = record;
      mesh.position.set(rect.left + rect.width / 2 - innerWidth / 2, innerHeight / 2 - rect.top - rect.height / 2, 0);
      mesh.scale.set(rect.width, rect.height, 1);
      mesh.rotation.set(state.rx, state.ry, 0);
      const uniforms = mesh.material.uniforms;
      uniforms.uPlaneSize.value.set(rect.width, rect.height);
      uniforms.uPointer.value.set(state.px, state.py);
      uniforms.uHover.value = state.hover; uniforms.uVelocity.value = state.velocity;
      uniforms.uTime.value = performance.now() / 1000;
      uniforms.uOpacity.value = Number(getComputedStyle(record.card).opacity);
      uniforms.uRadius.value = parseFloat(getComputedStyle(record.card).borderTopLeftRadius) || 0;
    });
    try {
      renderer.render(scene, camera);
      if (shaderFailed) { dispose(); return; }
      active.forEach(record => { record.image.style.opacity = '0'; record.card.dataset.enhanced = 'three'; });
      canvas.dataset.state = 'ready';
    } catch { dispose(); }
  }
  const lost = event => { event.preventDefault(); dispose(); };
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    gsap.ticker.remove(draw);
    window.removeEventListener('scroll', invalidate);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', invalidate);
    document.removeEventListener('pointermove', pointer);
    document.removeEventListener('pointerleave', leave);
    canvas.removeEventListener('webglcontextlost', lost);
    records.forEach(record => {
      gsap.killTweensOf(record.state);
      record.image.removeEventListener('load', record.load);
      release(record);
    });
    geometry.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
  }
  window.addEventListener('scroll', invalidate, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', invalidate);
  document.addEventListener('pointermove', pointer, { passive: true });
  document.addEventListener('pointerleave', leave);
  canvas.addEventListener('webglcontextlost', lost);
  gsap.ticker.add(draw);
  resize();
  return { invalidate, dispose };
}
