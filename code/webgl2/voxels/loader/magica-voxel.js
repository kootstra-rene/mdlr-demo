mdlr('webgl2:voxels:magica-loader', m => {

  const assert = (condition, message) => { if (!condition) throw new Error(message); }

  const { mat4, vec3 } = m.require('webgl2:matrix');

  const CHUNK_ID_MAIN = 0x4e49414d;
  const CHUNK_ID_PACK = 0x4b434150;
  const CHUNK_ID_SIZE = 0x455a4953;
  const CHUNK_ID_XYZI = 0x495a5958;
  const CHUNK_ID_RGBA = 0x41424752;

  const CHUNK_ID_MATL = 0x4c54414d;
  const CHUNK_ID_MATT = 0x5454414d;

  const CHUNK_ID_nTRN = 0x4e52546e;
  const CHUNK_ID_nGRP = 0x5052476e;
  const CHUNK_ID_nSHP = 0x5048536e;

  const CHUNK_ID_LAYR = 0x5259414c;

  const CHUNK_ID_rCAM = 0x4d414372;
  const CHUNK_ID_rOBJ = 0x4a424f72;

  const CHUNK_ID_NOTE = 0x45544f4e;

  const decoder = new TextDecoder;

  const TRANSFROM_VECTORS = [
    vec3.fromValues(1.0, 0.0, 0.0),
    vec3.fromValues(0.0, 1.0, 0.0),
    vec3.fromValues(0.0, 0.0, 1.0),
  ];

  const readDict = (view, offset, dict = []) => {
    const num_entries = view.getUint32(offset, true);
    offset += 4;

    for (let i = 0; i < num_entries; ++i) {
      const key_length = view.getUint32(offset, true);
      const key = decoder.decode(new Uint8Array(view.buffer, offset += 4, key_length));

      const value_length = view.getUint32(offset += key_length, true);
      const value = decoder.decode(new Uint8Array(view.buffer, offset += 4, value_length))

      dict.push([key, value]);
      offset += value_length;
    }
    return offset;
  }

  const addDictToStats = (stats, dict) => {
    if (stats) {
      for (let [key] of dict) {
        stats.dict.add(key);
      }
    }
  }

  const convert = (type, dict) => {
    return dict.reduce((object, [key, value]) => {
      switch (key) {
        case '_f':
          object.frameIndex = +value;
          break;

        case '_r':
          const encoded = +value;
          const index1 = (encoded >> 0) & 3;
          const index2 = (encoded >> 2) & 3;
          const index3 = (3 - index1 - index2);
          const sign1 = (encoded >> 4) & 1;
          const sign2 = (encoded >> 5) & 1;
          const sign3 = (encoded >> 6) & 1;

          const v0 = vec3.clone(TRANSFROM_VECTORS[index1]); if (sign1) vec3.negate(v0, v0);
          const v1 = vec3.clone(TRANSFROM_VECTORS[index2]); if (sign2) vec3.negate(v1, v1);
          const v2 = vec3.clone(TRANSFROM_VECTORS[index3]); if (sign3) vec3.negate(v2, v2);

          const matrix = mat4.fromValues(
            v0[0], v1[0], v2[0], 0.0,
            v0[1], v1[1], v2[1], 0.0,
            v0[2], v1[2], v2[2], 0.0,
            0.0, 0.0, 0.0, 1.0,
          );

          object.rotate = matrix;
          break;

        case '_t':
          const [x, y, z] = value.split(' ').map(a => +a);
          object.transform = vec3.fromValues(x, y, z);
          break;
      }
      return object;
    }, {})
  }

  function* chunk_reader(array_buffer, context) {
    const view = new DataView(array_buffer);
    let offset = 8;

    while (offset < view.byteLength) {

      const id = view.getUint32(offset, true);
      const N = view.getUint32(offset + 4, true);
      const M = view.getUint32(offset + 8, true);

      const next_offset = offset + 12 + N + M;

      offset += 12;

      switch (id) {
        case CHUNK_ID_MAIN:
          yield { id, len: N + M };
          continue;

        case CHUNK_ID_PACK:
          const num_models = view.getUint32(offset, true);
          yield { id, len: N + M, num_models };
          break;

        case CHUNK_ID_SIZE:
          const { models } = context;
          const X = view.getUint32(offset, true);
          const Y = view.getUint32(offset + 4, true);
          const Z = view.getUint32(offset + 8, true);

          models.push({ size: vec3.fromValues(X, Y, Z), voxels: new Uint32Array() });
          yield { id, len: N + M, size: vec3.fromValues(X, Y, Z) };
          break;

        case CHUNK_ID_XYZI:
          const model = context.models.at(-1);
          const num_voxels = view.getUint32(offset, true);
          const voxels = new Uint32Array(view.buffer, offset += 4, num_voxels);

          model.voxels = voxels;
          yield { id, len: N + M, voxels };

          if (context.stats) {
            context.stats.voxels += voxels.length;
          }
          break;

        case CHUNK_ID_RGBA:
          const palette = new Uint32Array(256);
          const block = new Uint8Array(view.buffer, offset, 255 << 2);
          palette.set(new Uint32Array(block.buffer, 0, 255), 1);

          context.palette = palette;
          yield { id, len: N + M, palette };
          break;

        case CHUNK_ID_MATL:
          const materialId = view.getUint32(offset, true);

          const dict = [];
          offset = readDict(view, offset += 4, dict);
          addDictToStats(context.stats, dict);

          context.materials.set(materialId, dict);
          yield { id, len: N + M, materialId, dict };
          break;

        case CHUNK_ID_MATT:
          // deprecated
          // yield { id, len: N + M };
          break;

        case CHUNK_ID_nGRP: {
          const { nodes } = context;
          const nodeId = view.getUint32(offset, true);

          const dict = [];
          offset = readDict(view, offset += 4, dict);
          addDictToStats(context.stats, dict);

          const num_children = view.getUint32(offset, true);

          const children = [];
          for (let child = 0; child < num_children; ++child) {
            const childId = view.getUint32(offset += 4, true);
            children.push(childId);
          }

          assert(!nodes.has(nodeId), `nodes: duplicate entry for '${nodeId}'`);
          nodes.set(nodeId, { id, nodeId, dict, children });
          yield { id, len: N + M, nodeId, dict, children };
        } break;

        case CHUNK_ID_nTRN: {
          const { nodes } = context;
          const nodeId = view.getUint32(offset, true);

          const dict = [];
          offset = readDict(view, offset += 4, dict);
          addDictToStats(context.stats, dict);

          const childId = view.getUint32(offset, true);
          const reserved = view.getInt32(offset += 4, true);
          const layerId = view.getInt32(offset += 4, true);
          const num_frames = view.getUint32(offset += 4, true);
          offset += 4;

          const frames = [];
          for (let frame = 0; frame < num_frames; ++frame) {
            const dict = [];
            offset = readDict(view, offset, dict);
            addDictToStats(context.stats, dict);

            frames.push({ id: frame, dict: convert(id, dict) });
          }

          assert(!nodes.has(nodeId), `nodes: duplicate entry for '${nodeId}'`);
          nodes.set(nodeId, { id, nodeId, dict, childId, layerId, frames });
          yield { id, len: N + M, nodeId, dict, childId, layerId, frames };
        } break;

        case CHUNK_ID_nSHP: {
          const { nodes } = context;
          const nodeId = view.getUint32(offset, true);

          const dict = [];
          offset = readDict(view, offset += 4, dict);
          addDictToStats(context.stats, dict);

          const num_models = view.getUint32(offset, true);
          offset += 4;

          const models = [];
          for (let model = 0; model < num_models; ++model) {
            const id = view.getUint32(offset, true);

            const dict = [];
            offset = readDict(view, offset += 4, dict);
            addDictToStats(context.stats, dict);

            models.push({ id, dict });
          }

          assert(!nodes.has(nodeId), `nodes: duplicate entry for '${nodeId}'`);
          nodes.set(nodeId, { id, nodeId, dict, models });
          yield { id, len: N + M, nodeId, dict, models };
        } break;

        case CHUNK_ID_LAYR: {
          const layerId = view.getUint32(offset, true);

          const dict = [];
          offset = readDict(view, offset += 4, dict);
          addDictToStats(context.stats, dict);

          const reserved = view.getUint32(offset, true);

          context.layers.set(layerId, dict);
          yield { id, len: N + M, layerId, dict };
        } break;

        case CHUNK_ID_rCAM: {
          const cameraId = view.getUint32(offset, true);

          const dict = [];
          readDict(view, offset += 4, dict);
          addDictToStats(context.stats, dict);

          context.cameras.set(cameraId, dict);
          yield { id, len: N + M, cameraId, dict };
        } break;

        case CHUNK_ID_rOBJ: {
          const dict = [];
          readDict(view, offset, dict);
          addDictToStats(context.stats, dict);

          context.objects.push(dict);
          yield { id, len: N + M, dict };
        } break;

        case CHUNK_ID_NOTE: {
          const num_names = view.getUint32(offset, true);
          offset += 4;

          const names = [];
          for (let model = 0; model < num_names; ++model) {
            const name_length = view.getUint32(offset, true);
            const name = decoder.decode(new Uint8Array(view.buffer, offset += 4, name_length));

            names.push(name);
            offset += name_length;
          }

          yield { id, len: N + M, names };

        } break;

        default:
          yield { id, len: N + M };
          return;
      }

      offset = next_offset;
    }
  }

  return { reader: chunk_reader };

})