mdlr('[web]snippets:demo-app', m => {

  const [L1, L2, L3] = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.'
  ];

  m.require('[web]snippets:m-accordion');
  m.require('[web]snippets:m-marquee');

  /**
    <m-marquee>
      {#each text,i in banners}
        <span slot={i}>{text}</span>
      {/each}
    </m-marquee>
   8*/
  m.html`
    <shader-art{art} autoplay />

    <div>
      <m-accordion{=} />
      <m-accordion{=} .multiple={true}/>
    </div>
  `;

  m.style`
    padding: 8px;
    display: block;
    -webkit-tap-highlight-color: transparent;
    position: absolute;
    inset: 0;
    overflow: hidden auto;

    &:before {
      content: '';
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      opacity: 0.75;
      background-position: right;
    }

    > div {
      display: flex;
      gap: 8px;
    }

    > shader-art {
      display: block;
      position: absolute;
      inset: 0;
      opacity: 0.5;
    }

    shader-art canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  // theming
  m.global`
    body {
      background-color: #202028;
    }

    m-marquee {
      height: 80px;
      position: absolute;
      bottom: 8px;
      width: 90%;
      margin: 0 5%;

      > div {
        display: grid;
        justify-content: center;
        align-content: center;
        border-radius: 6px;
        filter: sepia(1);

        > [slot] {
          color: #fa9a34;
          font-size: 2rem;
        }
      }
    }

    m-accordion {
      gap: 4px;

      > m-dialog {
        font-family: sans-serif;

        position: relative;
        background: transparent;
        backdrop-filter: blur(4px);
        color: white;

        cursor: pointer;
        padding: 0.5rem;
        gap: 0;

        transition: 150ms;
        transition-property: gap, grid-template-rows;

        border-radius: 0.25rem;
        box-shadow: 2px 2px 5px #0008;

        > :first-child {
          height: 1.6rem;
          line-height: 1.5rem;
          font-weight: 500;
        }

        > :last-child {
          font-weight: 100;
          font-size: 0.95rem;
          line-height: 1rem;
          white-space: pre-wrap;
          text-align: justify;
          cursor: default;
        }

        &[open] {
          gap: 4px;

          > :first-child {
            border-bottom: 1px solid #fa9a34;
          }
        }
      }

      > m-dialog:before {
        content: '';

        position: absolute;
        inset: 0;
        z-index: -1;

        border-radius: 0.25rem;
        border: 1px solid #556;
        background-color: #2a2f3d;

        opacity: 0.75;
      }
    }
  `;

  const initShaderArt = () => {
    var h = class { constructor() { this._startTime = NaN; this._totalElapsed = 0; this._running = !1 } start() { return this._startTime = performance.now(), this._running = !0, this } stop() { return this._running && (this._running = !1, this._totalElapsed += performance.now() - this._startTime), this } reset() { return this._totalElapsed = 0, this._startTime = this._running ? performance.now() : NaN, this } get running() { return this._running } get elapsedTime() { return this._running ? this._totalElapsed + performance.now() - this._startTime : this._totalElapsed } }; var p = s => ({ media: s, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { }, matches: !1, onchange: null }), m = s => ("onchange" in s || (s.onchange = null, s.addEventListener = (f, e) => { s.addListener(e == null ? void 0 : e.bind(s)) }, s.removeEventListener = (f, e) => { s.removeListener(e == null ? void 0 : e.bind(s)) }), s); function v(s) { return typeof window != "undefined" && "matchMedia" in window && m(window.matchMedia(s)) || p(s) } function l() { return v("(prefers-reduced-motion: reduce)") } var g = "precision highp float;", b = g + "attribute vec4 position;void main(){gl_Position=position;}", w = g + "void main(){gl_FragColor=vec4(1.,0,0,1.);}", d = class extends HTMLElement { constructor() { super(); this.buffers = {}; this.canvas = null; this.initialized = !1; this.gl = null; this.program = null; this.frame = -1; this.count = 0; this.fragShader = null; this.vertShader = null; this.activePlugins = []; this.prefersReducedMotion = l(), this.onResize = this.onResize.bind(this), this.renderLoop = this.renderLoop.bind(this), this.onChangeReducedMotion = this.onChangeReducedMotion.bind(this), this.frame = -1, this.watch = new h } static register(e = []) { d.plugins = e, typeof customElements.get("shader-art") == "undefined" && customElements.define("shader-art", d) } static get observedAttributes() { return ["play-state", "autoplay"] } connectedCallback() { this.gl || this.setup() } disconnectedCallback() { this.dispose() } attributeChangedCallback(e) { e === "play-state" && this.gl && this._updatePlaystate(), e === "autoplay" && this.gl && (this.playState = "running") } get fragCode() { let e = this.querySelector('[type="text/frag"], [type=frag]'); return ((e == null ? void 0 : e.textContent) || w).trim() } get vertCode() { let e = this.querySelector('[type="text/vert"], [type=vert]'); return ((e == null ? void 0 : e.textContent) || b).trim() } get webgl2() { return this.fragCode.includes("#version 300 es") } get devicePixelRatio() { return Math.min(parseFloat(this.getAttribute("dpr") || "1"), window.devicePixelRatio) } set playState(e) { this.setAttribute("play-state", e) } get playState() { return this.getAttribute("play-state") === "stopped" ? "stopped" : "running" } set autoPlay(e) { e ? this.setAttribute("autoplay", "") : this.removeAttribute("autoplay") } get autoPlay() { return this.hasAttribute("autoplay") } _updatePlaystate() { let { prefersReducedMotion: e } = this; if ((this.playState === "stopped" || e.matches) && this.frame > -1) { let t = this.frame; this.frame = -1, cancelAnimationFrame(t), this.watch.stop() } this.playState === "running" && e.matches === !1 && this.frame === -1 && (this.frame = requestAnimationFrame(this.renderLoop), this.watch.start()) } onResize() { let { canvas: e, gl: t, program: i } = this, r = this.clientWidth, n = this.clientHeight, a = this.devicePixelRatio; if (e && t && i) { e.width = r * a, e.height = n * a, t.viewport(0, 0, t.drawingBufferWidth, t.drawingBufferHeight); let o = t.getUniformLocation(i, "resolution"); t.uniform2fv(o, [t.drawingBufferWidth, t.drawingBufferHeight]), this.render() } } onChangeReducedMotion() { this._updatePlaystate() } createShader(e, t) { let { gl: i } = this; if (!i) return null; let r = i.createShader(e); if (!r) return null; if (i.shaderSource(r, t), i.compileShader(r), !i.getShaderParameter(r, i.COMPILE_STATUS)) throw i.getShaderInfoLog(r); return r } addBuffer(e, t, i) { let { gl: r, program: n } = this; if (!r || !n) throw Error("addBuffer failed: gl context not initialized."); let a = r.createBuffer(); if (!a) throw Error("gl.createBuffer failed."); r.bindBuffer(r.ARRAY_BUFFER, a), r.bufferData(r.ARRAY_BUFFER, i, r.STATIC_DRAW); let o = r.getAttribLocation(n, e); this.buffers[e] = { buffer: a, data: i, attribLoc: o, recordSize: t }, r.enableVertexAttribArray(o), r.bindBuffer(r.ARRAY_BUFFER, a), r.vertexAttribPointer(o, t, r.FLOAT, !1, 0, 0) } createBuffers() { let e = [...this.querySelectorAll('[type="text/buffer"], [type=buffer]')]; this.buffers = {}; let t = -1; e.forEach(i => { let r = i.getAttribute("id") || i.getAttribute("name") || "position", n = parseInt(i.getAttribute("data-size") || "1", 10) || 1, a = new Float32Array(JSON.parse((i.textContent || "").trim())); t = Math.max(t, a.length / n | 0), this.addBuffer(r, n, a) }), typeof this.buffers.position == "undefined" && (this.addBuffer("position", 2, new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, 1, 1, -1, 1])), t = 6), this.count = t } render() { let { gl: e, program: t, watch: i, initialized: r, canvas: n } = this; if (!e || !t || !r || !n) return; let a = e.getUniformLocation(t, "time"), o = i.elapsedTime * .001; for (let c of this.activePlugins) c.onFrame && c.onFrame(this, e, t, n); e.uniform1f(a, o), e.drawArrays(e.TRIANGLES, 0, this.count) } renderLoop() { this.render(), this.frame = requestAnimationFrame(this.renderLoop) } createPrograms() { let { gl: e } = this; if (!e) throw Error("render failed: gl context not initialized."); let t = { fragmentShader: this.fragCode, vertexShader: this.vertCode }; for (let r of this.activePlugins) r.onBeforeCompileShader && r.onBeforeCompileShader(t); let i = e.createProgram(); if (!i) throw Error("createProgram failed."); if (this.program = i, this.fragShader = this.createShader(e.FRAGMENT_SHADER, t.fragmentShader), this.vertShader = this.createShader(e.VERTEX_SHADER, t.vertexShader), !this.fragShader || !this.vertShader) throw Error("createShader failed."); if (e.attachShader(i, this.fragShader), e.attachShader(i, this.vertShader), e.linkProgram(i), !e.getProgramParameter(i, e.LINK_STATUS)) throw e.getProgramInfoLog(i); e.useProgram(i) } setup() { if (this.gl && !this.gl.isContextLost()) return; let e = document.createElement("canvas"); if (e.style.width = "100%", e.style.height = "100%", e.style.display = "block", this.canvas = e, this.appendChild(this.canvas), this.webgl2 ? this.gl = this.canvas.getContext("webgl2") : this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl"), !this.gl) throw new Error("WebGL not supported"); this.activatePlugins(), this.createPrograms(), this.createBuffers(), this.prefersReducedMotion = l(), this.setupActivePlugins().then(() => { this.initialized = !0, this.onResize() }), this.addEventListeners(), this.autoPlay && (this.playState = "running") } addEventListeners() { var e; window.addEventListener("resize", this.onResize, !1), (e = this.prefersReducedMotion) == null || e.addEventListener("change", this.onChangeReducedMotion, !1) } deactivatePlugins() { for (let e of this.activePlugins) e.dispose() } activatePlugins() { for (let e of d.plugins) { let t = e(); this.activePlugins.find(i => i.name === t.name) || this.activePlugins.push(t) } } setupActivePlugins() { return new Promise((e, t) => { if (!this.gl || !this.program || !this.canvas) { t(Error("WebGL not initialized")); return } let i = []; for (let r of this.activePlugins) { let n = r.setup(this, this.gl, this.program, this.canvas); n instanceof Promise && i.push(n) } Promise.all(i).then(() => { e() }).catch(r => { t(r) }) }) } reinitialize() { this.deactivatePlugins(), this.deleteProgramAndBuffers(), this.createPrograms(), this.createBuffers(), this.activatePlugins(), this.onResize() } deleteProgramAndBuffers() { if (!this.gl) throw Error("no gl context initialized"); Object.entries(this.buffers).forEach(([e, t]) => { this.gl && this.gl.deleteBuffer(t.buffer) }), this.gl.deleteProgram(this.program) } dispose() { if (this.frame > -1 && cancelAnimationFrame(this.frame), this.frame = -1, this.initialized = !1, this.prefersReducedMotion && this.prefersReducedMotion.removeEventListener("change", this.onChangeReducedMotion, !1), this.watch.reset(), this.deactivatePlugins(), window.removeEventListener("resize", this.onResize, !1), this.deleteProgramAndBuffers(), this.gl) { let e = this.gl.getExtension("WEBGL_lose_context"); e && typeof e.loseContext == "function" && e.loseContext(), this.gl = null } this.canvas && (this.removeChild(this.canvas), this.canvas = null), this.buffers = {} } }, u = d; u.plugins = [];

    return { ShaderArt: u };// {u as ShaderArt,h as Stopwatch,l as prefersReducedMotion};

  }
  return class {
    art;
    banners = [...'MDLR is quite awesome... '];
    sections = [
      { caption: 'section #1', body: [L3, L2].join('\n\n') },
      { caption: 'section #2', body: [L2].join('\n\n') },
      { caption: 'section #3', body: [L1, L2, L3].join('\n\n') },
    ]

    connected() {
      const { ShaderArt } = initShaderArt();

      this.art.innerHTML = `
        <script type="buffer" name="position" data-size="2">
          [-1, 1, -1,-1, 1,1, 1, 1, -1,-1, 1,-1]
        </script>
        <script type="buffer" name="uv" data-size="2">
          [ 0, 0,  0, 1, 1,0, 1, 0,  0, 1, 1, 1]
        </script>
        <script type="vert">
          #version 300 es
          
          precision highp float;
          in vec4 position;
          in vec2 uv;
          out vec2 vUv;
          out vec4 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = position;
          }
        </script>
        <script type="frag">
          #version 300 es
          
          precision highp float;
          in vec2 vUv;
          in vec4 vPosition;
          out vec4 fragColor;
          uniform vec2 resolution;
          uniform float time;
          uniform sampler2D charset;
          uniform sampler2D message;
          
          #define AA 1e-3
          #define PI 3.141592654
          #define DEG PI / 180.

          vec2 rotate(vec2 p, float a) {
            return vec2(p.x * cos(a) - p.y * sin(a),
                    p.x * sin(a) + p.y * cos(a));
          }
            
          float noise(vec2 p) {
            float n = .5 + .5 * (
              sin(p.x * .5 + cos(p.y * 4. + .2 * cos(p.x * 2. + time * .5) + time * .3) + time * .4) * 
              cos(p.y * .7 + sin(p.x * 3. + .3 * cos(p.y * 2. + time * .6) + time * .4) + time * .7)
            );
            return n;
          }
          
          
          vec3 background() {
            vec2 p0 = vPosition.xy;
            float aspectRatio = resolution.x / resolution.y;
            p0.x *= aspectRatio;
            vec2 p = rotate(p0.xy * .8, time * .05);
            
            float n = (noise(p) + noise(p * 2.) + noise(p * 5.)) / 3.;
            
            n = n * sin(n * n * 23. + time * .2);
            n = clamp(smoothstep(.3, .35, n) - smoothstep(.4, .45, n), 0., 1.);
            return vec3(.98, .60, .20) * n;
          }
          
          void main() {
            fragColor = vec4(background(),1);
          }
        </script>`;
  
        ShaderArt.register();

    }
  }

})