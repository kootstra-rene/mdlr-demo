mdlr('demo:modplayer:worklet:channel', m => {

  const [notes, samples] = m.require(':inject');

  let sampleRate;

  let outputBuffer;
  let outputIndex;

  let audio;
  let size;
  let volume;
  let finetune;
  let repeat, repeatBegin, repeatEnd;

  let indexStep;
  let interpolationFactor;
  let index;

  let $prevperiod;
  let $period;
  let $effect;

  let arpeggio;
  let portamentoSlideTo;
  let portamentoSpeed;

  let effectWaveForm;
  let vibratoDepth;
  let vibratoSpeed;

  let lastSample;
  let delay;

  let tremolo;
  let tremoloDepth;
  let tremoloSpeed;
  let effectIndex;

  const calculate_index_step = (delta = 0) => {
    const tunedPeriod = (0.5 + $period * (2 ** (-finetune / 12 / 8))) >>> 0;
    indexStep = 7093789.2 / ((tunedPeriod + delta) * 2 * sampleRate / arpeggio);
  }

  const clip_volume = () => {
    if (volume > 64) volume = 64;
    if (volume < 0) volume = 0;
  }

  const xy = data => data & 255;
  const x = data => (data >> 4) & 15;
  const y = data => data & 15;

  const sineTable = [
    0, 24, 49, 74, 97, 120, 141, 161,
    180, 197, 212, 224, 235, 244, 250, 253,
    255
  ].map(a => a / 128);

  const self = {
    init(audioContextSampleRate) {
      sampleRate = audioContextSampleRate;

      lastSample =
        finetune =
        index =
        interpolationFactor =
        indexStep =
        vibratoDepth =
        vibratoSpeed =
        effectIndex =
        $prevperiod =
        $period = 0;

      arpeggio = +1;

      effectWaveForm = [];
      for (let i = 0; i < 16; ++i) {
        effectWaveForm[0 + i] = sineTable[i];
        effectWaveForm[16 + i] = sineTable[16 - i];
        effectWaveForm[32 + i] = -sineTable[i];
        effectWaveForm[48 + i] = -sineTable[16 - i];
      }
    },

    set row(location) {
      const note = notes[location];
      const effect = (note >>> 0) & 0xfff;
      const period = ((note >>> 16) & 0xfff);
      const sampleId = (((note >>> 24) & 0xf0) | ((note >>> 12) & 0x0f));

      const instrument = samples[sampleId];

      if (instrument) {
        ([, audio, size, volume, repeatBegin, repeatEnd, finetune] = instrument);
        repeat = size && repeatEnd > repeatBegin + 2;
      }

      if (period) {
        tremolo = 0;
        $prevperiod = $period;
        $period = period;
        index = effectIndex = 0;
        delay = 0;

        calculate_index_step();
      }

      $effect = effect;
    },

    get effect() {
      return $effect;
    },

    set output(value) {
      outputBuffer = value;
      outputIndex = -1;
    },

    advance() {
      if (audio && index < size && !delay) {
        let sample = audio[(index >>> 0)];
        let interpolatedSample = lastSample + (sample - lastSample) * (interpolationFactor);
        // interpolatedSample -= sample;

        let $volume = volume + tremolo;
        if ($volume > 64) $volume = 64;
        if ($volume < 0) $volume = 0;

        outputBuffer[++outputIndex] = interpolatedSample * ($volume / 64.0);

        if ((interpolationFactor += indexStep) >= 1.0) {
          lastSample = sample;//interpolatedSample;
          interpolationFactor %= 1;
          ++index;
        }
        if (repeat && index >= repeatEnd) {
          index = repeatBegin;
        }
      }
    },

    // effects
    0(data, tick) { // arpeggio
      arpeggio = xy(data) ? 2 ** ((xy(data) >> ((2 - (tick % 3)) * 4) & 15) / 12) : 1;
      calculate_index_step();
    },
    1(data, tick) { // slide up
      if (tick && ($period -= xy(data)) < 113) $period = 113;
      calculate_index_step();
    },
    2(data, tick) { // slide down
      if (tick && ($period += xy(data)) > 856) $period = 856;
      calculate_index_step();
    },
    3(data, tick) { // tone portamento
      if (!tick && xy(data)) {
        portamentoSlideTo = $period;
        portamentoSpeed = ($period < $prevperiod) ? -xy(data) : xy(data);

        $period = $prevperiod;
        calculate_index_step();
      }
      else {
        if (portamentoSpeed < 0 && portamentoSlideTo < $period) {
          if (($period += portamentoSpeed) < portamentoSlideTo) {
            $period = portamentoSlideTo;
          }
          calculate_index_step();
        }
        if (portamentoSpeed > 0 && portamentoSlideTo > $period) {
          if (($period += portamentoSpeed) > portamentoSlideTo) {
            $period = portamentoSlideTo;
          }
          calculate_index_step();
        }
      }
    },
    4(data, tick) { // vibrato
      if (!tick && xy(data)) {
        vibratoSpeed = x(data) ? x(data) : vibratoSpeed ?? 0;
        vibratoDepth = y(data) ? y(data) : vibratoDepth ?? 0;
      }
      calculate_index_step(vibratoDepth * effectWaveForm[effectIndex]);
      effectIndex = (effectIndex + vibratoSpeed) % 64;
    },
    5(data, tick) { // tone portamento + volume slide
      self[3](0, tick);
      self[10](data, tick);
    },
    6(data, tick) { // vibrato + volume slide
      self[4](0, tick);
      self[10](data, tick);
    },
    7(data, tick) { // tremolo
      if (!tick && xy(data)) {
        tremoloSpeed = x(data) ? x(data) : tremoloSpeed ?? 0;
        tremoloDepth = y(data) ? y(data) : tremoloDepth ?? 0;
      }
      tremolo = tremoloDepth * effectWaveForm[effectIndex];
      effectIndex = (effectIndex + tremoloSpeed) % 64;
    },
    9(data, tick) { // set sample offset
      if (!tick && xy(data)) index = xy(data) << 8;
    },
    10(data, tick) { // volume slide
      if (tick && !(x(data) && y(data))) {
        volume = volume + x(data) - y(data);
        clip_volume();
      }
    },
    12(data, tick) { // set volume
      if (!tick) {
        volume = xy(data);
        clip_volume();
      }
    },
    225(data, tick) { // fine slide up
      if (!tick && ($period -= y(data)) < 113) $period = 113;
      calculate_index_step();
    },
    226(data, tick) { // fine slide down
      if (!tick && ($period += y(data)) > 856) $period = 856;
      calculate_index_step();
    },
    233(data, tick) { // retrigger note
      if (tick && !(tick % y(data))) {
        index = 0;
      }
    },
    234(data, tick) { // fine volume slide up
      if (!tick) {
        volume = volume + y(data);
        clip_volume();
      }
    },
    235(data, tick) { // fine volume slide down
      if (!tick) {
        volume = volume - y(data);
        clip_volume();
      }
    },
    236(data, tick) { // cut sample
      if (tick === y(data)) {
        volume = 0;
      }
    },
    237(data, tick) { // note delay
      if (!tick) {
        delay = y(data);
      }
      if (tick === delay) {
        delay = 0;
      }
    }
  };

  return self;
})

mdlr('demo:modplayer:worklet:player', m => {

  let port;
  let channels;

  let positions;
  let position;

  let bpm;
  let speed;
  let row;
  let tick;

  let sampleRate;

  let samplesPerTick;
  let untilTick;

  let positionJump;
  let rowJump;
  let playing;

  let looping;
  let loopStart;
  let loopCount;

  let effectId;
  let effect;

  let delay;

  const xy = data => data & 255;
  const x = data => (data >> 4) & 15;
  const y = data => data & 15;

  const missing_effect = (data, tick) => {
    post_message(['trace', `unimplemented effect: ${data.toString(16)}`]);
  }

  const apply_channels = f => channels.forEach(a => f(a));

  const post_message = (record) => {
    port.postMessage(record);
  }

  const on_pattern = (jump) => {
    position = jump >= 0 ? jump : ++position;
    playing = positions[position] >= 0;
  }

  const on_tick = () => {
    if (++tick >= speed) {
      tick = 0;
      on_row();
    }

    for (const channel of channels) {
      effectId = (effect = channel.effect) >> 8;
      if (effectId === 14) { // extended effects
        effectId = effect >> 4;
      }
      (channel[effectId] ?? self[effectId] ?? missing_effect)(effect, tick);
    }
  }

  const on_row = () => {
    if (!delay) {
      if (positionJump >= 0 || rowJump >= 0) {
        row = rowJump > 0 && rowJump < 64 ? rowJump : 0;
        rowJump = -1;

        on_pattern(positionJump);
        positionJump = -1;
      }
      else {
        if (++row >= 64) {
          on_pattern(-1);
          row = 0;
        }
      }
    }

    if (!playing) return;

    if (!delay) {
      apply_channels(channel => channel.row = (positions[position] << 6) | row);
    }

    post_message(['row', row | (positions[position] << 6), position]);
    tick = 0;
  }


  const self = {
    init(worklet, audioContextSampleRate) {
      ({ channels, port }) = worklet;

      apply_channels(channel => channel.init(audioContextSampleRate));
      sampleRate = audioContextSampleRate;
      positionJump = rowJump = -1;
      looping = false;
    },

    play(data) {
      ([positions]) = data;

      positionJump = 0;
      untilTick = 0;
      tick = -1;
      row = 63;
      delay = 0;

      self[15](125);
      self[15](6);
      playing = true;
    },

    advance() {
      if (!playing) return;

      if (--untilTick <= 0) {
        untilTick += samplesPerTick;
        on_tick();
      }

      apply_channels(channel => channel.advance());
    },

    // effects

    11(data, tick) { // position jump
      if (!tick) {
        positionJump = xy(data);
        rowJump = 0;
      }
    },
    13(data, tick) { // pattern break
      if (!tick) rowJump = x(data) * 10 + y(data);
    },
    15(data, tick) { // set speed
      if (!tick) {
        xy(data) < 0x20 ? speed = xy(data) : bpm = xy(data);
        samplesPerTick = ((sampleRate * 60) / bpm / 4 / 6) >>> 0;
      }
    },
    230(data, tick) { // pattern loop
      if (!tick) {
        if (!y(data)) {
          if (!looping) {
            looping = true;
            loopStart = row;
            loopCount = 0;
          }
          else {
            looping = loopCount > 1;
          }
        }
        else if (looping) {
          positionJump = position;
          rowJump = loopStart;

          if (!loopCount) {
            loopCount = y(data);
          }
          else {
            --loopCount;
          }
        }
      }
    },
    238(data, tick) { // pattern delay
      if (!tick && !delay) {
        delay = speed * y(data);
      }
      if (delay) --delay;
    }
  };

  return self;
})

mdlr('demo:modplayer:worklet', m => {

  registerProcessor('demo:modplayer:worklet', class extends AudioWorkletProcessor {

    channels = [];
    player = m.require('demo:modplayer:worklet:player');

    constructor() {
      super();

      this.port.onmessage = ({ data }) => {
        const [, channels] = data;
        this.channels = channels.map(channel => m.require('demo:modplayer:worklet:channel', { ':inject': channel }));
        this.player.init(this, sampleRate);
        this.player.play(data);
      }
    }

    process(_, outputs) {
      const { channels, player } = this;

      let samples = 0;

      outputs.forEach(([output], ch) => {
        // assume that all outputs are of the same length
        channels[ch].output = output;
        // should be 128 as render quantum
        samples = output?.length ?? 0;
      });

      // try {
        while (--samples >= 0) {
          player.advance();
        }
      // }
      // catch (e) {
      //   this.port.postMessage(['trace', e]);
      // }

      return true;
    }
  });

})

// todo:
// - combine pattern and row in one, patterndata is obsolete (contained in channel);
