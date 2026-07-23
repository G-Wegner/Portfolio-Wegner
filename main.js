// --- 1. MODAL & PROJEKT-STEUERUNG ---
function openProject(title, desc, ...images) {
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalInfoSide = document.querySelector('.modal-info-side');
    const gallerySide = document.querySelector('.modal-gallery-side');

    if (modalTitle) modalTitle.innerText = title;
    if (modalDesc) modalDesc.innerHTML = desc;

    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach((item, index) => {
        const fileSrc = images[index] ? images[index].trim() : null;
        
        if (fileSrc) {
            item.style.display = "block";
            
            // Prüfen, ob die Datei ein MP4-Video ist
            if (fileSrc.toLowerCase().endsWith('.mp4')) {
                item.innerHTML = `
                    <video autoplay loop muted playsinline class="modal-img" onclick="zoomMedia(this)">
                        <source src="${fileSrc}" type="video/mp4">
                    </video>`;
            } else {
                // Normales Bild
                item.innerHTML = `<img src="${fileSrc}" class="modal-img" onclick="zoomMedia(this)">`;
            }
        } else {
            item.style.display = "none";
            item.innerHTML = "";
        }
    });

    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
        
        if (gallerySide) gallerySide.scrollTop = 0;
        if (modalInfoSide) modalInfoSide.scrollTop = 0;

        gsap.fromTo(".modal-window", 
            { y: 100, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );
    }
}

function closeModal() {
    gsap.to(".modal-window", { 
        y: 100, 
        opacity: 0, 
        duration: 0.4, 
        ease: "power2.in",
        onComplete: () => {
            const modal = document.getElementById('project-modal');
            if (modal) modal.style.display = 'none';
            
            document.body.style.overflow = 'auto';
            
            const projectSection = document.querySelector('.projects');
            if (projectSection) {
                projectSection.scrollIntoView({ behavior: 'smooth' });
            }
        } 
    });
}


// --- 2. LIGHTBOX (ZOOM) MIT AMBILIGHT & SPEZIELLER DREHUNG ---
function zoomMedia(element) {
    const lightbox = document.getElementById('media-lightbox');
    if (!lightbox) return;

    lightbox.innerHTML = '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeLightbox;
    lightbox.appendChild(closeBtn);

    if (element.tagName === 'VIDEO') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ambilight-wrapper';

        // 1. Hintergrund-Glow (Genaue Videokopie)
        const glowVideo = element.cloneNode(true);
        glowVideo.className = 'ambilight-glow';
        glowVideo.removeAttribute('controls');
        glowVideo.removeAttribute('onclick');
        glowVideo.muted = true;

        // 2. Haupt-Video (Vordergrund)
        const mainVideo = element.cloneNode(true);
        mainVideo.className = 'ambilight-video modal-img';
        mainVideo.controls = true;
        mainVideo.setAttribute('controlsList', 'nodownload noplaybackrate');
        mainVideo.setAttribute('disablepictureinpicture', 'true');
        mainVideo.setAttribute('oncontextmenu', 'return false;');

        // 🔍 PRÜFUNG: Nur wenn die Quelle "StrangerThings.mp4" ist, wird gedreht!
        const videoSource = mainVideo.querySelector('source')?.src || mainVideo.src || '';
        const isStrangerThings = videoSource.toLowerCase().includes('strangerthings.mp4');

        if (isStrangerThings) {
            const ROTATE_AT_SECOND = 18.0; // Hier Sekunde der Drehung festlegen
            setupVideoRotation(mainVideo, ROTATE_AT_SECOND);
            setupVideoRotation(glowVideo, ROTATE_AT_SECOND);
        }

        wrapper.appendChild(glowVideo);
        wrapper.appendChild(mainVideo);
        lightbox.appendChild(wrapper);

        mainVideo.play();
        glowVideo.play();

        // Synchrone Wiedergabe halten
        mainVideo.addEventListener('play', () => glowVideo.play());
        mainVideo.addEventListener('pause', () => glowVideo.pause());
        mainVideo.addEventListener('seeking', () => glowVideo.currentTime = mainVideo.currentTime);

    } else {
        // Normales Bild
        const clone = element.cloneNode(true);
        clone.removeAttribute('onclick');
        lightbox.appendChild(clone);
    }

    lightbox.style.display = 'flex';
    document.addEventListener('keydown', handleEscKey);
}

function closeLightbox() {
    const lightbox = document.getElementById('media-lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        lightbox.innerHTML = ''; 
    }
    document.removeEventListener('keydown', handleEscKey);
}

function handleEscKey(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
}

// Zeitsteuerung & sanfter Loop-Reset für die Videodrehung
function setupVideoRotation(videoElement, rotateTimeInSeconds) {
    if (!videoElement) return;

    let isRotated = false;

    videoElement.addEventListener('timeupdate', function() {
        // Beim Loop-Neustart (Sekunde 0) SOFORT zurückdrehen ohne Animation
        if (this.currentTime < 0.3 && isRotated) {
            this.classList.add('no-transition');
            this.classList.remove('rotated-video');
            isRotated = false;

            setTimeout(() => {
                this.classList.remove('no-transition');
            }, 100);
        }
        // An der Dreh-Sekunde langsam eindrehen
        else if (this.currentTime >= rotateTimeInSeconds && !isRotated) {
            this.classList.remove('no-transition');
            this.classList.add('rotated-video');
            isRotated = true;
        }
    });
}


// --- 3. HIGH-END PARTICLE VORTEX (Three.js) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const particlesCount = 15000;
const posArray = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05, color: 0x00f2ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);
camera.position.z = 30;

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX - window.innerWidth / 2;
    mouseY = e.clientY - window.innerHeight / 2;
});

function animate() {
    requestAnimationFrame(animate);
    particlesMesh.rotation.y += 0.001 + (mouseX * 0.00005);
    particlesMesh.rotation.x += 0.0005 + (mouseY * 0.00005);
    particlesMesh.position.y = Math.sin(Date.now() * 0.0001) * 2;
    renderer.render(scene, camera);
}
animate();


// --- 4. GSAP ANIMATIONEN, LOADER & HELFER ---
gsap.registerPlugin(ScrollTrigger);

window.addEventListener('load', () => {
    window.scrollTo(0, 0);

    let count = { val: 0 };
    let target = 100;

    gsap.to(count, {
        val: target,
        duration: 3, 
        ease: "power2.inOut",
        onUpdate: () => {
            const counterEl = document.querySelector('.counter');
            const barEl = document.querySelector('.progress-bar');
            
            if (counterEl) counterEl.innerHTML = Math.floor(count.val);
            if (barEl) barEl.style.width = count.val + "%";
        },
        onComplete: () => {
            const tl = gsap.timeline();
            
            tl.to("#loader", { 
                yPercent: -100, 
                duration: 1.2, 
                ease: "expo.inOut" 
            })
            .from(".site-logo", { 
                y: -50, 
                opacity: 0, 
                duration: 1.2, 
                ease: "power3.out" 
            }, "-=0.6")
            .from(".reveal", { 
                y: 50, 
                opacity: 0, 
                stagger: 0.15, 
                duration: 1, 
                ease: "power4.out" 
            }, "-=0.8");
        }
    });
});

function moveSlider(button, direction) {
    const container = button.closest('.slider-container');
    const carousel = container.querySelector('.carousel');
    const scrollAmount = 300; 
    
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// Rechtsklick-Schutz
document.addEventListener('contextmenu', e => { e.preventDefault(); alert("Inhalte geschützt."); });

// Resize handling für Three.js
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});