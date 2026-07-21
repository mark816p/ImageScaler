import { pipeline, env, RawImage } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1';

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = true;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loadingContainer = document.getElementById('loading-container');
const loadingText = document.getElementById('loading-text');
const progressBar = document.getElementById('progressBar'); // oops, it's progress-bar in HTML
const progressBarEl = document.getElementById('progress-bar');
const resultContainer = document.getElementById('result-container');
const originalImage = document.getElementById('original-image');
const upscaledImage = document.getElementById('upscaled-image');
const resetBtn = document.getElementById('reset-btn');
const downloadBtn = document.getElementById('download-btn');

let upscaler = null;
let currentUpscaledUrl = null;

// Handle drag and drop styling
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
});

dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

async function handleFiles(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageUrl = e.target.result;
        originalImage.src = imageUrl;
        
        // Hide drop zone, show loading
        dropZone.classList.add('hidden');
        loadingContainer.classList.remove('hidden');
        resultContainer.style.display = 'none';
        
        try {
            await processImage(imageUrl);
        } catch (error) {
            console.error('Upscaling error:', error);
            alert('An error occurred during upscaling.');
            resetUI();
        }
    };
    reader.readAsDataURL(file);
}

async function processImage(imageUrl) {
    // 1. Load Model
    if (!upscaler) {
        loadingText.textContent = 'Loading AI model (this may take a minute the first time)...';
        upscaler = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64', {
            progress_callback: (info) => {
                if (info.status === 'progress') {
                    const percent = (info.progress || 0) + '%';
                    progressBarEl.style.width = percent;
                }
            }
        });
    }

    // 2. Prepare Image
    loadingText.textContent = 'Processing image...';
    progressBarEl.style.width = '100%';
    
    const image = await RawImage.fromURL(imageUrl);

    // 3. Run Inference
    const result = await upscaler(image);
    
    // The model outputs a RawImage object we can convert to a Blob/DataURL
    // Transformers.js V2 returns an object with a `toBlob` method for images.
    let outImage = result;
    if (Array.isArray(result)) outImage = result[0];
    
    // Convert output RawImage to Blob
    const canvas = document.createElement('canvas');
    canvas.width = outImage.width;
    canvas.height = outImage.height;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(
        new Uint8ClampedArray(outImage.data),
        outImage.width,
        outImage.height
    );
    ctx.putImageData(imageData, 0, 0);
    
    currentUpscaledUrl = canvas.toDataURL('image/png');
    upscaledImage.src = currentUpscaledUrl;

    // 4. Show Results
    loadingContainer.classList.add('hidden');
    resultContainer.style.display = 'flex';
}

function resetUI() {
    dropZone.classList.remove('hidden');
    loadingContainer.classList.add('hidden');
    resultContainer.style.display = 'none';
    fileInput.value = '';
    if (currentUpscaledUrl) {
        URL.revokeObjectURL(currentUpscaledUrl);
        currentUpscaledUrl = null;
    }
}

resetBtn.addEventListener('click', resetUI);

downloadBtn.addEventListener('click', () => {
    if (!currentUpscaledUrl) return;
    const a = document.createElement('a');
    a.href = currentUpscaledUrl;
    a.download = 'upscaled-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
