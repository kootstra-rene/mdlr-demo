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

        // readChunk(view, next_offset, state);
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
