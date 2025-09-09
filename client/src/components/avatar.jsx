import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Avatar() {
  window.onload = () => loadModel();

  function loadModel() {
    const loader = new GLTFLoader();
    loader.load('avatar.glb',
      (gltf) => {
        setupScene(gltf);
        document.getElementById('avatar-loading').style.display = 'none';
      }, 
      (xhr) => {
        const percentCompletion = Math.round((xhr.loaded / xhr.total) * 100);
        document.getElementById('avatar-loading').innerText = `LOADING... ${percentCompletion}%`
        console.log(`Loading model... ${percentCompletion}%`);
      }, 
      (error) => {
        console.log(error);
      }
    );
  }

  function setupScene(gltf) {
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      
      const container = document.getElementById('avatar-container');
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(renderer.domElement);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minDistance = 3;
      controls.minPolarAngle = 1.4;
      controls.maxPolarAngle = 1.4;
      controls.target = new THREE.Vector3(0, 0.75, 0);
      controls.update();

      // Scene setup
      const scene = new THREE.Scene();

      // Lighting setup
      scene.add(new THREE.AmbientLight());

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

      window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        mixer.update(clock.getDelta());
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
