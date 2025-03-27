mdlr('webgl2:utils', m => {

  return {
    compile: (options) => {
      const { gl, vertex, fragment } = options;

      const program = gl.createProgram();

      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertex);
      gl.compileShader(vertexShader);
      gl.attachShader(program, vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragment);
      gl.compileShader(fragmentShader);
      gl.attachShader(program, fragmentShader);

      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('vertex:', gl.getShaderInfoLog(vertexShader));
        console.log('fragment:', gl.getShaderInfoLog(fragmentShader));
        console.log(gl.getProgramInfoLog(program));
        throw 42;
      }

      return program;
    },

    createTexture: (options) => {
      const { gl, width, height } = options;

      const targetTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);

      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border,
        format, type, data);

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindTexture(gl.TEXTURE_2D, null);

      return targetTexture;
    },

    createDepthTexture: (options) => {
      const { gl, width, height } = options;

      const targetTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, targetTexture);

      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.DEPTH_COMPONENT24;
      const border = 0;
      const format = gl.DEPTH_COMPONENT;
      const type = gl.UNSIGNED_INT;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border,
        format, type, data);

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.bindTexture(gl.TEXTURE_2D, null);

      return targetTexture;
    },

    createFramebuffer: (options) => {
      const { gl, init } = options;
      const fbo = gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      init(gl);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      return fbo;
    },

    createVertexArray: (options) => {
      const { gl, init } = options;
      const vao = gl.createVertexArray();

      gl.bindVertexArray(vao);
      init(gl);
      gl.bindVertexArray(null);

      return vao;
    }
  }
})