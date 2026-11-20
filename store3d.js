/**
 * SML Foods - 3D Virtual Store Experience
 * Pure ES Module using Three.js via CDN importmap
 * Integrates with existing app.js cart system
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ==========================================================================
// CONFIGURATION & CONSTANTS
// ==========================================================================

const CONFIG = {
  // Shelf positions along Z-axis (camera moves along this path)
  shelfWaypoints: [
    { 
      id: 'ghee', 
      name: 'Bilona Ghee Shelf', 
      position: new THREE.Vector3(0, 1.6, -2),
      target: new THREE.Vector3(0, 1.4, -4),
      category: 'ghee'
    },
    { 
      id: 'paneer', 
      name: 'Fresh Paneer Counter', 
      position: new THREE.Vector3(0, 1.6, 3),
      target: new THREE.Vector3(0, 1.4, 5),
      category: 'paneer'
    },
    { 
      id: 'pickles', 
      name: 'Andhra Pickle Rack', 
      position: new THREE.Vector3(0, 1.6, 8),
      target: new THREE.Vector3(0, 1.4, 10),
      category: 'pickles'
    }
  ],
  
  // Product positions relative to shelf center
  productOffsets: [
    new THREE.Vector3(-1.8, 0, 0),
    new THREE.Vector3(-0.6, 0, 0),
    new THREE.Vector3(0.6, 0, 0),
    new THREE.Vector3(1.8, 0, 0)
  ],
  
  // Procedural model configs by category
  proceduralModels: {
    ghee: {
      type: 'jar',
      bodyColor: 0xD4A843,      // Golden ghee
      bodyOpacity: 0.85,
      lidColor: 0x8B7355,       // Wooden lid
      labelText: 'BILONA GHEE',
      labelColor: 0x1A1916,
      scale: new THREE.Vector3(1, 1.2, 1)
    },
    paneer: {
      type: 'block',
      bodyColor: 0xFFF8F0,      // Creamy white
      bodyOpacity: 1.0,
      labelText: 'MALAI PANEER',
      labelColor: 0x1A1916,
      scale: new THREE.Vector3(1.2, 0.8, 1.2)
    },
    pickles: {
      type: 'jar',
      bodyColor: 0xE8742B,      // Pickle orange-red
      bodyOpacity: 0.9,
      lidColor: 0xC59B27,       // Gold lid
      labelText: 'ANDHRA PICKLE',
      labelColor: 0xFFFDF5,
      scale: new THREE.Vector3(0.9, 1.3, 0.9)
    }
  },
  
  // Animation settings
  cameraTransitionDuration: 1200,
  hoverHighlightDuration: 150,
  autoRotateSpeed: 0.3,
  
  // Performance
  maxPixelRatio: 2,
  targetFPS: 60
};

// ==========================================================================
// GLOBAL STATE
// ==========================================================================

let scene, camera, renderer, controls;
let shelfProducts = [];        // 3D product meshes with metadata
let currentShelfIndex = 0;
let isInspecting = false;
let inspectionTarget = null;
let animationFrameId = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let touchStart = null;
let isTransitioning = false;
let productsData = [];         // Reference to app.js products array
let addToCartFn = null;        // Reference to app.js addToCart function

// DOM Elements
const canvas = document.getElementById('store3d-canvas');
const container = document.getElementById('store3d-container');
const loadingEl = document.getElementById('store3d-loading');
const shelfNav = document.getElementById('shelf-nav');
const shelfIndicator = document.getElementById('shelf-indicator');
const prevBtn = document.getElementById('prev-shelf');
const nextBtn = document.getElementById('next-shelf');
const tooltip = document.getElementById('product-tooltip');
const viewToggleBtn = document.getElementById('view-toggle-btn');
const exit3DBtn = document.getElementById('exit-3d-btn');
const inspectionOverlay = document.getElementById('product-inspection-overlay');
const inspectionBackdrop = document.getElementById('inspection-backdrop');
const inspectionPanel = document.getElementById('inspection-panel');
const inspectionContent = document.getElementById('inspection-content');
const closeInspectionBtn = document.getElementById('close-inspection');
const standardProductsView = document.getElementById('standard-products-view');

// ==========================================================================
// INITIALIZATION
// ==========================================================================

export async function initStore3D() {
  console.log('🪔 Initializing 3D Virtual Store...');
  
  // Wait for app.js to be ready and get references
  await waitForAppJS();
  
  // Setup Three.js scene
  setupScene();
  setupCamera();
  setupRenderer();
  setupControls();
  setupLighting();
  setupEnvironment();
  
  // Build store environment
  createStoreEnvironment();
  
  // Load products and populate shelves
  await populateShelves();
  
  // Setup event listeners
  setupEventListeners();
  
  // Create shelf indicator dots
  createShelfIndicator();
  
  // Start render loop
  animate();
  
  // Hide loading
  loadingEl?.classList.add('hidden');
  
  console.log('✅ 3D Virtual Store Ready');
}

// Wait for app.js to expose products and cart functions
function waitForAppJS() {
  return new Promise((resolve) => {
    const check = () => {
      // Check if app.js has initialized products and cart
      if (window.smlProducts && window.smlAddToCart) {
        productsData = window.smlProducts;
        addToCartFn = window.smlAddToCart;
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// ==========================================================================
// THREE.JS SCENE SETUP
// ==========================================================================

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0C0C0A);
  scene.fog = new THREE.FogExp2(0x0C0C0A, 0.025);
}

function setupCamera() {
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  camera.position.copy(CONFIG.shelfWaypoints[0].position);
  camera.lookAt(CONFIG.shelfWaypoints[0].target);
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Handle resize
  window.addEventListener('resize', onWindowResize);
}

function setupControls() {
  controls = new OrbitControls(camera, canvas);
  controls.enabled = false; // Disabled by default, enabled during inspection
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = true;
  controls.minDistance = 0.5;
  controls.maxDistance = 8;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 1.8;
  controls.autoRotate = false;
  controls.autoRotateSpeed = CONFIG.autoRotateSpeed;
}

function setupLighting() {
  // Warm ambient
  const ambient = new THREE.AmbientLight(0xFFF8F0, 0.6);
  scene.add(ambient);
  
  // Main key light - warm studio
  const keyLight = new THREE.DirectionalLight(0xFFE8C8, 1.8);
  keyLight.position.set(3, 6, 2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -4;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);
  
  // Fill light - cooler
  const fillLight = new THREE.DirectionalLight(0xC8D8FF, 0.5);
  fillLight.position.set(-4, 3, -3);
  scene.add(fillLight);
  
  // Rim light - gold accent
  const rimLight = new THREE.DirectionalLight(0xF5D890, 0.7);
  rimLight.position.set(0, 5, -6);
  scene.add(rimLight);
  
  // Shelf accent lights
  CONFIG.shelfWaypoints.forEach((waypoint, i) => {
    const shelfLight = new THREE.SpotLight(0xFFE8C8, 80, 5, Math.PI / 6, 0.3, 1);
    shelfLight.position.set(0, 3.5, waypoint.position.z);
    shelfLight.target.position.set(0, 1.4, waypoint.position.z);
    shelfLight.castShadow = true;
    shelfLight.shadow.mapSize.width = 1024;
    shelfLight.shadow.mapSize.height = 1024;
    scene.add(shelfLight);
    scene.add(shelfLight.target);
  });
}

function setupEnvironment() {
  // RoomEnvironment for realistic reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  const roomEnv = new RoomEnvironment();
  const envMap = pmremGenerator.fromScene(roomEnv).texture;
  scene.environment = envMap;
  scene.background = null; // Keep our dark background
  
  roomEnv.dispose();
  pmremGenerator.dispose();
}

// ==========================================================================
// STORE ENVIRONMENT - Shelves, Floor, Walls
// ==========================================================================

function createStoreEnvironment() {
  createFloor();
  createWalls();
  createShelves();
  createDecorativeElements();
}

function createFloor() {
  // Warm wooden floor
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x3D2B1F,
    roughness: 0.85,
    metalness: 0.05
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Subtle floor boards texture via normal map
  const boardGeometry = new THREE.PlaneGeometry(20, 20, 40, 1);
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: 0x2A1F16,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity: 0.3
  });
  const boards = new THREE.Mesh(boardGeometry, boardMaterial);
  boards.rotation.x = -Math.PI / 2;
  boards.position.y = 0.01;
  scene.add(boards);
}

function createWalls() {
  // Back wall - textured plaster
  const wallGeometry = new THREE.PlaneGeometry(20, 8);
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1A1814,
    roughness: 0.95,
    metalness: 0
  });
  
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 4, -10);
  backWall.receiveShadow = true;
  scene.add(backWall);
  
  // Side walls
  const sideWall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  sideWall1.rotation.y = Math.PI / 2;
  sideWall1.position.set(-10, 4, 0);
  sideWall1.receiveShadow = true;
  scene.add(sideWall1);
  
  const sideWall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  sideWall2.rotation.y = -Math.PI / 2;
  sideWall2.position.set(10, 4, 0);
  sideWall2.receiveShadow = true;
  scene.add(sideWall2);
}

function createShelves() {
  CONFIG.shelfWaypoints.forEach((waypoint, shelfIndex) => {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 0, waypoint.position.z);
    shelfGroup.name = `shelf-${waypoint.id}`;
    
    // Main shelf board
    const shelfGeo = new THREE.BoxGeometry(8, 0.06, 1.2);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x2D1F14,
      roughness: 0.8,
      metalness: 0.05
    });
    const shelfBoard = new THREE.Mesh(shelfGeo, shelfMat);
    shelfBoard.position.y = 1.4;
    shelfBoard.castShadow = true;
    shelfBoard.receiveShadow = true;
    shelfGroup.add(shelfBoard);
    
    // Shelf supports (brass brackets)
    const bracketGeo = new THREE.BoxGeometry(0.08, 1.4, 0.08);
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0xC59B27,
      roughness: 0.3,
      metalness: 0.8
    });
    [-3.8, 3.8].forEach(x => {
      const bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(x, 0.7, 0);
      bracket.castShadow = true;
      shelfGroup.add(bracket);
    });
    
    // Upper decorative shelf
    const upperShelf = new THREE.Mesh(shelfGeo, shelfMat);
    upperShelf.position.y = 2.6;
    upperShelf.scale.setScalar(0.7);
    upperShelf.castShadow = true;
    shelfGroup.add(upperShelf);
    
    scene.add(shelfGroup);
  });
}

function createDecorativeElements() {
  // Brass hanging lanterns
  CONFIG.shelfWaypoints.forEach(waypoint => {
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, 3.8, waypoint.position.z);
    
    // Chain
    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4);
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xB8962E, metalness: 0.9, roughness: 0.2 });
    const chain = new THREE.Mesh(chainGeo, chainMat);
    chain.position.y = -0.6;
    lanternGroup.add(chain);
    
    // Lantern body
    const lanternGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.35, 8);
    const lanternMat = new THREE.MeshStandardMaterial({ 
      color: 0xC59B27, 
      metalness: 0.7, 
      roughness: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = -1.4;
    lanternGroup.add(lantern);
    
    // Warm point light inside lantern
    const lanternLight = new THREE.PointLight(0xFFD480, 30, 4, 2);
    lanternLight.position.y = -1.4;
    lanternGroup.add(lanternLight);
    
    scene.add(lanternGroup);
  });
  
  // Traditional brass uruli (cooking vessel) as decor
  const uruliGeo = new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const uruliMat = new THREE.MeshStandardMaterial({ 
    color: 0xB8962E, 
    metalness: 0.85, 
    roughness: 0.15,
    side: THREE.DoubleSide
  });
  const uruli = new THREE.Mesh(uruliGeo, uruliMat);
  uruli.position.set(-4, 0.5, -1);
  uruli.rotation.x = Math.PI;
  uruli.castShadow = true;
  scene.add(uruli);
  
  // Wooden mortar and pestle
  createMortarPestle(4, 0.5, -1.5);
}

function createMortarPestle(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  
  // Mortar
  const mortarGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.2, 16);
  const mortarMat = new THREE.MeshStandardMaterial({ 
    color: 0x3D2B1F, 
    roughness: 0.7,
    metalness: 0.1
  });
  const mortar = new THREE.Mesh(mortarGeo, mortarMat);
  mortar.castShadow = true;
  group.add(mortar);
  
  // Pestle
  const pestleGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.4, 8);
  const pestle = new THREE.Mesh(pestleGeo, mortarMat);
  pestle.position.set(0, 0.35, 0);
  pestle.rotation.z = -0.3;
  pestle.castShadow = true;
  group.add(pestle);
  
  scene.add(group);
}

// ==========================================================================
// PROCEDURAL 3D PRODUCT MODELS
// ==========================================================================

function createProceduralProduct(product, shelfIndex, productIndex) {
  const config = CONFIG.proceduralModels[product.category] || CONFIG.proceduralModels.ghee;
  const group = new THREE.Group();
  group.name = `product-${product.id}`;
  group.userData = { 
    productId: product.id,
    productData: product,
    shelfIndex,
    productIndex,
    originalPosition: null,
    originalRotation: null,
    isHovered: false
  };
  
  if (config.type === 'jar') {
    createJarModel(group, config, product);
  } else if (config.type === 'block') {
    createBlockModel(group, config, product);
  }
  
  // Position on shelf
  const offset = CONFIG.productOffsets[productIndex % CONFIG.productOffsets.length];
  group.position.copy(offset);
  group.position.y = 1.45; // On shelf surface
  group.position.z = CONFIG.shelfWaypoints[shelfIndex].position.z;
  
  group.userData.originalPosition = group.position.clone();
  group.userData.originalRotation = group.rotation.clone();
  
  // Add subtle floating animation
  group.userData.floatOffset = Math.random() * Math.PI * 2;
  group.userData.floatSpeed = 0.5 + Math.random() * 0.5;
  
  return group;
}

function createJarModel(group, config, product) {
  // Jar body (glass)
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.85, 24);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: config.bodyColor,
    opacity: config.bodyOpacity,
    transparent: true,
    transmission: 0.85,
    thickness: 0.08,
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    ior: 1.5,
    side: THREE.DoubleSide
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.425;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  
  // Jar inner liquid (ghee/pickle)
  const liquidGeo = new THREE.CylinderGeometry(0.3, 0.33, 0.75, 16);
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: config.bodyColor,
    opacity: 0.95,
    transparent: true,
    transmission: 0.6,
    thickness: 0.6,
    roughness: 0.1,
    metalness: 0
  });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = 0.375;
  group.add(liquid);
  
  // Jar lid
  const lidGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 20);
  const lidMat = new THREE.MeshStandardMaterial({
    color: config.lidColor || 0x8B7355,
    roughness: config.lidColor ? 0.2 : 0.5,
    metalness: config.lidColor ? 0.8 : 0.1
  });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = 0.91;
  lid.castShadow = true;
  group.add(lid);
  
  // Lid seal ring
  const sealGeo = new THREE.TorusGeometry(0.4, 0.015, 8, 24);
  const sealMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFD480, 
    metalness: 0.5, 
    roughness: 0.3 
  });
  const seal = new THREE.Mesh(sealGeo, sealMat);
  seal.position.y = 0.85;
  seal.rotation.x = Math.PI / 2;
  group.add(seal);
  
  // Product label (canvas texture)
  const label = createLabelTexture(config.labelText, config.labelColor);
  const labelGeo = new THREE.PlaneGeometry(0.55, 0.45);
  const labelMat = new THREE.MeshBasicMaterial({ 
    map: label, 
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 0.45, 0.4);
  group.add(labelMesh);
  
  // Apply scale
  group.scale.copy(config.scale);
}

function createBlockModel(group, config, product) {
  // Paneer block (rounded cube)
  const blockGeo = new THREE.BoxGeometry(0.7, 0.5, 0.7, 4, 2, 4);
  const blockMat = new THREE.MeshStandardMaterial({
    color: config.bodyColor,
    roughness: 0.85,
    metalness: 0,
    subsurfaceColor: 0xFFE8D0,
    subsurface: 0.15
  });
  const block = new THREE.Mesh(blockGeo, blockMat);
  block.position.y = 0.25;
  block.castShadow = true;
  block.receiveShadow = true;
  group.add(block);
  
  // Rounded edges via bevel (simulated with smooth shading)
  block.geometry.computeVertexNormals();
  
  // Wrapper/label band
  const bandGeo = new THREE.BoxGeometry(0.72, 0.18, 0.72, 4, 1, 4);
  const bandTexture = createLabelTexture(config.labelText, config.labelColor, true);
  const bandMat = new THREE.MeshBasicMaterial({ 
    map: bandTexture, 
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const band = new THREE.Mesh(bandGeo, bandMat);
  band.position.y = 0.25;
  group.add(band);
  
  // Moisture highlight (subtle specular spots)
  const spotsGeo = new THREE.SphereGeometry(0.02, 6, 4);
  const spotsMat = new THREE.MeshStandardMaterial({ 
    color: 0xFFF8F0, 
    roughness: 0.1, 
    metalness: 0,
    emissive: 0xFFF8F0,
    emissiveIntensity: 0.3
  });
  for (let i = 0; i < 8; i++) {
    const spot = new THREE.Mesh(spotsGeo, spotsMat);
    spot.position.set(
      (Math.random() - 0.5) * 0.5,
      0.25 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.5
    );
    spot.scale.setScalar(0.5 + Math.random() * 0.5);
    group.add(spot);
  }
  
  group.scale.copy(config.scale);
}

function createLabelTexture(text, color, isBand = false) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = isBand ? 128 : 384;
  
  // Background
  ctx.fillStyle = '#1A1916';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Gold border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = isBand ? 3 : 6;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  
  // Inner gold line
  ctx.strokeStyle = '#E8C56D';
  ctx.lineWidth = isBand ? 1 : 2;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  
  // Text
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = `bold ${isBand ? '36' : '52'}px 'Playfair Display', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 - (isBand ? 0 : 20));
  
  // Subtitle
  if (!isBand) {
    ctx.fillStyle = '#E8C56D';
    ctx.font = '24px Manrope, sans-serif';
    ctx.fillText('SML FOODS', canvas.width / 2, canvas.height / 2 + 50);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ==========================================================================
// GLTF MODEL LOADING
// ==========================================================================

async function loadGLTFModel(url, product, shelfIndex, productIndex) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.name = `product-${product.id}`;
        model.userData = { 
          productId: product.id,
          productData: product,
          shelfIndex,
          productIndex,
          isGLTF: true,
          originalPosition: null,
          originalRotation: null
        };
        
        // Scale and position
        model.scale.setScalar(1.5); // Adjust based on model
        const offset = CONFIG.productOffsets[productIndex % CONFIG.productOffsets.length];
        model.position.copy(offset);
        model.position.y = 1.45;
        model.position.z = CONFIG.shelfWaypoints[shelfIndex].position.z;
        
        model.userData.originalPosition = model.position.clone();
        model.userData.originalRotation = model.rotation.clone();
        
        // Enable shadows
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        resolve(model);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load GLTF for ${product.name}:`, error);
        reject(error);
      }
    );
  });
}

// ==========================================================================
// POPULATE SHELVES WITH PRODUCTS
// ==========================================================================

async function populateShelves() {
  // Clear existing
  shelfProducts.forEach(p => scene.remove(p));
  shelfProducts = [];
  
  // Group products by category
  const productsByCategory = {};
  productsData.forEach(p => {
    if (!productsByCategory[p.category]) productsByCategory[p.category] = [];
    productsByCategory[p.category].push(p);
  });
  
  // For each shelf waypoint, place products
  for (let i = 0; i < CONFIG.shelfWaypoints.length; i++) {
    const waypoint = CONFIG.shelfWaypoints[i];
    const categoryProducts = productsByCategory[waypoint.category] || [];
    
    // Take up to 4 products per shelf
    const shelfProducts = categoryProducts.slice(0, 4);
    
    for (let j = 0; j < shelfProducts.length; j++) {
      const product = shelfProducts[j];
      
      try {
        // Try to load GLTF if modelUrl exists
        let model;
        if (product.modelUrl) {
          try {
            model = await loadGLTFModel(product.modelUrl, product, i, j);
          } catch (e) {
            model = createProceduralProduct(product, i, j);
          }
        } else {
          model = createProceduralProduct(product, i, j);
        }
        
        scene.add(model);
        shelfProducts.push(model);
      } catch (error) {
        console.error(`Error creating product ${product.name}:`, error);
      }
    }
  }
}

// ==========================================================================
// CAMERA NAVIGATION
// ==========================================================================

function navigateToShelf(index, animate = true) {
  if (isTransitioning || index < 0 || index >= CONFIG.shelfWaypoints.length) return;
  
  isTransitioning = true;
  currentShelfIndex = index;
  const waypoint = CONFIG.shelfWaypoints[index];
  
  updateShelfIndicator();
  
  if (animate) {
    animateCameraTo(waypoint.position, waypoint.target, CONFIG.cameraTransitionDuration);
  } else {
    camera.position.copy(waypoint.position);
    controls.target.copy(waypoint.target);
    camera.lookAt(waypoint.target);
    isTransitioning = false;
  }
}

function animateCameraTo(targetPos, targetLook, duration) {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  
  function animateCamera(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease in-out cubic
    const eased = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    camera.position.lerpVectors(startPos, targetPos, eased);
    controls.target.lerpVectors(startTarget, targetLook, eased);
    camera.lookAt(controls.target);
    
    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      isTransitioning = false;
    }
  }
  
  requestAnimationFrame(animateCamera);
}

// ==========================================================================
// RAYCASTING & INTERACTION
// ==========================================================================

function setupEventListeners() {
  // Mouse move for hover
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  
  // Touch for mobile
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  
  // Shelf navigation buttons
  prevBtn?.addEventListener('click', () => navigateToShelf(currentShelfIndex - 1));
  nextBtn?.addEventListener('click', () => navigateToShelf(currentShelfIndex + 1));
  
  // Shelf indicator dots
  shelfIndicator?.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-shelf-index]');
    if (dot) {
      navigateToShelf(parseInt(dot.dataset.shelfIndex));
    }
  });
  
  // View toggle
  viewToggleBtn?.addEventListener('click', toggle3DView);
  exit3DBtn?.addEventListener('click', () => toggle3DView(false));
  
  // Inspection overlay
  closeInspectionBtn?.addEventListener('click', closeInspection);
  inspectionBackdrop?.addEventListener('click', closeInspection);
  
  // Keyboard navigation
  document.addEventListener('keydown', onKeyDown);
  
  // Window focus/blur for performance
  window.addEventListener('blur', () => cancelAnimationFrame(animationFrameId));
  window.addEventListener('focus', () => animate());
}

function onMouseMove(event) {
  if (isInspecting) return;
  
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(shelfProducts, true);
  
  // Reset all hover states
  shelfProducts.forEach(product => {
    if (product.userData.isHovered) {
      setProductHover(product, false);
    }
  });
  
  // Highlight hovered
  if (intersects.length > 0) {
    const product = findProductRoot(intersects[0].object);
    if (product && product.userData.productData) {
      setProductHover(product, true);
      showTooltip(product, event.clientX, event.clientY);
    }
  } else {
    hideTooltip();
  }
}

function onClick(event) {
  if (isInspecting) return;
  
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(shelfProducts, true);
  
  if (intersects.length > 0) {
    const product = findProductRoot(intersects[0].object);
    if (product && product.userData.productData) {
      openInspection(product);
    }
  }
}

function onTouchStart(event) {
  if (event.touches.length === 1) {
    touchStart = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      time: Date.now()
    };
  }
}

function onTouchMove(event) {
  if (!touchStart) return;
  // Prevent scrolling when touching canvas
  event.preventDefault();
}

function onTouchEnd(event) {
  if (!touchStart) return;
  
  const touchEnd = event.changedTouches[0];
  const dx = touchEnd.clientX - touchStart.x;
  const dy = touchEnd.clientY - touchStart.y;
  const dt = Date.now() - touchStart.time;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Tap detection (not a swipe)
  if (distance < 20 && dt < 300) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((touchEnd.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touchEnd.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shelfProducts, true);
    
    if (intersects.length > 0) {
      const product = findProductRoot(intersects[0].object);
      if (product && product.userData.productData) {
        openInspection(product);
      }
    }
  }
  
  // Swipe detection for shelf navigation
  if (distance > 50 && dt < 500) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) navigateToShelf(currentShelfIndex - 1);
      else navigateToShelf(currentShelfIndex + 1);
    }
  }
  
  touchStart = null;
}

function onKeyDown(event) {
  if (isInspecting) {
    if (event.key === 'Escape') closeInspection();
    return;
  }
  
  switch (event.key) {
    case 'ArrowLeft':
      navigateToShelf(currentShelfIndex - 1);
      break;
    case 'ArrowRight':
      navigateToShelf(currentShelfIndex + 1);
      break;
    case '1':
      navigateToShelf(0);
      break;
    case '2':
      navigateToShelf(1);
      break;
    case '3':
      navigateToShelf(2);
      break;
  }
}

function findProductRoot(object) {
  let current = object;
  while (current && !current.userData.productId) {
    current = current.parent;
  }
  return current;
}

function setProductHover(product, hovered) {
  if (product.userData.isHovered === hovered) return;
  product.userData.isHovered = hovered;
  
  product.traverse(child => {
    if (child.isMesh && child.material) {
      if (hovered) {
        child.material.emissive = child.material.emissive || new THREE.Color(0x000000);
        child.material.emissive.setHex(0x332200);
        child.material.emissiveIntensity = 0.3;
      } else {
        child.material.emissiveIntensity = 0;
      }
    }
  });
  
  // Subtle scale animation
  if (hovered) {
    gsapLike(product.scale, { x: 1.02, y: 1.02, z: 1.02 }, 200);
  } else {
    gsapLike(product.scale, { x: 1, y: 1, z: 1 }, 300);
  }
}

function showTooltip(product, clientX, clientY) {
  const data = product.userData.productData;
  const variant = data.variants?.[0];
  const price = variant ? `₹${variant.price.toLocaleString('en-IN')}` : '';
  
  tooltip.innerHTML = `
    <span class="tooltip-name">${escapeHtml(data.name)}</span>
    <span class="tooltip-category">${escapeHtml(data.category.toUpperCase())}</span>
    <span class="tooltip-price">${price}</span>
  `;
  
  tooltip.style.left = `${clientX}px`;
  tooltip.style.top = `${clientY - 80}px`;
  tooltip.style.opacity = '1';
  tooltip.style.pointerEvents = 'none';
}

function hideTooltip() {
  tooltip.style.opacity = '0';
  tooltip.style.pointerEvents = 'none';
}

// Simple GSAP-like animation helper
function gsapLike(target, props, duration) {
  const start = {};
  Object.keys(props).forEach(key => start[key] = target[key]);
  const startTime = performance.now();
  
  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    Object.keys(props).forEach(key => {
      target[key] = start[key] + (props[key] - start[key]) * eased;
    });
    
    if (progress < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// ==========================================================================
// PRODUCT INSPECTION OVERLAY
// ==========================================================================

function openInspection(product) {
  const data = product.userData.productData;
  inspectionTarget = product;
  isInspecting = true;
  
  // Enable orbit controls for 360 view
  controls.enabled = true;
  controls.autoRotate = true;
  
  // Animate camera to product
  const productWorldPos = new THREE.Vector3();
  product.getWorldPosition(productWorldPos);
  
  const inspectPos = productWorldPos.clone().add(new THREE.Vector3(0.8, 0.3, 1.2));
  animateCameraTo(inspectPos, productWorldPos, 800);
  
  // Build inspection overlay content
  buildInspectionContent(data);
  
  // Show overlay
  inspectionOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    inspectionPanel.style.opacity = '1';
    inspectionPanel.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  
  // Pause main render loop auto-rotation of products
  pauseProductAnimations();
}

function buildInspectionContent(product) {
  const variants = product.variants || [];
  const defaultVariant = variants[0];
  
  inspectionContent.innerHTML = `
    <div class="inspection-grid">
      <div class="inspection-3d-viewer" id="inspection-3d-viewer"></div>
      <div class="inspection-details">
        <div class="inspection-detail-row">
          <span class="inspection-detail-label">Category</span>
          <span class="inspection-detail-value">${escapeHtml(product.category.toUpperCase())}</span>
        </div>
        <div class="inspection-detail-row">
          <span class="inspection-detail-label">Status</span>
          <span class="inspection-detail-value" style="color: ${defaultVariant?.inStock ? '#4ade80' : '#f87171'}">
            ${defaultVariant?.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        ${product.churnDate ? `
        <div class="inspection-detail-row">
          <span class="inspection-detail-label">Churned / Made</span>
          <span class="inspection-detail-value">${escapeHtml(product.churnDate)}</span>
        </div>
        ` : ''}
        ${product.cureDate ? `
        <div class="inspection-detail-row">
          <span class="inspection-detail-label">Cured On</span>
          <span class="inspection-detail-value">${escapeHtml(product.cureDate)}</span>
        </div>
        ` : ''}
        ${product.madeDate ? `
        <div class="inspection-detail-row">
          <span class="inspection-detail-label">Made Fresh</span>
          <span class="inspection-detail-value">${escapeHtml(product.madeDate)}</span>
        </div>
        ` : ''}
        
        <div class="inspection-detail-row">
          <span class="inspection-detail-label">Select Weight</span>
          <div class="inspection-weight-selector" id="inspection-weight-selector">
            ${variants.map((v, i) => `
              <button type="button" class="inspection-weight-pill ${i === 0 ? 'active' : ''} ${!v.inStock ? 'disabled' : ''}" 
                data-price="${v.price}" data-weight="${escapeHtml(v.weight)}" data-index="${i}" ${!v.inStock ? 'disabled' : ''}>
                ${escapeHtml(v.weight)} · ₹${v.price.toLocaleString('en-IN')}
              </button>
            `).join('')}
          </div>
        </div>
        
        <button id="inspection-add-cart" class="inspection-add-btn ${!defaultVariant?.inStock ? 'disabled' : ''}" ${!defaultVariant?.inStock ? 'disabled' : ''}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          Add to Cart
        </button>
        
        <p class="inspection-description">${escapeHtml(product.description)}</p>
      </div>
    </div>
  `;
  
  // Setup weight selector
  const weightSelector = document.getElementById('inspection-weight-selector');
  weightSelector?.addEventListener('click', (e) => {
    const pill = e.target.closest('.inspection-weight-pill');
    if (!pill || pill.disabled) return;
    
    weightSelector.querySelectorAll('.inspection-weight-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    const addBtn = document.getElementById('inspection-add-cart');
    addBtn.dataset.price = pill.dataset.price;
    addBtn.dataset.weight = pill.dataset.weight;
    addBtn.dataset.index = pill.dataset.index;
  });
  
  // Add to cart button
  document.getElementById('inspection-add-cart')?.addEventListener('click', () => {
    const btn = document.getElementById('inspection-add-cart');
    const price = parseInt(btn.dataset.price);
    const weight = btn.dataset.weight;
    const index = parseInt(btn.dataset.index);
    
    if (addToCartFn && inspectionTarget) {
      addToCartFn(inspectionTarget.userData.productId, index);
      closeInspection();
    }
  });
  
  // Create mini 3D viewer in overlay
  createInspectionViewer();
}

function createInspectionViewer() {
  const container = document.getElementById('inspection-3d-viewer');
  if (!container) return;
  
  // Clean up existing
  while (container.firstChild) container.removeChild(container.firstChild);
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  const inspectRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  inspectRenderer.setSize(width, height);
  inspectRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  inspectRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  inspectRenderer.toneMappingExposure = 1.1;
  inspectRenderer.outputColorSpace = THREE.SRGBColorSpace;
  inspectRenderer.shadowMap.enabled = true;
  container.appendChild(inspectRenderer.domElement);
  
  const inspectScene = new THREE.Scene();
  inspectScene.background = null;
  
  const inspectCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
  inspectCamera.position.set(0.8, 0.3, 1.2);
  
  const inspectControls = new OrbitControls(inspectCamera, inspectRenderer.domElement);
  inspectControls.enableDamping = true;
  inspectControls.enablePan = true;
  inspectControls.enableZoom = true;
  inspectControls.autoRotate = true;
  inspectControls.autoRotateSpeed = 0.5;
  
  // Lighting
  inspectScene.add(new THREE.AmbientLight(0xFFF8F0, 0.8));
  const keyLight = new THREE.DirectionalLight(0xFFE8C8, 1.5);
  keyLight.position.set(2, 3, 2);
  inspectScene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xC8D8FF, 0.5);
  fillLight.position.set(-2, 2, -2);
  inspectScene.add(fillLight);
  
  // Clone the product model
  if (inspectionTarget) {
    const clone = inspectionTarget.clone(true);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    inspectScene.add(clone);
  }
  
  // Animation loop for mini viewer
  function renderInspect() {
    inspectControls.update();
    inspectRenderer.render(inspectScene, inspectCamera);
    if (isInspecting) requestAnimationFrame(renderInspect);
    else {
      inspectRenderer.dispose();
      inspectControls.dispose();
    }
  }
  renderInspect();
  
  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    if (!isInspecting) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    inspectCamera.aspect = w / h;
    inspectCamera.updateProjectionMatrix();
    inspectRenderer.setSize(w, h);
  });
  resizeObserver.observe(container);
}

function closeInspection() {
  if (!isInspecting) return;
  
  isInspecting = false;
  inspectionTarget = null;
  
  // Disable orbit controls
  controls.enabled = false;
  controls.autoRotate = false;
  
  // Return camera to current shelf
  const waypoint = CONFIG.shelfWaypoints[currentShelfIndex];
  animateCameraTo(waypoint.position, waypoint.target, 800);
  
  // Hide overlay
  inspectionPanel.style.opacity = '0';
  inspectionPanel.style.transform = 'translate(-50%, -50%) scale(0.95)';
  setTimeout(() => {
    inspectionOverlay.classList.add('hidden');
    inspectionContent.innerHTML = '';
  }, 300);
  
  // Resume product animations
  resumeProductAnimations();
}

function pauseProductAnimations() {
  shelfProducts.forEach(p => p.userData.paused = true);
}

function resumeProductAnimations() {
  shelfProducts.forEach(p => p.userData.paused = false);
}

// ==========================================================================
// VIEW TOGGLE (3D <-> GRID)
// ==========================================================================

function toggle3DView(forceState = null) {
  const is3D = forceState !== null ? forceState : container.classList.contains('hidden');
  
  if (is3D) {
    // Show 3D, hide grid
    container.classList.remove('hidden');
    standardProductsView.classList.add('hidden');
    viewToggleBtn.setAttribute('aria-pressed', 'true');
    viewToggleBtn.querySelector('span').textContent = 'Grid View';
    exit3DBtn.classList.remove('hidden');
    
    // Resume 3D render
    animate();
  } else {
    // Show grid, hide 3D
    container.classList.add('hidden');
    standardProductsView.classList.remove('hidden');
    viewToggleBtn.setAttribute('aria-pressed', 'false');
    viewToggleBtn.querySelector('span').textContent = '3D Store';
    exit3DBtn.classList.add('hidden');
    
    // Close any open inspection
    if (isInspecting) closeInspection();
    
    // Pause 3D render
    cancelAnimationFrame(animationFrameId);
  }
}

// ==========================================================================
// SHELF INDICATOR
// ==========================================================================

function createShelfIndicator() {
  shelfIndicator.innerHTML = CONFIG.shelfWaypoints.map((wp, i) => 
    `<button class="shelf-dot ${i === 0 ? 'active' : ''}" data-shelf-index="${i}" role="tab" aria-label="${escapeHtml(wp.name)}" aria-selected="${i === 0}"></button>`
  ).join('');
}

function updateShelfIndicator() {
  shelfIndicator.querySelectorAll('.shelf-dot').forEach((dot, i) => {
    const active = i === currentShelfIndex;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-selected', active);
  });
  
  prevBtn.disabled = currentShelfIndex === 0;
  nextBtn.disabled = currentShelfIndex === CONFIG.shelfWaypoints.length - 1;
}

// ==========================================================================
// ANIMATION LOOP
// ==========================================================================

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  const time = performance.now() * 0.001;
  
  // Animate product floating
  shelfProducts.forEach(product => {
    if (product.userData.paused || isInspecting) return;
    if (product.userData.floatOffset !== undefined) {
      const floatY = Math.sin(time * product.userData.floatSpeed + product.userData.floatOffset) * 0.015;
      product.position.y = product.userData.originalPosition.y + floatY;
      
      // Gentle rotation
      product.rotation.y = product.userData.originalRotation.y + Math.sin(time * 0.2 + product.userData.floatOffset) * 0.02;
    }
  });
  
  // Update controls
  if (!isInspecting) {
    controls.update();
  }
  
  // Render
  renderer.render(scene, camera);
}

// ==========================================================================
// RESIZE HANDLER
// ==========================================================================

function onWindowResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, tag => ({
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '\''
  }[tag]));
}

// ==========================================================================
// PUBLIC API FOR EXTERNAL ACCESS
// ==========================================================================

export const Store3D = {
  navigateToShelf,
  toggle3DView,
  openInspection,
  closeInspection,
  refreshProducts: populateShelves,
  getCurrentShelf: () => currentShelfIndex,
  is3DViewActive: () => !container.classList.contains('hidden')
};

// Make available globally for debugging
window.Store3D = Store3D;

console.log('📦 store3d.js module loaded');