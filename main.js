let scene, camera, renderer;
let model;
let startTime = 0;
let rotationState = 'idle';
let cycleStartTime = 0;
let audio;
let lastColorChange = 0;
let dragging = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let dragOffset = new THREE.Vector3();
const COLOR_CHANGE_INTERVAL = 100;
const STATES = {
    idle: { speed: 0, duration: 0 },
    extremeFast: { speed: 0.6, duration: 2000 },
    pause1: { speed: 0, duration: 1000 },
    mediumFast: { speed: 0.2, duration: 2000 },
    pause2: { speed: 0, duration: 1000 },
    finalSpin: { speed: 0.8, duration: 39000 }
};
function getRandomColor() {
    return new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
    );
}
function initAudio() {
    audio = new Audio('oiia-oiia-spinning-cat-made-with-Voicemod.mp3');
    audio.load();
}
function resetPattern() {
    if (model) model.rotation.y = 0;
    rotationState = 'idle';
    scene.background = new THREE.Color(0xFFFFFF);
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    cycleStartTime = 0;
}
function startPattern() {
    cycleStartTime = performance.now();
    rotationState = 'extremeFast';
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#glCanvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    initAudio();
    const loader = new THREE.GLTFLoader();
    loader.load(
        'oiiaioooooiai_cat.glb',
        function (gltf) {
            model = gltf.scene;
            scene.add(model);
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            camera.position.z = cameraZ * 1.5;
            const ambient = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambient);
            const directional = new THREE.DirectionalLight(0xffffff, 1);
            directional.position.set(5, 5, 5);
            scene.add(directional);
            const pointLight = new THREE.PointLight(0xffffff, 1, 100);
            pointLight.position.set(0, 5, 5);
            scene.add(pointLight);
            startTime = performance.now();
            animate();
        },
        undefined,
        function (error) {
            console.error(error);
        }
    );
}
function updateRotationState(currentTime) {
    if (rotationState === 'idle') return;
    const elapsedInCycle = currentTime - cycleStartTime;
    const totalCycleDuration = STATES.extremeFast.duration +
        STATES.pause1.duration +
        STATES.mediumFast.duration +
        STATES.pause2.duration +
        STATES.finalSpin.duration;
    if (elapsedInCycle >= totalCycleDuration) {
        resetPattern();
        return;
    }
    if (elapsedInCycle < STATES.extremeFast.duration) {
        rotationState = 'extremeFast';
    } else if (elapsedInCycle < STATES.extremeFast.duration + STATES.pause1.duration) {
        rotationState = 'pause1';
        if (model) model.rotation.y = 0;
    } else if (elapsedInCycle < STATES.extremeFast.duration + STATES.pause1.duration + STATES.mediumFast.duration) {
        rotationState = 'mediumFast';
    } else if (elapsedInCycle < STATES.extremeFast.duration + STATES.pause1.duration + STATES.mediumFast.duration + STATES.pause2.duration) {
        rotationState = 'pause2';
        if (model) model.rotation.y = 0;
    } else {
        rotationState = 'finalSpin';
    }
}
function animate() {
    requestAnimationFrame(animate);
    const currentTime = performance.now();
    updateRotationState(currentTime);
    if (rotationState === 'finalSpin' && currentTime - lastColorChange > COLOR_CHANGE_INTERVAL) {
        scene.background = getRandomColor();
        lastColorChange = currentTime;
    }
    if (model && STATES[rotationState]) {
        model.rotation.y += STATES[rotationState].speed;
    }
    renderer.render(scene, camera);
}
function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);
    if (intersects.length > 0) {
        dragging = true;
        dragOffset.copy(intersects[0].point).sub(model.position);
    }
}
function onMouseMove(event) {
    if (!dragging) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    model.position.copy(intersectPoint.sub(dragOffset));
}
function onMouseUp() {
    dragging = false;
}
window.onload = init;
window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'r') {
        if (rotationState === 'idle') {
            startPattern();
        } else {
            resetPattern();
        }
    }
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);
