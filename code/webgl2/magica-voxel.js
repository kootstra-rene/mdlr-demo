mdlr('[web]webgl-magica-voxel', m => {

  const { loader: vox_loader } = m.require('voxels:loader');
  const { mat3, mat4, vec3 } = m.require('webgl2:matrix');
  const utils = m.require('webgl2:utils');

  const shaders = {
    vertex: `#version 300 es
      #pragma vscode_glsllint_stage: vert

      precision highp float;
      precision highp int;
      
      layout(location=0) in vec3 base;
      layout(location=1) in vec3 norm;
      layout(location=2) in ivec3 bits;

      flat out ivec2 atlas_image_base;
      out vec4 frag_pos;
      out vec4 ambient;
      out vec4 normal;

      uniform vec3 center;

      uniform sampler2D world_offset;
      uniform mat4 model_matrix;
      uniform mat4 camera_matrix;
      uniform mat4 projection_matrix;
      uniform vec4 ambient_light;

      void main() {
        normal = vec4(norm, 1.0);
        ambient = vec4(ambient_light.rgb * ambient_light.a, 1.0);

        float x = float((bits.x >> 0u) & 31);
        float y = float((bits.x >> 5u) & 31);
        float z = float((bits.x >> 10u) & 31);
        float xs = float((bits.y >> 0u) & 31);
        float ys = float((bits.y >> 5u) & 31);
        uint chunkId = uint(bits.y >> 10u) & 63u;
        chunkId += (uint(bits.z >> 11u) & 31u) << 6;
        uint textureId = uint(bits.z >> 0u) & 255u;

        atlas_image_base = ivec2(textureId, 0);

        // base position z is gravity direction
        vec3 pos = vec3(base.xy * vec2(xs,ys), 0.0);
        switch (int(base.z)) {
          case 0: pos.z++; pos.xzy = pos.xyz; break;  // y+ (up)
          case 1: pos.xzy = pos.xyz; break;           // y- (down)
          case 2: pos.z++, pos.yzx = pos.xyz; break;  // x+ (right)
          case 3: pos.yzx = pos.xyz; break;           // x- (left)
          case 4: pos.z++; pos.xyz = pos.xyz; break;  // z+ (back)
          case 5: pos.xyz = pos.xyz; break;           // z- (left)
        }
        pos += vec3(x, y, z);
        pos /= 32.0; // chunks are [0..1] coordinate system

        vec4 offset = texelFetch(world_offset, ivec2(chunkId, 0), 0);
        pos += ((offset.xyz * (255.0 + 0.0) - center));

        gl_Position = projection_matrix * camera_matrix * model_matrix * vec4(pos, 1.0);
        frag_pos = model_matrix * vec4(pos, 1.0);
      }`,

    fragment: `#version 300 es
      #pragma vscode_glsllint_stage: frag

      precision highp float;
      precision highp int;

      uniform highp sampler2D sampler;
      uniform vec4 diffuse_light;
      uniform vec4 ambient_light;

      flat in ivec2 atlas_image_base;
      in vec4 ambient;
      in vec4 normal;
      in vec4 frag_pos;

      out vec4 frag_color;

      void main() {
        vec4 norm = normalize(normal);
        vec4 lightDir = normalize(diffuse_light - frag_pos);
        float diff = max(dot(norm, lightDir), 0.0);
        vec4 diffuse = diff * ambient_light;

        vec4 texel = texelFetch(sampler, atlas_image_base, 0);
        frag_color = (ambient + diffuse) * texel;
        // frag_color.a = 1.0;
      }`
  }

  m.html`
    <canvas{} height="4096" width="4096"/>
    <span>{time.toFixed(3)}ms</span>
    <span>{model_triangles} => {drawn_triangles}</span>
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

  //#region normals
  const FACE_NORMALS = [
    vec3.fromValues(0, +1, 0),
    vec3.fromValues(0, -1, 0),
    vec3.fromValues(+1, 0, 0),
    vec3.fromValues(-1, 0, 0),
    vec3.fromValues(0, 0, +1),
    vec3.fromValues(0, 0, -1),
  ];
  const [FACE_NORMAL_UP, FACE_NORMAL_DOWN, FACE_NORMAL_RIGHT, FACE_NORMAL_LEFT, FACE_NORMAL_FAR, FACE_NORMAL_NEAR] = FACE_NORMALS;

  const vertex_buffer_data = new Uint8Array([
    // position,face,normal,  -- only constants

    // y+ (front-face)
    0, 0, 0, ...FACE_NORMAL_UP,
    0, 1, 0, ...FACE_NORMAL_UP,
    1, 0, 0, ...FACE_NORMAL_UP,
    1, 1, 0, ...FACE_NORMAL_UP,

    // y- (back-face)
    0, 0, 1, ...FACE_NORMAL_DOWN,
    1, 0, 1, ...FACE_NORMAL_DOWN,
    0, 1, 1, ...FACE_NORMAL_DOWN,
    1, 1, 1, ...FACE_NORMAL_DOWN,

    // x+ (front-face)
    0, 0, 2, ...FACE_NORMAL_RIGHT,
    1, 0, 2, ...FACE_NORMAL_RIGHT,
    0, 1, 2, ...FACE_NORMAL_RIGHT,
    1, 1, 2, ...FACE_NORMAL_RIGHT,

    // x- (back-face)
    0, 0, 3, ...FACE_NORMAL_LEFT,
    0, 1, 3, ...FACE_NORMAL_LEFT,
    1, 0, 3, ...FACE_NORMAL_LEFT,
    1, 1, 3, ...FACE_NORMAL_LEFT,

    // z+ (back-face)
    0, 0, 4, ...FACE_NORMAL_FAR,
    1, 0, 4, ...FACE_NORMAL_FAR,
    0, 1, 4, ...FACE_NORMAL_FAR,
    1, 1, 4, ...FACE_NORMAL_FAR,

    // z- (front-face)
    0, 0, 5, ...FACE_NORMAL_NEAR,
    0, 1, 5, ...FACE_NORMAL_NEAR,
    1, 0, 5, ...FACE_NORMAL_NEAR,
    1, 1, 5, ...FACE_NORMAL_NEAR,
  ]);
  //#endregion

  const makeVoxelId = (x, y, z) => (x + z * 131072 + y * 131072 * 131072);

  const isFaceVisible = (face, model_matrix, inverse_camera) => {
    const face_normal = vec3.clone(FACE_NORMALS[face]);

    // Normal matrix (3x3 version)
    const normal_matrix = mat3.create();
    if (!mat3.normalFromMat4(normal_matrix, model_matrix)) {
      console.warn("normalFromMat4 failed");
    }

    // Transform the local normal to world space
    const world_normal = vec3.create();
    vec3.transformMat3(world_normal, face_normal, normal_matrix);
    vec3.normalize(world_normal, world_normal);

    const direction = vec3.dot(world_normal, inverse_camera);
    const EPSILON = 0.35; // howto calculate this?
    return (direction < EPSILON);
  }

  const setupVertexArrayObject = (gl) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_BYTE, false, 6, 0);
    gl.vertexAttribPointer(1, 3, gl.BYTE, false, 6, 3);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const instance_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffer);

    gl.vertexAttribIPointer(2, 3, gl.SHORT, 6, 0);
    gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(2);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindVertexArray(null);

    return [vao, vertex_buffer, instance_buffer];
  }

  const rebuild_model = (gl, chunks, VOXELS) => {
    const model_data = [];

    for (let face = 0; face < 6; ++face) {
      const [vao, vertex_buffer, instance_buffer] = setupVertexArrayObject(gl), instance_buffer_data = new Uint16Array(VOXELS * 3);

      // fill vertex_buffer with the face model_matrix data 
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(vertex_buffer_data.buffer, face * 24, 24), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      // fill instance_buffer with the face instance data 
      const instance_buffer_size = rebuild_face_model(face, chunks, instance_buffer_data);
      gl.bindBuffer(gl.ARRAY_BUFFER, instance_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(instance_buffer_data.buffer, 0, instance_buffer_size), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const instance_count = instance_buffer_size / 3;
      model_data.push([vao, instance_count])
    }

    return model_data;
  }

  const rebuild_face_model = (face, chunks, buffer_data) => {
    let index = 0;

    chunks.values().forEach((chunk, n) => {
      chunk.voxels.forEach((voxel) => {
        if (voxel.f & (1 << face)) {
          const { x, y, z, i } = voxel;
          const X = 1;
          const Y = 1;

          buffer_data[index + 0] = (((x >>> 0) & 31) << 0) | (((y >>> 0) & 31) << 5) | (((z >>> 0) & 31) << 10);
          buffer_data[index + 1] = (((X >>> 0) & 31) << 0) | (((Y >>> 0) & 31) << 5) | (((n >>> 0) & 63) << 10);
          buffer_data[index + 2] = (((i >>> 0) & 2047) << 0) | (((n >>> 6) & 31) << 11);
          index += 3;
        }
      })
    })

    return index;
  }

  const get_inverse_camera = (camera_matrix) => {
    // Inverse of view matrix gives you camera's world transform
    const inverse_camera_matrix = mat4.create();
    if (!mat4.invert(inverse_camera_matrix, camera_matrix)) {
      console.warn("Camera matrix not invertible");
    }
    // Camera forward direction in world space is negative Z axis of camera matrix
    const inverse_camera = vec3.fromValues(
      -inverse_camera_matrix[8],
      -inverse_camera_matrix[9],
      -inverse_camera_matrix[10]
    );
    vec3.normalize(inverse_camera, inverse_camera);

    return inverse_camera;
  }

  return class {
    canvas;
    gl;
    time;
    drawn_triangles;
    model_triangles;

    async connected() {
      const gl = this.gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: false,
        premultipliedAlpha: false,
        depth: true,
        stencil: false,
      });

      // const res = await fetch('/docs/res/M1A.vox');
      // const res = await fetch('/docs/res/christmas_scene.vox');
      // const res = await fetch('/docs/res/scene_store11.vox');
      // const res = await fetch('/docs/res/dragon.vox');
      // const res = await fetch('/docs/res/monu0.vox');
      // const res = await fetch('/docs/res/monu1.vox');
      // const res = await fetch('/docs/res/monu7.vox');
      // const res = await fetch('/docs/res/monu8.vox');
      const res = await fetch('/docs/res/monu16.vox');
      // const res = await fetch('/docs/res/haunted_house.vox');
      // const res = await fetch('/docs/res/treehouse.vox');
      // const res = await fetch('/docs/res/phantom_mansion.vox');
      // const res = await fetch('/docs/res/teapot.vox');
      // const res = await fetch('/docs/res/skyscraper_04_000.vox');
      // const res = await fetch('/docs/res/skyscraper_06_000.vox');
      // const res = await fetch('/docs/res/pieta.vox');
      // const res = await fetch('/docs/res/realistic_terrain.vox'); 
      // const res = await fetch('/docs/res/nature.vox');
      // const res = await fetch('/docs/res/rocky-mossy-stairs.vox');
      // const res = await fetch('/docs/res/odyssey_scene.vox');
      // const res = await fetch('/docs/res/red_booth_solid.vox');
      // const res = await fetch('/docs/res/street_scene.vox');
      // const res = await fetch('/docs/res/TallBuilding03.vox');

      const data = await res.arrayBuffer();
      let state = vox_loader(data);
      console.log('state:', state);
      let scene = this.buildScene(state);

      this.makeSceneXYZ(scene);
      console.log('scene:', scene);
      scene = this.makeSceneHollow(scene);
      console.log('hollow:', scene);

      const chunks = this.buildModelChunks(scene);
      console.log('chunks:', chunks);
      // todo: remove invisible voxels from chunks (neighbour count === 6 ?)
      // todo: remove invisible faces from chunks (touching faces of 2 neighbouring visible voxels)

      const { maxX, maxY, maxZ, minX, minY, minZ } = scene;

      const CX = ((maxX - minX) / 32) / 2;
      const CY = ((maxY - minY) / 32) / 2;
      const CZ = ((maxZ - minZ) / 32) / 2;

      const MX = Math.max(CX, CY, CZ);
      console.log(CX, CY, CZ, MX);

      const offsets = chunks.values().reduce((offsets, chunk) => {
        offsets.push(...chunk.offset, 0);
        return offsets;
      }, []);

      const program = utils.compile({ gl, ...shaders });
      gl.useProgram(program);
      gl.uniform1i(gl.getUniformLocation(program, "sampler"), 0);
      gl.uniform1i(gl.getUniformLocation(program, "world_offset"), 1);

      //    6         5         4         3         2         1         0
      // 3210987654321098 7654321098765432 1098765432109876 5432109876543210
      //                  iiiiittttttttttt iiiiiiYYYYYXXXXX  zzzzzyyyyyxxxxx

      gl.activeTexture(gl.TEXTURE0);
      const texture = utils.createTexture({ gl, width: 256, height: 1 });
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(state.pallete.buffer));

      gl.activeTexture(gl.TEXTURE1);
      const worldOffset = utils.createTexture({ gl, width: 1024, height: 1 });
      gl.bindTexture(gl.TEXTURE_2D, worldOffset);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offsets.length >> 2, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(offsets));

      const VOXELS = scene.voxels.length;

      const center_loc = gl.getUniformLocation(program, "center");
      const ambient_loc = gl.getUniformLocation(program, "ambient_light");
      const diffuse_loc = gl.getUniformLocation(program, "diffuse_light");

      const model_matrix_loc = gl.getUniformLocation(program, "model_matrix");
      const camera_matrix_loc = gl.getUniformLocation(program, "camera_matrix");
      const projection_matrix_loc = gl.getUniformLocation(program, "projection_matrix");

      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      const model_data = rebuild_model(gl, chunks, VOXELS);

      { // stats
        console.log('- model:');
        console.log(`  - #voxels:`, state.total_voxels);
        console.log('  - #faces:', state.total_voxels * 6);
        console.log('  - #triangles:', state.total_voxels * 6 * 2);
        console.log('- voxel removal:');
        console.log(`  - #voxels:`, VOXELS);
        console.log('  - #faces:', VOXELS * 6);
        console.log('  - #triangles:', VOXELS * 6 * 2);
        let real_faces = 0;

        for (let face = 0; face < 6; ++face) {
          const [, instance_count] = model_data[face];
          real_faces += instance_count;
        }

        console.log('- face removal:');
        console.log(`  - #voxels:`, VOXELS);
        console.log('  - #face:', real_faces);
        console.log('  - #triangles:', real_faces * 2);
        for (let face = 0; face < 6; ++face) {
          const [, instance_count] = model_data[face];
          console.log(`    - face[${face}]:`, instance_count * 2);
        }
      }

      // setup projection
      const projection = mat4.create();
      const fieldOfView = (45 * Math.PI) / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.1;
      const zFar = 1000.0;
      mat4.perspective(projection, fieldOfView, aspect, zNear, zFar);

      // setup model_matrix
      const model_matrix = mat4.create();

      // setup camera_matrix
      const camera_matrix = mat4.create();
      const eye_pos = vec3.fromValues(CX * 0, CY * 1.5, -MX * 3);
      mat4.lookAt(camera_matrix, eye_pos, [0, 0, 0], [0, 1, 0]);
      gl.uniformMatrix4fv(camera_matrix_loc, false, camera_matrix);
      const inverse_camera = get_inverse_camera(camera_matrix);

      // setup uniforms
      gl.uniform3fv(center_loc, [CX, CY, CZ]);
      gl.uniformMatrix4fv(projection_matrix_loc, false, projection);
      gl.uniform4fv(ambient_loc, [1.0, 1.0, 1.0, 0.2]);
      gl.uniform4fv(diffuse_loc, [0, CY * 2, 0, 1.0]);

      this.drawScene = (now) => {
        // rotate camera
        // mat4.rotate(camera_matrix, camera_matrix, -0.0015, [1, 0, 0]);
        // gl.uniformMatrix4fv(camera_matrix_loc, false, camera_matrix);
        // const inverse_camera = get_inverse_camera(camera_matrix);

        // rotate model
        mat4.rotate(model_matrix, model_matrix, -0.0025, [0, 1, 0]);
        gl.uniformMatrix4fv(model_matrix_loc, false, model_matrix);

        let total_faces = 0;
        for (let face = 0; face < 6; ++face) {
          if (!isFaceVisible(face, model_matrix, inverse_camera)) continue;

          const [vao, instance_count] = model_data[face];
          total_faces += instance_count;

          gl.bindVertexArray(vao);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instance_count);
          // gl.drawArraysInstanced(gl.LINE_STRIP, 0, 4, instance_count);
          gl.bindVertexArray(null);
        }
        // console.log('#triangles:', 2 * total_faces);
        this.drawn_triangles = total_faces * 2;
        this.model_triangles = state.total_voxels * 6 * 2;

      }
    }

    frame = 0;
    // frameTimes = [];
    beforeRender(now) {
      // const {frameTimes} = this;

      // if (((++this.frame) & 1) == 0) return;
      const stamp = performance.now();
      this.drawScene?.(now);
      this.time = performance.now() - stamp;

      // frameTimes.push(stamp);
      // this.frameTimes = frameTimes.slice(-60);
      // console.log('fps:', (1000 / ((frameTimes[59] - frameTimes[0]) / 60)).toFixed(1));
      // return 1000/1;
    }

    buildScene(state, scene = { translate: { x: 0, y: 0, z: 0 } }, nodeId = 0, depth = 0) {
      const nodes = state.nodes;

      const node = (nodes?.get(nodeId)) ?? {
        kind: 'nSHP',
        models: [{ modelId: 0 }]
      };

      // console.log('  '.repeat(depth) + node.kind);

      switch (node.kind) {
        case 'nTRN': {
          const { x, y, z, m } = this.getTranslate(node);
          mat3.transpose(m, m);
          scene.m = m;
          scene.translate.x += x;
          scene.translate.y += y;
          scene.translate.z += z;
          this.buildScene(state, scene, node.childId, depth + 1);
          scene.translate.x -= x;
          scene.translate.y -= y;
          scene.translate.z -= z;
        } break;

        case 'nGRP': {
          for (let childId of node.children) {
            this.buildScene(state, scene, childId, depth + 1);
          }
        } break;

        case 'nSHP': {
          if (node.models.length !== 1) abort();
          const model = state.models[node.models[0].modelId];
          const tr = scene.translate; // todo: should be done after the shape has been build?
          scene.voxels = scene.voxels ?? [];
          for (let bits of model.xyzi) {
            const x = tr.x + ((bits >>> 0) & 255);
            const y = tr.y + ((bits >>> 8) & 255);
            const z = tr.z + ((bits >>> 16) & 255);
            const i = (bits >>> 24) & 255;

            const v = vec3.fromValues(x, y, z);
            // vec3.transformMat3(v, v, scene.m);

            const record = { id: -1, x: v[0], y: v[1], z: v[2], i, f: -1 };
            if (scene.minX === undefined || record.x < scene.minX) scene.minX = record.x;
            if (scene.maxX === undefined || record.x > scene.maxX) scene.maxX = record.x;
            if (scene.minY === undefined || record.y < scene.minY) scene.minY = record.y;
            if (scene.maxY === undefined || record.y > scene.maxY) scene.maxY = record.y;
            if (scene.minZ === undefined || record.z < scene.minZ) scene.minZ = record.z;
            if (scene.maxZ === undefined || record.z > scene.maxZ) scene.maxZ = record.z;
            scene.voxels.push(record);
          }

        } break;

        default: abort();
      }

      return scene;
    }

    makeSceneXYZ(scene) {
      const { minY, maxY, minZ, maxZ } = scene;

      scene.minY = minZ;
      scene.maxY = maxZ;
      scene.minZ = minY;
      scene.maxZ = maxY;

      scene.voxels.forEach(voxel => {
        const { x, y, z } = voxel;

        voxel.id = makeVoxelId(x, z, y);
        voxel.y = z;
        voxel.z = y;
      });
    }

    makeSceneHollow(scene) {
      console.time('occurrences')
      // slow...
      const occurrences = new Set;
      for (const voxel of scene.voxels) {
        occurrences.add(voxel.id);
      }
      console.timeEnd('occurrences')

      console.time('count');
      // .vox has z as the gravity direction, here y s the gravity direction
      scene.voxels.forEach(voxel => {
        const { x, y, z } = voxel;
        voxel.f = 63;
        { // y+ (up)
          const voxelId = makeVoxelId(x, y + 1, z);
          if (occurrences.has(voxelId)) { voxel.f &= ~(1 << 0); }
        }
        { // y- (down)
          const voxelId = makeVoxelId(x, y - 1, z);
          if (occurrences.has(voxelId)) { voxel.f &= ~(1 << 1); }
        }
        { // x+ (right)
          const voxelId = makeVoxelId(x + 1, y, z);
          if (occurrences.has(voxelId)) { voxel.f &= ~(1 << 2); }
        }
        { // x- (left)
          const voxelId = makeVoxelId(x - 1, y, z);
          if (occurrences.has(voxelId)) { voxel.f &= ~(1 << 3); }
        }
        { // z+ (front)
          const voxelId = makeVoxelId(x, y, z + 1);
          if (occurrences.has(voxelId)) { voxel.f &= ~(1 << 4); }
        }
        { // z- (back)
          const voxelId = makeVoxelId(x, y, z - 1);
          if (occurrences.has(voxelId)) { voxel.f &= ~(1 << 5); }
        }
      });
      console.timeEnd('count')

      console.time('filter')
      scene.voxels = scene.voxels.filter(voxel => voxel.f !== 0);
      console.timeEnd('filter')

      return scene;
    }

    buildModelChunks(scene) {
      return scene.voxels.reduce((chunks, voxel) => {
        voxel.x -= scene.minX ?? 0;
        voxel.y -= scene.minY ?? 0;
        voxel.z -= scene.minZ ?? 0;
        const chunkId = (voxel.x >>> 5) + (voxel.y >>> 5) * 256 + (voxel.z >>> 5) * 256 * 256;
        let chunk = chunks.get(chunkId);
        if (!chunk) {
          chunks.set(chunkId, chunk = { chunkId, voxels: [], offset: [(voxel.x >>> 5), (voxel.y >>> 5), (voxel.z >>> 5)] });
        }
        chunk.voxels.push({ x: voxel.x & 31, y: voxel.y & 31, z: voxel.z & 31, i: voxel.i, f: voxel.f });
        return chunks;
      }, new Map);
    }

    getTranslate(node) {
      let [x, y, z] = [0, 0, 0];
      let m = mat3.create();

      if (node.frames.length > 1) abort();

      node.frames[0].forEach(([k, v]) => {
        if (k === '_t') {
          [x, y, z] = v.split(' ').map(a => +a);
        }
        if (k === '_r') {
          this.decodeRotationMatrix(m, +v);
          // console.log('matrix:', v, m);
        }
      });

      return { x, y, z, m };
    }

    decodeRotationMatrix(matrix, encoded) {
      let index1 = (encoded >> 0) & 3;
      let index2 = (encoded >> 2) & 3;
      let sign1 = (encoded >> 4) & 1 ? -1 : 1;
      let sign2 = (encoded >> 5) & 1 ? -1 : 1;
      let sign3 = (encoded >> 6) & 1 ? -1 : 1;

      matrix[0 * 3 + index1] = sign1;
      matrix[1 * 3 + index2] = sign2;
      matrix[2 * 3 + (3 - (index1 + index2))] = sign3;

      return matrix;
    }
  }

})