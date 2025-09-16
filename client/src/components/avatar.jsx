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
    const container = document.getElementById('avatar-container');

    //sets initial size and shadow properties
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Camera, scene and lighting setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight * 0.9), 0.1, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    const scene = new THREE.Scene();
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
   

    //Logic to rotate around the island (home)
    let idleTimeout;
    function setIdleRotation() { controls.autoRotate = true;}
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


    //find rock names
    const clickableMeshes = {};

    avatar.traverse((child) => {
      if (child.isMesh) {
        if (child.name === "Github") clickableMeshes.Github = child;
        if (child.name === "LinkedIn") clickableMeshes.LinkedIn = child;
        if (child.name === "Email") clickableMeshes.Email = child;
      }
    });

    const mouse = new THREE.Vector2();

    container.addEventListener("mousedown", (event) => {
      // Convert mouse position to normalized device coords
      mouse.x = (event.offsetX / container.clientWidth) * 2 - 1;
      mouse.y = -(event.offsetY / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Intersect only with the clickable meshes
      const intersects = raycaster.intersectObjects(Object.values(clickableMeshes));

      if (intersects.length > 0) {
        const clicked = intersects[0].object;

        if (clicked.name === "LinkedIn") window.open("https://github.com/Derick12345678", "_blank");
        else if (clicked.name === "Github") window.open("https://www.linkedin.com/in/derekgallagher1", "_blank");
        else if (clicked.name === "Email") window.open("mailto:derekgallagher01@email.com", "_blank");
        
      }
    });

    function goHome() {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2;
      controls.enabled = true;
      controls.minDistance = 4.3;
      controls.maxDistance = 10;
      controls.enableDamping = true;
      controls.enableZoom = true;
      controls.update();
      controls.target.set(0.77, 0.46, -1.47);
      camera.position.set(0.77,1.3,4.8);
    }

    function goAboutMe() {
      controls.maxDistance = 2.65;
      controls.minDistance = 2.4;
      controls.autoRotateSpeed = 0;
      controls.enabled = true;
      controls.update();
      camera.position.set(3.0,0.3,0);
      controls.target.set(0.77, 0.46, -1.47);
      //THINGS TO WORK ON: Change controls to limit how far you can rotate the camera up/down and left/right
      //Also make the scroll controls smoother
      //Also figure out how to transition the camera to the new position instead of jumping
    }

    function goProjects() {
      console.log("Projects view not yet implemented");
    }

    function goContact() {
      camera.position.set(-1.2,0.45,-4);
      controls.target.set(-0.9, 0.35, -1.3);
      controls.minDistance = 3;
      controls.maxDistance = 3;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
    }

    document.getElementById("home-btn").addEventListener("click", goHome);
    document.getElementById("aboutme-btn").addEventListener("click", goAboutMe);
    document.getElementById("projects-btn").addEventListener("click", goProjects);
    document.getElementById("contact-btn").addEventListener("click", goContact);

    goHome();

    // Handle window resize, refit camera so model always stays correct
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / (window.innerHeight * 0.9);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
      goHome();
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
