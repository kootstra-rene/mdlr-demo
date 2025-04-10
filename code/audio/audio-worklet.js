mdlr('audio:worklet', m => {

  registerProcessor('audio:worklet', class extends AudioWorkletProcessor {

    #internals;

    constructor() {
      super();

      const { port } = this;

      this.#internals = [[], []];

      port.onmessage = ({ data: [command, [l, r]] }) => {
        if (command === 'flush') {
          this.#internals = [[], []];
        }
        if (command === 'audio') {
          // keep at maximum 2 blocks.
          this.#internals[0].push(l);
          this.#internals[1].push(r);
        }
      }
    }

    process(_, outputs) {
      outputs.forEach(([output], ch) => {
        const audio = this.#internals[ch].shift();
        if (audio) output.set(audio, 0);
      });

      return true;
    }

  })

})