import "./style.css";
import * as THREE from "three";
import GUI from "lil-gui";
import { Power0, gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";


let scene, camera, renderer, controls, model, text, light;

let cube;

const clock = new THREE.Clock();
let lastElapsedTime = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const gui = new GUI();

const sizes = {
  width: 1125,
  height: 650,
};

init();
animate();

function init() {
  const canvas = document.querySelector(".webgl1");

  //! Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    // alpha: true,
  });
  renderer.setClearColor(0x212121);
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  //! Scene
  scene = new THREE.Scene();

  //! Camera
  camera = new THREE.PerspectiveCamera(
    45,
    sizes.width / sizes.height,
    0.1,
    1000
  );
  camera.position.set(40, 45, 85);
  camera.lookAt(0, 0, 0);

  controls = new OrbitControls(camera, canvas);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.12;

  createCube();

  //! Handle window resize
  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - lastElapsedTime;
  lastElapsedTime = elapsedTime;
  //   console.log(camera.position);
  // console.log(camera.rotation);

  // controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

// create the cube geometry
function createCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(3, 3, 3);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);
}
