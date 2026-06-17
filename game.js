import * as THREE from "./vendor/three.module.min.js";

const ROUND_SECONDS = 45;
const CAMERA_Y = 1.45;
const STORAGE_KEY = "bananaStrikeBest";
const MAX_MONKEYS = 10;
const MAX_HEALTH = 5;

const canvas = document.querySelector("#gameCanvas");
const shell = document.querySelector(".game-shell");

const els = {
  score: document.querySelector("#scoreValue"),
  time: document.querySelector("#timeValue"),
  combo: document.querySelector("#comboValue"),
  health: document.querySelector("#healthValue"),
  healthMeter: document.querySelector("#healthMeter"),
  healthStat: document.querySelector(".stat-health"),
  best: document.querySelector("#bestValue"),
  status: document.querySelector("#statusLabel"),
  restartButton: document.querySelector("#restartButton"),
  panel: document.querySelector("#roundOverPanel"),
  roundTitle: document.querySelector("#roundTitle"),
  finalScore: document.querySelector("#finalScore"),
  finalBest: document.querySelector("#finalBest"),
  finalHits: document.querySelector("#finalHits"),
  playAgainButton: document.querySelector("#playAgainButton"),
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12616a);
scene.fog = new THREE.Fog(0x123f31, 18, 62);

const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 90);
camera.position.set(0, CAMERA_Y, 0);
camera.rotation.order = "YXZ";
scene.add(camera);

const clock = new THREE.Clock();
const forwardVector = new THREE.Vector3();
const tempVector = new THREE.Vector3();

const state = {
  width: 1,
  height: 1,
  yaw: 0,
  pitch: 0,
  score: 0,
  best: readBest(),
  combo: 0,
  hits: 0,
  health: MAX_HEALTH,
  timeLeft: ROUND_SECONDS,
  cooldown: 0,
  spawnTimer: 0,
  statusText: "按住拖动，松开发射",
  statusTTL: 0,
  recoil: 0,
  shake: 0,
  ended: false,
  paused: false,
  monkeys: [],
  bananas: [],
  particles: [],
};

const input = {
  dragging: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  downX: 0,
  downY: 0,
  moved: 0,
  keys: new Set(),
};

const materials = {
  ground: new THREE.MeshStandardMaterial({ color: 0x12381f, roughness: 0.95 }),
  lane: new THREE.LineBasicMaterial({ color: 0xd6b549, transparent: true, opacity: 0.22 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x3a2716, roughness: 0.86 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x124822, roughness: 0.82 }),
  leafLight: new THREE.MeshStandardMaterial({ color: 0x2a7832, roughness: 0.78 }),
  banana: new THREE.MeshStandardMaterial({ color: 0xffd636, roughness: 0.38, metalness: 0.01 }),
  bananaHighlight: new THREE.MeshStandardMaterial({ color: 0xfff28d, roughness: 0.32, metalness: 0.02 }),
  bananaShadow: new THREE.MeshStandardMaterial({ color: 0xca8a13, roughness: 0.55 }),
  bananaTip: new THREE.MeshStandardMaterial({ color: 0x3b2410, roughness: 0.8 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd28b54, roughness: 0.72 }),
  sleeve: new THREE.MeshStandardMaterial({ color: 0x244c28, roughness: 0.74 }),
  launcher: new THREE.MeshStandardMaterial({ color: 0x20382c, roughness: 0.48, metalness: 0.16 }),
  launcherBand: new THREE.MeshStandardMaterial({ color: 0xf5b531, roughness: 0.42, metalness: 0.04 }),
  hit: new THREE.MeshStandardMaterial({ color: 0xffde3a, roughness: 0.34, emissive: 0x6c4a00 }),
  eyeWhite: new THREE.MeshStandardMaterial({ color: 0xfff8df, roughness: 0.5 }),
  pupil: new THREE.MeshStandardMaterial({ color: 0x130d08, roughness: 0.35 }),
  nose: new THREE.MeshStandardMaterial({ color: 0x21140c, roughness: 0.58 }),
  cheek: new THREE.MeshStandardMaterial({ color: 0xf0a06f, roughness: 0.68 }),
};

const geometries = {
  sphere: new THREE.SphereGeometry(1, 24, 16),
  belly: new THREE.SphereGeometry(1, 24, 16),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
  barrel: new THREE.CylinderGeometry(0.1, 0.13, 1, 20),
  bananaBody: new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, -0.08, 0),
      new THREE.Vector3(-0.16, 0.12, 0.01),
      new THREE.Vector3(0.14, 0.1, 0),
      new THREE.Vector3(0.34, -0.12, 0),
    ]),
    34,
    0.06,
    14,
    false,
  ),
  bananaRidge: new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.26, -0.035, 0.055),
      new THREE.Vector3(-0.1, 0.095, 0.06),
      new THREE.Vector3(0.12, 0.075, 0.055),
      new THREE.Vector3(0.27, -0.07, 0.052),
    ]),
    24,
    0.012,
    6,
    false,
  ),
  bananaTip: new THREE.SphereGeometry(0.06, 12, 8),
  bananaStem: new THREE.CylinderGeometry(0.026, 0.04, 0.16, 10),
  monkeyMouth: new THREE.TorusGeometry(0.09, 0.009, 6, 16, Math.PI),
  leaf: new THREE.ConeGeometry(1, 2.4, 10),
  plane: new THREE.PlaneGeometry(120, 120, 1, 1),
  box: new THREE.BoxGeometry(1, 1, 1),
};

let weaponGroup;

function readBest() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function writeBest(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Local storage can be unavailable in private modes.
  }
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("zh-CN");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  state.width = Math.max(320, rect.width);
  state.height = Math.max(360, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(state.width, state.height, false);
  camera.aspect = state.width / state.height;
  camera.updateProjectionMatrix();
}

function setStatus(text, ttl = 1.1) {
  state.statusText = text;
  state.statusTTL = ttl;
}

function triggerFlash() {
  shell.classList.remove("screen-flash");
  void shell.offsetWidth;
  shell.classList.add("screen-flash");
}

function triggerDamageFlash() {
  shell.classList.remove("damage-flash");
  void shell.offsetWidth;
  shell.classList.add("damage-flash");
}

function vibrate(duration) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

function makeMat(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function makeMesh(geometry, material, position, scale, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function buildWorld() {
  scene.add(new THREE.HemisphereLight(0x9feaff, 0x183414, 2.85));

  const sun = new THREE.DirectionalLight(0xffdc93, 2.55);
  sun.position.set(-7, 12, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x69d6ff, 1.15);
  rim.position.set(8, 5, -16);
  scene.add(rim);

  const ground = new THREE.Mesh(geometries.plane, materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  drawGroundLines();
  buildTrees();
  weaponGroup = buildWeapon();
  camera.add(weaponGroup);
}

function drawGroundLines() {
  const points = [];
  for (let x = -18; x <= 18; x += 3) points.push(new THREE.Vector3(x, 0.015, -2), new THREE.Vector3(x * 2.4, 0.015, -62));
  for (let z = -5; z >= -62; z -= 5) points.push(new THREE.Vector3(-42, 0.018, z), new THREE.Vector3(42, 0.018, z));
  const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), materials.lane);
  scene.add(line);
}

function buildTrees() {
  for (let i = 0; i < 36; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = -rand(7, 58);
    const x = side * rand(8, 26);
    const height = rand(3.8, 8.5);
    const trunk = makeMesh(
      geometries.cylinder,
      materials.trunk,
      new THREE.Vector3(x, height * 0.5, z),
      new THREE.Vector3(rand(0.12, 0.28), height, rand(0.12, 0.28)),
    );
    trunk.rotation.z = rand(-0.14, 0.14);
    scene.add(trunk);

    const leafMat = Math.random() > 0.42 ? materials.leafDark : materials.leafLight;
    for (let j = 0; j < 3; j += 1) {
      const leaf = makeMesh(
        geometries.leaf,
        leafMat,
        new THREE.Vector3(x + rand(-0.8, 0.8), height + rand(-0.3, 1.2), z + rand(-0.8, 0.8)),
        new THREE.Vector3(rand(0.9, 1.7), rand(0.75, 1.35), rand(0.9, 1.7)),
      );
      leaf.rotation.set(rand(-0.5, 0.5), rand(0, Math.PI), rand(-0.4, 0.4));
      scene.add(leaf);
    }
  }
}

function buildWeapon() {
  const group = new THREE.Group();
  group.position.set(0.34, -0.34, -0.68);
  group.rotation.set(-0.02, -0.15, 0.02);

  const leftArm = makeMesh(
    geometries.cylinder,
    materials.sleeve,
    new THREE.Vector3(-0.32, -0.16, 0.12),
    new THREE.Vector3(0.07, 0.42, 0.07),
  );
  leftArm.rotation.set(0.92, -0.32, 0.12);

  const rightArm = makeMesh(
    geometries.cylinder,
    materials.sleeve,
    new THREE.Vector3(0.31, -0.19, 0.09),
    new THREE.Vector3(0.07, 0.45, 0.07),
  );
  rightArm.rotation.set(0.98, 0.26, -0.08);

  const leftHand = makeMesh(
    geometries.sphere,
    materials.skin,
    new THREE.Vector3(-0.2, -0.02, -0.18),
    new THREE.Vector3(0.12, 0.1, 0.1),
  );
  const rightHand = makeMesh(
    geometries.sphere,
    materials.skin,
    new THREE.Vector3(0.19, -0.03, -0.19),
    new THREE.Vector3(0.13, 0.1, 0.1),
  );

  const barrel = makeMesh(
    geometries.barrel,
    materials.launcher,
    new THREE.Vector3(0, 0.02, -0.34),
    new THREE.Vector3(1.12, 1.12, 1.12),
  );
  barrel.rotation.x = Math.PI / 2;

  const bandA = makeMesh(
    geometries.cylinder,
    materials.launcherBand,
    new THREE.Vector3(0, 0.02, -0.64),
    new THREE.Vector3(0.145, 0.06, 0.145),
  );
  bandA.rotation.x = Math.PI / 2;

  const bandB = bandA.clone();
  bandB.position.z = -0.2;

  const loadedBanana = buildBananaModel(0.76);
  loadedBanana.position.set(0.03, 0.16, -0.62);
  loadedBanana.rotation.set(-0.2, 0.05, -0.7);

  group.add(leftArm, rightArm, leftHand, rightHand, barrel, bandA, bandB, loadedBanana);
  return group;
}

function buildBananaModel(scale = 1) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(geometries.bananaBody, materials.banana);
  body.castShadow = true;
  body.receiveShadow = true;

  const topRidge = new THREE.Mesh(geometries.bananaRidge, materials.bananaHighlight);
  topRidge.castShadow = true;

  const lowerRidge = new THREE.Mesh(geometries.bananaRidge, materials.bananaShadow);
  lowerRidge.position.set(0.02, -0.075, -0.045);
  lowerRidge.rotation.z = -0.08;

  const stem = new THREE.Mesh(geometries.bananaStem, materials.bananaTip);
  stem.position.set(-0.38, -0.12, 0);
  stem.rotation.set(0.15, 0.05, -0.72);
  stem.castShadow = true;

  const tipA = new THREE.Mesh(geometries.bananaTip, materials.bananaTip);
  tipA.position.set(-0.32, -0.08, 0);
  tipA.scale.set(0.82, 0.72, 0.82);
  const tipB = new THREE.Mesh(geometries.bananaTip, materials.bananaTip);
  tipB.position.set(0.34, -0.12, 0);
  tipB.scale.set(0.72, 0.62, 0.72);

  const freckleMat = materials.bananaTip;
  for (const [x, y, z, size] of [
    [-0.08, 0.09, 0.063, 0.16],
    [0.08, 0.07, 0.064, 0.12],
    [0.19, 0.0, 0.058, 0.1],
  ]) {
    const spot = new THREE.Mesh(geometries.bananaTip, freckleMat);
    spot.position.set(x, y, z);
    spot.scale.setScalar(size);
    group.add(spot);
  }

  group.add(body, topRidge, lowerRidge, stem, tipA, tipB);
  group.scale.setScalar(scale);
  return group;
}

function buildMonkeyModel(palette) {
  const fur = makeMat(palette.fur);
  const face = makeMat(palette.face);
  const innerEarMat = makeMat(0xe6ad79, 0.7);
  const group = new THREE.Group();

  const body = makeMesh(geometries.sphere, fur, new THREE.Vector3(0, 0.8, 0), new THREE.Vector3(0.42, 0.58, 0.3));
  const belly = makeMesh(geometries.sphere, face, new THREE.Vector3(0, 0.72, 0.24), new THREE.Vector3(0.26, 0.36, 0.08), false);
  const head = makeMesh(geometries.sphere, fur, new THREE.Vector3(0, 1.45, 0), new THREE.Vector3(0.36, 0.34, 0.32));
  const muzzle = makeMesh(geometries.sphere, face, new THREE.Vector3(0, 1.38, 0.25), new THREE.Vector3(0.23, 0.14, 0.09), false);
  const earL = makeMesh(geometries.sphere, fur, new THREE.Vector3(-0.34, 1.47, 0), new THREE.Vector3(0.15, 0.15, 0.09));
  const earR = makeMesh(geometries.sphere, fur, new THREE.Vector3(0.34, 1.47, 0), new THREE.Vector3(0.15, 0.15, 0.09));
  const innerEarL = makeMesh(geometries.sphere, innerEarMat, new THREE.Vector3(-0.35, 1.47, 0.018), new THREE.Vector3(0.08, 0.09, 0.026), false);
  const innerEarR = makeMesh(geometries.sphere, innerEarMat, new THREE.Vector3(0.35, 1.47, 0.018), new THREE.Vector3(0.08, 0.09, 0.026), false);

  const eyeWhiteL = makeMesh(geometries.sphere, materials.eyeWhite, new THREE.Vector3(-0.12, 1.51, 0.3), new THREE.Vector3(0.055, 0.05, 0.021), false);
  const eyeWhiteR = makeMesh(geometries.sphere, materials.eyeWhite, new THREE.Vector3(0.12, 1.51, 0.3), new THREE.Vector3(0.055, 0.05, 0.021), false);
  const pupilL = makeMesh(geometries.sphere, materials.pupil, new THREE.Vector3(-0.105, 1.5, 0.322), new THREE.Vector3(0.019, 0.022, 0.01), false);
  const pupilR = makeMesh(geometries.sphere, materials.pupil, new THREE.Vector3(0.105, 1.5, 0.322), new THREE.Vector3(0.019, 0.022, 0.01), false);
  const nose = makeMesh(geometries.sphere, materials.nose, new THREE.Vector3(0, 1.4, 0.337), new THREE.Vector3(0.05, 0.033, 0.018), false);
  const mouth = makeMesh(geometries.monkeyMouth, materials.nose, new THREE.Vector3(0, 1.34, 0.34), new THREE.Vector3(1, 0.72, 0.72), false);
  mouth.rotation.z = Math.PI;
  const cheekL = makeMesh(geometries.sphere, materials.cheek, new THREE.Vector3(-0.14, 1.36, 0.323), new THREE.Vector3(0.045, 0.028, 0.012), false);
  const cheekR = makeMesh(geometries.sphere, materials.cheek, new THREE.Vector3(0.14, 1.36, 0.323), new THREE.Vector3(0.045, 0.028, 0.012), false);

  const browL = makeMesh(geometries.cylinder, fur, new THREE.Vector3(-0.12, 1.58, 0.29), new THREE.Vector3(0.012, 0.1, 0.012), false);
  browL.rotation.set(0.1, 0, Math.PI / 2 + 0.2);
  const browR = makeMesh(geometries.cylinder, fur, new THREE.Vector3(0.12, 1.58, 0.29), new THREE.Vector3(0.012, 0.1, 0.012), false);
  browR.rotation.set(0.1, 0, Math.PI / 2 - 0.2);

  const armL = makeMesh(geometries.cylinder, fur, new THREE.Vector3(-0.44, 0.76, 0), new THREE.Vector3(0.07, 0.52, 0.07));
  armL.rotation.z = -0.28;
  const armR = makeMesh(geometries.cylinder, fur, new THREE.Vector3(0.44, 0.76, 0), new THREE.Vector3(0.07, 0.52, 0.07));
  armR.rotation.z = 0.28;
  const legL = makeMesh(geometries.cylinder, fur, new THREE.Vector3(-0.16, 0.24, 0.02), new THREE.Vector3(0.08, 0.46, 0.08));
  legL.rotation.z = 0.14;
  const legR = makeMesh(geometries.cylinder, fur, new THREE.Vector3(0.16, 0.24, 0.02), new THREE.Vector3(0.08, 0.46, 0.08));
  legR.rotation.z = -0.14;

  group.add(
    body,
    belly,
    head,
    muzzle,
    earL,
    earR,
    innerEarL,
    innerEarR,
    eyeWhiteL,
    eyeWhiteR,
    pupilL,
    pupilR,
    nose,
    mouth,
    cheekL,
    cheekR,
    browL,
    browR,
    armL,
    armR,
    legL,
    legR,
  );
  group.userData.parts = { armL, armR, legL, legR, head };
  return group;
}

function spawnMonkey() {
  const difficulty = 1 + (ROUND_SECONDS - state.timeLeft) / ROUND_SECONDS;
  const size = rand(0.82, 1.16);
  const z = -rand(15, 34);
  const lane = 3.4 + Math.abs(z) * 0.14;
  const palettes = [
    { fur: 0x6a3f20, face: 0xd79c63 },
    { fur: 0x50311d, face: 0xc98b58 },
    { fur: 0x744f27, face: 0xe0ab69 },
  ];
  const palette = palettes[Math.floor(rand(0, palettes.length))];
  const model = buildMonkeyModel(palette);

  const monkey = {
    model,
    x: rand(-lane, lane),
    baseX: rand(-lane, lane),
    z,
    size,
    radius: 0.62 * size,
    age: 0,
    sway: rand(0.5, 1.35),
    phase: rand(0, Math.PI * 2),
    speedZ: rand(1.08, 1.82) * difficulty,
    points: Math.round(12 + Math.abs(z) * 0.7 + (1.25 - size) * 9),
  };
  model.scale.setScalar(size);
  model.position.set(monkey.x, 0, monkey.z);
  scene.add(model);
  state.monkeys.push(monkey);
}

function seedMonkeys() {
  state.monkeys.forEach((monkey) => scene.remove(monkey.model));
  state.monkeys = [];
  for (let index = 0; index < 5; index += 1) {
    spawnMonkey();
    state.monkeys[index].z -= index * 4.2;
  }

  const opener = state.monkeys[0];
  opener.baseX = 0;
  opener.x = 0;
  opener.z = -12.5;
  opener.sway = 0.18;
  opener.speedZ = 0.64;
  opener.points += 12;
  opener.model.position.set(0, 0, opener.z);
}

function aimDirection() {
  camera.getWorldDirection(forwardVector);
  return forwardVector.clone().normalize();
}

function throwBanana() {
  if (state.ended) return;
  if (state.cooldown > 0) {
    setStatus("回收发射器", 0.42);
    return;
  }

  const direction = aimDirection();
  const origin = new THREE.Vector3(0.18, -0.18, -0.62).applyQuaternion(camera.quaternion);
  origin.add(camera.position);

  const model = buildBananaModel(0.78);
  model.position.copy(origin);
  model.quaternion.copy(camera.quaternion);
  scene.add(model);

  state.bananas.push({
    model,
    position: origin.clone(),
    velocity: direction.multiplyScalar(28).add(new THREE.Vector3(0, 1.1, 0)),
    age: 0,
    hit: false,
  });

  state.cooldown = 0.24;
  state.recoil = 1;
  state.shake = Math.max(state.shake, 0.035);
  setStatus("香蕉发射", 0.55);
  vibrate(10);
}

function hitMonkey(monkey, banana) {
  banana.hit = true;
  state.monkeys = state.monkeys.filter((item) => item !== monkey);
  scene.remove(monkey.model);
  state.combo = Math.min(9, state.combo + 1);
  state.hits += 1;

  const farBonus = Math.max(0, Math.round(Math.abs(monkey.z) * 0.72));
  const comboBonus = Math.max(1, state.combo);
  const gain = Math.round((monkey.points + farBonus) * comboBonus);
  state.score += gain;

  spawnHitEffect(monkey, gain);
  setStatus(`命中 +${gain}`, 1.15);
  triggerFlash();
  vibrate(22);
}

function loseHealth(amount) {
  if (state.ended || amount <= 0) return;
  const loss = Math.min(state.health, amount);
  state.health -= loss;
  state.combo = 0;
  triggerDamageFlash();
  setStatus(`猴子没拿到香蕉 -${loss}血`, 1.15);
  vibrate(45);

  if (state.health <= 0) endRound("health");
}

function spawnHitEffect(monkey, gain) {
  const burstOrigin = new THREE.Vector3(monkey.x, 1.08 * monkey.size, monkey.z);
  for (let index = 0; index < 20; index += 1) {
    const mesh = makeMesh(
      geometries.sphere,
      index % 3 === 0 ? materials.launcherBand : materials.hit,
      burstOrigin.clone().add(new THREE.Vector3(rand(-0.2, 0.2), rand(-0.1, 0.2), rand(-0.2, 0.2))),
      new THREE.Vector3(rand(0.025, 0.06), rand(0.025, 0.06), rand(0.025, 0.06)),
      false,
    );
    scene.add(mesh);
    state.particles.push({
      mesh,
      velocity: new THREE.Vector3(rand(-2.5, 2.5), rand(1.8, 5.2), rand(-1.8, 1.8)),
      age: 0,
      life: rand(0.35, 0.82),
    });
  }
  setStatus(`命中 +${gain}`, 1.2);
}

function updateCamera() {
  const shakeX = Math.sin(performance.now() * 0.055) * state.shake;
  const shakeY = Math.cos(performance.now() * 0.043) * state.shake;
  camera.rotation.y = state.yaw + shakeX;
  camera.rotation.x = clamp(state.pitch - state.recoil * 0.035 + shakeY, -0.62, 0.52);

  if (weaponGroup) {
    const t = performance.now() * 0.004;
    weaponGroup.position.set(0.34, -0.35 + Math.sin(t) * 0.006, -0.68 + state.recoil * 0.082);
    weaponGroup.rotation.set(-0.02 - state.recoil * 0.13, -0.15, 0.02 + Math.sin(t * 0.7) * 0.01);
  }
}

function updateMonkeys(dt) {
  state.spawnTimer -= dt;
  const spawnCadence = clamp(0.95 - (ROUND_SECONDS - state.timeLeft) * 0.01, 0.46, 0.95);
  if (state.spawnTimer <= 0 && state.monkeys.length < MAX_MONKEYS) {
    spawnMonkey();
    state.spawnTimer = rand(spawnCadence * 0.65, spawnCadence * 1.25);
  }

  state.monkeys.forEach((monkey) => {
    monkey.age += dt;
    monkey.z += monkey.speedZ * dt;
    monkey.x =
      monkey.baseX +
      Math.sin(monkey.age * monkey.sway * 2.4 + monkey.phase) *
        (0.55 + Math.abs(monkey.z) * 0.012);
    monkey.model.position.set(monkey.x, 0, monkey.z);
    monkey.model.rotation.y = Math.sin(monkey.age * 1.8 + monkey.phase) * 0.16;

    const parts = monkey.model.userData.parts;
    if (parts) {
      parts.armL.rotation.z = -0.28 + Math.sin(monkey.age * 8 + monkey.phase) * 0.28;
      parts.armR.rotation.z = 0.28 - Math.sin(monkey.age * 8 + monkey.phase) * 0.28;
      parts.legL.rotation.z = 0.14 - Math.sin(monkey.age * 7.2) * 0.16;
      parts.legR.rotation.z = -0.14 + Math.sin(monkey.age * 7.2) * 0.16;
      parts.head.rotation.y = Math.sin(monkey.age * 2.6) * 0.16;
    }
  });

  const escaped = state.monkeys.filter((monkey) => monkey.z > -1.6);
  if (escaped.length) {
    escaped.forEach((monkey) => scene.remove(monkey.model));
    state.monkeys = state.monkeys.filter((monkey) => monkey.z <= -1.6);
    loseHealth(escaped.length);
  }
}

function updateBananas(dt) {
  state.bananas.forEach((banana) => {
    banana.age += dt;
    banana.velocity.y -= 8.8 * dt;
    banana.position.addScaledVector(banana.velocity, dt);
    banana.model.position.copy(banana.position);
    banana.model.rotation.x += dt * 9;
    banana.model.rotation.z += dt * 13;

    state.monkeys.some((monkey) => {
      tempVector.set(monkey.x, 1.04 * monkey.size, monkey.z);
      if (banana.position.distanceTo(tempVector) < monkey.radius + 0.32) {
        hitMonkey(monkey, banana);
        return true;
      }
      return false;
    });
  });

  const expired = state.bananas.filter(
    (banana) => banana.hit || banana.age > 1.65 || banana.position.y < -0.5 || banana.position.z < -70,
  );
  expired.forEach((banana) => scene.remove(banana.model));
  state.bananas = state.bananas.filter((banana) => !expired.includes(banana));
}

function updateParticles(dt) {
  state.particles.forEach((particle) => {
    particle.age += dt;
    particle.velocity.y -= 7.6 * dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    const fade = 1 - particle.age / particle.life;
    particle.mesh.scale.multiplyScalar(Math.max(0.92, fade));
  });
  const expired = state.particles.filter((particle) => particle.age >= particle.life);
  expired.forEach((particle) => scene.remove(particle.mesh));
  state.particles = state.particles.filter((particle) => particle.age < particle.life);
}

function updateKeyboard(dt) {
  const speed = dt * 1.45;
  if (input.keys.has("ArrowLeft") || input.keys.has("KeyA")) state.yaw += speed;
  if (input.keys.has("ArrowRight") || input.keys.has("KeyD")) state.yaw -= speed;
  if (input.keys.has("ArrowUp") || input.keys.has("KeyW")) state.pitch += speed * 0.65;
  if (input.keys.has("ArrowDown") || input.keys.has("KeyS")) state.pitch -= speed * 0.65;
  state.pitch = clamp(state.pitch, -0.5, 0.5);
}

function update(dt) {
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.recoil = Math.max(0, state.recoil - dt * 5.8);
  state.shake = Math.max(0, state.shake - dt * 0.22);
  state.statusTTL = Math.max(0, state.statusTTL - dt);

  if (state.statusTTL <= 0 && !state.ended) {
    state.statusText = input.dragging ? "松开发射" : state.cooldown > 0 ? "回收发射器" : "按住拖动，松开发射";
  }

  updateKeyboard(dt);
  updateCamera();
  updateBananas(dt);
  updateParticles(dt);

  if (!state.ended) {
    state.timeLeft -= dt;
    updateMonkeys(dt);
    if (!state.ended && state.timeLeft <= 0) endRound("time");
  }

  updateHud();
}

function updateHud() {
  els.score.textContent = formatNumber(state.score);
  els.time.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
  els.combo.textContent = `x${Math.max(1, state.combo)}`;
  els.health.textContent = `${state.health}/${MAX_HEALTH}`;
  els.healthMeter.style.transform = `scaleX(${clamp(state.health / MAX_HEALTH, 0, 1)})`;
  els.healthStat.classList.toggle("low", state.health <= 2);
  els.best.textContent = `最高 ${formatNumber(Math.max(state.best, state.score))}`;
  els.status.textContent = state.statusText;
}

function endRound(reason = "time") {
  if (state.ended) return;
  state.ended = true;
  state.timeLeft = 0;
  state.combo = 0;
  state.statusText = reason === "health" ? "血量归零" : "结算";
  shell.classList.remove("aiming");
  input.dragging = false;

  if (state.score > state.best) {
    state.best = state.score;
    writeBest(state.best);
  }

  let title = reason === "health" ? "香蕉防线失守" : "香蕉投手";
  if (reason !== "health") {
    if (state.score >= 900) title = "丛林神射手";
    else if (state.score >= 600) title = "金牌投蕉员";
    else if (state.score >= 320) title = "稳定命中手";
  }

  els.roundTitle.textContent = title;
  els.finalScore.textContent = formatNumber(state.score);
  els.finalBest.textContent = formatNumber(state.best);
  els.finalHits.textContent = formatNumber(state.hits);
  els.panel.hidden = false;
}

function restart() {
  state.yaw = 0;
  state.pitch = 0;
  state.score = 0;
  state.combo = 0;
  state.hits = 0;
  state.health = MAX_HEALTH;
  state.timeLeft = ROUND_SECONDS;
  state.cooldown = 0;
  state.spawnTimer = 0.45;
  state.statusText = "按住拖动，松开发射";
  state.statusTTL = 0;
  state.recoil = 0;
  state.shake = 0;
  state.ended = false;
  state.bananas.forEach((banana) => scene.remove(banana.model));
  state.particles.forEach((particle) => scene.remove(particle.mesh));
  state.bananas = [];
  state.particles = [];
  els.panel.hidden = true;
  shell.classList.remove("aiming", "damage-flash", "screen-flash");
  seedMonkeys();
  updateCamera();
  updateHud();
}

function frame() {
  const dt = Math.min(0.033, clock.getDelta());
  if (!state.paused) update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function aimByDelta(deltaX, deltaY) {
  const sensitivity = 0.0032;
  state.yaw -= deltaX * sensitivity;
  state.pitch = clamp(state.pitch - deltaY * sensitivity, -0.5, 0.5);
}

canvas.addEventListener("pointerdown", (event) => {
  if (state.ended || input.dragging || event.isPrimary === false) return;
  input.dragging = true;
  input.pointerId = event.pointerId;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  input.downX = event.clientX;
  input.downY = event.clientY;
  input.moved = 0;
  canvas.setPointerCapture(event.pointerId);
  shell.classList.add("aiming");
  setStatus("松开发射", 0.6);
});

canvas.addEventListener("pointermove", (event) => {
  if (!input.dragging || input.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - input.lastX;
  const deltaY = event.clientY - input.lastY;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  input.moved += Math.abs(deltaX) + Math.abs(deltaY);
  aimByDelta(deltaX, deltaY);
});

canvas.addEventListener("pointerup", (event) => {
  if (!input.dragging || input.pointerId !== event.pointerId) return;
  input.dragging = false;
  input.pointerId = null;
  canvas.releasePointerCapture(event.pointerId);
  shell.classList.remove("aiming");
  throwBanana();
});

canvas.addEventListener("pointercancel", () => {
  input.dragging = false;
  input.pointerId = null;
  shell.classList.remove("aiming");
});
els.restartButton.addEventListener("click", restart);
els.playAgainButton.addEventListener("click", restart);

window.addEventListener("keydown", (event) => {
  input.keys.add(event.code);
  if (event.code === "Space") {
    event.preventDefault();
    throwBanana();
  }
});

window.addEventListener("keyup", (event) => {
  input.keys.delete(event.code);
});

window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => {
  state.paused = document.hidden;
  if (!state.paused) clock.getDelta();
});

window.__bananaStrike = {
  restart,
  throwBanana,
  state: () => ({
    score: state.score,
    hits: state.hits,
    health: state.health,
    timeLeft: state.timeLeft,
    monkeyCount: state.monkeys.length,
    bananaCount: state.bananas.length,
  }),
};

buildWorld();
resize();
restart();
frame();
