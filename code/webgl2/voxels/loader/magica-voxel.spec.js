mdlr('[test]webgl2:voxels:magica-loader', m => {

  const { it, expect, before } = m.test;

  const { reader } = m.require('webgl2:voxels:magica-loader');

  let binary_data;

  before(async done => {
    // const res = await fetch('/docs/res/huge/custom.vox');
    // const res = await fetch('/docs/res/huge/nuke.vox');
    // const res = await fetch('/docs/res/huge/Church_Of_St_Sophia.vox');
    // const res = await fetch('/docs/res/huge/castle.vox');
    // const res = await fetch('/docs/res/red_booth_solid.vox');
    const res = await fetch('/docs/res/haunted_house.vox');
    // const res = await fetch('/docs/res/t-rex.vox');
    binary_data = await res.arrayBuffer();

    done();
  })

  it('should ...', done => {
    let num_chunks = 0;
    let context = { cameras: new Map, layers: new Map, materials: new Map, models: [], nodes: new Map, objects: [], stats: { voxels: 0, dict: new Set } };
    for (const { id, len, ...props } of reader(binary_data, context)) {
      // console.log('chunk:', id.toString(16), `(${len})`, props);
      ++num_chunks;
    }
    // console.log('#chunks:', num_chunks);
    console.log(context);
    done();
  })

})