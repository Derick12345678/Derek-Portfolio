import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";
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
   
    function TV() {
      const screen = avatar.getObjectByName("screen");
      const upArrow = avatar.getObjectByName("uparrow");
      const downArrow = avatar.getObjectByName("downarrow");

      if (screen && upArrow && downArrow) {
        const movies = ["/Discord.mp4", "/CRM.mp4"];
        let currentMovieIndex = 0;

        const video = document.createElement("video");
        video.src = movies[currentMovieIndex];
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        video.play().catch((err) => {
          console.warn("Autoplay blocked. Will require user interaction:", err);
        });

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.encoding = THREE.sRGBEncoding;
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        videoTexture.flipY = false;

        screen.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
          toneMapped: false,
        });

        upArrow.material = upArrow.material.clone();
        downArrow.material = downArrow.material.clone();

        // Save original colors
        const upArrowOriginal = upArrow.material.color.clone();
        const downArrowOriginal = downArrow.material.color.clone();

        function changeMovie(next) {
          if (next) {
            currentMovieIndex = (currentMovieIndex + 1) % movies.length;
          } else {
            currentMovieIndex =
              (currentMovieIndex - 1 + movies.length) % movies.length;
          }
          video.src = movies[currentMovieIndex];
          video.play();
        }

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let hovered = null;

        function onMouseMove(event) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(pointer, camera);
          const intersects = raycaster.intersectObjects([upArrow, downArrow]);

          if (intersects.length > 0) {
            const target = intersects[0].object;
            if (hovered !== target) {
              hovered = target;
              renderer.domElement.style.cursor = "pointer";
            }
          } else {
            hovered = null;
            renderer.domElement.style.cursor = "default";
          }
        }

        function onClick() {
          if (hovered === upArrow) {
            changeMovie(true);
            flashArrow(upArrow, upArrowOriginal);
          } else if (hovered === downArrow) {
            changeMovie(false);
            flashArrow(downArrow, downArrowOriginal);
          }
        }

        function flashArrow(arrow, originalColor) {
          arrow.material.color.set("yellow");
          setTimeout(() => {
            arrow.material.color.copy(originalColor);
          }, 200);
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("click", onClick);
    
        TV._video = video;
        TV._screen = screen;
      }
    }

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

    function transitionCamera(camera, controls, pos, target, duration = 2) {
      gsap.to(camera.position, {
        duration,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        ease: "power2.inOut",
      });

      gsap.to(controls.target, {
        duration,
        x: target.x,
        y: target.y,
        z: target.z,
        ease: "power2.inOut",
      });
    }


    function goHome() {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2;
      controls.enabled = true;
      controls.minDistance = 4.3;
      controls.maxDistance = 10;
      controls.enableDamping = true;
      controls.enableZoom = true;
      controls.update();
      transitionCamera(camera, controls, {x: 0.77, y: 1.3, z: 4.8}, { x: 0.77, y: 0.46, z: -1.47});
    }

    function goAboutMe() {
      controls.minDistance = 2.6;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
      transitionCamera(camera, controls, {x: 3, y: 0.3, z: 0}, { x: 0.77, y: 0.46, z: -1.47});
    }

    function goProjects() {
      controls.minDistance = 2.05;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
      transitionCamera(camera, controls, {x: -1.35, y: 0.625, z: 0}, { x:-0.6, y: 0.46, z: -1.47});
      TV();
    }

    function goContact() {
      controls.minDistance = 2.9;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
      transitionCamera(camera, controls, {x: -1.2, y: 0.45, z: -4}, { x: -0.9, y: 0.35, z: -1.3});
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
//TODO: fix resize for mobile devices.
//TODO: create tv2() function to turn off tv
//TODO: add all videos
//TODO: fix sign to make more readable