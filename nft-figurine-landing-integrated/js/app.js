// NFT Figurine Generator - API Integration

const API_BASE = "http://127.0.0.1:8000";

let uploadedImages = [];
let currentJobId = null;
let statusPoller = null;

// ====================
// DOM Elements
// ====================
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const generateBtn = document.getElementById('generate-btn');

// ====================
// Event Listeners
// ====================
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFiles({ target: { files: e.dataTransfer.files } }); });
document.getElementById('add-more-btn')?.addEventListener('click', () => fileInput.click());
document.getElementById('clear-btn')?.addEventListener('click', clearImages);
generateBtn.addEventListener('click', startProcessing);
document.getElementById('new-figurine-btn')?.addEventListener('click', resetApp);

// ====================
// File Handling
// ====================
function handleFiles(e) {
  const files = Array.from(e.target.files);
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (files.some(f => !validTypes.includes(f.type))) {
    alert('Please upload only JPG, PNG, or WebP images');
    return;
  }
  
  if (uploadedImages.length + files.length > 6) {
    alert('Maximum 6 images allowed');
    return;
  }
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push({ file, dataUrl: e.target.result });
      updatePreview();
    };
    reader.readAsDataURL(file);
  });
  
  fileInput.value = '';
}

function updatePreview() {
  const uploadPrompt = document.getElementById('upload-prompt');
  const previewGrid = document.getElementById('preview-grid');
  const imageGrid = document.getElementById('image-grid');
  
  if (uploadedImages.length === 0) {
    uploadPrompt?.classList.remove('hidden');
    previewGrid?.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }
  
  uploadPrompt?.classList.add('hidden');
  previewGrid?.classList.remove('hidden');
  
  imageGrid.innerHTML = uploadedImages.map((img, i) => `
    <div class="relative aspect-square rounded-lg overflow-hidden bg-gray-700">
      <img src="${img.dataUrl}" class="w-full h-full object-cover">
      <button onclick="removeImage(${i})" class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600">×</button>
    </div>
  `).join('');
  
  generateBtn.disabled = uploadedImages.length < 3;
  generateBtn.classList.toggle('opacity-50', uploadedImages.length < 3);
  generateBtn.classList.toggle('cursor-not-allowed', uploadedImages.length < 3);
}

function removeImage(index) {
  uploadedImages.splice(index, 1);
  updatePreview();
}

function clearImages() {
  uploadedImages = [];
  updatePreview();
}

// ====================
// API Integration
// ====================
async function startProcessing() {
  if (uploadedImages.length < 3) return;
  
  // Switch to processing view
  document.getElementById('upload').classList.add('hidden');
  document.getElementById('processing').classList.remove('hidden');
  document.getElementById('processing').scrollIntoView({ behavior: 'smooth' });
  
  try {
    // Step 1: Upload images
    updateStep(1, 'Uploading images...', 'accent');
    
    const formData = new FormData();
    uploadedImages.forEach((img, i) => {
      formData.append('files', img.file);
    });
    
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    currentJobId = data.job_id;
    
    updateStep(1, 'Uploading images...', 'green');
    updateProgress(20);
    
    // Step 2: Poll for status
    pollStatus();
    
  } catch (error) {
    showError(error.message);
  }
}

function pollStatus() {
  if (!currentJobId) return;
  
  updateStep(2, 'Processing (checking status...)', 'accent');
  updateProgress(30);
  
  statusPoller = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE}/status/${currentJobId}`);
      const data = await response.json();
      
      updateProgress(data.queue_position > 0 ? 40 : 50);
      updateStep(2, `Status: ${data.status}`, data.status === 'complete' ? 'green' : 'accent');
      
      if (data.status === 'complete') {
        clearInterval(statusPoller);
        onJobComplete();
      } else if (data.status === 'failed') {
        clearInterval(statusPoller);
        showError(data.error || 'Job failed');
      }
      
    } catch (error) {
      clearInterval(statusPoller);
      showError(`Status check failed: ${error.message}`);
    }
  }, 2000);
}

async function onJobComplete() {
  updateStep(3, 'Complete!', 'green');
  updateStep(4, 'Ready for download', 'green');
  updateStep(5, 'Ready', 'green');
  updateProgress(100);
  
  // Show result
  setTimeout(() => {
    document.getElementById('processing').classList.add('hidden');
    document.getElementById('preview').classList.remove('hidden');
    document.getElementById('preview').scrollIntoView({ behavior: 'smooth' });
    
    // Load GLB preview
    loadGLBPreview();
    
    // Wire up download buttons
    wireDownloadButtons();
  }, 1000);
}

function loadGLBPreview() {
  if (!currentJobId) return;
  
  const container = document.getElementById('canvas-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Three.js setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 3);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);
  
  // Try to load GLB
  fetch(`${API_BASE}/download/${currentJobId}`)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const loader = new THREE.GLTFLoader();
      loader.load(url, (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        scene.add(model);
        
        function animate() {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();
      }, undefined, () => {
        // Fallback: create demo
        createDemoFigurine(scene, renderer, camera, controls);
      });
    })
    .catch(() => {
      createDemoFigurine(scene, renderer, camera, controls);
    });
}

function createDemoFigurine(scene, renderer, camera, controls) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.3, roughness: 0.7 });
  
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.8, 32), material);
  group.add(body);
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), material);
  head.position.y = 0.6;
  group.add(head);
  
  scene.add(group);
  
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

function wireDownloadButtons() {
  if (!currentJobId) return;
  
  // STL button
  const stlBtn = document.querySelector('button:contains("Download STL")');
  if (stlBtn) {
    stlBtn.onclick = () => window.open(`${API_BASE}/download/${currentJobId}`, '_blank');
  }
  
  // GLB button  
  const glbBtn = document.querySelector('button:contains("Download GLB")');
  if (glbBtn) {
    glbBtn.onclick = () => window.open(`${API_BASE}/download/${currentJobId}`, '_blank');
  }
}

function updateStep(stepNum, text, color) {
  const dot = document.getElementById(`step-${stepNum}-dot`);
  const textEl = document.getElementById(`step-${stepNum}-text`);
  
  if (dot) {
    dot.className = `w-3 h-3 rounded-full bg-${color}-500`;
  }
  if (textEl) {
    textEl.textContent = text;
  }
}

function updateProgress(percent) {
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (bar) bar.style.width = percent + '%';
  if (text) text.textContent = percent + '% complete';
}

function showError(message) {
  clearInterval(statusPoller);
  document.getElementById('processing').classList.add('hidden');
  document.getElementById('upload').classList.remove('hidden');
  alert('Error: ' + message);
}

function resetApp() {
  uploadedImages = [];
  currentJobId = null;
  clearInterval(statusPoller);
  updatePreview();
  document.getElementById('preview').classList.add('hidden');
  document.getElementById('upload').classList.remove('hidden');
}

window.removeImage = removeImage;
