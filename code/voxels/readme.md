
max dimensions model: 512x512x512 which yields a maximum of 134.217.728 voxels per model

chunk size: 16x16x16: which yields a maximum of 4096 voxels

dimension in chunks: (512/16)x(512/16)x(512/16)

octree nodes: 32x32x32 which yields a max of 32768 leaf nodes (ommitted are the tree nodes)

1 -> 2 -> 4 -> 8 -> 16 -> 32 (6 levels)

512 = 2**9 so a voxel position can be encoded in 27 bits


octree node 32 bits
- 2 bits type (empty/solid/partial/rerved)
- 



leaf_node
- 2 bits type (empty/solid/partial/rerved)
- xyz: 15bits (octree dimensions which are x,y,z divided by chunksize)

- [voxel_data]: array of voxels

voxel_data = 32bits
- xyz: 12 bits (node dimensions)
- color: 8 bits;


