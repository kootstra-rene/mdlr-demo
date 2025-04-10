mdlr('[test]greedy-mesher', m => {

  const { create_bitfield, get_row_blocks, trailing_zeros } = m.require('greedy-mesher');

  const { it, expect } = m.test;

  const make_chunk = (generator) => {
    const chunk = { voxels: [] };

    for (let y = 0; y < 32; ++y) {
      for (let z = 0; z < 32; ++z) {
        for (let x = 0; x < 32; ++x) {
          const voxel = generator(x, y, z);
          if (voxel) chunk.voxels.push(voxel);
        }
      }
    }
    return chunk;
  }

  const valley_chunk = make_chunk((x, y, z) => {
    const has_voxel = y <= (x * x + z * z) * 31 / (32 * 32 * 2) + 1 ? 1 : 0;
    return has_voxel ? { x, y, z, i: 1, f: 63 } : null;
  });


  it('should count trailing zeros', done => {
    // trailing zeros
    expect(trailing_zeros(0)).to.eql(32);
    expect(trailing_zeros(1024)).to.eql(10);
    expect(trailing_zeros(-1)).to.eql(0);

    // trailing ones
    expect(trailing_zeros(~0)).to.eql(0);
    expect(trailing_zeros(~1023)).to.eql(10);
    expect(trailing_zeros(~-1)).to.eql(32);

    done();
  })

  it('should convert chunk to bitfield', done => {
    const bitfield = create_bitfield(valley_chunk);

    expect(bitfield[0]).to.eql(0b11111111111111111111111111111111);
    expect(bitfield[16 * 32 + 16]).to.eql(0b11110000000000000000000000000000);
    expect(bitfield[1023]).to.eql(0b00000000000000000000000000000000);

    done();
  })

  it('should convert a row into blocks', done => {
    const row = 0b11011111111110001011111111001111;

    const blocks = get_row_blocks(row);

    expect(blocks).to.eql([
      [0, 4, 0b00000000000000000000000000001111],
      [6, 8, 0b00000000000000000011111111000000],
      [15, 1, 0b00000000000000001000000000000000],
      [19, 10, 0b00011111111110000000000000000000],
      [30, 2, 0b11000000000000000000000000000000],
    ])
    done();
  })

  it('should convert rows into blocks', done => {
    const rows = new Uint32Array([
      0b11011111111110001011111111001111,
      0b00011111111110000011100111001111,
      0b11011111111110000011111111001100,
    ]);

    const blocks = get_row_blocks(rows[0]);
    for (let block of blocks) {
      console.log(block);
    }

    // expect(blocks).to.eql([
    //   [0, 4,   0b00000000000000000000000000001111],
    //   [6, 8,   0b00000000000000000011111111000000],
    //   [15, 1,  0b00000000000000001000000000000000],
    //   [19, 10, 0b00011111111110000000000000000000],
    //   [30, 2,  0b11000000000000000000000000000000],
    // ])
    done();
  })
})