import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TextureLoader } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
// import { Howl, Howler } from "howler";
// import * as Cannon from "cannon-es";

// !  Main Part

const scene = new THREE.Scene();

const sizes = {
    width: 1125,
    height: 650,
};

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  1,
  1000
);
camera.position.set(0, 20, 5);
scene.add(camera);
//& STAR counter
// let collectedStars = 0;
// function updateCounter() {
//   counterElement.innerHTML = `Stars Collected: ${collectedStars}`;
// }
const canvas = document.querySelector(".webgl");
const canvas1 = document.querySelector(".webgl1");
const button = document.getElementById("button");
const button1 = document.getElementById("button1");
const container = document.getElementById("container");
const blocker = document.getElementById("blocker");

// Add a click event listener to the button
// button1.addEventListener("click", () => {
//   // Toggle the visibility of the canvases
//   canvas.style.display = "block";
//   container.style.display = "block";
//   canvas1.style.display = "none";
//   canvas1.style.position = "fixed";
//   button.style.display = "block";
//   button1.style.display = "none";
// });
// blocker.addEventListener("click", () => {
//   blocker.style.display = "none";
// });
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas1,
//   alpha: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
// renderer.setClearColor("#212121")
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

// Load an HDR environment map
const loader = new RGBELoader();
loader.load("light.hdr", (texture) => {
  // scene.background = texture;

  // Generate an environment map for better reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;

  texture.dispose();
  pmremGenerator.dispose();
});
// Window Resizing
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// const rocketSound = new Howl({
//   src: ["rocketsound.mp3"], // Replace with the path to your rocket sound file
//   loop: true,
//   volume: 0.5,
//   rate: 1.0,
//   preload: true,
// });

// Create an AxesHelper for visual reference
// const axesHelper = new THREE.AxesHelper(10);
// scene.add(axesHelper);
// & Particles

const particlesCount = 20000;
const position = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount; i++) {
  position[i * 3 + 0] = (Math.random() - 0.5) * 100;
  position[i * 3 + 1] = (Math.random() - 0.5) * 100;
  position[i * 3 + 2] = (Math.random() - 0.5) * 100;
}

let randomColor = "silver";
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(position, 3)
);
// material
const particlesMaterial = new THREE.PointsMaterial({
  color: new THREE.Color(randomColor),
  sizeAttenuation: true,
  size: 0.03,
});
const Particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(Particles);
// & STAR GEOMRY
const material1 = new THREE.LineBasicMaterial({ color: 0xffd700 });
// Create the geometry for the star
const starGeometry = new THREE.BufferGeometry();
const starVertices = [
  0,
  1,
  0,
  0.2,
  0.2,
  0,
  1,
  0,
  0,
  0.2,
  -0.2,
  0,
  0,
  -1,
  0,
  -0.2,
  -0.2,
  0,
  -1,
  0,
  0,
  -0.2,
  0.2,
  0,
  0,
  1,
  0, // Close the loop
];
// Convert the vertex data to Float32Array
const vertices = new Float32Array(starVertices);
const positions = new THREE.BufferAttribute(vertices, 3);
starGeometry.setAttribute("position", positions);
// Create a line segment using the geometry and material
for (let i = 0; i < 100; i++) {
  const star = new THREE.Line(starGeometry, material1);

  // Define random positions for each star
  star.position.x = Math.random() * 100 - 50; // Random X position between -5 and 5
  star.position.y = Math.random() * 100 - 50; // Random Y position between -5 and 5
  star.position.z = Math.random() * 100 - 50;

  scene.add(star);
}
// & Load a 3D model (GLTF format)

let model;
let rocketBody;
const loader1 = new GLTFLoader();
loader1.load("/models/bombRocket.glb", (gltf) => {
  model = gltf.scene;
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  model.rotation.set(0, 0, 0);
  scene.add(model);

  addKeysListener();
  animate();
});

const keyState = {};
let isWKeyPressed = false;
function addKeysListener() {
  window.addEventListener("keydown", function onkeydown(e) {
    keyState[e.keyCode] = true;
    if (e.keyCode === 87 && !isWKeyPressed) {
      isWKeyPressed = true;
    //   rocketSound.play();
    }
  });

  window.addEventListener("keyup", function onKeyUp(e) {
    keyState[e.keyCode] = false;
    if (e.keyCode === 87) {
      isWKeyPressed = false;
    //   rocketSound.stop();
    }
  });
}

// const starCollectedSound = new Audio("mario.mp3");
function movePlayer() {
  //^ Collision detector
  const playerBoundingBox = new THREE.Box3().setFromObject(model);

  for (const star of scene.children) {
    if (star !== model && star instanceof THREE.Line) {
      const starBoundingBox = new THREE.Box3().setFromObject(star);

      if (playerBoundingBox.intersectsBox(starBoundingBox)) {
        // Collision detected, remove the star
        scene.remove(star);
        collectedStars++;
        updateCounter();
        // starCollectedSound.play();
      }
    }
  }

  //^ W key (move forward)
  if (keyState[87]) {
    model.translateZ(+0.2);
    // rocketSound.play(); // Start the rocket sound
  } //^ S key (MOVE backword)
  else if (keyState[83]) {
    model.translateZ(-0.2);
    // rocketSound.stop(); // Stop the rocket sound
  }
  //^ A key (rotate left)
  if (keyState[65]) model.rotateY(0.02);
  //^ D (rotate right)
  if (keyState[68]) {
    model.rotateY(-0.02);
  }
  //^ Up Arrow key (Move forward)
  if (keyState[38]) {
    model.position.y += 0.1;
    // model.rotateX(-0.04)
  }
  //^ Down arrow key (move down)
  if (keyState[40]) {
    model.position.y -= 0.1;
    // model.rotateX(0.1)
  }
}

const cameraOffset = new THREE.Vector3(0, 4, -13);
const cameraRotation = new THREE.Quaternion();
function updateCamera() {
  // ^ 2D camera
  // const newPosition = model.position.clone().add(cameraOffset);
  // camera.position.copy(newPosition);

  // ^ Third person camera
  const relativeCameraOffset = cameraOffset
    .clone()
    .applyMatrix4(model.matrixWorld);
  camera.position.copy(relativeCameraOffset);
  const targetCameraRotation = model.quaternion.clone();
  cameraRotation.slerp(targetCameraRotation, 0.005);
  camera.setRotationFromQuaternion(cameraRotation);

  camera.lookAt(model.position);
}

// animatstars
function animateStars() {
  for (const star of scene.children) {
    if (star !== model && star instanceof THREE.Line) {
      // Update the Y position to create a floating animation
      star.position.y +=
        Math.sin(Date.now() * 0.001 + star.position.x * 0.1) * 0.02;
    }
  }
}

// Animation loop
function animate() {
  renderer.render(scene, camera);

  animateStars();
  movePlayer();
  updateCamera();

  requestAnimationFrame(animate);
}
