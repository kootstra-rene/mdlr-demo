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

  const readString = (view, offset, length) => {
    let str = '';
    for (let i = 0; i < length; ++i) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
  }

  const readChunk = (view, offset, state = { models: [] }) => {
    if (offset >= view.byteLength) return;

    const id = view.getUint32(offset, true);
    const N = view.getUint32(offset + 4, true);
    const M = view.getUint32(offset + 8, true);

    const next_offset = offset + 12 + N + M;

    switch (id) {
      case MAIN:
        readChunk(view, offset + 12, state);
        break;

      case PACK:
        const number_of_models = view.getUint32(offset + 12, true);
        // console.log('number_of_models:', number_of_models);
        readChunk(view, next_offset, state);
        break;

      case SIZE: {
        const model = {};

        const X = view.getUint32(offset + 12, true);
        const Y = view.getUint32(offset + 16, true);
        const Z = view.getUint32(offset + 20, true);
        const buffer = model.buffer = new Uint8Array(X * Y * Z);
        const YSTEP = (X * Z);
        const ZSTEP = X;
        model.X = X;
        model.Y = Y;
        model.Z = Z;
        model.raw = [];
        model.setColor = (x, y, z, c) => {
          buffer[x + z * ZSTEP + y * YSTEP] = c;
        }
        state.models.push(model);

        // console.log('x,y,z:', X, Y, Z);
        readChunk(view, next_offset, state);
      } break;

      case XYZI: {
        const model = state.models.at(-1);

        const number_of_voxels = view.getUint32(offset + 12, true);
        // console.log('number_of_voxels:', number_of_voxels);
        state.total_voxels = (state.total_voxels ?? 0) + number_of_voxels;
        offset += 16;
        for (let voxelId = 0; voxelId < number_of_voxels; ++voxelId) {
          const bits = view.getUint32(offset, true);
          model.raw.push(bits);
          const x = (bits >>> 0) & 0xff;
          const y = (bits >>> 8) & 0xff;
          const z = (bits >>> 16) & 0xff;
          const i = (bits >>> 24) & 0xff;
          model.setColor(x, y, z, i);
          offset += 4;
        }
        readChunk(view, next_offset, state);
      } break;

      case RGBA:
        offset += 12;
        state.pallete = new Uint32Array(256);
        for (let i = 0; i < 256; ++i) {
          const rgba = view.getUint32(offset, true);
          state.pallete[(1 + i) & 0xff] = rgba;
          offset += 4;
        }
        readChunk(view, next_offset, state);
        break;

      /*
            case NOTE: {
              offset += 12;
              const number_of_colours = view.getUint32(offset, true);
              offset += 4;
              for (let i = 0; i < number_of_colours; ++i) {
                const length = view.getUint32(offset, true);
                offset += 4;
                const text = readString(view, offset, length);
                console.log(`'${text}'`, offset, length);
                offset += length;
              }
            } break;
      */

      case LAYR: {
        state.layers = state.layers ?? new Map;

        const dict = [];
        offset += 12;
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
        offset += 12;
        const materialId = view.getUint32(offset, true);
        offset += 4;

        offset = readDict(view, offset, dict);

        state.materials.set(materialId, dict);

        readChunk(view, next_offset, state);
      } break;

      case rCAM: {
        state.cameras = state.cameras ?? new Map;

        const dict = [];
        offset += 12;
        const cameraId = view.getUint32(offset, true);
        offset += 4;

        offset = readDict(view, offset, dict);

        state.cameras.set(cameraId, dict);

        readChunk(view, next_offset, state);
      } break;

      case rOBJ: {
        state.objects = state.objects ?? [];

        const dict = [];
        offset += 12;
        offset = readDict(view, offset, dict);

        state.objects.push(dict);

        readChunk(view, next_offset, state);
      } break;

      case nGRP: {
        offset += 12;

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

        readChunk(view, next_offset, state);
      } break;

      case nTRN: {
        offset += 12;

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

        readChunk(view, next_offset, state);
      } break;

      case nSHP: {
        offset += 12;

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

        readChunk(view, next_offset, state);
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
      return readChunk(view, 8);
    }
  }
})

mdlr('[web]voxels:canvas-app', m => {

  const { loader } = m.require('voxels:loader');

  const abort = () => { throw new Error() }

  m.html`
    <div><canvas{cxy} width="{X}" height="{Y}"/></div>
    <div><canvas{cxz} width="{X}" height="{Z}"/></div>
    <div><canvas{cyz} width="{Y}" height="{Z}"/></div>
  `;

  m.style`
    display: flex;
    justify-items: center;
    align-items: center;
    height: 100%;
    width: 100%;
    background-color: #111;

    div {
      display: grid;
      position: relative;
      flex: 1;
      width: 100%;
      aspect-ratio: 1/1;
    }

    canvas {
      image-rendering: pixelated;
      transform: scale(1,-1);
      margin: auto;
    }
  `;

  return class {
    cxy;
    cxz;
    cyz;

    #contextXY;
    #contextXZ;
    #contextYZ;
    #state;

    modelIndex = 0;

    connected() {
      window.$state = this;
      this.#contextXY = this.cxy.getContext('2d', { alpha: true });
      this.#contextXZ = this.cxz.getContext('2d', { alpha: true });
      this.#contextYZ = this.cyz.getContext('2d', { alpha: true });

      (async () => {
        // const res = await fetch('/docs/res/monu5.vox');
        // const res = await fetch('/docs/res/monu10.vox');
        // const res = await fetch('/docs/res/monu16.vox');
        // const res = await fetch('/docs/res/veh_truck7.vox');
        // const res = await fetch('/docs/res/haunted_house.vox');
        // const res = await fetch('/docs/res/odyssey_scene.vox');
        // const res = await fetch('/docs/res/TallBuilding03.vox');
        // const res = await fetch('/docs/res/teapot.vox');
        // const res = await fetch('/docs/res/dragon.vox');
        // const res = await fetch('/docs/res/T-Rex.vox');
        // const res = await fetch('/docs/res/street_scene.vox');
        const res = await fetch('/docs/res/pieta.vox');

        const data = await res.arrayBuffer();

        this.#state = loader(data);
        this.scene = this.buildScene();
        setTimeout(() => this.beforeRenderOnce(), 250);

      })();
    }

    get X() {
      return this.scene ? 1 + this.scene.maxX - this.scene.minX : 0;
    }
    get Y() {
      return this.scene ? 1 + this.scene.maxY - this.scene.minY : 0;
    }
    get Z() {
      return this.scene ? 1 + this.scene.maxZ - this.scene.minZ : 0;
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
          for (let bits of model.raw) {
            const x = (bits >>> 0) & 0xff;
            const y = (bits >>> 8) & 0xff;
            const z = (bits >>> 16) & 0xff;
            const i = (bits >>> 24) & 0xff;

            const record = { x: x + tr.x, y: y + tr.y, z: z + tr.z, i };
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

    beforeRenderOnce() {
      if (!this.#state) return;

      const { X, Y, Z, scene } = this;
      console.log('dimensions:', X, Y, Z);
      console.log('sparsity:', (100 * scene.voxels.length / (X * Y * Z)).toFixed(3) + '%');

      const shiftx = (512 - X) >> 1;
      const shifty = (512 - X) >> 1;
      const shiftz = (512 - X) >> 1;
      
      const voxels = scene.voxels.reduce((lut, voxel) => {
        const x = voxel.x - scene.minX;
        const y = voxel.y - scene.minY;
        const z = voxel.z - scene.minZ;

        lut.push({ x, y, z, i: voxel.i });
        return lut;
      }, []);

      const { pallete } = this.#state;

      console.time('beforeRenderOnce');
      if (true) { // XY
        const img = new Uint32Array(X * Y);

        console.time('sort');
        voxels.sort((a, b) => a.z - b.z);
        console.timeEnd('sort');
        console.time('image');
        for (const { x, y, z, i } of voxels) {
          img[x + (y * X)] = pallete[i];
        }
        console.timeEnd('image');

        console.time('draw');
        const imageData = new ImageData(new Uint8ClampedArray(img.buffer), X, Y);
        this.#contextXY.putImageData(imageData, 0, 0);
        console.timeEnd('draw');
      }

      if (true) { // XZ
        const img = new Uint32Array(X * Z);

        console.time('sort');
        voxels.sort((a, b) => b.y - a.y);
        console.timeEnd('sort');
        console.time('image');
        for (const { x, y, z, i } of voxels) {
          img[x + (z * X)] = pallete[i];
        }
        console.timeEnd('image');

        console.time('draw');
        const imageData = new ImageData(new Uint8ClampedArray(img.buffer), X, Z);
        this.#contextXZ.putImageData(imageData, 0, 0);
        console.timeEnd('draw');
      }

      if (true) { // YZ
        const img = new Uint32Array(Y * Z);

        console.time('sort');
        voxels.sort((a, b) => b.x - a.x);
        console.timeEnd('sort');
        console.time('image');
        for (const { x, y, z, i } of voxels) {
          img[(Y - 1 - y) + (z * Y)] = pallete[i];
        }
        console.timeEnd('image');

        console.time('draw');
        const imageData = new ImageData(new Uint8ClampedArray(img.buffer), Y, Z);
        this.#contextYZ.putImageData(imageData, 0, 0);
        console.timeEnd('draw');
      }
      console.timeEnd('beforeRenderOnce');
    }
  }

})
