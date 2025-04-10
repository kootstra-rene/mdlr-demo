mdlr('greedy-mesher', m => {

  const DEBRUIN_32BIT = 0x077CB531;
  const TRAILING_ZERO_TABLE = new Uint32Array([
    0, 1, 28, 2, 29, 14, 24, 3,
    30, 22, 20, 15, 25, 17, 4, 8,
    31, 27, 13, 23, 21, 19, 16, 7,
    26, 12, 18, 6, 11, 5, 10, 9
  ]);

  const create_bitfield = (chunk) => {
    const bitfield = new Uint32Array(32 * 32);

    chunk.voxels.forEach(({ x, y, z }) => {
      bitfield[z + y * 32] |= (1 << x);
    });

    return bitfield;
  }

  const trailing_zeros = (bits) => {
    bits >>>= 0; // ensure unsigned 32-bit

    if (bits === 0) return 32 >>> 0;
  
    const isolated = (bits & -bits) >>> 0;
    const index = (isolated * DEBRUIN_32BIT) >>> 27;

    return TRAILING_ZERO_TABLE[index];
  }

  return {
    create_bitfield,
    trailing_zeros,

    get_row_blocks(row) {
      let blocks = [], bits, mask, size, skip, start = 0;

      for(;;) {
        // start of block
        bits = row >>> start;
        skip = trailing_zeros(bits);
        bits >>>= skip;
        start += skip;
  
        // no more blocks vailable
        if (!bits) break;
  
        // size of block
        size = trailing_zeros(~bits);
        bits >>>= size;
        mask = (size === 32 ? -1 : ((1 << size) - 1) << start) >>> 0;
        blocks.push([start, size, mask]);
        start += size;
  
        if (start >= 32) break;
      }

      return blocks;
    },
  }
})