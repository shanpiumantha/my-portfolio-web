document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Mobile menu ---------- */
const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
burgerBtn.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('is-open');
  burgerBtn.setAttribute('aria-expanded', String(isOpen));
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.remove('is-open');
  burgerBtn.setAttribute('aria-expanded', 'false');
}));
// Close the mobile menu on Escape, and if the viewport is resized past the mobile breakpoint
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && mobileMenu.classList.contains('is-open')){
    mobileMenu.classList.remove('is-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.focus();
  }
});
window.addEventListener('resize', () => {
  if(window.innerWidth > 720 && mobileMenu.classList.contains('is-open')){
    mobileMenu.classList.remove('is-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
  }
});

/* ---------- Scrubber progress bar ---------- */
const scrubberFill = document.getElementById('scrubberFill');
function updateScrubber(){
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  scrubberFill.style.width = scrolled + '%';
}
document.addEventListener('scroll', updateScrubber, { passive: true });
updateScrubber();

/* ---------- Scroll reveal (IntersectionObserver) ---------- */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');

  if(reduceMotion || !('IntersectionObserver' in window)){
    revealEls.forEach(el => el.classList.add('is-visible'));
    return;
  }

  // Stagger cards that share a parent grid, so groups cascade in rather than popping together
  const parentIndexMap = new WeakMap();
  revealEls.forEach(el => {
    const parent = el.parentElement;
    if(!parentIndexMap.has(parent)) parentIndexMap.set(parent, 0);
    const idx = parentIndexMap.get(parent);
    parentIndexMap.set(parent, idx + 1);
    if(!el.classList.contains('reveal-delay-1') && !el.classList.contains('reveal-delay-2') && !el.classList.contains('reveal-delay-3')){
      el.style.transitionDelay = Math.min(idx * 0.08, 0.4) + 's';
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
})();

/* ---------- Hero running timecode (real clock, cinematic HUD detail) ---------- */
const tcEl = document.getElementById('heroTimecode');
let frame = 0;
function pad(n){ return String(n).padStart(2,'0'); }
function tickTimecode(){
  frame = (frame + 1) % 24;
  const d = new Date();
  tcEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(frame)}`;
  requestAnimationFrame(tickTimecode);
}
tickTimecode();

/* ---------- Contact form (client-side, mailto fallback) ---------- */
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const subject = form.subject.value.trim() || 'New project inquiry';
  const message = form.message.value.trim();

  if(!name || !email || !message){
    status.textContent = 'Please fill in your name, email, and message.';
    status.style.color = 'var(--orange)';
    return;
  }

  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  const mailto = `mailto:wilegepiumanthaudayakumara@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  window.location.href = mailto;
  status.textContent = 'Opening your email app to send this message...';
  status.style.color = 'var(--teal)';
});

/* ============================================================
   THREE.JS CINEMATIC HERO SCENE
============================================================ */
(function(){
  const canvas = document.getElementById('hero-canvas');
  const heroSection = document.getElementById('hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer, scene, camera, group;
  let width = heroSection.clientWidth, height = heroSection.clientHeight;
  let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  let scrollProgress = 0;

  function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100);
    camera.position.set(0, 0, 14);

    renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Lights: ambient + teal/orange rim lights (color-grade reference)
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const tealLight = new THREE.PointLight(0x1fb8a3, 6, 30);
    tealLight.position.set(-6, 3, 6);
    scene.add(tealLight);
    const orangeLight = new THREE.PointLight(0xff6b35, 5, 30);
    orangeLight.position.set(6, -3, 4);
    scene.add(orangeLight);
    const goldLight = new THREE.PointLight(0xd4af37, 2, 30);
    goldLight.position.set(0, 6, -4);
    scene.add(goldLight);

    group = new THREE.Group();
    scene.add(group);

    // Layered "artboard" planes — referencing design layers
    const count = 16;
    for(let i=0;i<count;i++){
      const w = 2.2 + Math.random()*2.4;
      const h = 1.4 + Math.random()*2.0;
      const geo = new THREE.PlaneGeometry(w, h);
      const hueChoice = [0x1fb8a3, 0xff6b35, 0xd4af37, 0xf2efea][i % 4];
      const mat = new THREE.MeshPhysicalMaterial({
        color: hueChoice,
        transparent: true,
        opacity: 0.06 + Math.random()*0.05,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);

      const radius = 4 + Math.random()*6;
      const theta = Math.random()*Math.PI*2;
      const yPos = (Math.random()-0.5)*8;
      mesh.position.set(Math.cos(theta)*radius, yPos, Math.sin(theta)*radius - 2);
      mesh.rotation.set(Math.random()*0.6-0.3, Math.random()*Math.PI, Math.random()*0.4-0.2);

      // wireframe edge outline for HUD feel
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: hueChoice, transparent:true, opacity:0.35 });
      const line = new THREE.LineSegments(edges, lineMat);
      mesh.add(line);

      mesh.userData.speed = 0.05 + Math.random()*0.08;
      mesh.userData.baseY = yPos;

      group.add(mesh);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('scroll', onScroll, { passive:true });
  }

  function onResize(){
    width = heroSection.clientWidth;
    height = heroSection.clientHeight;
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function onMouseMove(e){
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function onScroll(){
    const rect = heroSection.getBoundingClientRect();
    scrollProgress = Math.min(Math.max(-rect.top / heroSection.clientHeight, 0), 1.4);
  }

  let clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if(!reduceMotion){
      targetRotY += (mouseX*0.25 - targetRotY) * 0.03;
      targetRotX += (mouseY*0.15 - targetRotX) * 0.03;
      group.rotation.y = t*0.03 + targetRotY;
      group.rotation.x = targetRotX*0.4;

      group.children.forEach((mesh, idx) => {
        mesh.position.y = mesh.userData.baseY + Math.sin(t*mesh.userData.speed + idx) * 0.4;
      });

      camera.position.z = 14 - scrollProgress*4;
      camera.position.y = scrollProgress*1.2;
      camera.lookAt(0,0,0);
    }

    renderer.render(scene, camera);
  }

  if(canvas && window.WebGLRenderingContext){
    try{
      init();
      animate();
    }catch(e){
      console.warn('3D hero scene failed to initialize:', e);
    }
  }
})();
