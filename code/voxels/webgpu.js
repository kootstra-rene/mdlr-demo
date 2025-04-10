mdlr('[web]voxels:webgpu-app', m => {

  const mediaQueryHDR = window.matchMedia('(dynamic-range: high)');
  // mediaQueryHDR.onchange = () => {
    if (!mediaQueryHDR.matches) {
      console.log('switched to SDR');
    }
    else {
      console.log('switched to HDR');
    }
  // };

  m.html`
    <canvas{}/>
  `;

  m.style`
  display: inline-block;

   & canvas { 
    height: 32px;
    width: 32px;
   }
  `;

  return class {
    canvas;

    async connected() {
      const adapter = await navigator.gpu?.requestAdapter();
      const device = await adapter?.requestDevice();
      console.log(adapter, device);

      const context = this.canvas.getContext('webgpu');
      context.configure({
        device,
        format: 'rgba16float',
        toneMapping: { mode: 'extended' },
        colorSpace: 'display-p3',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });

      console.log(context.getConfiguration());

      const renderPassDescriptor = {
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 3.0, g: 3.0, b: 3.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };

      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setViewport(0, 0, 32, 32, 0, 1);
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);

    }
  }
})