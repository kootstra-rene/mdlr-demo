mdlr('webgl2:matrix', m => {

  // heavily inspired by https://github.com/toji/gl-matrix

  const EPSILON = 0.000001;

  const IDENTITY_MAT3 = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
  ];

  const IDENTITY_MAT4 = [
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  ];

  const $ = {
    mat3: {
      create: () => new Float32Array(9),
      identity: (matrix) => {
        matrix.set(IDENTITY_MAT3);
      },
      transpose(out, a) {
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if (out === a) {
          let a01 = a[1],
            a02 = a[2],
            a12 = a[5];
          out[1] = a[3];
          out[2] = a[6];
          out[3] = a01;
          out[5] = a[7];
          out[6] = a02;
          out[7] = a12;
        } else {
          out[0] = a[0];
          out[1] = a[3];
          out[2] = a[6];
          out[3] = a[1];
          out[4] = a[4];
          out[5] = a[7];
          out[6] = a[2];
          out[7] = a[5];
          out[8] = a[8];
        }

        return out;
      },
      normalFromMat4(out, a) {
        let a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
        let a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
        let a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
        let a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];

        let b00 = a00 * a11 - a01 * a10;
        let b01 = a00 * a12 - a02 * a10;
        let b02 = a00 * a13 - a03 * a10;
        let b03 = a01 * a12 - a02 * a11;
        let b04 = a01 * a13 - a03 * a11;
        let b05 = a02 * a13 - a03 * a12;
        let b06 = a20 * a31 - a21 * a30;
        let b07 = a20 * a32 - a22 * a30;
        let b08 = a20 * a33 - a23 * a30;
        let b09 = a21 * a32 - a22 * a31;
        let b10 = a21 * a33 - a23 * a31;
        let b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det =
          b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
          return null;
        }
        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

        out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

        out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

        return out;
      }
    },
    mat4: {
      create: () => new Float32Array(IDENTITY_MAT4),
      identity: (matrix) => {
        matrix.set(IDENTITY_MAT4);
      },
      fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        let out = new Float32Array(16);
        out[0] = m00;
        out[1] = m01;
        out[2] = m02;
        out[3] = m03;
        out[4] = m10;
        out[5] = m11;
        out[6] = m12;
        out[7] = m13;
        out[8] = m20;
        out[9] = m21;
        out[10] = m22;
        out[11] = m23;
        out[12] = m30;
        out[13] = m31;
        out[14] = m32;
        out[15] = m33;
        return out;
      },
      lookAt: (matrix, eye, center, up) => {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        let eyex = eye[0];
        let eyey = eye[1];
        let eyez = eye[2];
        let upx = up[0];
        let upy = up[1];
        let upz = up[2];
        let centerx = center[0];
        let centery = center[1];
        let centerz = center[2];

        if (
          Math.abs(eyex - centerx) < EPSILON &&
          Math.abs(eyey - centery) < EPSILON &&
          Math.abs(eyez - centerz) < EPSILON
        ) {
          return $.mat4.identity(matrix);
        }

        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;

        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;

        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if (!len) {
          x0 = 0;
          x1 = 0;
          x2 = 0;
        } else {
          len = 1 / len;
          x0 *= len;
          x1 *= len;
          x2 *= len;
        }

        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;

        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if (!len) {
          y0 = 0;
          y1 = 0;
          y2 = 0;
        } else {
          len = 1 / len;
          y0 *= len;
          y1 *= len;
          y2 *= len;
        }

        matrix[0] = x0;
        matrix[1] = y0;
        matrix[2] = z0;
        matrix[3] = 0;
        matrix[4] = x1;
        matrix[5] = y1;
        matrix[6] = z1;
        matrix[7] = 0;
        matrix[8] = x2;
        matrix[9] = y2;
        matrix[10] = z2;
        matrix[11] = 0;
        matrix[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        matrix[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        matrix[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        matrix[15] = 1;

        return matrix;
      },
      perspective: (matrix, field_of_view, aspect_ratio, near, far) => {
        const f = 1.0 / Math.tan(field_of_view / 2);
        matrix[0] = f / aspect_ratio;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;
        matrix[4] = 0;
        matrix[5] = f;
        matrix[6] = 0;
        matrix[7] = 0;
        matrix[8] = 0;
        matrix[9] = 0;
        matrix[11] = -1;
        matrix[12] = 0;
        matrix[13] = 0;
        matrix[15] = 0;
        if (far != null && far !== Infinity) {
          const nf = 1 / (near - far);
          matrix[10] = (far + near) * nf;
          matrix[14] = 2 * far * near * nf;
        } else {
          matrix[10] = -1;
          matrix[14] = -2 * near;
        }
      },
      rotate: (matrix, a, rad, axis) => {
        let [x, y, z] = axis;
        let [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23] = a;

        let len = Math.sqrt(x * x + y * y + z * z);
        let s, c, t;
        let b00, b01, b02;
        let b10, b11, b12;
        let b20, b21, b22;

        if (len < EPSILON) {
          return null;
        }

        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;

        s = Math.sin(rad);
        c = Math.cos(rad);
        t = 1 - c;


        // Construct the elements of the rotation matrix
        b00 = x * x * t + c;
        b01 = y * x * t + z * s;
        b02 = z * x * t - y * s;
        b10 = x * y * t - z * s;
        b11 = y * y * t + c;
        b12 = z * y * t + x * s;
        b20 = x * z * t + y * s;
        b21 = y * z * t - x * s;
        b22 = z * z * t + c;

        // Perform rotation-specific matrix multiplication
        matrix[0] = a00 * b00 + a10 * b01 + a20 * b02;
        matrix[1] = a01 * b00 + a11 * b01 + a21 * b02;
        matrix[2] = a02 * b00 + a12 * b01 + a22 * b02;
        matrix[3] = a03 * b00 + a13 * b01 + a23 * b02;
        matrix[4] = a00 * b10 + a10 * b11 + a20 * b12;
        matrix[5] = a01 * b10 + a11 * b11 + a21 * b12;
        matrix[6] = a02 * b10 + a12 * b11 + a22 * b12;
        matrix[7] = a03 * b10 + a13 * b11 + a23 * b12;
        matrix[8] = a00 * b20 + a10 * b21 + a20 * b22;
        matrix[9] = a01 * b20 + a11 * b21 + a21 * b22;
        matrix[10] = a02 * b20 + a12 * b21 + a22 * b22;
        matrix[11] = a03 * b20 + a13 * b21 + a23 * b22;

        if (a !== matrix) {
          // If the source and destination differ, copy the unchanged last row
          matrix[12] = a[12];
          matrix[13] = a[13];
          matrix[14] = a[14];
          matrix[15] = a[15];
        }
        return matrix;
      },
      scale: (matrix, a, v) => {
        let x = v[0],
          y = v[1],
          z = v[2];

        matrix[0] = a[0] * x;
        matrix[1] = a[1] * x;
        matrix[2] = a[2] * x;
        matrix[3] = a[3] * x;
        matrix[4] = a[4] * y;
        matrix[5] = a[5] * y;
        matrix[6] = a[6] * y;
        matrix[7] = a[7] * y;
        matrix[8] = a[8] * z;
        matrix[9] = a[9] * z;
        matrix[10] = a[10] * z;
        matrix[11] = a[11] * z;
        matrix[12] = a[12];
        matrix[13] = a[13];
        matrix[14] = a[14];
        matrix[15] = a[15];
        return matrix;
      },
      translate(matrix, a, v) {
        let x = v[0],
          y = v[1],
          z = v[2];
        let a00, a01, a02, a03;
        let a10, a11, a12, a13;
        let a20, a21, a22, a23;

        if (a === matrix) {
          matrix[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
          matrix[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
          matrix[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
          matrix[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
          a00 = a[0];
          a01 = a[1];
          a02 = a[2];
          a03 = a[3];
          a10 = a[4];
          a11 = a[5];
          a12 = a[6];
          a13 = a[7];
          a20 = a[8];
          a21 = a[9];
          a22 = a[10];
          a23 = a[11];

          matrix[0] = a00;
          matrix[1] = a01;
          matrix[2] = a02;
          matrix[3] = a03;
          matrix[4] = a10;
          matrix[5] = a11;
          matrix[6] = a12;
          matrix[7] = a13;
          matrix[8] = a20;
          matrix[9] = a21;
          matrix[10] = a22;
          matrix[11] = a23;

          matrix[12] = a00 * x + a10 * y + a20 * z + a[12];
          matrix[13] = a01 * x + a11 * y + a21 * z + a[13];
          matrix[14] = a02 * x + a12 * y + a22 * z + a[14];
          matrix[15] = a03 * x + a13 * y + a23 * z + a[15];
        }

        return matrix;
      },
      invert(out, a) {
        let a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
        let a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
        let a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
        let a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];

        let b00 = a00 * a11 - a01 * a10;
        let b01 = a00 * a12 - a02 * a10;
        let b02 = a00 * a13 - a03 * a10;
        let b03 = a01 * a12 - a02 * a11;
        let b04 = a01 * a13 - a03 * a11;
        let b05 = a02 * a13 - a03 * a12;
        let b06 = a20 * a31 - a21 * a30;
        let b07 = a20 * a32 - a22 * a30;
        let b08 = a20 * a33 - a23 * a30;
        let b09 = a21 * a32 - a22 * a31;
        let b10 = a21 * a33 - a23 * a31;
        let b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det =
          b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
          return null;
        }
        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

        return out;
      },
      transpose(out, a) {
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if (out === a) {
          let a01 = a[1],
            a02 = a[2],
            a03 = a[3];
          let a12 = a[6],
            a13 = a[7];
          let a23 = a[11];

          out[1] = a[4];
          out[2] = a[8];
          out[3] = a[12];
          out[4] = a01;
          out[6] = a[9];
          out[7] = a[13];
          out[8] = a02;
          out[9] = a12;
          out[11] = a[14];
          out[12] = a03;
          out[13] = a13;
          out[14] = a23;
        } else {
          out[0] = a[0];
          out[1] = a[4];
          out[2] = a[8];
          out[3] = a[12];
          out[4] = a[1];
          out[5] = a[5];
          out[6] = a[9];
          out[7] = a[13];
          out[8] = a[2];
          out[9] = a[6];
          out[10] = a[10];
          out[11] = a[14];
          out[12] = a[3];
          out[13] = a[7];
          out[14] = a[11];
          out[15] = a[15];
        }

        return out;
      },
      multiply(out, a, b) {
        let a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
        let a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
        let a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
        let a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];

        // Cache only the current line of the second matrix
        let b0 = b[0],
          b1 = b[1],
          b2 = b[2],
          b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
      },
    },
    vec3: {
      create: () => new Float32Array(3),
      clone(a) {
        var out = new Float32Array(3);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        return out;
      },
      fromValues(x, y, z) {
        let out = $.vec3.create();
        out[0] = x;
        out[1] = y;
        out[2] = z;
        return out;
      },
      add(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
      },
      transformMat3(out, a, m) {
        const [x, y, z] = a;
        out[0] = x * m[0] + y * m[3] + z * m[6];
        out[1] = x * m[1] + y * m[4] + z * m[7];
        out[2] = x * m[2] + y * m[5] + z * m[8];
        return out;
      },
      transformMat4(out, a, m) {
        const [x, y, z] = a;
        let w = m[3] * x + m[7] * y + m[11] * z + m[15];
        w = w || 1.0;
        out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
        out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
        out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
        return out;
      },
      dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      },
      negate(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        out[2] = -a[2];
        return out;
      },
      normalize(out, a) {
        let x = a[0];
        let y = a[1];
        let z = a[2];
        let len = x * x + y * y + z * z;
        if (len > 0) {
          //TODO: evaluate use of glm_invsqrt here?
          len = 1 / Math.sqrt(len);
        }
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        return out;
      }
    },
    vec4: {
      create: () => new Float32Array(4),
      normalize(vector, input) {
        let [x, y, z, w] = input;
        let len = x * x + y * y + z * z + w * w;
        if (len > 0) {
          //TODO: evaluate use of glm_invsqrt here?
          len = 1 / Math.sqrt(len);
        }

        vector[0] = input[0] * len;
        vector[1] = input[1] * len;
        vector[2] = input[2] * len;
        vector[3] = input[3] * len;

        return vector;
      },
      fromValues(x, y, z, w) {
        let out = new Float32Array(4);
        out[0] = x;
        out[1] = y;
        out[2] = z;
        out[3] = w;
        return out;
      },
      transformMat4(out, a, m) {
        let x = a[0],
          y = a[1],
          z = a[2],
          w = a[3];
        out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
        return out;
      },
    },
  }

  return $;
})