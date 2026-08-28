/* SSC 2027 — shared ambient FX (Swift orb decor + plasma shader background).
   Each page sets window.SSC_FX_PAUSED before including this file:
     index.html -> true until the boot overlay finishes
     apply.html -> false immediately */
  (() => {
    const TAU = Math.PI * 2;
    const _mq = (q) => window.matchMedia(q).matches;
    const SSC_REDUCED = _mq('(prefers-reduced-motion: reduce)');
    const SSC_MOBILE = _mq('(max-width: 768px)');
    const SSC_LOW = SSC_REDUCED || SSC_MOBILE || ((navigator.deviceMemory && navigator.deviceMemory <= 4) && (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
    let _orbLast = 0;
    const SWIFT_PATH = "M13.543 3.41c4.114 2.47 6.545 7.162 5.549 11.131-.024.093-.05.181-.076.272l.002.001c2.062 2.538 1.5 5.258 1.236 4.745-1.072-2.086-3.066-1.568-4.088-1.043a6.803 6.803 0 0 1-.281.158l-.02.012-.002.002c-2.115 1.123-4.957 1.205-7.812-.022a12.568 12.568 0 0 1-5.64-4.838c.649.48 1.35.902 2.097 1.252 3.019 1.414 6.051 1.311 8.197-.002C9.651 12.73 7.101 9.67 5.146 7.191a10.628 10.628 0 0 1-1.005-1.384c2.34 2.142 6.038 4.83 7.365 5.576C8.69 8.408 6.208 4.743 6.324 4.86c4.436 4.47 8.528 6.996 8.528 6.996.154.085.27.154.36.213.085-.215.16-.437.224-.668.708-2.588-.09-5.548-1.893-7.992z";
    const maskCache = new Map();
    function pathDots(key, d, N) {
      const ck = key + "-" + N;
      if (maskCache.has(ck)) return maskCache.get(ck);
      const px = 200, c = document.createElement("canvas");
      c.width = c.height = px;
      const g = c.getContext("2d");
      g.setTransform(px / 24, 0, 0, px / 24, 0, 0);
      g.fillStyle = "#fff";
      g.fill(new Path2D(d));
      const img = g.getImageData(0, 0, px, px).data;
      let x0 = px, x1 = -1, y0 = px, y1 = -1;
      for (let j = 0; j < px; j++) for (let i = 0; i < px; i++)
        if (img[(j * px + i) * 4 + 3] > 128) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, m = Math.max(x1 - x0, y1 - y0);
      const pts = [];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const sx = mx + ((i + .5) / N * 2 - 1) * m / 2, sy = my + ((j + .5) / N * 2 - 1) * m / 2;
        const ix = Math.round(sx), iy = Math.round(sy);
        if (ix < 0 || iy < 0 || ix >= px || iy >= px) continue;
        if (img[(iy * px + ix) * 4 + 3] <= 128) continue;
        pts.push([(sx - mx) / (m / 2), (sy - my) / (m / 2)]);
      }
      maskCache.set(ck, pts);
      return pts;
    }

    const canvases = document.querySelectorAll(".swift-orb-canvas");
    const accent = [240, 81, 56];

    canvases.forEach(canvas => {
      const S = parseInt(canvas.dataset.size) || 90;
      const cW = S, cH = S;
      canvas.width = cW; canvas.height = cH;
      const ctx = canvas.getContext("2d");
      const R = S / 2 * .88;
      const rs = Math.pow(S / 300, .6);
      const phase = Math.random() * Math.PI * 2;
      const pts = pathDots("swift", SWIFT_PATH, SSC_LOW ? (S > 80 ? 14 : 10) : (S > 80 ? 22 : 16));

        let _drawn = false;
        function frame() {
          if (window.SSC_FX_PAUSED) { requestAnimationFrame(frame); return; }
          if (SSC_REDUCED) {
            if (_drawn) { return; }
            _drawn = true;
          } else {
            const _now = performance.now();
            if (SSC_LOW && _now - _orbLast < 33) { requestAnimationFrame(frame); return; }
            _orbLast = _now;
          }
          const t = performance.now() / 1000;
          ctx.clearRect(0, 0, cW, cH);

        // soft glow
        const glow = ctx.createRadialGradient(cW/2, cH/2, 0, cW/2, cH/2, cW/2);
        glow.addColorStop(0, "rgba(255,255,255,.04)");
        glow.addColorStop(.7, "rgba(255,255,255,.01)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, cW, cH);

        // 3D projection
        const yaw = .2 * Math.sin(t * .43 + phase);
        const tilt = .18 * Math.sin(t * .31 + phase) - .04;
        const st = Math.sin(tilt), ct = Math.cos(tilt), sy = Math.sin(yaw), cy = Math.cos(yaw);
        const projFn = (x, y) => {
          const px = x * cy, pz = -x * sy;
          const py = y * ct - pz * st;
          return [cW/2 + px * R, cH/2 - py * R];
        };

        const bob = .035 * Math.sin(t * .95 + phase);
        const wave = (((t * .4 + phase) % 1 + 1) % 1) * 2.4 - 1.2;

        const dots = [];
        for (const [gx, gy] of pts) {
          const u = (gx - gy) * .5;
          const crest = Math.exp(-Math.pow(u - wave, 2) / .05);
          const [x, y] = projFn(gx, -gy + bob);
          const dep = (gx + 1) / 2;
          dots.push({ x, y, r: (.75 + .8 * dep + .45 * crest) * rs, v: .6 + .16 * dep + .26 * crest, a: .35 });
        }

        dots.sort((a, b) => a.r - b.r);
        for (const d of dots) {
          if (d.a < .02) continue;
          const v = d.v < 0 ? 0 : d.v > 1 ? 1 : d.v;
          const g = v * 255;
          let r = g, gg = g, b = g;
          const lift = Math.min(1, v * 1.12);
          r = g * (1 - .92) + accent[0] * lift * .92;
          gg = g * (1 - .92) + accent[1] * lift * .92;
          b = g * (1 - .92) + accent[2] * lift * .92;
          if (v > .85) { const w = (v - .85) / .15 * .45; r += (255 - r) * w; gg += (255 - gg) * w; b += (255 - b) * w; }
          ctx.fillStyle = `rgba(${r|0},${gg|0},${b|0},${d.a})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, Math.max(.3, d.r), 0, TAU);
          ctx.fill();
        }

        requestAnimationFrame(frame);
      }
      frame();
    });
  })();

  /* Plasma Shader Background */
  (() => {
    const canvas = document.getElementById("shaderBg");
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return;

    const _mq = (q) => window.matchMedia(q).matches;
    const SSC_REDUCED = _mq('(prefers-reduced-motion: reduce)');
    const SSC_MOBILE = _mq('(max-width: 768px)');
    const SSC_LOW = SSC_REDUCED || SSC_MOBILE || ((navigator.deviceMemory && navigator.deviceMemory <= 4) && (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));

    const VERT = "attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}";
    const FRAG = (SSC_LOW
      ? "precision mediump float;"
      : "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif") + `
uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#define u_seed u_transform.x
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
float hash21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
float grainHash(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(17.0,9.2);a*=0.5;}return v;}
vec3 palette(float x){float n=max(u_colorCount-1.0,1.0);float f=clamp(x,0.0,1.0)*n;vec3 col=u_colors[0];for(int i=0;i<7;i++){if(float(i)<n){float t=smoothstep(0.0,1.0,clamp(f-float(i),0.0,1.0));col=mix(col,u_colors[i+1],t);}}return col;}
vec3 hueRotate(vec3 col,float a){const mat3 toYIQ=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);const mat3 toRGB=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);vec3 yiq=toYIQ*col;float ca=cos(a),sa=sin(a);yiq=vec3(yiq.x,yiq.y*ca-yiq.z*sa,yiq.y*sa+yiq.z*ca);return toRGB*yiq;}
vec3 shade(vec2 uv,vec2 p,float t){float k=2.0+u_intensity*6.0;float v=sin(p.x*k+t)+sin(p.y*k*0.8-t*0.7)+sin((p.x+p.y)*k*0.6+t*0.5)+sin(length(p)*k*1.2-t);return palette(0.5+0.5*sin(v+u_seed));}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution.xy;
  vec2 screenUv=uv;
  vec2 p=(gl_FragCoord.xy-0.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
  vec2 cursor=(0.5*u_mouse*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
  p+=cursor*u_cursorPresence*0.3;
  uv=p*min(u_resolution.x,u_resolution.y)/u_resolution.xy+0.5;
  p*=u_scale;
  if(abs(u_rotate)>0.0001){float cr=cos(u_rotate),sr=sin(u_rotate);p=mat2(cr,-sr,sr,cr)*p;}
  p+=u_offset;
  if(u_drift>0.0001)p+=u_drift*vec2(sin(u_time*0.31),cos(u_time*0.23));
  if(u_warp>0.0){p+=u_warp*(vec2(fbm(p*u_detail+u_seed),fbm(p*u_detail+vec2(5.2,1.3)))-0.5);}
  vec3 col;
  if(u_blur>0.0){float e=u_blur;float pe=e*u_scale;vec2 uvE=vec2(e)*min(u_resolution.x,u_resolution.y)/u_resolution.xy;col=shade(uv,p,u_time)*0.36;col+=shade(uv+vec2(uvE.x,0),p+vec2(pe,0),u_time)*0.16;col+=shade(uv-vec2(uvE.x,0),p-vec2(pe,0),u_time)*0.16;col+=shade(uv+vec2(0,uvE.y),p+vec2(0,pe),u_time)*0.16;col+=shade(uv-vec2(0,uvE.y),p-vec2(0,pe),u_time)*0.16;}
  else{col=shade(uv,p,u_time);}
  if(abs(u_contrast-1.0)>0.0001)col=(col-0.5)*u_contrast+0.5;
  if(abs(u_saturation-1.0)>0.0001){float luma=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(luma),col,u_saturation);}
  if(abs(u_hue)>0.0001)col=hueRotate(col,u_hue);
  if(abs(u_brightness)>0.0001)col+=u_brightness;
  if(u_vignette>0.0001){float vd=length(screenUv-0.5)*1.41421356;col*=1.0-u_vignette*smoothstep(0.35,1.0,vd);}
  if(u_grain>0.0001)col+=(grainHash(gl_FragCoord.xy+vec2(u_seed*17.0,u_seed*31.0))-0.5)*u_grain;
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

    const U = {
      colors: [[0.22,0.06,0.02],[0.62,0.14,0.04],[0.84,0.36,0.08],[0.95,0.72,0.42],[0.95,0.72,0.42],[0.95,0.72,0.42],[0.95,0.72,0.42],[0.95,0.72,0.42]],
      colorCount: 4, scale: 1.5, intensity: 0.48, warp: 0.0,
      detail: 2.4, contrast: 0.88, brightness: -0.18, saturation: 1.1,
      hue: 0.0, vignette: 0.42, blur: 0.016, grain: 0.25,
      seed: 7.0, rotate: 0.0, offsetX: 0.0, offsetY: 0.0, drift: 0.1,
      cursorEffect: 4.0, cursorStrength: 0.65, cursorRadius: 0.297,
      timeScale: 0.4
    };

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uni = {};
    ["colors","scene","shape","surface","finish","transform","space","cursor"].forEach(n => {
      uni[n] = gl.getUniformLocation(prog, "u_" + n);
    });

    gl.uniform3fv(uni.colors, new Float32Array(U.colors.flat()));
    gl.uniform4f(uni.shape, U.scale, U.intensity, 0.5, U.warp);
    gl.uniform4f(uni.surface, U.detail, U.contrast, U.brightness, U.saturation);
    gl.uniform4f(uni.finish, U.hue, U.vignette, U.blur, U.grain);
    gl.uniform4f(uni.transform, U.seed, U.rotate, U.drift, 0.0);
    gl.uniform4f(uni.cursor, 0, U.cursorEffect, U.cursorStrength, U.cursorRadius);

    let W, H;
    const isMobileFX = window.matchMedia('(max-width:768px)').matches;
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isMobileFX) {
      U.blur = 0.0;
      gl.uniform4f(uni.finish, U.hue, U.vignette, U.blur, U.grain);
    }

    // Android mid-range GPUs struggle with heavy fragment shaders. Start Android at 55% scale.
    let resolutionScale = isAndroid ? 0.55 : 1.0;

    const resize = (scaleFactor = 1.0) => {
      let dpr = Math.min(window.devicePixelRatio || 1, isMobileFX ? 1.5 : 2);
      if (isMobileFX) dpr *= 0.75; // lower internal resolution on phones (~44% fewer fragments, imperceptible on a 6" screen)
      if (SSC_LOW) dpr *= 0.8; // extra reduction for low-power devices
      dpr *= scaleFactor; // Apply dynamic quality scaling
      W = canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      H = canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, W, H);
    };
    resize(resolutionScale);
    window.addEventListener("resize", () => resize(resolutionScale));

    const start = performance.now();
    let _lastFrame = 0;
    const _targetDt = SSC_LOW ? (1000 / 30) : 0;

    let frameTimes = [];
    let performanceCheckDone = false;

    function render(now) {
      if (window.SSC_FX_PAUSED) { requestAnimationFrame(render); return; }
      if (SSC_REDUCED) {
        if (!render._drawn) {
          render._drawn = true;
          const t = ((now - start) / 1000) * U.timeScale;
          gl.uniform4f(uni.scene, W, H, t, U.colorCount);
          gl.uniform4f(uni.space, U.offsetX, U.offsetY, 0, 0);
          gl.uniform4f(uni.cursor, 0, U.cursorEffect, U.cursorStrength, U.cursorRadius);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        return;
      }

      // Live FPS Performance profiling over the first 30 frames (unthrottled to measure raw GPU speed)
      // Immediate quality reduction on confirmed low-power devices (no benchmark delay)
      if (SSC_LOW) {
        resolutionScale *= 0.6;
        resize(resolutionScale);
      }
      performanceCheckDone = true;

      // Apply the 30fps battery-saving throttle ONLY after the benchmark completes
      if (performanceCheckDone) {
        if (_targetDt && now - _lastFrame < _targetDt) { requestAnimationFrame(render); return; }
      }

      _lastFrame = now;
      const t = ((now - start) / 1000) * U.timeScale;
      gl.uniform4f(uni.scene, W, H, t, U.colorCount);
      gl.uniform4f(uni.space, U.offsetX, U.offsetY, 0, 0);
      gl.uniform4f(uni.cursor, 0, U.cursorEffect, U.cursorStrength, U.cursorRadius);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  })();

  
