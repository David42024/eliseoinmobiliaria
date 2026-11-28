import * as THREE from 'three';
import type { Scene, Tour } from '../data/media';

const radians = THREE.MathUtils.degToRad;
function direction(yaw: number, pitch: number) {
  return new THREE.Vector3(Math.sin(radians(yaw)) * Math.cos(radians(pitch)),
    Math.sin(radians(pitch)), -Math.cos(radians(yaw)) * Math.cos(radians(pitch)));
}

function fitImage(image: HTMLImageElement, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  return { width: image.naturalWidth * scale, height: image.naturalHeight * scale };
}

export async function renderInteractiveTour(stage: HTMLElement, tour: Tour, status: HTMLElement, fallback: HTMLAnchorElement | null) {
  const viewport = document.createElement('div');
  viewport.className = 'tour-viewport';
  stage.append(viewport);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tour.kind === 'panorama' ? 2 : 1.5));
  viewport.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.001, 1000);
  const scene = new THREE.Scene();
  let render = () => renderer.render(scene, camera);
  const observer = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = viewport;
    if (!clientWidth || !clientHeight) return;
    camera.aspect = clientWidth / clientHeight;
    if (tour.kind === 'panorama') {
      const verticalFovFor90DegreesAcross = THREE.MathUtils.radToDeg(2 * Math.atan(1 / camera.aspect));
      camera.fov = Math.max(70, verticalFovFor90DegreesAcross);
    }
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
    render();
  });
  observer.observe(viewport);
  const events = new AbortController();
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    observer.disconnect();
    renderer.setAnimationLoop(null);
    renderer.dispose();
    events.abort();
  }, { signal: events.signal });

  try {
    if (tour.kind === 'model') {
      const [{ OrbitControls }, { GLTFLoader }] = await Promise.all([
        import('three/addons/controls/OrbitControls.js'),
        import('three/addons/loaders/GLTFLoader.js'),
      ]);
      const { scene: model } = await new GLTFLoader().loadAsync(tour.src);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6d735f, 2), model);
      const sun = new THREE.DirectionalLight(0xffffff, 2);
      sun.position.set(4, 7, 5);
      scene.add(sun);
      const bounds = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
      const radius = Math.max(bounds.radius, .01);
      camera.position.copy(bounds.center).add(new THREE.Vector3(1, .7, 1).normalize().multiplyScalar(radius * 3));
      camera.near = radius / 100;
      camera.far = radius * 100;
      camera.updateProjectionMatrix();
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(bounds.center);
      controls.update();
      controls.addEventListener('change', render);
      events.signal.addEventListener('abort', () => controls.dispose(), { once: true });
      status.textContent = '';
      render();
      return;
    }

    const material = new THREE.MeshBasicMaterial();
    const sphere = new THREE.SphereGeometry(20, 72, 48);
    sphere.scale(-1, 1, 1);
    scene.add(new THREE.Mesh(sphere, material));
    let yaw = 0;
    let pitch = 0;
    let hotspots: { button: HTMLButtonElement; position: THREE.Vector3 }[] = [];
    const still = document.createElement('div');
    still.className = 'tour-still';
    still.tabIndex = -1;
    still.hidden = true;
    viewport.append(still);
    let activePhoto: HTMLImageElement | undefined;
    render = () => {
      if (activePhoto) {
        const size = fitImage(activePhoto, viewport.clientWidth, viewport.clientHeight);
        still.style.width = `${size.width}px`;
        still.style.height = `${size.height}px`;
        return;
      }
      camera.lookAt(direction(yaw, pitch));
      renderer.render(scene, camera);
      const look = direction(yaw, pitch);
      const horizontalLimit = 1 - 44 / viewport.clientWidth;
      const verticalLimit = 1 - 44 / viewport.clientHeight;
      for (const { button, position } of hotspots) {
        const projected = position.clone().project(camera);
        button.hidden = position.dot(look) <= 0
          || Math.abs(projected.x) > horizontalLimit
          || Math.abs(projected.y) > verticalLimit;
        button.style.left = `${(projected.x + 1) * 50}%`;
        button.style.top = `${(1 - projected.y) * 50}%`;
      }
    };
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Vista de 360 grados. Usa las flechas o arrastra para girar.');
    const turn = (x: number, y: number) => {
      yaw += x;
      pitch = THREE.MathUtils.clamp(pitch + y, -85, 85);
      render();
    };
    let drag: { id: number; x: number; y: number } | undefined;
    canvas.addEventListener('pointerdown', event => {
      if (drag || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId) return;
      const { clientX, clientY } = event;
      turn((drag.x - clientX) * .24, (clientY - drag.y) * .24);
      drag.x = clientX;
      drag.y = clientY;
    });
    canvas.addEventListener('lostpointercapture', event => { if (drag?.id === event.pointerId) drag = undefined; });
    canvas.addEventListener('keydown', event => {
      const delta = { ArrowLeft: [-7, 0], ArrowRight: [7, 0], ArrowUp: [0, 7], ArrowDown: [0, -7] }[event.key];
      if (!delta) return;
      event.preventDefault();
      turn(delta[0], delta[1]);
    });

    if (tour.kind === 'video360') {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.preload = 'metadata';
      const control = document.createElement('button');
      control.className = 'button';
      control.textContent = 'Reproducir video';
      await new Promise<void>((resolve, reject) => {
        video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        video.addEventListener('error', reject, { once: true });
        video.src = tour.src;
      });
      material.map = new THREE.VideoTexture(video);
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.needsUpdate = true;
      stage.append(control);
      control.addEventListener('click', async () => {
        if (!video.paused) { video.pause(); return; }
        try { await video.play(); }
        catch { status.textContent = 'No se pudo reproducir el video. Puedes abrirlo en otra pestaña.'; }
      });
      video.addEventListener('play', () => {
        control.textContent = 'Pausar video';
        renderer.setAnimationLoop(render);
      });
      const stop = () => {
        control.textContent = 'Reproducir video';
        renderer.setAnimationLoop(null);
      };
      video.addEventListener('pause', stop);
      video.addEventListener('ended', stop);
      events.signal.addEventListener('abort', () => video.pause(), { once: true });
      status.textContent = '';
      render();
      return;
    }

    if (tour.kind !== 'panorama' || !tour.scenes.length) throw new Error('Sin escenas.');
    const scenes = tour.scenes;
    const toolbar = document.createElement('div');
    toolbar.className = 'tour-toolbar';
    const label = document.createElement('label');
    label.textContent = 'Escena del recorrido';
    const menu = document.createElement('select');
    for (const group of new Set(scenes.map(item => item.group))) {
      const options = document.createElement('optgroup');
      options.label = group;
      for (const item of scenes.filter(item => item.group === group)) options.append(new Option(item.title, item.id));
      menu.append(options);
    }
    label.append(menu);
    toolbar.append(label);
    const controls = document.createElement('div');
    controls.className = 'tour-view-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Controles de la vista');
    let startYaw = 0;
    let startPitch = 0;
    const resetView = () => { yaw = startYaw; pitch = startPitch; render(); };
    for (const control of [
      { text: '←', label: 'Girar a la izquierda', activate: () => turn(-25, 0) },
      { text: 'Centrar vista', label: 'Centrar vista', activate: resetView },
      { text: '→', label: 'Girar a la derecha', activate: () => turn(25, 0) },
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button compact outline';
      button.textContent = control.text;
      button.setAttribute('aria-label', control.label);
      button.addEventListener('click', control.activate);
      controls.append(button);
    }
    toolbar.append(controls);
    stage.prepend(toolbar);
    const hint = document.createElement('p');
    hint.className = 'tour-hint';
    stage.append(hint);
    const fallbackLabel = fallback?.querySelector('span');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const textureLoader = new THREE.TextureLoader();
    let activeScene: Scene | undefined;
    let requested = 0;
    let fadeLayer: HTMLCanvasElement | undefined;
    function capturePreviousView() {
      fadeLayer?.remove();
      if (!activeScene || reducedMotion.matches) return;
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const context = snapshot.getContext('2d');
      if (!context) return;
      if (activePhoto) {
        const size = fitImage(activePhoto, snapshot.width, snapshot.height);
        context.drawImage(activePhoto, (snapshot.width - size.width) / 2,
          (snapshot.height - size.height) / 2, size.width, size.height);
      } else {
        // Draw immediately while the WebGL drawing buffer still contains this frame.
        render();
        context.drawImage(canvas, 0, 0);
      }
      snapshot.className = 'tour-fade';
      snapshot.setAttribute('aria-hidden', 'true');
      viewport.append(snapshot);
      fadeLayer = snapshot;
      return snapshot;
    }

    async function show(item: Scene) {
      const request = ++requested;
      menu.value = item.id;
      if (item === activeScene) {
        status.textContent = '';
        return;
      }
      status.textContent = 'Cargando escena…';
      let photo: HTMLImageElement | undefined;
      let texture: THREE.Texture | undefined;
      try {
        if (item.kind === 'image') {
          photo = new Image();
          photo.alt = item.alt;
          photo.src = item.src;
          await photo.decode();
        } else {
          texture = await textureLoader.loadAsync(item.src);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        }
        if (request !== requested || events.signal.aborted) { texture?.dispose(); return; }
        const previous = capturePreviousView();
        material.map?.dispose();
        material.map = texture ?? null;
        material.needsUpdate = true;
        const hotspotHadFocus = viewport.contains(document.activeElement) && document.activeElement !== canvas;
        hotspots.forEach(({ button }) => button.remove());
        still.replaceChildren(...(photo ? [photo] : []));
        activePhoto = photo;
        still.hidden = !photo;
        canvas.hidden = Boolean(photo);
        controls.style.visibility = photo ? 'hidden' : '';
        if (fallback) fallback.href = item.src;
        if (fallbackLabel) fallbackLabel.textContent = photo
          ? 'Abrir imagen en máxima resolución' : 'Abrir imagen panorámica';
        hint.textContent = photo
          ? 'Toca los círculos blancos o elige otra escena en el menú.'
          : item.hotspots?.length
            ? 'Arrastra para mirar alrededor y toca los círculos blancos para cambiar de escena. También puedes usar el menú.'
            : 'Arrastra la imagen para mirar alrededor o usa las flechas con el visor enfocado.';
        hotspots = (item.hotspots || []).flatMap(hotspot => {
          const target = scenes.find(candidate => candidate.id === hotspot.target);
          if (!target) return [];
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'tour-hotspot';
          button.setAttribute('aria-label', hotspot.label);
          const caption = document.createElement('span');
          caption.textContent = hotspot.label;
          caption.setAttribute('aria-hidden', 'true');
          button.append(caption);
          button.addEventListener('click', () => { void show(target).catch(() => {}); });
          if ('x' in hotspot) {
            button.style.left = `${hotspot.x}%`;
            button.style.top = `${hotspot.y}%`;
            still.append(button);
            return [];
          }
          viewport.append(button);
          return [{ button, position: direction(hotspot.yaw, hotspot.pitch).multiplyScalar(10) }];
        });
        startYaw = item.kind === 'image' ? 0 : item.yaw ?? 0;
        startPitch = item.kind === 'image' ? 0 : THREE.MathUtils.clamp(item.pitch ?? 0, -85, 85);
        resetView();
        activeScene = item;
        if (hotspotHadFocus) (photo ? still : canvas).focus({ preventScroll: true });
        if (previous) {
          const remove = () => {
            previous.remove();
            if (fadeLayer === previous) fadeLayer = undefined;
          };
          const transition = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out' });
          void transition.finished.then(remove, remove);
        }
        status.textContent = '';
      } catch (error) {
        if (request !== requested) return;
        if (!activeScene) throw error;
        menu.value = activeScene.id;
        status.textContent = 'La escena no pudo cargar. Puedes reintentar o seleccionar otra vista.';
      }
    }
    menu.addEventListener('change', () => {
      const item = scenes.find(candidate => candidate.id === menu.value);
      if (item) void show(item).catch(() => {});
    });
    await show(scenes[0]);
  } catch (error) {
    observer.disconnect();
    renderer.dispose();
    events.abort();
    throw error;
  }
}
