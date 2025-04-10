mdlr('voxels:loader', m => {

  const abort = () => { throw new Error() }

  const decoder = new TextDecoder;

  const MAIN = 0x4e49414d;
  const PACK = 0x4b434150;
  const SIZE = 0x455a4953;
  const XYZI = 0x495a5958;
  const RGBA = 0x41424752;
  const NOTE = 0x45544f4e;
  const MATL = 0x4c54414d;
  const LAYR = 0x5259414c;
  const nTRN = 0x4e52546e;
  const rCAM = 0x4d414372;
  const rOBJ = 0x4a424f72;
  const nGRP = 0x5052476e;
  const nSHP = 0x5048536e;

  const readDict = (view, offset, dict = []) => {
    const number_of_entries = view.getUint32(offset, true);
    offset += 4;

    for (let i = 0; i < number_of_entries; ++i) {
      const key_length = view.getUint32(offset, true);
      offset += 4;
      const key = decoder.decode(new Uint8Array(view.buffer, offset, key_length))
      offset += key_length;

      const value_length = view.getUint32(offset, true);
      offset += 4;
      const value = decoder.decode(new Uint8Array(view.buffer, offset, value_length))
      offset += value_length;

      dict.push([key, value]);
    }
    return offset;
  }

  const readChunk = (view, offset, state = { models: [], next_offset:0 }) => {
    if (offset >= view.byteLength) return;

    const id = view.getUint32(offset, true);
    const N = view.getUint32(offset + 4, true);
    const M = view.getUint32(offset + 8, true);

    offset += 12;

    const next_offset = state.next_offset = offset + N + M;

    switch (id) {
      case MAIN:
        readChunk(view, offset, state);
        break;

      case PACK:
        const number_of_models = view.getUint32(offset, true);
        console.log('number_of_models:', number_of_models);
        readChunk(view, next_offset, state);
        break;

      case SIZE: {
        const model = {};

        const X = view.getUint32(offset, true);
        const Y = view.getUint32(offset + 4, true);
        const Z = view.getUint32(offset + 8, true);
        model.X = X;
        model.Y = Y;
        model.Z = Z;
        state.models.push(model);

        readChunk(view, next_offset, state);
      } break;

      case XYZI: {
        const model = state.models.at(-1);
        const number_of_voxels = view.getUint32(offset, true);
        offset += 4;
        // console.log('number_of_voxels:', number_of_voxels);
        state.total_voxels = (state.total_voxels ?? 0) + number_of_voxels;
        model.xyzi = new Uint32Array(view.buffer, offset, number_of_voxels);
        offset += number_of_voxels << 2;
        readChunk(view, next_offset, state);
      } break;

      case RGBA:
        state.pallete = new Uint32Array(256);
        for (let i = 0; i < 256; ++i) {
          const rgba = view.getUint32(offset, true);
          state.pallete[(1 + i) & 0xff] = rgba;
          offset += 4;
        }
        readChunk(view, next_offset, state);
        break;

      case LAYR: {
        state.layers = state.layers ?? new Map;

        const dict = [];
        const layerId = view.getUint32(offset, true);
        offset += 4;

        offset = readDict(view, offset, dict);

        state.layers.set(layerId, dict);

        const reserved = view.getUint32(offset, true);
        offset += 4;

        readChunk(view, next_offset, state);
      } break;

      case MATL: {
        state.materials = state.materials ?? new Map;

        const dict = [];
        const materialId = view.getUint32(offset, true);
        offset += 4;

        offset = readDict(view, offset, dict);

        state.materials.set(materialId, dict);

        readChunk(view, next_offset, state);
      } break;

      case rCAM: {
        state.cameras = state.cameras ?? new Map;

        const dict = [];
        const cameraId = view.getUint32(offset, true);
        offset += 4;

        offset = readDict(view, offset, dict);

        state.cameras.set(cameraId, dict);

        readChunk(view, next_offset, state);
      } break;

      case rOBJ: {
        state.objects = state.objects ?? [];

        const dict = [];
        offset = readDict(view, offset, dict);

        state.objects.push(dict);

        readChunk(view, next_offset, state);
      } break;

      case nGRP: {
        const nodeId = view.getUint32(offset, true);
        offset += 4;

        const dict = [];
        offset = readDict(view, offset, dict);

        const number_of_children = view.getUint32(offset, true);
        offset += 4;

        const children = [];
        for (let child = 0; child < number_of_children; ++child) {
          const childId = view.getUint32(offset, true);
          offset += 4;
          children.push(childId);
        }

        const record = { type: nGRP, kind: 'nGRP', nodeId, dict, children };
        state.nodes = state.nodes ?? new Map;
        state.nodes.set(nodeId, record);
      } break;

      case nTRN: {
        const nodeId = view.getUint32(offset, true);
        offset += 4;

        const dict = [];
        offset = readDict(view, offset, dict);

        const childId = view.getUint32(offset, true);
        offset += 4;
        offset += 4; // reserved

        const layerId = view.getInt32(offset, true);
        offset += 4;

        const number_of_frames = view.getUint32(offset, true);
        offset += 4;

        const frames = [];
        for (let frame = 0; frame < number_of_frames; ++frame) {
          const dict = [];
          offset = readDict(view, offset, dict);
          frames.push(dict);
        }

        const record = { type: nTRN, kind: 'nTRN', nodeId, childId, layerId, dict, frames };
        state.nodes = state.nodes ?? new Map;
        state.nodes.set(nodeId, record);
      } break;

      case nSHP: {
        const nodeId = view.getUint32(offset, true);
        offset += 4;

        const dict = [];
        offset = readDict(view, offset, dict);

        const number_of_modules = view.getUint32(offset, true);
        offset += 4;

        const models = [];
        for (let model = 0; model < number_of_modules; ++model) {
          const modelId = view.getUint32(offset, true);
          offset += 4;

          const dict = [];
          offset = readDict(view, offset, dict);
          models.push({ modelId, dict });
        }

        const record = { type: nSHP, kind: 'nSHP', nodeId, dict, models };
        state.nodes = state.nodes ?? new Map;
        state.nodes.set(nodeId, record);

        // readChunk(view, next_offset, state);
      } break;

      default:
        console.log(id.toString(16).padStart(4, '0'));
        console.log(decoder.decode(new Uint8Array(view.buffer, offset, 4)));

        // console.log(new Error, N, M);
        readChunk(view, offset + 12 + N + M, state);
        return;
    }
    return state;
  }

  return {
    loader: (arrayBuffer) => {
      const view = new DataView(arrayBuffer);
      let state = readChunk(view, 8);
      while(state.next_offset < view.byteLength) {
        state = readChunk(view, state.next_offset, state);
      }
      return state;
    }
  }
})

mdlr('[web]voxels:canvas-app', m => {

  const { loader: vox_loader } = m.require('voxels:loader');
  const { loader: rvso_loader, stream_voxels: rvso_stream } = m.require('voxels:loader:rvso');

  const abort = () => { throw new Error() }

  m.html`
    <canvas{cxy} width="{X}" height="{Y}"/>
    <canvas{cxz} width="{X}" height="{Z}"/>
    <canvas{cyz} width="{Y}" height="{Z}"/>
    <canvas{cxyb} width="{X}" height="{Y}"/>
    <canvas{cxzb} width="{X}" height="{Z}"/>
    <canvas{cyzb} width="{Y}" height="{Z}"/>
  `;
  // m.html`
  //   <canvas{}/>
  // `;

  m.style`
    display: grid;
    grid-template-columns: 33.3% 33.4% 33.3%;
    grid-template-rows: 50% 50%;
    justify-items: center;
    align-items: center;
    height: 100%;
    width: 100%;
    background-color: #000;
    overflow: auto;

    canvas {
      image-rendering: pixelated;
      aspect-ratio: 1/1;
      scale: 1 -1;
      width: 100%;
    }
  `;

  return class {
    cxy;
    cxz;
    cyz;
    cxyb;
    cxzb;
    cyzb;
    canvas;

    #canvas;
    #contextXY;
    #contextXZ;
    #contextYZ;
    #contextXYB;
    #contextXZB;
    #contextYZB;
    #state;

    modelIndex = 0;

    connected() {
      window.$state = this;
      this.#canvas = this.canvas?.getContext('2d', { alpha: true });
      this.#contextXY = this.cxy?.getContext('2d', { alpha: true });
      this.#contextXZ = this.cxz?.getContext('2d', { alpha: true });
      this.#contextYZ = this.cyz?.getContext('2d', { alpha: true });
      this.#contextXYB = this.cxyb?.getContext('2d', { alpha: true });
      this.#contextXZB = this.cxzb?.getContext('2d', { alpha: true });
      this.#contextYZB = this.cyzb?.getContext('2d', { alpha: true });

      (async () => {
        if (true) {
          // const res = await fetch('/docs/res/monu5.vox');
          // const res = await fetch('/docs/res/monu8.vox');
          // const res = await fetch('/docs/res/monu9.vox');
          // const res = await fetch('/docs/res/monu10.vox');
          // const res = await fetch('/docs/res/monu16.vox');
          // const res = await fetch('/docs/res/veh_truck7.vox');
          // const res = await fetch('/docs/res/haunted_house.vox');
          // const res = await fetch('/docs/res/odyssey_scene.vox');
          const res = await fetch('/docs/res/TallBuilding03.vox');
          // const res = await fetch('/docs/res/teapot.vox');
          // const res = await fetch('/docs/res/dragon.vox');
          // const res = await fetch('/docs/res/T-Rex.vox');
          // const res = await fetch('/docs/res/street_scene.vox');
          // const res = await fetch('/docs/res/pieta.vox');
          // const res = await fetch('/docs/res/chr_sword.vox');
          // const res = await fetch('/docs/res/nature.vox');
          // const res = await fetch('/docs/res/rocky-mossy-cliff.vox');
          // const res = await fetch('/docs/res/rocky-mossy-stairs.vox');
          // const res = await fetch('/docs/res/rocky-mossy-boulder.vox');
          // const res = await fetch('/docs/res/realistic_terrain.vox');
          // const res = await fetch('/docs/res/M1A.vox');
          // const res = await fetch('/docs/res/DualStriker.vox');
          // const res = await fetch('/docs/res/skyscraper_06_000.vox');

          const data = await res.arrayBuffer();

          this.#state = vox_loader(data);
          console.log('state:', this.#state);
          this.scene = this.buildScene();
          this.buildModelSVO(this.scene);
          this.scene = this.normalizeScene(this.scene);
          console.log('scene', this.scene);
          setTimeout(() => this.beforeRenderOnce(), 250);
        }
        else {
          // const res = await fetch('/docs/res/sibenik_8k.rsvo');
          // const res = await fetch('/docs/res/xyzrgb_statuette_8k.rsvo');
          // const res = await fetch('/docs/res/buddha_16k.rsvo');
          const res = await fetch('/docs/res/xyzrgb_dragon_16k.rsvo');
          const data = await res.arrayBuffer();

          // console.time('loader');
          // this.scene = rvso_loader(data);
          // console.timeEnd('loader');

          console.time('streaming');
          const scene = rvso_stream(data, 13);
          console.timeEnd('streaming');

          this.#sceneAsImage(scene);
        }

      })();
    }

    #sceneAsImage(scene) {
      const voxels = scene.voxels;
      const count = 2 ** scene.level;
      console.log(`dimensions: ${count}x${count}x${count}`);

      this.canvas.setAttribute('height', `${count}`);
      this.canvas.setAttribute('width', `${count}`);

      const MAX = (2 ** 30), MIN = -(2 ** 30);

      let max_x = MIN, max_y = MIN, max_z = MIN;
      let min_x = MAX, min_y = MAX, min_z = MAX;

      console.time('sceneAsImage');
      const depth = new Int32Array(count * count);
      const empty = MIN;
      depth.fill(empty);

      for (let i = -1, l = voxels.length - 1; i < l;) {
        let x = voxels[++i];
        let y = voxels[++i];
        let z = voxels[++i];

        ([x, y, z] = [x, z, y])

        // if (z > 2600) continue;

        if (x < min_x) min_x = x;
        if (y < min_y) min_y = y;
        if (z < min_z) min_z = z;
        if (x > max_x) max_x = x;
        if (y > max_y) max_y = y;
        if (z > max_z) max_z = z;

        const index = x + y * count;
        if (z > depth[index]) {
          depth[index] = z;
        }
        // if (z < depth[index]) {
        //   depth[index] = z;
        // }
      }
      console.timeEnd('sceneAsImage');

      let unused = 0, ox = (count - (max_x - min_x)) >> 1, oy = ((count - (max_y - min_y)) >> 1);
      const img = new Int32Array(count * count);
      img.fill(0xff000000);

      for (let y = 0; y < count; ++y) {
        for (let x = 0; x < count; ++x) {
          const i = x + y * count;

          let ct, a = 0xff000000;//((depth[i] / max_z) * 255.0) << 24;

          const c1 = ct = depth[i];
          const c2 = depth[i - 1];
          const c3 = depth[i - 1 - count];
          if (c1 === empty || c2 === empty || c3 === empty) continue;

          if (c1 < c2 && c1 < c3) {
            ct = a | 0xffffff;
          }
          else if (c1 > c2 && c1 > c3) {
            ct = a | 0x404040;
          }
          else if (c1 < c2) {
            ct = a | 0xcfcfcf;
          }
          else if (c1 < c3) {
            ct = a | 0xafafaf;
          }
          else if (c1 > c2) {
            ct = a | 0x808080;
          }
          else if (c1 > c3) {
            ct = a | 0x606060;
          }
          else {
            ct = a | 0x909090;
          }

          img[(x + ox) + (y + oy) * count] = ct;

        }
      }
      console.log(`[${min_x}..${max_x}]x[${min_y}..${max_y}]x[${min_z}..${max_z}] (${unused})`);
      const imageData = new ImageData(new Uint8ClampedArray(img.buffer), count, count);
      this.#canvas.putImageData(imageData, 0, 0);
    }

    get X() {
      return this.scene ? this.scene.maxX - this.scene.minX : 0;
    }
    get Y() {
      return this.scene ? this.scene.maxY - this.scene.minY : 0;
    }
    get Z() {
      return this.scene ? this.scene.maxZ - this.scene.minZ : 0;
    }

    getTranslate(node) {
      let [x, y, z] = [0, 0, 0];

      if (node.frames.length !== 1) abort();

      node.frames[0].forEach(([k, v]) => {
        if (k === '_t') {
          [x, y, z] = v.split(' ').map(a => +a);
        }
      });

      return { x, y, z };
    }

    buildScene(scene = { translate: { x: 0, y: 0, z: 0 } }, nodeId = 0) {
      const nodes = this.#state.nodes;

      const node = (nodes?.get(nodeId)) ?? {
        kind: 'nSHP',
        models: [{ modelId: 0 }]
      };

      switch (node.kind) {
        case 'nTRN': {
          const translate = this.getTranslate(node);
          scene.translate = translate;
          this.buildScene(scene, node.childId);
        } break;

        case 'nGRP': {
          for (let childId of node.children) {
            this.buildScene(scene, childId);
          }
        } break;

        case 'nSHP': {
          if (node.models.length !== 1) abort();
          const model = this.#state.models[node.models[0].modelId];
          const tr = scene.translate;
          scene.voxels = scene.voxels ?? [];
          for (let bits of model.xyzi) {
            const x = (bits >>> 0) & 0xff;
            const y = (bits >>> 8) & 0xff;
            const z = (bits >>> 16) & 0xff;
            const i = (bits >>> 24) & 0xff;

            const record = { x: (x + tr.x), y: (y + tr.y), z: (z + tr.z), i };
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

    normalizeScene(scene) {
      // model axis range [0 .. 2^n-1] i.e: [0..31] or [0..1023] (max)
      // voxels are centered in the model
      // chunks are 32x32x32, so a model smaller then that should always fit in a single chunk
      const { X, Y, Z } = this;

      // minimal model size is 1 chunk 32x32x32
      const rootChunkBits = Math.max(5, Math.ceil(Math.log2(Math.max(X, Y, Z))));
      const modelSize = 2 ** rootChunkBits;
      console.log('rootChunkBits:', rootChunkBits, '[0..' + (2 ** rootChunkBits - 1) + ']');
      console.log(`model-size: ${modelSize}x${modelSize}x${modelSize} - (${X}x${Y}x${Z})`);

      const dX = (modelSize - X) >>> 1;
      const dY = (modelSize - Y) >>> 1;
      const dZ = (modelSize - Z) >>> 1;

      console.log(`translate: ${dX}x${dY}x${dZ}`);

      const voxels = scene.voxels.map(({ x, y, z, i }) => ({
        x: x - scene.minX + dX,
        y: y - scene.minY + dY,
        z: z - scene.minZ + dZ,
        i
      }));

      // todo: real model bounding box
      scene.minX = 0; scene.maxX = modelSize;
      scene.minY = 0; scene.maxY = modelSize;
      scene.minZ = 0; scene.maxZ = modelSize;

      scene.voxels = voxels;
      return scene;
    }

    buildModelSVO(scene) {
      const svo = scene.voxels.reduce((svo, { x, y, z }) => {
        const cx = x >> 5; x = x & 0x1f;
        const cy = y >> 5; y = y & 0x1f;
        const cz = z >> 5; z = z & 0x1f;

        const chunkId = (cz << 20) + (cy << 10) + (cx << 0);
        const voxel = (z << 10) + (y << 5) + (x << 0)

        const list = svo.get(chunkId) ?? [];
        list.push(voxel);
        svo.set(chunkId, list);
        return svo
      }, new Map);

      console.log('svo:', svo);
      return svo;
    }

    #renderScene(voxels, [X, Y, Z], direction, context, getPixelId) {
      const {pallete} = this.#state;
      const img = new Uint32Array(X * Y);
      img.fill(0xff000000);
      const depthBuffer = new Int32Array(X * Y);
      const empty = ((2 ** 30) * direction) >> 0;
      depthBuffer.fill(empty);

      for (const voxel of voxels) {
        const [pixelIdx, z] = getPixelId(voxel);

        // if (z < (Z*.25)) continue; 
        if (direction > 0 && z > depthBuffer[pixelIdx]) continue;
        if (direction < 0 && z < depthBuffer[pixelIdx]) continue;
        depthBuffer[pixelIdx] = z;

        // const c = (-direction < 0 ? (z / Z * 255.0) : ((Z - 1 - z) / Z * 255.0)) >>> 0;
        // img[pixelIdx] = 0xff000000 + (c << 16) + (c << 8) + c;
        // img[pixelIdx] = (c << 24) + 0xffffff;
        // img[pixelIdx] = (c << 24) + (pallete[voxel.i] & 0x00ffffff);

        img[pixelIdx] = pallete[voxel.i];
      }
/*
      for (let y = 0; y < Y; ++y) {
        let ct = 0;
        for (let x = 1; x < X; ++x) {
          const c1 = depthBuffer[y * X + x];
          const c2 = depthBuffer[y * X + x - 1];
          const c3 = depthBuffer[(y - 1) * X + x - 1];
          if (c1 === empty || c2 === empty || c3 === empty) continue;

          if (c1 < c2 && c1 < c3) {
            ct = 0xffffffff;
          }
          else
            if (c1 > c2 && c1 > c3) {
              ct = 0xff404040;
            }
            else
              if (c1 < c2) {
                ct = 0xffcfcfcf;
              }
              else
                if (c1 < c3) {
                  ct = 0xffafafaf;
                }
                else
                  if (c1 > c2) {
                    ct = 0xff808080;
                  }
                  else
                    if (c1 > c3) {
                      ct = 0xff606060;
                    }
                    else {
                      ct = 0xff909090;
                    }

          img[y * X + x - 1] = ct;

          // if (y = 255) console.log(c2-c1);
        }

      }
      */
      const imageData = new ImageData(new Uint8ClampedArray(img.buffer), X, Y);
      context.putImageData(imageData, 0, 0);
    }

    beforeRenderOnce() {
      if (!this.scene) return;

      const { X, Y, Z, scene } = this;
      console.log('dimensions:', X, Y, Z);
      console.log('sparsity:', (100 * scene.voxels.length / (X * Y * Z)).toFixed(3) + '%');

      const voxels = scene.voxels;

      const top_view = ({ x, y, z }) => [(x) + (y * X), z];
      const bottom_view = ({ x, y, z }) => [(X - 1 - x) + (y * X), z];

      const front_view = ({ x, y, z }) => [(x) + (z * X), y];
      const back_view = ({ x, y, z }) => [(X - 1 - x) + (z * X), y];

      const yz_pos_f = ({ x, y, z }) => [(Y - 1 - y) + (z * Y), x];
      const yz_pos_b = ({ x, y, z }) => [(y) + (z * Y), x];

      console.time('beforeRenderOnce');

      this.#renderScene(voxels, [X, Y, Z], -1, this.#contextXY, top_view);
      this.#renderScene(voxels, [X, Y, Z], +1, this.#contextXYB, bottom_view);

      this.#renderScene(voxels, [X, Z, Y], +1, this.#contextXZ, front_view);
      this.#renderScene(voxels, [X, Z, Y], -1, this.#contextXZB, back_view);

      this.#renderScene(voxels, [Y, Z, X], +1, this.#contextYZ, yz_pos_f);
      this.#renderScene(voxels, [Y, Z, X], -1, this.#contextYZB, yz_pos_b);

      console.timeEnd('beforeRenderOnce');

      // this.scene = null;
    }
  }

})

mdlr('voxels:loader:rvso', m => {

  const abort = () => { throw new Error() }

  const RVSO = 0x4f565352;

  const get_scene = (view, levels) => {
    // header
    const magic_number = view.getUint32(0, true);
    const version = view.getUint32(4, true);
    if (magic_number !== RVSO) abort();
    if (version !== 1) abort();

    // top-level
    const top_level = view.getUint32(16, true);
    console.log('top-level:', (top_level), `(${2 ** top_level}x${2 ** top_level}x${2 ** top_level})`);

    // nodes per level
    let offset = 20;
    let total_nodes = 0;
    let nodes_per_level = [];
    for (let level = 0; level < top_level; ++level) {
      const number_of_nodes = view.getUint32(offset, true); offset += 4;
      console.log(`level${level}: ${number_of_nodes} nodes`);
      nodes_per_level[level] = number_of_nodes;
      total_nodes += number_of_nodes;
    }
    const number_of_nodes = view.getUint32(offset, true); offset += 4;
    nodes_per_level[top_level] = number_of_nodes;
    console.log(`level${top_level}: ${number_of_nodes} nodes`);


    // sanity check
    if ((offset + total_nodes) > view.buffer.byteLength) abort();

    const scene = {
      minX: 2 ** levels, minY: 2 ** levels, minZ: 2 ** levels,
      maxX: 0, maxY: 0, maxZ: 0,
      voxels: [{ x: 0, y: 0, z: 0 }],

      nodes_per_level,
      offset
    }

    return scene;
  }

  const parse_buffer = view => {
    const levels = 12;
    const scene = get_scene(view, levels);
    const { nodes_per_level } = scene;
    let offset = scene.offset; // todo: hide this detail

    for (let level = 0; level < levels; ++level) {
      const nodes = scene.voxels;
      const voxels = scene.voxels = [];
      for (let node = 0; node < nodes_per_level[level]; ++node) {
        let mask = view.getUint8(offset); ++offset;
        // console.log(level + ': child-mask:', hex(mask, 2));

        let { x, y, z } = nodes[node];
        x <<= 1; y <<= 1; z <<= 1;

        if (mask & 0x01) {
          voxels.push({ x: x + 0, y: y + 0, z: z + 0 });
        }
        if (mask & 0x02) {
          voxels.push({ x: x + 1, y: y + 0, z: z + 0 });
        }
        if (mask & 0x04) {
          voxels.push({ x: x + 0, y: y + 0, z: z + 1 });
        }
        if (mask & 0x08) {
          voxels.push({ x: x + 1, y: y + 0, z: z + 1 });
        }

        if (mask & 0x10) {
          voxels.push({ x: x + 0, y: y + 1, z: z + 0 });
        }
        if (mask & 0x20) {
          voxels.push({ x: x + 1, y: y + 1, z: z + 0 });
        }
        if (mask & 0x40) {
          voxels.push({ x: x + 0, y: y + 1, z: z + 1 });
        }
        if (mask & 0x80) {
          voxels.push({ x: x + 1, y: y + 1, z: z + 1 });
        }
      }
    }

    // determine dimensions
    const voxels = scene.voxels;
    for (const { x, y, z } of voxels) {
      if (x < scene.minX) scene.minX = x;
      if (y < scene.minY) scene.minY = y;
      if (z < scene.minZ) scene.minZ = z;
      if (x > scene.maxX) scene.maxX = x;
      if (y > scene.maxY) scene.maxY = y;
      if (z > scene.maxZ) scene.maxZ = z;
    }

    return scene;
  }

  return {
    loader: (arrayBuffer) => {
      const view = new DataView(arrayBuffer);
      return parse_buffer(view);
    },
    stream_voxels: (arrayBuffer, max_level = 4) => {
      const view = new DataView(arrayBuffer);

      const scene = get_scene(view, max_level);
      scene.level = max_level;
      const { nodes_per_level } = scene;
      let offset = scene.offset; // todo: hide this detail
      console.log(JSON.stringify(scene));

      for (let level = 0; level < max_level; ++level) {
        const nodes = scene.voxels;
        const total_voxels = nodes_per_level[level];
        const voxels = scene.voxels = new Uint16Array(3 * nodes_per_level[level + 1]);
        let index = -1;
        for (let node = 0; node < total_voxels; ++node) {
          let mask = view.getUint8(offset); ++offset;
          if (offset > arrayBuffer.length) throw 42;

          const read_index = node * 3;
          let x = nodes[read_index + 0];
          let y = nodes[read_index + 1];
          let z = nodes[read_index + 2];

          x <<= 1; y <<= 1; z <<= 1;

          if (mask & 0x01) {
            voxels[++index] = x + 0;
            voxels[++index] = y + 0;
            voxels[++index] = z + 0;
          }
          if (mask & 0x02) {
            voxels[++index] = x + 1;
            voxels[++index] = y + 0;
            voxels[++index] = z + 0;
          }
          if (mask & 0x04) {
            voxels[++index] = x + 0;
            voxels[++index] = y + 0;
            voxels[++index] = z + 1;
          }
          if (mask & 0x08) {
            voxels[++index] = x + 1;
            voxels[++index] = y + 0;
            voxels[++index] = z + 1;
          }

          if (mask & 0x10) {
            voxels[++index] = x + 0;
            voxels[++index] = y + 1;
            voxels[++index] = z + 0;
          }
          if (mask & 0x20) {
            voxels[++index] = x + 1;
            voxels[++index] = y + 1;
            voxels[++index] = z + 0;
          }
          if (mask & 0x40) {
            voxels[++index] = x + 0;
            voxels[++index] = y + 1;
            voxels[++index] = z + 1;
          }
          if (mask & 0x80) {
            voxels[++index] = x + 1;
            voxels[++index] = y + 1;
            voxels[++index] = z + 1;
          }
        }
        console.log(`#voxels: ${(1 + index) / 3}`);
      }
      return scene;
    }
  }
})
