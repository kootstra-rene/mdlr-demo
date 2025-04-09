mdlr('webgl2:utils', m => {

  const create_texture = (options) => {
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
  }

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
      const {gl} = options;
      return create_texture(options, [gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE]);
    },

    createDepthTexture: (options) => {
      const {gl} = options;
      return create_texture(options, [gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT]);
    },
  }
})