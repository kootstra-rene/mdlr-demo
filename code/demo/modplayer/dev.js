mdlr('[web]demo:modplayer-dev:pattern-channel', m => {

  m.html`
    {:self autohide}
    <div>chan#{id}</div>
    {#each row in channel.rows}
      <div>{note(row)}</div>
    {/each}
  `;

  m.style`
    display: inline-block;
    width: 128px;
  `;

  return class {
    id
    channel;

    note([note, instrument, volume, effect, parameters]) {
      const eff = (effect << 8) + parameters;
      return `${!note ? '\xb7\xb7\xb7' : note.toString().padStart(3, '0')} ${!instrument ? '\xb7\xb7' : instrument.toString(16).padStart(2, '0')}  ${!volume ? '\xb7\xb7' : volume.toString(16).padStart(2, '0')} ${!eff ? '\xb7\xb7\xb7' : eff.toString(16).padStart(3, '0')}`;
    }

    $stable() {
      return [this.channel];
    }
  }

})

mdlr('[web]demo:modplayer-dev', m => {

  m.require('[web]demo:modplayer-dev:pattern-channel');

  const text = (view, base, size) => {
    const nameBytes = [...new Array(size)].map((a, i) => view.getUint8(base + i)).filter(a => a);
    return String.fromCodePoint(...nameBytes).trim();
  }

  m.html`
  {#each {id,name,samples} in instruments}
  <div><span>{id} - {name}</span>
    {#each s,i in samples}
      <button on{click=()=>click(s)}>{i}</button>
    {/each}
  </div>
  {/each}

  <hr/>
  {#each p in pattern_order}
  <button on{click=()=>channels=patterns[p].channels}>{p}</button>
  {/each}
  <br/>

  <hr/>
  <div patterns>
    {#each channel, i in channels}
      <pattern-channel id={i+1} channel={} />
    {:else}
      Select pattern...
    {/each}
    <br/>
  </div>
  `;

  m.style`
  width: 100%;
  height: 100%;
  overflow: auto auto;
  display: block;

  > div > span {
    display: inline-block;
    width: 200px;
  }

  > div[patterns] {
    width: 4096px;
    font-family: monospace;

    > div[channel] {
      display: inline-block;
      width: 128px;

      > span {
        display: inline-block;
      }
    }
  }
  `;
  return class {
    instruments = [];
    pattern_info = [];
    pattern_order = [];
    pattern = 0;

    channels = [];
    patterns = [];

    context;
    worklet;

    async connected() {
      window.$state = this;

      // 33432 = ambrozia.xm
      // 33501 = an_path.xm
      // 34435 = aws_futu.xm
      // 35280 = deadlock.xm
      // 46496 = jt_letgo.xm
      // 66187 = external.xm
      // 167157 = radix_-_yuki_satellites.xm
      // 185350 = atekuro_-_point_of_departure.xm
      const buffer = await fetch("https://api.modarchive.org/downloads.php?moduleid=185350", {
        "referrer": "https://localhost/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit"
      }).then(res => res.arrayBuffer());

      const view = new DataView(buffer);

      // XM
      const extended_module = text(view, 0, 17);
      const module_name = text(view, 17, 20);
      const tracker_name = text(view, 38, 20);
      const version = view.getUint16(58, true);
      const header_size = view.getUint32(60, true);
      const song_length = view.getUint16(64, true);
      const restart_position = view.getUint16(66, true);
      const number_channels = view.getUint16(68, true);
      const number_patterns = view.getUint16(70, true);
      const number_instruments = view.getUint16(72, true);
      const flags = view.getUint16(74, true);
      const default_tempo = view.getUint16(76, true);
      const default_bpm = view.getUint16(78, true);
      const pattern_order_table = new Uint8Array(buffer, 80, song_length);

      this.pattern_order = pattern_order_table;
      this.pattern = pattern_order_table[0];

      // console.log(extended_module);
      // console.log(module_name);
      // console.log(tracker_name);
      // console.log(version.toString(16));
      // console.log(header_size);
      // console.log(song_length);
      // console.log(restart_position);
      // console.log(number_channels);
      // console.log(number_patterns);
      // console.log(number_instruments);
      // console.log(flags.toString(16));
      // console.log(default_tempo);
      // console.log(default_bpm);
      // console.log(pattern_order_table);

      const pattern_info = this.pattern_info = [];

      let base = 0x150;
      for (let p = 0; p < number_patterns; ++p) {
        // console.log('pattern #' + p);

        const header_size = view.getUint32(base + 0, true);
        const packing_type = view.getUint8(base + 4);
        const numbers_rows = view.getUint16(base + 5, true);
        const pattern_data_size = view.getUint16(base + 7, true);
        const pattern_data = new Uint8Array(buffer, base + header_size, pattern_data_size);

        pattern_info[p] = [...new Array(numbers_rows).fill(0).keys()];
        // console.log(pattern_info[p]);

        // console.log(header_size);
        // console.log(packing_type);
        // console.log(numbers_rows);
        // console.log(pattern_data_size, pattern_data_size % 5 ? 'likely packed' : '');
        // console.log(pattern_data);

        let index = 0;
        let pattern = this.patterns[p] = { channels: [] };

        for (let row = 0; pattern_data_size && row < numbers_rows; ++row) {
          for (let channel = 0; channel < number_channels; ++channel) {
            let rows, note, instrument, volume, effect, parameters, byte = pattern_data[index++];

            if (byte & 0x80) {
              // packed
              note = (byte & 0x01) ? pattern_data[index++] : 0;
              instrument = (byte & 0x02) ? pattern_data[index++] : 0;
              volume = (byte & 0x04) ? pattern_data[index++] : 0;
              effect = (byte & 0x08) ? pattern_data[index++] : 0;
              parameters = (byte & 0x10) ? pattern_data[index++] : 0;
            }
            else {
              note = byte;
              instrument = pattern_data[index++];
              volume = pattern_data[index++];
              effect = pattern_data[index++];
              parameters = pattern_data[index++];
            }

            ({ rows } = pattern.channels[channel] = pattern.channels[channel] ?? { rows: [] });
            rows[row] = [note, instrument, volume, effect, parameters];
          }
        }
        if (index !== pattern_data_size) throw 42;

        base += (header_size + pattern_data_size);
      }

      console.log(this.patterns)

      const instruments = this.instruments = [];

      for (let p = 0; p < number_instruments; ++p) {

        // console.log('instrument #' + p);

        const instrument_size = view.getUint32(base + 0, true);
        const instrument_name = text(view, base + 4, 22) || '...';
        const instrument_type = view.getUint8(base + 26);
        const number_samples = view.getUint16(base + 27, true);
        const sample_header_size = view.getUint16(base + 29, true);

        // console.log(instrument_size);
        // console.log(instrument_name);
        // console.log(instrument_type);
        // console.log(number_samples);
        // console.log(sample_header_size);

        base += (instrument_size);

        const instrument = {
          id: p,
          name: instrument_name,
          samples: [],
        };
        instruments.push(instrument);

        const samples = instrument.samples;

        for (let s = 0; s < number_samples; ++s) {
          // console.log('sample #' + s);

          const sample_size = view.getUint32(base + 0, true);

          const sample_loop_start = view.getUint32(base + 4, true);
          const sample_loop_length = view.getUint32(base + 8, true);
          const sample_type = view.getUint8(base + 14);
          const sample_name = text(view, base + 18, 22) || '...';

          // console.log(sample_name);
          // console.log(sample_type.toString(16), sample_loop_start, sample_loop_length, sample_size, sample_size - sample_loop_start);

          samples[s] = [sample_size, [sample_type, sample_loop_start, (sample_loop_start + sample_loop_length)]];

          base += sample_header_size;
        }

        for (let s = 0; s < number_samples; ++s) {
          const sample_size = samples[s][0];
          const sample_type = samples[s][1][0];

          if (sample_type & 0x10) {
            const view = new DataView(buffer, base, sample_size);

            const sample_buffer = new Float32Array(sample_size >>> 1);
            for (let i = 0, acc = 0; i < sample_size; i += 2) {
              acc = ((view.getInt16(i, true) + acc) << 16) >> 16;
              sample_buffer[i >>> 1] = acc / 32768.0;
            }

            const [type, start, end] = samples[s][1];
            samples[s][1] = [type, start >>> 1, end >>> 1];
            samples[s][0] = sample_buffer;
          }
          else {
            const view = new DataView(buffer, base, sample_size);

            const sample_buffer = new Float32Array(sample_size);
            for (let i = 0, acc = 0; i < sample_size; ++i) {
              acc = ((view.getInt8(i) + acc) << 24) >> 24;
              sample_buffer[i] = acc / 128.0;
            }
            // console.log(sample_buffer);
            samples[s][0] = sample_buffer;
          }

          base += sample_size;
        }

        instrument.samples = samples.filter(([sample_buffer]) => sample_buffer.length)
      }
    }

    async click(sample) {
      let { context, worklet } = this;

      if (!context || !worklet) {
        context = this.context = new AudioContext();
        await context.audioWorklet.addModule('/bundle/unit/demo:modplayer:worklet-dev');

        worklet = this.worklet = new AudioWorkletNode(context, 'modplay', {
          numberOfOutputs: 1,
          numberOfInputs: 0,
        });

        worklet.port.start();
        worklet.connect(context.destination);
      }

      console.log(sample)
      worklet.port.postMessage(['sample', sample]);
    }
  }
})

mdlr('demo:modplayer:worklet-dev', m => {

  registerProcessor('modplay', class extends AudioWorkletProcessor {

    #internals;

    constructor() {
      super();

      this.port.onmessage = ({ data: [type, params] }) => {
        // console.log(type, params);

        this.#internals = [0, 1, ...params];
      }
    }

    process(inputs, outputs, parameters) {
      let [index, step, samples, [loop, start, end]] = this.#internals;

      loop &= 3;

      outputs.forEach(([output], ch) => {
        const lastSample = loop && end ? end : samples.length;

        for (let i = 0; i < 128; ++i) {
          output[i] = index < lastSample ? samples[index] : 0.0;

          // make all samples loops then this logic is not needed requires adjusting of samples and loops.

          index += step;

          if (loop === 1 && index >= lastSample) {
            index = start;
          }
          else if (loop === 2) {
            if (step > 0 && index >= lastSample) {
              index = lastSample - 1;
              step = -1;
            }
            else
              if (step < 0 && index < start) {
                index = start + 1;
                step = +1;
              }
          }
        }
        this.#internals = [index, step, samples, [loop, start, end]];
      });

      return true;
    }
  });

})
