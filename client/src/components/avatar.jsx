import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import '../home.css';

export default function Avatar() {
  window.onload = () => loadModel();

  function loadModel() {
    const loader = new GLTFLoader();
    loader.load('HomePage.glb',
      (gltf) => {setupScene(gltf)}, 
      (error) => {console.log(error)}
    );
  }

  function setupScene(gltf) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const container = document.getElementById('avatar-container');

    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight * 0.9), 0.1, 1000);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    controls.minDistance = 4.5;
    controls.maxDistance = 10;
    
    // Scene setup
    const scene = new THREE.Scene();

    // Lighting setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 1);
    spotlight.penumbra = 0.5;
    spotlight.position.set(0, 4, 2);
    spotlight.castShadow = true;
    scene.add(spotlight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(1, 1, 2);
    keyLight.lookAt(new THREE.Vector3());
    scene.add(keyLight);

    // Load avatar
    const avatar = gltf.scene;
    avatar.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(avatar);

    // --- Fit camera to model helper ---
    function fitCameraToObject(obj, zoomFactor = 0.7) {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      cameraZ *= zoomFactor; // adjust zoom (smaller = closer)

      // More natural front-facing angle (slightly above)
      camera.position.set(center.x, center.y + size.y * 0.2, cameraZ);
      camera.lookAt(center);

      controls.target.copy(center);
      controls.update();
    }

    // Initial fit
    fitCameraToObject(avatar, 0.6);

    // --- Auto-rotate on idle ---
    let idleTimeout;
    function setIdleRotation() {
      controls.autoRotate = true;
    }
    function resetIdleTimer() {
      controls.autoRotate = false;
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(setIdleRotation, 2000);
    }
    ["scroll", "mousedown", "wheel"].forEach(evt => {
      window.addEventListener(evt, resetIdleTimer);
    });
    resetIdleTimer();

    // Load animations
    const mixer = new THREE.AnimationMixer(avatar);
    const clips = gltf.animations;
    const SaluteClip = THREE.AnimationClip.findByName(clips, 'Salute');
    const DrunkClip = THREE.AnimationClip.findByName(clips, 'drunk.001');
    const SaluteAction = mixer.clipAction(SaluteClip);
    const DrunkAction = mixer.clipAction(DrunkClip);

    let isDrunk = false;
    const raycaster = new THREE.Raycaster();
    container.addEventListener('mousedown', (ev) => {
      const coords = {
        x: (ev.offsetX / container.clientWidth) * 2 - 1,
        y: -(ev.offsetY / container.clientHeight) * 2 + 1
      };

      raycaster.setFromCamera(coords, camera);
      const intersections = raycaster.intersectObject(avatar);

      if (intersections.length > 0) {
        if (isDrunk) return;

        isDrunk = true;
        DrunkAction.reset();
        DrunkAction.play();
        SaluteAction.crossFadeTo(DrunkAction, 0.3);

        setTimeout(() => {
          SaluteAction.reset();
          SaluteAction.play();
          DrunkAction.crossFadeTo(SaluteAction, 1);
          setTimeout(() => isDrunk = false, 1000);
        }, 4000)
      }
    });

    // Handle window resize → refit camera so model always stays correct
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / (window.innerHeight * 0.9);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
      fitCameraToObject(avatar, 0.6);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      mixer.update(clock.getDelta());
      controls.update();
      renderer.render(scene, camera);
    }

    animate();
    SaluteAction.play();
  }

  return(      
    <div id='avatar-container'>
      <div id='avatar-loading'></div>
    </div>
  );
}
