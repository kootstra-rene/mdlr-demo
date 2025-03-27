mdlr('[web]webgl-instancing', m => {

  const { MersenneTwister } = m.require('random:mt19937');
  const { mat4 } = m.require('webgl2:matrix');
  const utils = m.require('webgl2:utils');

  const shaders = {
    vertex: `#version 300 es
      #pragma vscode_glsllint_stage: vert

      precision highp float;
      precision highp int;
      
      layout(location=0) in vec3 base;
      layout(location=1) in vec3 norm;
      layout(location=2) in ivec2 bits;

      flat out ivec2 atlas_image_coord;
      out vec2 atlas_image_size;
      out vec4 color;

      uniform highp sampler2D sampler;
      uniform highp sampler2D sampler2;
      uniform highp mat4 model_matrix;
      uniform highp mat4 camera_matrix;
      uniform highp mat4 projection_matrix;
      
      void main() {
        float x = float((bits.x >> 0u) & 31);
        float y = float((bits.x >> 5u) & 31);
        float z = float((bits.x >> 10u) & 31);
        float xs = float((bits.x >> 15u) & 31);
        float ys = float((bits.x >> 20u) & 31);
        uint chunkId = uint(bits.y >> 11u) & 31u;
        uint textureId = uint(bits.y >> 0u) & 2047u;

        vec3 size = vec3(base.xy * vec2(xs,ys), 0.0);

        atlas_image_coord = 16 * ivec2((textureId >> 0) & 63u, (textureId >> 6) & 31u);
        atlas_image_size = 16.0 * size.xy;

        vec3 pos = vec3(base.xy * vec2(xs,ys), 0.0);
        switch (int(base.z)) {
          case 0: color = vec4(1.0, 0.0, 0.0, 1.00); pos.z++; pos.zyx = pos.xyz; break;
          case 1: color = vec4(1.0, 0.0, 0.0, 0.50); pos.zyx = pos.xyz; break;
          case 2: color = vec4(0.0, 0.0, 1.0, 1.00); pos.z++; pos.xzy = pos.xyz; break;
          case 3: color = vec4(0.0, 0.0, 1.0, 0.50); pos.xzy = pos.xyz; break;
          case 4: color = vec4(0.0, 1.0, 0.0, 1.00); pos.z++; pos.xyz = pos.xyz; break;
          case 5: color = vec4(0.0, 1.0, 0.0, 0.50); pos.xyz = pos.xyz; break;
        }

        vec3 center = vec3(1.5, 1.5, 1.5); // center of object
        vec4 offset = texelFetch(sampler2, ivec2(chunkId, 0), 0);
        pos += round((offset.xyz * 256.0 - center) * 32.0);
        pos += vec3(x, y, z);

        gl_Position = projection_matrix * camera_matrix * model_matrix * vec4(pos, 1.0);
      }`,

    fragment: `#version 300 es
      #pragma vscode_glsllint_stage: frag

      precision highp float;
      precision highp int;

      uniform highp sampler2D sampler;

      flat in ivec2 atlas_image_coord;
      in vec2 atlas_image_size;

      in vec4 color;
      out vec4 frag_color;

      void main() {
        frag_color = texelFetch(sampler, ivec2(atlas_image_coord + ivec2(atlas_image_size) % 16), 0);
        if (frag_color.a < 0.1) discard;
        frag_color.rgba *= color.rgba;
      }`
  }

  m.html`
    <canvas{} height="4096" width="4096"/>
    <span>{time.toFixed(3)}ms</span>
    <span>{voxels}/{triangles}</span>
  `;

  m.style`
    display: block;
    height: 100%;
    background-color: #444;

    > canvas {
      height: 100%;
      width: 100%;
    }
    
    >span {
      position:absolute;
      bottom: 0;
      right: 0;
      z-index: 100;
      height: 24px;
      line-height: 24px;
      font-family: sans-serif;
      font-size: 24px;
      font-weight: 700;
      -webkit-text-fill-color: white;
      -webkit-text-stroke: 1px red;
    }

    >span:last-child {
      right: unset;
      left: 0;
    }
  `;

  const loadImage = () => new Promise(resolve => {
    const image = new Image();
    image.src = '/docs/res/atlas.png';
    image.addEventListener('load', () => resolve(image));
  });

  return class {
    canvas;
    gl;
    time;
    voxels;
    triangles;

    async connected() {
      const gl = this.gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: false,
        premultipliedAlpha: false,
        depth: true,
        stencil: false,
      });

      const image = await loadImage();

      const program = utils.compile({ gl, ...shaders });
      gl.useProgram(program);
      gl.uniform1i(gl.getUniformLocation(program, "sampler"), 0);
      gl.uniform1i(gl.getUniformLocation(program, "sampler2"), 1);

      //    6         5         4         3         2         1         0
      // 3210987654321098 7654321098765432 1098765432109876 5432109876543210
      //                  iiiiittttttttttt        YYYYYXXXX Xzzzzzyyyyyxxxxx

      const packLo = (x, y, z, xs = 1, ys = 1) => (
        (((x >>> 0) & 31) << 0) +
        (((y >>> 0) & 31) << 5) +
        (((z >>> 0) & 31) << 10) +
        (((xs >>> 0) & 31) << 15) +
        (((ys >>> 0) & 31) << 20)
      ) >>> 0;

      const packHi = (t, i = -1) => (
        (((t >>> 0) & 2047) << 0) +
        (((i >>> 0) & 31) << 11)
      ) >>> 0;

      const modelData = new Uint8Array([
        // position,face,normal, todo: center??

        // y+
        0, 0, 0, 0, +1, 0,
        0, 1, 0, 0, +1, 0,
        1, 0, 0, 0, +1, 0,
        1, 1, 0, 0, +1, 0,

        // y-
        0, 0, 1, 0, -1, 0,
        0, 1, 1, 0, -1, 0,
        1, 0, 1, 0, -1, 0,
        1, 1, 1, 0, -1, 0,

        // x+
        0, 0, 2, +1, 0, 0,
        0, 1, 2, +1, 0, 0,
        1, 0, 2, +1, 0, 0,
        1, 1, 2, +1, 0, 0,

        // x-
        0, 0, 3, -1, 0, 0,
        0, 1, 3, -1, 0, 0,
        1, 0, 3, -1, 0, 0,
        1, 1, 3, -1, 0, 0,

        // z+
        0, 0, 4, 0, 0, +1,
        0, 1, 4, 0, 0, +1,
        1, 0, 4, 0, 0, +1,
        1, 1, 4, 0, 0, +1,

        // z-
        0, 0, 5, 0, 0, -1,
        0, 1, 5, 0, 0, -1,
        1, 0, 5, 0, 0, -1,
        1, 1, 5, 0, 0, -1,
      ]);

      gl.activeTexture(gl.TEXTURE0);
      const texture = utils.createTexture({ gl, width: 1024, height: 512 });
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.activeTexture(gl.TEXTURE1);
      const worldOffset = utils.createTexture({ gl, width: 27, height: 1 });
      gl.bindTexture(gl.TEXTURE_2D, worldOffset);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 27, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x01, 0x00,
        0x00, 0x00, 0x02, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00,
        0x01, 0x00, 0x02, 0x00,
        0x02, 0x00, 0x00, 0x00,
        0x02, 0x00, 0x01, 0x00,
        0x02, 0x00, 0x02, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x00, 0x01, 0x01, 0x00,
        0x00, 0x01, 0x02, 0x00,
        0x01, 0x01, 0x00, 0x00,
        0x01, 0x01, 0x01, 0x00,
        0x01, 0x01, 0x02, 0x00,
        0x02, 0x01, 0x00, 0x00,
        0x02, 0x01, 0x01, 0x00,
        0x02, 0x01, 0x02, 0x00,
        0x00, 0x02, 0x00, 0x00,
        0x00, 0x02, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x00,
        0x01, 0x02, 0x00, 0x00,
        0x01, 0x02, 0x01, 0x00,
        0x01, 0x02, 0x02, 0x00,
        0x02, 0x02, 0x00, 0x00,
        0x02, 0x02, 0x01, 0x00,
        0x02, 0x02, 0x02, 0x00,
      ]));

      const vao = utils.createVertexArray({
        gl, init: (gl) => {
          const modelBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.DYNAMIC_COPY);

          gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, false, 6, 0);
          gl.vertexAttribPointer(1, 3, gl.BYTE, false, 6, 3);
          gl.enableVertexAttribArray(0);
          gl.enableVertexAttribArray(1);

          const transformBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);

          gl.vertexAttribIPointer(2, 2, gl.INT, 8, 0);
          gl.vertexAttribDivisor(2, 1);
          gl.enableVertexAttribArray(2);
        }
      });

      // const VOXELS = 2*32;
      const VOXELS = 27 * 32 * 32 * 32;
      // const VOXELS = 256 * 256;
      // const VOXELS = 200_000;
      const transformData = new Uint32Array(VOXELS * 2);
      console.log(`${VOXELS} =>`, transformData.buffer.byteLength);

      this.voxels = VOXELS;
      this.triangles = VOXELS * 2 * 6 * 2;
      const mt = new MersenneTwister();

      const model_matrix = gl.getUniformLocation(program, "model_matrix");
      const camera_matrix = gl.getUniformLocation(program, "camera_matrix");
      const projection_matrix = gl.getUniformLocation(program, "projection_matrix");

      // gl.enable(gl.CULL_FACE);
      // gl.cullFace(gl.FRONT);
      // gl.enable(gl.BLEND);
      // gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
      // gl.blendFunc(gl.ONE_MINUS_SRC_COLOR, gl.ONE_MINUS_DST_COLOR);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);

      // setup projection
      const projection = mat4.create();
      const fieldOfView = (45 * Math.PI) / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.1;
      const zFar = 1000.0;
      mat4.perspective(projection, fieldOfView, aspect, zNear, zFar);

      // setup camera
      const camera = mat4.create();
      mat4.lookAt(camera, [0.65, 0.65, .65], [0, 0, 0], [0, 0, 1]);

      // setup model
      const model = mat4.create();
      mat4.translate(model, model, [-5, -5, -5]);
      mat4.scale(model, model, [1 / 32, 1 / 32, 1 / 32]);

      console.log('#triangles:', transformData.length * 2 * 6);

      for (let i = 0, l = transformData.length; i < l; i += 2) {
        transformData[i + 0] = packLo((i >>> 1) & 31, (i >>> 6) & 31, (i >>> 11) & 31, 1, 1);
        transformData[i + 1] = packHi(mt.randomInt32() >>> 21, i >>> 16);
      }
      gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.STREAM_DRAW);

      this.drawScene = () => {
        gl.bindVertexArray(vao);

        mat4.rotate(model, model, 0.01, [0, 0, 1]);

        gl.uniformMatrix4fv(model_matrix, false, model);
        gl.uniformMatrix4fv(camera_matrix, false, camera);
        gl.uniformMatrix4fv(projection_matrix, false, projection);

        for (let face = 0; face < 6; ++face) {
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, face * 4, 4, VOXELS);
          // gl.drawArraysInstanced(gl.LINE_STRIP, face * 4, 4, VOXELS);
        }

        gl.bindVertexArray(null);
      }
    }

    beforeRender() {
      const stamp = performance.now();
      this.drawScene?.();
      this.time = performance.now() - stamp;
    }
  }

})