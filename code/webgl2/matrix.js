mdlr('webgl2:matrix', m => {

  // heavily inspired by https://github.com/toji/gl-matrix

  const EPSILON = 0.000001;

  const IDENTITY = [
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  ];

  return {
    mat4: {
      create: () => new Float32Array(IDENTITY),
      identity: (matrix) => {
        matrix.set(IDENTITY);
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
          return this.identity(matrix);
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
      }
    }
  }

})