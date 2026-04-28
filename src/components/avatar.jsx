import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";
import "../home.css";

export default function Avatar() {
  useEffect(() => {
    const container = document.getElementById("avatar-container");
    const loadingEl = document.getElementById("avatar-loading");
    if (!container) return;
    let currentView = "home";

    // --- Core Three objects ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / (window.innerHeight * 0.9),
      0.1,
      1000
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- Lighting ---
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

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactables = []; // meshes only
    let hovered = null;

    function applyHover(mesh) {
      if (!mesh) return clearHover();

      if (mesh.userData.view && mesh.userData.view === currentView) {
        return clearHover();
      }

      if (hovered === mesh) return;

      clearHover();
      hovered = mesh;

      if (mesh.userData.hoverType === "yellow") {
        mesh.material = mesh.material.clone();
        mesh.material.color.set(0xffff00);
      }
      else if (mesh.userData.hoverType === "glow") {
        mesh.material = mesh.material.clone();
        if (mesh.material.emissive) {
          mesh.material.emissive.set(0x444444);
        }
      }

      document.body.style.cursor = "pointer";
    }

    function clearHover() {
      if (!hovered) return;

      hovered.material = hovered.userData.baseMaterial;
      hovered = null;
      document.body.style.cursor = "default";
    }

    function makeClickable(root, action, options = {}) {
      if (!root) return;

      root.traverse((child) => {
        if (!child.isMesh) return;

        child.userData.action = action;
        child.userData.hoverType = options.hoverType || "glow";
        child.userData.view = options.view || null;

        interactables.push(child);

        // Cache materials ONCE
        if (!child.userData.baseMaterial) {
          child.userData.baseMaterial = child.material;
        }
      });
    }

    // --- Idle rotation ---
    let idleTimeout;
    function setIdleRotation() {
      controls.autoRotate = true;
    }
    function resetIdleTimer() {
      controls.autoRotate = false;
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(setIdleRotation, 4000);
    }

    // --- Camera transitions ---
    function transitionCamera(pos, target, duration = 2) {
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
      currentView = "home";
      if (window.innerWidth <= 768) {
        controls.minDistance = 15;
        controls.maxDistance = 20;
      } else {
        controls.minDistance = 4.3;
        controls.maxDistance = 10;
      }
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2;
      controls.enabled = true;
      controls.enableZoom = true;
      controls.update();
      transitionCamera(
        { x: 0.77, y: 1.3, z: 4.8 },
        { x: 0.77, y: 0.46, z: -1.47 }
      );
    }

    function goAboutMe() {
      currentView = "about";
      controls.minDistance = window.innerWidth <= 768 ? 3.8 : 2.6;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
      transitionCamera(
        { x: 3, y: 0.3, z: 0 },
        { x: 0.77, y: 0.46, z: -1.47 }
      );
    }

    // TV subsystem (initialized once)
    let tvInitialized = false;
    let tvVideo = null;
    let tvTexture = null;

    function initTV(avatar) {
      if (tvInitialized) return;
      tvInitialized = true;

      const screen = avatar.getObjectByName("screen");
      const upArrow = avatar.getObjectByName("uparrow");
      const downArrow = avatar.getObjectByName("downarrow");
      if (!screen || !upArrow || !downArrow) return;

      const movies = ["Discord.mp4", "CRM.mp4", "spaceus.mp4", "portfolio.mp4"];
      let idx = 0;

      tvVideo = document.createElement("video");
      tvVideo.src = movies[idx];
      tvVideo.loop = true;
      tvVideo.autoplay = true;

      // Autoplay policy: must be muted on most browsers.
      tvVideo.muted = true;
      tvVideo.playsInline = true;
      tvVideo.play().catch(() => { });

      tvTexture = new THREE.VideoTexture(tvVideo);
      tvTexture.flipY = false;

      screen.material = new THREE.MeshBasicMaterial({ map: tvTexture });

      function changeMovie(next) {
        idx = next ? (idx + 1) % movies.length : (idx - 1 + movies.length) % movies.length;
        tvVideo.src = movies[idx];
        tvVideo.play().catch(() => { });
      }

      // Make arrows interactive using the same system:
      makeClickable(upArrow, () => changeMovie(true), { hoverType: "yellow" });
      makeClickable(downArrow, () => changeMovie(false), { hoverType: "yellow" });
    }

    function goProjects() {
      currentView = "projects";
      controls.minDistance = window.innerWidth <= 768 ? 3.25 : 2.05;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
      transitionCamera(
        { x: -1.35, y: 0.625, z: 0 },
        { x: -0.6, y: 0.46, z: -1.47 }
      );
      if (avatarRef) initTV(avatarRef);
    }

    function goContact() {
      currentView = "contact";
      controls.minDistance = window.innerWidth <= 768 ? 3.4 : 2.9;
      controls.autoRotateSpeed = 0;
      controls.enabled = false;
      controls.update();
      transitionCamera(
        { x: -1.2, y: 0.45, z: -4 },
        { x: -0.9, y: 0.35, z: -1.3 }
      );
    }

    // --- Model + animations ---
    const mixer = new THREE.AnimationMixer(scene);
    let saluteAction = null;
    let drunkAction = null;
    let isDrunk = false;
    let avatarRef = null;

    function playDrunk() {
      if (!drunkAction || !saluteAction) return;
      if (isDrunk) return;
      isDrunk = true;

      drunkAction.reset();
      drunkAction.play();
      saluteAction.crossFadeTo(drunkAction, 0.3);

      setTimeout(() => {
        saluteAction.reset();
        saluteAction.play();
        drunkAction.crossFadeTo(saluteAction, 1);
        setTimeout(() => {
          isDrunk = false;
        }, 1000);
      }, 4000);
    }

    // --- Load model ---
    const loader = new GLTFLoader();
    let disposed = false;

    loader.load(
      "/Derek-Portfolio/HomePage.glb",
      (gltf) => {
        if (disposed) return;

        avatarRef = gltf.scene;

        avatarRef.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(avatarRef);

        // Animations
        const clips = gltf.animations || [];
        const saluteClip = THREE.AnimationClip.findByName(clips, "Salute");
        const drunkClip = THREE.AnimationClip.findByName(clips, "drunk.001");

        if (saluteClip) saluteAction = mixer.clipAction(saluteClip, avatarRef);
        if (drunkClip) drunkAction = mixer.clipAction(drunkClip, avatarRef);

        if (saluteAction) saluteAction.play();

        // Clickable avatar (only if you click the Avatar meshes)
        const derek = avatarRef.getObjectByName("Avatar");
        makeClickable(derek, playDrunk, { hoverType: "none" });

        // Contact icons (fixing the swapped URLs in your current file)
        const githubIcon = avatarRef.getObjectByName("Github");
        const linkedinIcon = avatarRef.getObjectByName("LinkedIn");
        const emailIcon = avatarRef.getObjectByName("Email");

        makeClickable(githubIcon, () => window.open("https://www.linkedin.com/in/derekgallagher1", "_blank"));
        makeClickable(linkedinIcon, () => window.open("https://github.com/Derick12345678", "_blank"));
        makeClickable(emailIcon, () => window.open("mailto:derekgallagher01@email.com", "_blank"));

        // Big navigation objects
        makeClickable(
          avatarRef.getObjectByName("ROCK"),
          goContact,
          { hoverType: "glow", view: "contact" }
        );

        makeClickable(
          avatarRef.getObjectByName("Sketchfab_model"),
          goAboutMe,
          { hoverType: "glow", view: "about" }
        );

        makeClickable(
          avatarRef.getObjectByName("curve7_wood1_0.001"),
          goProjects,
          { hoverType: "glow", view: "projects" }
        );

        makeClickable(
          avatarRef.getObjectByName("curve7_wood1_0"),
          goProjects,
          { hoverType: "glow", view: "projects" }
        );

        if (loadingEl) loadingEl.style.display = "none";

        // Default camera
        goHome();
        resetIdleTimer();
      },
      (xhr) => {
        if (!loadingEl) return;
        const raw = (xhr.loaded / xhr.total) * 100 - 50;
        const pct = raw < 0 ? 0 : Math.round(raw);
        loadingEl.innerText = `LOADING... ${pct}%`;
      },
      (err) => console.error("Error loading model:", err)
    );


    function updatePointerFromEvent(ev) {
      pointer.x = (ev.offsetX / container.clientWidth) * 2 - 1;
      pointer.y = -(ev.offsetY / container.clientHeight) * 2 + 1;
    }

    function raycast() {
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(interactables, false);
      return hits;
    }

    const onMouseMove = (ev) => {
      updatePointerFromEvent(ev);
      const hit = raycast()[0]?.object || null;
      applyHover(hit);
    };

    const onMouseDown = (ev) => {
      updatePointerFromEvent(ev);
      const hit = raycast()[0]?.object || null;
      if (hit?.userData?.action) hit.userData.action();
    };

    const onAnyActivity = () => resetIdleTimer();

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onAnyActivity);
    window.addEventListener("wheel", onAnyActivity);
    window.addEventListener("mousedown", onAnyActivity);

    // Buttons
    const homeBtn = document.getElementById("home-btn");
    const aboutBtn = document.getElementById("aboutme-btn");
    const projectsBtn = document.getElementById("projects-btn");
    const contactBtn = document.getElementById("contact-btn");

    homeBtn?.addEventListener("click", goHome);
    aboutBtn?.addEventListener("click", goAboutMe);
    projectsBtn?.addEventListener("click", goProjects);
    contactBtn?.addEventListener("click", goContact);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / (window.innerHeight * 0.9);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
      goHome();
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let rafId = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      mixer.update(dt);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      disposed = true;

      cancelAnimationFrame(rafId);
      clearTimeout(idleTimeout);

      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onAnyActivity);
      window.removeEventListener("wheel", onAnyActivity);
      window.removeEventListener("mousedown", onAnyActivity);
      window.removeEventListener("resize", onResize);

      homeBtn?.removeEventListener("click", goHome);
      aboutBtn?.removeEventListener("click", goAboutMe);
      projectsBtn?.removeEventListener("click", goProjects);
      contactBtn?.removeEventListener("click", goContact);

      if (tvVideo) {
        tvVideo.pause();
        tvVideo.src = "";
        tvVideo.load();
      }
      if (tvTexture) tvTexture.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div id="avatar-container">
      <div id="avatar-loading"></div>
    </div>
  );
}
