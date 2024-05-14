mdlr('[web]demo:modplayer-analyser', m => {
  const DPR = devicePixelRatio;
  const WIDTH = 96;
  const HEIGHT = 48;

  m.html`<canvas{} width="${WIDTH * DPR}" height="${HEIGHT * DPR}" />`;

  m.style`
  display: block;

  > canvas {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
  }
  `;

  return class {
    canvas;
    analyser;
    #context;
    #dataArray = new Float32Array(WIDTH);

    connected() {
      const context = this.#context = this.canvas.getContext('2d', { alpha: true }); // todo: fix web plugin to support just context
      context.imageSmoothingEnabled = false;
      context.imageSmoothingQuality = 'high';
      context.strokeStyle = "black";
      context.lineWidth = 1;

      context.translate(0.5, 0.5);
      context.scale(DPR, DPR);
    }

    beforeRender() {
      const { analyser } = this;
      const context = this.#context;
      const dataArray = this.#dataArray;
      const sliceWidth = WIDTH / WIDTH;

      if (!analyser) return;

      analyser.getFloatTimeDomainData(dataArray);

      context.clearRect(-1, -1, WIDTH + 1, HEIGHT + 1);
      context.beginPath();

      let x = 0;

      for (let i = 0; i < WIDTH; ++i) {
        const v = dataArray[i] * (HEIGHT / 2);
        const y = (HEIGHT / 2 + v);

        if (i === 0) {
          context.moveTo(x, y);
        }
        else {
          context.lineTo(x, y);
        }
        x += sliceWidth;
      }

      context.stroke();
    }
  }
})

mdlr('[web]demo:modplayer-channel', m => {

  m.require('[web]demo:modplayer-analyser');

  const hex = (value, digits) => value.toString(16).padStart(digits, '0')

  const valid_row = row => row >= 0 && row <= 63;

  const paula_notes = [
    'c-', 'c#', 'd-', 'd#', 'e-', 'f-',
    'f#', 'g-', 'g#', 'a-', 'a#', 'b-'];

  const paula = new Map([
    856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, // C-1 to B-1 Finetune 0
    428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226, // C-2 to B-2 Finetune 0
    214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113, // C-3 to B-3 Finetune 0
  ].map((a, i) => [a, `${paula_notes[i % 12]}${1 + (i / 12) | 0}`]));

  m.html`
  <modplayer-analyser{=} />
  {#each o in offsets}
    <div class="o{o}">{note(o)}</div>
  {/each}
  `;

  m.style`
  display: inline-block;
  font-family: monospace;

  > div {
    text-align: center;
    line-height: 1rem;
    height: 1rem;

    &.o0 {
      background-color: gray;
    }
  }

  > modplayer-analyser {
    background-color: lightgray;
  }
  `;

  return class {
    offsets = [];
    analyser;
    notes;
    row;

    note(o) {
      const { notes, row } = this;
      const pattern = row >>> 6;
      const pattern_row = (row & 63) + o;
      if (!notes || !valid_row(pattern_row)) return '';

      const requested_row = (pattern << 6) | pattern_row;
      const note = notes[requested_row] ?? 0;
      const effect = (note >>> 0) & 0xfff;
      const period = (note >>> 16) & 0xfff;
      const instrument = ((note >>> 24) & 0xf0) | ((note >>> 12) & 0x0f);

      return `${paula.get(period) ?? '---'} ${hex(instrument & 31, 2)} ${effect ? hex(effect, 3) : '...'}`;
    }
  }

})

mdlr('[web]demo:modplayer-app', m => {

  m.require('[web]demo:modplayer-channel');

  const mod_type = new Map([
    ['M.K.', { num_channels: 4 }],
    ['8CHN', { num_channels: 8 }],
    ['20CH', { num_channels: 20 }],
  ]);

  const text = (view, base, size) => {
    const nameBytes = [...new Array(size)].map((a, i) => view.getUint8(base + i)).filter(a => a);
    return String.fromCodePoint(...nameBytes).trim();
  }

  const $files = [
    ['agony (intro)', 'https://api.modarchive.org/downloads.php?moduleid=124303'],
    ['drum-bass', 'https://api.modarchive.org/downloads.php?moduleid=168110'],
    ['another world', 'https://api.modarchive.org/downloads.php?moduleid=104957'],
    ['speedball 2', 'https://api.modarchive.org/downloads.php?moduleid=130970'],
    ['popcorn', 'https://api.modarchive.org/downloads.php?moduleid=52767'],
    ['silkworm', 'https://api.modarchive.org/downloads.php?moduleid=83115'],
    ['desert-strike', 'https://api.modarchive.org/downloads.php?moduleid=68835'],
    ['space-debris', 'https://api.modarchive.org/downloads.php?moduleid=57925'],
    ['shadow of the beast (title)', 'https://media.demozoo.org/music/ba/d2/biititle.MOD'],
    ['shadow of the beast (gameover)', 'https://api.modarchive.org/downloads.php?moduleid=90997'],
    ['shadow of the beast (attack)', 'https://api.modarchive.org/downloads.php?moduleid=104018'],
    ['shadow of the beast 2', 'https://api.modarchive.org/downloads.php?moduleid=125974'],
    ['pinball illusions', 'https://api.modarchive.org/downloads.php?moduleid=55058'],
    ['her 4', 'https://ftp.modland.com/pub/modules/Protracker/Estrayk/her%2041.mod'],
    ['swiv (title)', 'https://api.modarchive.org/downloads.php?moduleid=169441'],
    ['amiga power', 'https://api.modarchive.org/downloads.php?moduleid=65565'],
    ['lotus2 title', 'https://api.modarchive.org/downloads.php?moduleid=87180'],
    ['cannon fodder', 'https://api.modarchive.org/downloads.php?moduleid=34568'],
    ['ambient power', 'https://api.modarchive.org/downloads.php?moduleid=33431'],
    ['projectx', 'https://api.modarchive.org/downloads.php?moduleid=56660'],
    ['sweet dreams', 'https://api.modarchive.org/downloads.php?moduleid=167668'],
    ['axelf', 'https://api.modarchive.org/downloads.php?moduleid=32394'],
    ['elysium', 'https://api.modarchive.org/downloads.php?moduleid=40475'],
    ['visions', 'https://api.modarchive.org/downloads.php?moduleid=37530'],
    ['deadline caught me', 'https://api.modarchive.org/downloads.php?moduleid=194236'],
    ['classic', 'https://api.modarchive.org/downloads.php?moduleid=160640'],
    ['stardust', 'https://api.modarchive.org/downloads.php?moduleid=59344'],
    ['pofessional tracker', 'https://www.stef.be/bassoontracker/demomods/hoffman_and_daytripper_-_professional_tracker.mod'],
    ['enigma', 'https://www.stef.be/amiga/mod/enigma.mod'],
    ['der weg des kriegers', 'https://api.modarchive.org/downloads.php?moduleid=154946'],
    ['depech mode mix', 'https://api.modarchive.org/downloads.php?moduleid=162419'],
    ['autobahn', 'https://api.modarchive.org/downloads.php?moduleid=121128'],
    ['deep house nine', 'https://api.modarchive.org/downloads.php?moduleid=112714'],
    ['plasma sucker', 'https://api.modarchive.org/downloads.php?moduleid=113391'],
    ['beast in castle', 'https://api.modarchive.org/downloads.php?moduleid=103989'],
    ['underwater-remix', 'https://api.modarchive.org/downloads.php?moduleid=58742'],
    ['airwolf', 'https://api.modarchive.org/downloads.php?moduleid=159538'],
    ['menu magic iii', 'https://api.modarchive.org/downloads.php?moduleid=127959'],
    ['the amen breaks', 'https://api.modarchive.org/downloads.php?moduleid=119507'],
    ['krunk\'d','https://api.modarchive.org/downloads.php?moduleid=175221'],
    // ['the sectret', 'https://api.modarchive.org/downloads.php?moduleid=194298#thunder_-_the_secret.symmod']
  ];

  m.html`
  <select id="song" on{change}>
    <option disabled hidden>choose</option>
    ${$files.map(([name, url]) => `<option value="${url}" selected={"${url}" === url}>${name}</option>`).join('')}
  </select>
  <span> {position}</span><span> - </span><span>{row >>> 6}</span><span>:</span><span>{row & 63}</span>
  <div/>
  {#each [notes],i in channels}
    <modplayer-channel{=} notes={} analyser={analysers[i]} />
  {/each}
  `;

  return class {
    // offsets = [-15, -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    offsets = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
    row = 0;
    position;
    positions;
    worklet;
    url;
    channels;

    analysers = [];
    num_channels;

    async change(e) {
      let { worklet, analysers } = this;

      worklet?.port.close();
      worklet?.disconnect();

      const response = await fetch(this.url = e.target.value);
      const array_buffer = await response.arrayBuffer();
      const state = this.loadFile(array_buffer);

      const audio = new AudioContext;
      // const audio = new AudioContext({sampleRate:28837}); // paula
      await audio.audioWorklet.addModule('/app/unit/demo:modplayer:worklet');

      const [, channels, num_channels] = state;
      this.channels = channels;
      this.num_channels = num_channels;
      worklet = this.worklet = new AudioWorkletNode(audio, 'demo:modplayer:worklet', {
        numberOfOutputs: num_channels,
        numberOfInputs: 0,
      });

      worklet.port.start();

      worklet.port.onmessage = ({ data }) => {
        const [type, ...args] = data;
        // console.log('message', data);
        switch (type) {
          case 'trace':
            console.warn(...args);
            break;
          case 'row':
            ([this.row, this.position] = args);
            break;
        }
      }

      const merger = audio.createChannelMerger(2);
      const filter = new BiquadFilterNode(audio, { frequency: audio.sampleRate / 2 });
      const analyserConfig = { fftSize: 256 };

      merger.connect(filter);
      filter.connect(audio.destination);

      const merger_mapping = [0, 1, 1, 0];
      analysers.length = num_channels;
      for (let ch = 0; ch < num_channels; ++ch) {
        analysers[ch] = new AnalyserNode(audio, analyserConfig)
        worklet.connect(merger, ch, merger_mapping[ch & 3]);
        worklet.connect(analysers[ch], ch);
      }
      this.worklet.port.postMessage(state);
    }

    loadFile(array_buffer) {
      const view = new DataView(array_buffer);
      const name = text(view, 0, 20);
      const type = text(view, 1080, 4);

      const known_type =  mod_type.get(type);
      console.log(`*** ${name} (${type}) ***`);

      const max_samples = known_type ? 31 : 15;
      const pattern_base = known_type ? 950 : 470;
      const samples_base = known_type ? 1084 : 600;

      const song_length = view.getInt8(pattern_base);
      // const songEnd = view.getInt8(pattern_base + 1, true);

      const num_channels = mod_type.get(type)?.num_channels ?? 4;
      const pattern_size = num_channels << 8;

      console.log(num_channels, pattern_size, max_samples);
      const pattern_table = new Uint8Array(array_buffer, pattern_base + 2, song_length);
      const max_pattern = Math.max(...pattern_table);
      const positions = this.positions = [...pattern_table];

      const samples = [null];
      let samplesStart = samples_base + (max_pattern + 1) * pattern_size;

      for (let i = 0; i < max_samples; ++i) {
        const view = new DataView(array_buffer, 20 + i * 30, 30);
        const length = view.getUint16(22) << 1;
        const name = text(view, 0, 22);
        const finetune = view.getInt8(24) << 28 >> 28;
        const volume = view.getInt8(25);
        const repeatOffset = view.getUint16(26) << 1;
        const repeatLength = view.getUint16(28) << 1;
        const size = (samplesStart + length > array_buffer.byteLength) ? array_buffer.byteLength - samplesStart : length;
        const audio = new Int8Array(array_buffer, samplesStart, size);
        samplesStart += size;
        console.log(`- ${name}: ${size} (${repeatOffset}..${repeatOffset + repeatLength}) <<${finetune}>>`);

        samples.push([
          name,
          [...audio].map(a => (+a / 196.0)),
          size,
          volume,
          repeatOffset,
          repeatOffset + repeatLength,
          finetune,
        ]);

        // console.log('=>', samples[samples.length-1]);
      }

      const channels = [];
      for (let ch = 0; ch < num_channels; ++ch) {
        // store notes per channel for all patterns.
        const [notes] = channels[ch] = [
          new Uint32Array((max_pattern + 1) << 6),
          samples
        ];

        for (let i = 0; i <= max_pattern; ++i) {
          const view = new DataView(array_buffer, samples_base + i * pattern_size + (ch << 2), pattern_size);

          for (let row = 0; row < 64; ++row) {
            notes[(i << 6) | row] = view.getUint32(row * (num_channels << 2));
          }
        }
      }

      return [
        positions,
        channels,
        num_channels,
      ]
    }
  }
})