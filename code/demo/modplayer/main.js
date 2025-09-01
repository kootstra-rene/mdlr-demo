mdlr('[web]demo:modplayer-analyser', m => {
  const DPR = devicePixelRatio;
  const WIDTH = 128;
  const HEIGHT = 80;

  m.html`<canvas{} width="${WIDTH * DPR}" height="${HEIGHT * DPR}" />`;

  m.style`
  display: contents;
  cursor: pointer;

  > canvas {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    outline: none; 
    border: none;
    background-color: #222;
    color: cyan;
  }
  `;

  return class {
    canvas;
    analyser;
    #context;
    #dataArray = new Float32Array(WIDTH);
    mute;

    connected() {
      const context = this.#context = this.canvas.getContext('2d', { alpha: false }); // todo: fix web plugin to support just context
      context.imageSmoothingEnabled = false;
      // context.imageSmoothingQuality = 'high';
      context.lineWidth = 0.75 * DPR;

      context.translate(0.5, 0.5);
      context.scale(DPR, DPR);
    }

    beforeRender() {
      const { analyser } = this;
      const context = this.#context;
      const dataArray = this.#dataArray;
      const sliceWidth = WIDTH / WIDTH;

      if (!analyser || !context) return;

      analyser.getFloatTimeDomainData(dataArray);

      context.fillStyle = this.mute ? '#000' : '#2224';
      context.fillRect(-1, -1, WIDTH + 1, HEIGHT + 1);
      context.beginPath();
      context.strokeStyle = this.mute ? 'darkcyan' : 'cyan';

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

      // return 1000/25;
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
    1712, 1616, 1525, 1440, 1357, 1281, 1209, 1141, 1077, 1017, 961, 907, // C-0 to B-0 Finetune 0
    856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453, // C-1 to B-1 Finetune 0
    428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226, // C-2 to B-2 Finetune 0
    214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113, // C-3 to B-3 Finetune 0
    107, 101, 95, 90, 85, 80, 76, 71, 67, 64, 60, 57, // C-4 to B-4 Finetune 0
  ].map((a, i) => [a, `${paula_notes[i % 12]}${(i / 12) | 0}`]));

  m.html`
  <modplayer-analyser{=} on{click} />
  {#each o in offsets}
    <div class="{o ? false : 'center'}">{note(o)}</div>
  {/each}
  `;

  m.style`
  display: inline-block;
  font-family: monospace;

  > div {
    text-align: center;
    line-height: 0.9rem;
    height: 0.9rem;
    user-select: none;

    &.center {
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
    gain;
    notes;
    row;
    mute = false;

    note(o) {
      const { notes, row } = this;
      const pattern = row >>> 6;
      const pattern_row = (row & 63) + o;
      if (!notes || !valid_row(pattern_row)) return '\xa0';

      const requested_row = (pattern << 6) | pattern_row;
      const note = notes[requested_row] ?? 0;
      const effect = (note >>> 0) & 0xfff;
      const period = (note >>> 16) & 0xfff;
      const instrument = ((note >>> 24) & 0xf0) | ((note >>> 12) & 0x0f);

      return `${paula.get(period) ?? '\xb7\xb7\xb7'} ${instrument ? hex(instrument & 31, 2) : '\xb7\xb7'} ${'\xb7\xb7'} ${effect ? hex(effect, 3) : '\xb7\xb7\xb7'}`;
    }

    click() {
      this.mute = !this.mute;
      this.gain.gain.value = this.mute ? 0 : 0.8;
    }

    $stable() {
      return [this.row];
    }
  }

})

mdlr('[web]demo:modplayer-files', m => {

  m.html`
  <select id="song" on{change}>
    <option disabled hidden>choose</option>
    {#each [name, u] in files}
      <option value="{u}" selected={u === url}>{name}</option>
    {/each}
  </select>
  `;

  return class {
    files;
    select;
    url;

    change(e) {
      this.select(this.url = e.target.value);
    }

    $stable() {
      return [this.url];
    }

  }

})

mdlr('[web]demo:modplayer-app', m => {

  m.require('[web]demo:modplayer-files');
  m.require('[web]demo:modplayer-channel');

  const mod_type = new Map([
    ['M.K.', { num_channels: 4 }],
    ['8CHN', { num_channels: 8 }],
    ['12CH', { num_channels: 12 }],
    ['16CH', { num_channels: 16 }],
    ['20CH', { num_channels: 20 }],
    ['24CH', { num_channels: 24 }],
    ['28CH', { num_channels: 28 }],
    ['32CH', { num_channels: 32 }],
  ]);

  const text = (view, base, size) => {
    const nameBytes = [...new Array(size)].map((a, i) => view.getUint8(base + i)).filter(a => a);
    return String.fromCodePoint(...nameBytes).trim();
  }

  const modarchive = id => `https://api.modarchive.org/downloads.php?moduleid=${id}`;

  const $files = [
    ['agony (intro)', modarchive(124303)],
    ['drum-bass', modarchive(168110)],
    ['another world', modarchive(104957)],
    ['speedball 2', modarchive(130970)],
    ['popcorn', modarchive(52767)],
    ['silkworm', modarchive(83115)],
    ['desert-strike', modarchive(68835)],
    ['space-debris', modarchive(57925)],
    ['shadow of the beast (gameover)', modarchive(90997)],
    ['shadow of the beast (attack)', modarchive(104018)],
    ['shadow of the beast 2', modarchive(125974)],
    ['shadow of the beast 3 (intro)', modarchive(126132)],
    ['pinball illusions', modarchive(55058)],
    ['her 4', modarchive(45463)],
    ['swiv (title)', modarchive(169441)],
    ['amiga power', modarchive(65565)],
    ['lotus2 title', modarchive(87180)],
    ['cannon fodder', modarchive(171397)],
    ['ambient power', modarchive(33431)],
    ['projectx', modarchive(56660)],
    ['sweet dreams', modarchive(167668)],
    ['axelf', modarchive(32394)],
    ['elysium', modarchive(40475)],
    ['visions', modarchive(37530)],
    ['deadline caught me', modarchive(194236)],
    ['eyegaboom', modarchive(43053)],
    ['classic', modarchive(160640)],
    ['stardust', modarchive(59344)],
    ['pofessional tracker', modarchive(174955)],
    ['enigma', modarchive(42146)],
    ['der weg des kriegers', modarchive(154946)],
    ['depech mode mix', modarchive(162419)],
    ['autobahn', modarchive(121128)],
    ['deep house nine', modarchive(112714)],
    ['plasma sucker', modarchive(113391)],
    ['beast in castle', modarchive(103989)],
    ['underwater-remix', modarchive(58742)],
    ['airwolf', modarchive(159538)],
    ['menu magic iii', modarchive(127959)],
    ['the amen breaks', modarchive(119507)],
    ['krunk\'d', modarchive(175221)],
    ['twilight chuckles', modarchive(66793)],
    ['guitar slinger', modarchive(42560)],
    ['physical presence', modarchive(104644)],
    ['resonance2', modarchive(54859)],
    ['fountain', modarchive(40748)],
    ['giel song', modarchive(183132)],
    ['trans atlantic', modarchive(105709)],
    ['living insanity', modarchive(48324)],
    ['mk', modarchive(52117)],
    ['g thang', modarchive(180323)],
    ['mosquito', modarchive(186024)],
    ['japan hills', modarchive(65727)],
    ['open the eyes', modarchive(61278)],
    ['lonesome', modarchive(48739)],
    ['thrones', modarchive(172293)],
    ['try again', modarchive(58443)],
    ['dope', modarchive(35344)],
    ['ravers megamix', modarchive(62009)],
    ['slow step', modarchive(207783)],
    ['cream of the earth', modarchive(120017)],
    ['playing with delay', modarchive(67779)]

  ];

  m.html`
  <modplayer-files{=} class="{channels?.length ? 'open' : ''}" />
  <div/>
  {#each [notes],i in channels}
    <modplayer-channel{=} .notes={} .gain={gains[i]} .analyser={analysers[i]} />
  {/each}
  `;

  m.style`
  display: inline-block;
  background: rgba(223, 223, 223, 0.5);
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(223, 223, 223, 0.25);
  padding: 0.25rem;
  position: relative;
  left: 50%;
  translate: -50% -50%;
  top: 50%;
  min-width: calc(512px + 0.65rem);
  max-width: calc(1024px + 0.65rem);
  overflow: auto;
  max-height: 100%;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  modplayer-files.open {
    display: block;
    padding-bottom: 0.25rem;
  }
  `;

  return class {
    offsets = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
    row = 0;
    position;
    positions;
    worklet;
    channels;
    audioContext;
    files = $files;
    url;

    analysers = [];
    gains = [];
    num_channels;

    async select(url) {
      let { worklet, analysers, gains, audioContext } = this;

      audioContext?.suspend();

      worklet?.disconnect();
      worklet?.port.close();
      gains?.forEach(n => n.disconnect());
      analysers?.forEach(n => n.disconnect());

      const response = await fetch(this.url = url);
      const array_buffer = await response.arrayBuffer();
      const state = this.loadFile(array_buffer);

      audioContext?.close();

      audioContext = this.audioContext = new AudioContext();
      await audioContext.audioWorklet.addModule('/bundle/unit/demo:modplayer:worklet');

      const [, channels, num_channels] = state;
      this.channels = channels;
      this.num_channels = num_channels;
      worklet = this.worklet = new AudioWorkletNode(audioContext, 'mod', {
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

      const merger = audioContext.createChannelMerger(2);
      // const filter = new BiquadFilterNode(audioContext, { frequency: audioContext.sampleRate / 2 });
      const analyserConfig = { fftSize: 256 };
      const merger_mapping = [0, 1, 1, 0];

      // merger.connect(filter);
      // filter.connect(audioContext.destination);
      merger.connect(audioContext.destination);

      analysers.length = num_channels;
      for (let ch = 0; ch < num_channels; ++ch) {
        gains[ch] = new GainNode(audioContext);
        gains[ch].gain.value = 0.8;
        gains[ch].connect(merger, 0, merger_mapping[ch & 3]);
        worklet.connect(gains[ch], ch);

        analysers[ch] = new AnalyserNode(audioContext, analyserConfig);
        gains[ch].connect(analysers[ch], 0);
      }
      this.worklet.port.postMessage(state);
      audioContext.resume();
    }

    loadFile(array_buffer) {
      const view = new DataView(array_buffer);
      const name = text(view, 0, 20);
      const type = text(view, 1080, 4);

      const known_type = mod_type.get(type);
      console.log(`*** ${name} (${type}) ***`);

      const max_samples = known_type ? 31 : 15;
      const pattern_base = known_type ? 950 : 470;
      const samples_base = known_type ? 1084 : 600;

      const song_length = view.getInt8(pattern_base);
      // const songEnd = view.getInt8(pattern_base + 1, true);

      const num_channels = mod_type.get(type)?.num_channels ?? 4;
      const pattern_size = num_channels << 8;

      // console.log(num_channels, pattern_size, max_samples);
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
        // console.log(`- ${name}: ${size} (${repeatOffset}..${repeatOffset + repeatLength}) <<${finetune}>>`);

        samples.push([
          name,
          new Float32Array([...audio].map(a => (+a / 196.0))),
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