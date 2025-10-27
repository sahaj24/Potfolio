// EXACT LUSION ANIMATION FROM lusion-line-exact.html
// ============================================
// 🎛️ EASY CONTROLS
// ============================================
const ANIMATION_CONFIG = {
    scrollSpeed: 8.0,        // How fast pipe grows (1.0 = normal, 2.0 = 2x faster, 0.5 = slower)
    smoothness: 0.1          // Animation smoothness (0.1 = smooth, 0.5 = snappy)
};
// ============================================

(function() {
    // Create container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '700px';
    container.style.left = '-550px';
    container.style.width = '140vw';  // 150% of viewport width - WIDER
    container.style.height = '100vh';
    container.style.zIndex = '500';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'visible';
    document.body.appendChild(container);

    // EXACT SHADERS FROM LUSION SITE (lines 3710-3713)
    const vert$j = `
        attribute vec3 CP;           // Curve Point
        attribute float Cd;          // Color/AO data
        
        varying float v_cd;
        varying float v_lineRatio;
        varying float v_s;
        
        uniform float u_scrollY;
        uniform vec2 u_viewportResolution;
        uniform vec2 u_aspect;
        uniform vec2 u_margin;
        uniform float u_radius;
        
        void main() {
            vec3 pos = vec3(CP.xy + position.xy * u_radius, 0.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            v_cd = Cd;
            v_lineRatio = position.z;
            v_s = CP.z;
        }
    `;

    const frag$m = `
        varying float v_cd;
        varying float v_lineRatio;
        varying float v_s;
        
        uniform float u_showRatio;
        uniform float u_hideRatio;
        uniform vec3 u_colorBg;
        uniform vec3 u_color0;
        uniform vec3 u_color1;
        uniform float u_aoThreshold;
        
        float linearStep(float edge0, float edge1, float x) {
            return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        }
        
        vec3 hsv2rgb(in vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
        }
        
        vec3 rgb2hsv(vec3 c) {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        
        vec3 lerpHSV(in vec3 a, in vec3 b, in float x) {
            float hue = (mod(mod((b.x - a.x), 1.0) + 1.5, 1.0) - 0.5) * x + a.x;
            return vec3(hue, mix(a.yz, b.yz, x));
        }
        
        void main() {
            float ao = 0.9 + 0.1 * v_cd;
            float aoRatio = linearStep(u_aoThreshold - 0.02, u_aoThreshold + 0.02, u_showRatio);
            
            if(step(u_showRatio, v_lineRatio) > 0.5) discard;
            
            float mixRatio = 1.0 - pow(1.0 - clamp(v_lineRatio, 0.0, 1.0), 2.0);
            gl_FragColor.rgb = hsv2rgb(lerpHSV(rgb2hsv(u_color1), rgb2hsv(u_color0), mixRatio));
            gl_FragColor.rgb *= min(1.0, ao + 1.0 - aoRatio);
            
            float alpha = abs(v_s - 0.5);
            gl_FragColor.a = linearStep(0.5, 0.5 - fwidth(alpha), alpha);
        }
    `;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        container.offsetWidth / -2, container.offsetWidth / 2,
        container.offsetHeight / 2, container.offsetHeight / -2,
        0.1, 1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera.position.z = 1;

    // Create line geometry matching the original structure
    function createLineGeometry() {
        const geometry = new THREE.BufferGeometry();
        
        // Generate flowing curve path (mimicking line_reel.buf)
        const curvePoints = [];
        const numSegments = 200;
        
        for (let i = 0; i < numSegments; i++) {
            const t = i / (numSegments - 1);
            
            // Create flowing S-curve similar to the site
            const x = (t - 0.2) * container.offsetWidth * 1.2;
            const y = container.offsetHeight * 0.2 + 
                     Math.sin(t * Math.PI * 2) * 200 + 
                     Math.cos(t * Math.PI * 4) * 80 +
                     Math.sin(t * Math.PI * 6) * 40;
            
            curvePoints.push(new THREE.Vector2(x, y));
        }
        
        // Build tube geometry
        const vertices = [];
        const cpPositions = [];
        const cdValues = [];
        const indices = [];
        
        const radius = 8; // Tube radius in pixels
        const radialSegments = 16;
        
        for (let i = 0; i < curvePoints.length; i++) {
            const t = i / (curvePoints.length - 1);
            const p = curvePoints[i];
            
            // Calculate tangent
            let tangent;
            if (i === 0) {
                tangent = new THREE.Vector2().subVectors(curvePoints[i + 1], p).normalize();
            } else if (i === curvePoints.length - 1) {
                tangent = new THREE.Vector2().subVectors(p, curvePoints[i - 1]).normalize();
            } else {
                tangent = new THREE.Vector2().subVectors(curvePoints[i + 1], curvePoints[i - 1]).normalize();
            }
            
            const normal = new THREE.Vector2(-tangent.y, tangent.x);
            
            // Create tube cross-section
            for (let j = 0; j <= radialSegments; j++) {
                const angle = (j / radialSegments) * Math.PI * 2;
                const s = (Math.cos(angle) * 0.5 + 0.5); // 0 to 1
                
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;
                
                // Position (used for tube cross-section offset)
                vertices.push(offsetX, offsetY, t);
                
                // CP (curve point - centerline)
                cpPositions.push(p.x, p.y, s);
                
                // Cd (ambient occlusion)
                const ao = 0.85 + Math.random() * 0.15;
                cdValues.push(ao);
            }
            
            // Create indices for triangle strip
            if (i < curvePoints.length - 1) {
                for (let j = 0; j < radialSegments; j++) {
                    const a = i * (radialSegments + 1) + j;
                    const b = a + radialSegments + 1;
                    const c = a + 1;
                    const d = b + 1;
                    
                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('CP', new THREE.BufferAttribute(new Float32Array(cpPositions), 3));
        geometry.setAttribute('Cd', new THREE.BufferAttribute(new Float32Array(cdValues), 1));
        geometry.setIndex(indices);
        
        return geometry;
    }

    // Create shader material with EXACT data from line_reel
    const lineData = {
        aoThreshold: 0.555,
        color0: "#5a90ff",  // Lighter blue
        color1: "#2a38ee"   // Darker purple/blue
    };

    const material = new THREE.ShaderMaterial({
        vertexShader: vert$j,
        fragmentShader: frag$m,
        uniforms: {
            u_showRatio: { value: 0.0 },
            u_hideRatio: { value: 0.0 },
            u_aoThreshold: { value: lineData.aoThreshold },
            u_colorBg: { value: new THREE.Color(0xffffff) },
            u_color0: { value: new THREE.Color(lineData.color0) },
            u_color1: { value: new THREE.Color(lineData.color1) },
            u_scrollY: { value: 0 },
            u_radius: { value: 1.0 },
            u_aspect: { value: new THREE.Vector2(1, 1) },
            u_margin: { value: new THREE.Vector2(-0.05, -0.8) },
            u_viewportResolution: { value: new THREE.Vector2(container.offsetWidth, container.offsetHeight) }
        },
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
    });

    const lineGeometry = createLineGeometry();
    const line = new THREE.Mesh(lineGeometry, material);
    scene.add(line);

    // Animation
    let scrollY = 0;
    let targetScrollY = 0;

    // Scroll handler with speed control
    window.addEventListener('scroll', () => {
        const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
        targetScrollY = Math.min(1.0, scrollPercent * ANIMATION_CONFIG.scrollSpeed); // Apply speed multiplier
    });

    function animate() {
        requestAnimationFrame(animate);

        // Smooth scroll interpolation with configurable smoothness
        scrollY += (targetScrollY - scrollY) * ANIMATION_CONFIG.smoothness;

        // Animate show ratio (drawing animation)
        // Matches original site's animation timing
        let showRatio = scrollY;
        showRatio = Math.pow(showRatio, 0.8); // Ease out
        
        material.uniforms.u_showRatio.value = showRatio;
        material.uniforms.u_scrollY.value = scrollY;

        renderer.render(scene, camera);
    }

    // Handle resize
    window.addEventListener('resize', () => {
        camera.left = container.offsetWidth / -2;
        camera.right = container.offsetWidth / 2;
        camera.top = container.offsetHeight / 2;
        camera.bottom = container.offsetHeight / -2;
        camera.updateProjectionMatrix();
        
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        
        material.uniforms.u_viewportResolution.value.set(container.offsetWidth, container.offsetHeight);
        
        // Regenerate geometry for new screen size
        line.geometry.dispose();
        line.geometry = createLineGeometry();
    });

    animate();
})();
