import "./style.css";
import * as THREE from "three";
import GUI from "lil-gui";
import { Power0, Power3, gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { SlowMo } from "gsap/all";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass  } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

let scene, camera, renderer, controls, model;

let bloomPass,composer;

let loadingManager;

const clock = new THREE.Clock();
let lastElapsedTime = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isFunctionsOn = true;
let hdrPath = "/textures/neon.hdr";

const gui = new GUI();

const params = {
  threshold: 0.34,
  strength: 0.345,
  radius: 0,
  exposure: 1,
};

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

init();
animate();

function init() {
  const canvas = document.querySelector(".webgl");

  //! Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x323232);
  renderer.gammaOutput = true;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  //! Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x11151c, 0.01);

  //! Camera
  camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    0.1,
    1000
  );
  camera.position.set(38, 28, 40);
  camera.lookAt(0, 0, 0);
  moveCamera();
  //! Controls
  // controls = new OrbitControls(camera, canvas);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.12;
  //! Bloom PASS
  const renderScene = new RenderPass(scene, camera);

   bloomPass = new UnrealBloomPass (
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = params.threshold;
  bloomPass.strength = params.strength;
  bloomPass.radius = params.radius;

  const outputPass = new OutputPass();

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  // createGlassPlane();
  // //! light
  createLight();

  //! Loading managar
  loadingManager = setupLoadingManager();

  //! RGBE LOADER
  rgbeLoad(scene, renderer, hdrPath, loadingManager);

  //! GLBE MODEL
  model = createModel(loadingManager);
  scene.add(model);

  //! Add a click event listener to the renderer's DOM element
  canvas.addEventListener("click", onClick);

  //! Handle window resize
  window.addEventListener("resize", onWindowResize);

  //! GUI
  createGui();
}

function onWindowResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width,sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function render(){
  renderer.render(scene, camera);
  composer.render()
}

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;
  // console.log(camera.position);
  // console.log(camera.rotation);

  // controls.update();
  render()
  window.requestAnimationFrame(animate);
}

// create the cube geometry
function createGlassPlane() {
  const geometry = new THREE.PlaneGeometry(500, 500);

  // Use MeshStandardMaterial for a more realistic and shiny appearance
  const material = new THREE.MeshStandardMaterial({
    color: 0x11151c, // Base color of the ground
    metalness: 0,
    roughness: 1, // Adjust roughness as needed
    transparent: true, // Make the material transparent
    opacity: 0.5,
    side: THREE.DoubleSide,
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.rotateX(Math.PI * 0.5);
  plane.position.set(0, -5, 0);

  // Add shadows to the plane
  plane.receiveShadow = true;

  scene.add(plane);
}

function createLight() {
  const light1 = new THREE.DirectionalLight(0xffffff, 4);
  light1.position.set(46, 31, 22);
  light1.castShadow = true;
  light1.shadow.mapSize.width = 5048;
  light1.shadow.mapSize.height = 5048;
  light1.shadow.bias = -0.001;
  light1.name = "your_light_name";
  scene.add(light1);

  // const helper = new THREE.CameraHelper(light1.shadow.camera);
  // scene.add(helper);

  gui
    .add(light1.position, "x")
    .min(-50)
    .max(50)
    .step(1)
    .name("light x position");
  gui
    .add(light1.position, "y")
    .min(-50)
    .max(50)
    .step(1)
    .name("light x position");
  gui
    .add(light1.position, "z")
    .min(-50)
    .max(50)
    .step(1)
    .name("light x position");
}

function createGui() {
  const cameraFolder = gui.addFolder("Camera");
  cameraFolder.add(camera.position, "x", -100, 100).step(1).name("X Position");
  cameraFolder.add(camera.position, "y", -100, 100).step(1).name("Y Position");
  cameraFolder.add(camera.position, "z", -100, 100).step(1).name("Z Position");
  cameraFolder
    .add(camera.rotation, "x", -Math.PI * 2, Math.PI * 2)
    .step(0.01)
    .name("X Rotation");
  cameraFolder
    .add(camera.rotation, "y", -Math.PI * 2, Math.PI * 2)
    .step(0.01)
    .name("Y Rotation");
  cameraFolder
    .add(camera.rotation, "z", -Math.PI * 2, Math.PI * 2)
    .step(0.01)
    .name("Z Rotation");

    const bloomFolder = gui.addFolder( 'bloom' );

				bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {

					bloomPass.threshold = Number( value );

				} );

				bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {

					bloomPass.strength = Number( value );

				} );

				gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

					bloomPass.radius = Number( value );

				} );
    
}

function setupLoadingManager() {
  const loadingManager = new THREE.LoadingManager();
  const progressElement = document.getElementById("progress");
  const loadingContainer = document.getElementById("loadingContainer");
  let currentProgress = 0;

  loadingManager.onProgress = function (url, loaded, total) {
    currentProgress = (loaded / total) * 100;
    progressElement.textContent = `${currentProgress.toFixed(0)}%`;

    if (currentProgress === 100) {
      loadingContainer.style.display = "none";
      document.body.style.overflow = "auto";
    }
  };
  return loadingManager;
}

function rgbeLoad(scene, renderer, hdrPath, loadingManager) {
  const loader = new RGBELoader(loadingManager);
  loader.load(hdrPath, (texture) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    // scene.background = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  });
}

// Define the onClick function
function onClick(event) {
  // Calculate the mouse coordinates in normalized device space (-1 to 1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster's ray with the mouse coordinates
  raycaster.setFromCamera(mouse, camera);

  // Perform the raycasting against the loaded model
  const intersects = raycaster.intersectObject(model, true);

  // Check if any objects were intersected
  if (intersects.length > 0) {
    // Access the first intersected object (you can loop through intersects for more)
    const clickedObject = intersects[0].object;

    console.log(clickedObject);

    // rotateAnimation(clickedObject);

    if (clickedObject.name === "Object_14") {
      console.log("Clicked Object");
      clickedObject.rotateX(20);
    }

    if (clickedObject.name === "Object_25") {
      console.log("Color chnaged");
      const randomColor = new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
      );
      if (clickedObject.material) {
        clickedObject.material.color.copy(randomColor);
      }
    }
    if (clickedObject.name === "Object_49") {
      // Toggle the state of functions
      isFunctionsOn = !isFunctionsOn;

      // Turn off/on RGBE function and lights function based on the state
      if (isFunctionsOn) {
        rgbeLoad(scene, renderer, hdrPath, loadingManager);
      } else {
        // You can remove the environment map and lights here if needed
        scene.environment = null;
      }
    }

    // clickedObject.material.color.set(0xff0000); // Set it to red
  }
}

const texture = new THREE.TextureLoader(loadingManager).load(
  "textures/black.jpg"
);
texture.repeat.set(0.5, 0.5);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
// texture.offset.set(1,1); // Adjust as needed

const furniture = new THREE.TextureLoader(loadingManager).load(
  "textures/2.png"
);

const bed = new THREE.TextureLoader(loadingManager).load("textures/8.png");

const floor = new THREE.TextureLoader(loadingManager).load("textures/6.png");
floor.repeat.set(0.2, 0.2);
floor.wrapS = THREE.RepeatWrapping;
floor.wrapT = THREE.RepeatWrapping;

const videoElement = document.getElementById("video");
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBAFormat;

function createModel(loadingManager) {
  const group = new THREE.Group();

  const loader = new GLTFLoader(loadingManager);
  loader.load("/models/polly-room.glb", (e) => {
    const model = e.scene;
    model.position.set(0, 0, 0);
    model.scale.set(3, 3, 3);
    group.add(model);

    model.traverse((item) => {
      // console.log(item);
      item.castShadow = true;
      item.receiveShadow = true;
    });

    model.traverse((child) => {
      if (child.name === "Object_4" || child.name === "Object_7") {
        child.material = new THREE.MeshStandardMaterial({ map: texture });
        child.castShadow = false;
        // child.material.color.set(0x000000)
      }
      if (
        child.name === "Object_16" ||
        child.name === "Object_28" ||
        child.name === "Object_46"
      ) {
        child.material = new THREE.MeshStandardMaterial({ map: furniture });
        // child.castShadow = false;
        // child.material.color.set(0x000000)
      }
      if (child.name === "Object_21" || child.name === "Object_19") {
        child.material = new THREE.MeshStandardMaterial({ map: bed });
      }
      if (child.name === "Object_6") {
        child.material.color.set(0x000000);
      }
      if (child.name === "Object_34") {
        child.material = new THREE.MeshStandardMaterial({ map: videoTexture });
        child.material.envMapIntensity = 0;
      }
      if (child.name === "Object_5") {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x000000,
        });
        child.castShadow = false;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({ map: floor });
      }
    });

    model.traverse((parts) => {
      if (parts.isMesh) {
        // console.log(parts);
        gsap.set(parts.position, {
          x: 0,
          y: 100,
          z: 0,
        });

        gsap.to(parts.position, {
          x: 0,
          y: 0,
          z: 0,
          duration: 4,
          ease: Power3,
        });
      }
    });
  });
  return group;
}

function moveCamera() {
  const webgl1 = document.querySelector(".webgl1");
  const start = document.getElementById("webgl1-content-container");
  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline({
    // duration: 10,
    ease: "power0",
    scrollTrigger: {
      trigger: ".trigger",
      endTrigger: ".trigger1",
      // start: " top top ",
      // end: " bottom bottom",
      scrub: 0.5,
      // pin: true,
      markers: true,
    },
  });

  ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
    syncInterval: 999999999,
  });

  // camera.position.set(29,23,39);
  camera.lookAt(scene.position.x, scene.position.y, scene.position.z);

  //^
  tl.to(scene.rotation, {
    y: Math.PI * 2 + 0.5,
    duration: 2,
  })
    //^^
    .to(
      camera.position,
      {
        x: -10,
        y: 17,
        z: 0,
        duration: 2,
      },
      ">"
    )

    .to(
      camera.rotation,
      {
        x: -0.54,
        y: -0.15,
        z: -0.55,
        duration: 2,
      },
      "<"
    )
    //^^^
    .to(
      camera.position,
      {
        x: 4,
        y: 5,
        z: -8,
        duration: 2,
      },
      ">"
    )

    .to(
      camera.rotation,
      {
        x: -3.78,
        y: -0.54,
        z: -3.22,
        duration: 2,
      },
      "<"
    )

    //^^^^
    .to(
      camera.position,
      {
        x: 10,
        y: 5,
        z: -5,
        duration: 2,
      },
      ">"
    )

    .to(
      camera.rotation,
      {
        x: -4.66,
        y: 0,
        z: 2.66,
        duration: 2,
      },
      "<"
    )

    //^^^^^
    .to(
      camera.position,
      {
        x: 15,
        y: 4,
        z: 4,
        duration: 1,
      },
      ">"
    )

    .to(
      camera.rotation,
      {
        x: 0.02,
        y: 1.47,
        z: -0.04,
        duration: 2,
      },
      "<"
    )

    //^^^^^^
    .to(
      camera.position,
      {
        x: 0,
        y: 11,
        z: -5,
        duration: 1,
      },
      ">"
    )

    .to(
      camera.rotation,
      {
        x: 0.59,
        y: 2.21,
        z: -0.52,
        duration: 2,
      },
      "<"
    )

    //^^^^^
    .to(
      camera.position,
      {
        x: -5,
        y: 7,
        z: -1,
        duration: 1,
      },
      ">"
    )

    .to(
      camera.rotation,
      {
        x: -3.1,
        y: 1.07,
        z: 3.1,
        duration: 1,
      },
      "<"
    )

    .to(
      webgl1,
      {
        opacity: 1,
        zIndex: 1,
      },
      ">"
    )
    .to(
      start,
      {
        opacity: 1,
      },
      ">"
    );
}
