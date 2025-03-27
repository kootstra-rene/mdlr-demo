mdlr('random:mt19937', m => {
  // based on https://gist.github.com/banksean/300494

  const N = 624;
  const M = 397;
  const FACTOR_A = 0x6c078965;
  const MATRIX_A = 0x9908b0df;
  const UPPER_MASK = 0x80000000;
  const LOWER_MASK = 0x7fffffff;
  const MAG01 = new Uint32Array([0, MATRIX_A]);

  class MersenneTwister {
    constructor(seed = Date.now()) {
      this.mt = new Uint32Array(N);
      this.mti = N;

      this.#initialize(seed);
    }

    randomInt32() {
      const { mti, mt } = this;

      if (mti >= N) {
        this.#generate();
        this.mti = 0;
      }

      let y = mt[this.mti++];

      y ^= (y >>> 11);
      y ^= (y << 7) & 0x9d2c5680;
      y ^= (y << 15) & 0xefc60000;
      y ^= (y >>> 18);

      return y >>> 0;
    }

    #initialize(s) {
      const { mt } = this;

      mt[0] = s >>> 0;
      for (let mti = 1; mti < N; ++mti) {
        const s = (mt[mti - 1] ^ (mt[mti - 1] >>> 30)) >>> 0;

        mt[mti] = ((((s >>> 16) * FACTOR_A) << 16) + (s & 0xffff) * FACTOR_A) + mti;
      }
    }

    #generate() {
      const { mt } = this;
      let kk = 0, y;

      for (; kk < N - M; ++kk) {
        y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
        mt[kk] = mt[kk + M] ^ (y >>> 1) ^ MAG01[y & 1];
      }

      for (; kk < N - 1; ++kk) {
        y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
        mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ MAG01[y & 1];
      }

      y = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK);
      mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ MAG01[y & 1];
    }
  }

  return { MersenneTwister };
})