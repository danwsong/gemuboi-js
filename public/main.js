const MILLISECONDS = 1000;
const DISPLAY_WIDTH = 160;
const DISPLAY_HEIGHT = 144;
const CANVAS_MARGIN = 16;
const CANVAS_WIDTH = DISPLAY_WIDTH + 2 * CANVAS_MARGIN;
const CANVAS_HEIGHT = DISPLAY_HEIGHT + 2 * CANVAS_MARGIN;
const CPU_FREQUENCY = 1048576;
const DISPLAY_FREQUENCY = 4194304;
const DISPLAY_CYCLES = DISPLAY_FREQUENCY / CPU_FREQUENCY;
const DISPLAY_CYCLES_PER_LINE = 456;
const LINES_PER_FRAME = 154;
const CPU_CYCLES_PER_FRAME = DISPLAY_CYCLES_PER_LINE * LINES_PER_FRAME / DISPLAY_CYCLES;
const FRAME_DURATION = CPU_CYCLES_PER_FRAME / CPU_FREQUENCY;
const AUDIO_FREQUENCY = 4194304;
const AUDIO_CYCLES = AUDIO_FREQUENCY / CPU_FREQUENCY;
const PULSE_FREQUENCY = 1048576;
const AUDIO_CYCLES_PER_PULSE = AUDIO_FREQUENCY / PULSE_FREQUENCY;
const WAVE_FREQUENCY = 2097152;
const AUDIO_CYCLES_PER_WAVE = AUDIO_FREQUENCY / WAVE_FREQUENCY;
const AUDIO_BUFFER_SAMPLES = 4096;
const AUDIO_SAMPLE_FREQUENCY = 65536;
const AUDIO_BUFFER_DURATION = AUDIO_BUFFER_SAMPLES / AUDIO_SAMPLE_FREQUENCY;
const AUDIO_FRAME_FREQUENCY = 512;
const AUDIO_CYCLES_PER_AUDIO_FRAME = AUDIO_FREQUENCY / AUDIO_FRAME_FREQUENCY;
const AUDIO_CYCLES_PER_SAMPLE = AUDIO_FREQUENCY / AUDIO_SAMPLE_FREQUENCY;
const AUDIO_CYCLES_PER_BUFFER = AUDIO_CYCLES_PER_SAMPLE * AUDIO_BUFFER_SAMPLES;
const SOUND_CHANNEL_COUNT = 4;
const PULSE_TABLE = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
];
const VOLUME_SHIFT = [
    4, 0, 1, 2,
];
const DIVISION_RATIOS = [
    2, 4, 8, 12, 16, 20, 24, 28,
].map((value => value * AUDIO_CYCLES));

const canvas = document.getElementById('canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const canvasCtx = canvas.getContext('2d');
AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

class Sound {
    constructor(gb) {
        this.gb = gb;

        this.channel3WaveTable = [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ];

        this.cycles = 0;
        this.frame = 0;

        this.channel1SweepDuration = 0b000;
        this.channel1SweepDown = false;
        this.channel1SweepShift = 0b000;

        this.channel1Duty = 0b00;
        this.channel1Length = 0b000000;

        this.channel1LengthCounter = 0;
        this.channel1FrequencyCounter = 0;
        this.channel1SweepCounter = 0;
        this.channel1SweepFrequency = 0;
        this.channel1EnvelopeCounter = 0;
        this.channel1Volume = 0;
        this.channel1Index = 0;

        this.channel1InitialVolume = 0b0000;
        this.channel1VolumeUp = false;
        this.channel1EnvelopeDuration = 0b000;

        this.channel1Frequency = 0b00000000000;

        this.channel1Trigger = false;
        this.channel1LengthEnable = false;

        this.channel2Duty = 0b00;
        this.channel2Length = 0b000000;

        this.channel2LengthCounter = 0;
        this.channel2FrequencyCounter = 0;
        this.channel2EnvelopeCounter = 0;
        this.channel2Volume = 0;
        this.channel2Index = 0;

        this.channel2InitialVolume = 0b0000;
        this.channel2VolumeUp = false;
        this.channel2EnvelopeDuration = 0b000;

        this.channel2Frequency = 0b00000000000;

        this.channel2Trigger = false;
        this.channel2LengthEnable = false;

        this.channel3Play = false;

        this.channel3Length = 0b00000000;

        this.channel3LengthCounter = 0;
        this.channel3FrequencyCounter = 0;
        this.channel3Index = 0;

        this.channel3Volume = 0b00;

        this.channel3Frequency = 0b00000000000;

        this.channel3Trigger = false;
        this.channel3LengthEnable = false;

        this.channel4Length = 0b000000;

        this.channel4LengthCounter = 0;
        this.channel4FrequencyCounter = 0;
        this.channel4EnvelopeCounter = 0;
        this.channel4Volume = 0;

        this.channel4LFSR = 0;

        this.channel4InitialVolume = 0b0000;
        this.channel4VolumeUp = false;
        this.channel4EnvelopeDuration = 0b000;

        this.channel4ShiftClockFrequency = 0b0000;
        this.channel4CounterStep = false;
        this.channel4DivisionRatio = 0b000;

        this.channel4Trigger = false;
        this.channel4LengthEnable = false;

        this.outputVinRight = false;
        this.rightVolume = 0b000;
        this.outputVinLeft = false;
        this.leftVolume = 0b000;

        this.channel1LeftEnable = false;
        this.channel2LeftEnable = false;
        this.channel3LeftEnable = false;
        this.channel4LeftEnable = false;
        this.channel1RightEnable = false;
        this.channel2RightEnable = false;
        this.channel3RightEnable = false;
        this.channel4RightEnable = false;

        this.channel1Enable = false;
        this.channel2Enable = false;
        this.channel3Enable = false;
        this.channel4Enable = false;

        this.soundEnable = false;

        this.buffer = audioCtx.createBuffer(2, AUDIO_BUFFER_SAMPLES, AUDIO_SAMPLE_FREQUENCY);
        this.bufferLeft = this.buffer.getChannelData(0);
        this.bufferRight = this.buffer.getChannelData(1);
    }

    get nr10() {
        return ((this.channel1SweepDuration & 0b111) << 4) | (this.channel1SweepDown << 3) | this.channel1SweepShift;
    }

    set nr10(value) {
        this.channel1SweepDuration = (value & 0b1110000) >> 4;
        this.channel1SweepDown = (value & 0b1000) != 0;
        this.channel1SweepShift = value & 0b111;
    }

    get nr11() {
        return (this.channel1Duty << 6) | this.channel1Length;
    }

    set nr11(value) {
        this.channel1Duty = (value & 0b11000000) >> 6;
        this.channel1Length = value & 0b111111;
    }

    get nr12() {
        return (this.channel1InitialVolume << 4) | (this.channel1VolumeUp << 3) | (this.initialEnvelopeSteps1 & 0b111);
    }

    set nr12(value) {
        this.channel1InitialVolume = (value & 0b11110000) >> 4;
        this.channel1VolumeUp = (value & 0b1000) != 0;
        this.channel1EnvelopeDuration = value & 0b111;
    }

    get nr13() {
        return 0x00;
    }

    set nr13(value) {
        this.channel1Frequency = (this.channel1Frequency & 0b11100000000) | value;
    }

    get nr14() {
        return this.channel1LengthEnable << 6;
    }

    set nr14(value) {
        this.channel1Trigger = (value & 0b10000000) != 0;
        this.channel1LengthEnable = (value & 0b1000000) != 0;
        this.channel1Frequency = ((value & 0b111) << 8) | (this.channel1Frequency & 0b11111111);
    }

    get nr21() {
        return (this.channel2Duty << 6) | this.channel2Length;
    }

    set nr21(value) {
        this.channel2Duty = (value & 0b11000000) >> 6;
        this.channel2Length = value & 0b111111;
    }

    get nr22() {
        return (this.channel2InitialVolume << 4) | (this.channel2VolumeUp << 3) | (this.initialEnvelopeSteps2 & 0b111);
    }

    set nr22(value) {
        this.channel2InitialVolume = (value & 0b11110000) >> 4;
        this.channel2VolumeUp = (value & 0b1000) != 0;
        this.channel2EnvelopeDuration = value & 0b111;
    }

    get nr23() {
        return 0x00;
    }

    set nr23(value) {
        this.channel2Frequency = (this.channel2Frequency & 0b11100000000) | value;
    }

    get nr24() {
        return this.channel2LengthEnable << 6;
    }

    set nr24(value) {
        this.channel2Trigger = (value & 0b10000000) != 0;
        this.channel2LengthEnable = (value & 0b1000000) != 0;
        this.channel2Frequency = ((value & 0b111) << 8) | (this.channel2Frequency & 0b11111111);
    }

    get nr30() {
        return this.channel3Play << 7;
    }

    set nr30(value) {
        this.channel3Play = (value & 0b10000000) != 0;
    }

    get nr31() {
        return this.channel3Length;
    }

    set nr31(value) {
        this.channel3Length = value;
    }

    get nr32() {
        return this.channel3Volume << 5;
    }

    set nr32(value) {
        this.channel3Volume = (value & 0b1100000) >> 5;
    }

    get nr33() {
        return 0x00;
    }

    set nr33(value) {
        this.channel3Frequency = (this.channel3Frequency & 0b11100000000) | value;
    }

    get nr34() {
        return this.channel3LengthEnable << 6;
    }

    set nr34(value) {
        this.channel3Trigger = (value & 0b10000000) != 0;
        this.channel3LengthEnable = (value & 0b1000000) != 0;
        this.channel3Frequency = ((value & 0b111) << 8) | (this.channel3Frequency & 0b11111111);
    }

    get nr41() {
        return this.channel4Length;
    }

    set nr41(value) {
        this.channel4Length = value & 0b111111;
    }

    get nr42() {
        return (this.channel4InitialVolume << 4) | (this.channel4VolumeUp << 3) | (this.initialEnvelopeSteps4 & 0b111);
    }

    set nr42(value) {
        this.channel4InitialVolume = (value & 0b11110000) >> 4;
        this.channel4VolumeUp = (value & 0b1000) != 0;
        this.channel4EnvelopeDuration = value & 0b111;
    }

    get nr43() {
        return (this.channel4ShiftClockFrequency << 4) | (this.channel4CounterStep << 3) | this.channel4DivisionRatio;
    }

    set nr43(value) {
        this.channel4ShiftClockFrequency = (value & 0b11110000) >> 4;
        this.channel4CounterStep = (value & 0b1000) != 0;
        this.channel4DivisionRatio = value & 0b111;
    }

    get nr44() {
        return this.channel4LengthEnable << 6;
    }

    set nr44(value) {
        this.channel4Trigger = (value & 0b10000000) != 0;
        this.channel4LengthEnable = (value & 0b1000000) != 0;
    }

    get nr50() {
        return (this.outputVinRight << 7) | (this.rightVolume << 4) | (this.outputVinLeft << 3) | this.leftVolume;
    }

    set nr50(value) {
        this.outputVinRight = (value & 0b10000000) != 0;
        this.rightVolume = (value & 0b1110000) >> 4;
        this.outputVinLeft = (value & 0b1000) != 0;
        this.leftVolume = value & 0b111;
    }

    get nr51() {
        return (this.channel4RightEnable << 7) | (this.channel3RightEnable << 6) | (this.channel2RightEnable << 5) | (this.channel1RightEnable << 4) | (this.channel4LeftEnable << 3) | (this.channel3LeftEnable << 2) | (this.channel2LeftEnable << 1) | this.channel1LeftEnable;
    }

    set nr51(value) {
        this.channel4RightEnable = (value & 0b10000000) != 0;
        this.channel3RightEnable = (value & 0b1000000) != 0;
        this.channel2RightEnable = (value & 0b100000) != 0;
        this.channel1RightEnable = (value & 0b10000) != 0;
        this.channel4LeftEnable = (value & 0b1000) != 0;
        this.channel3LeftEnable = (value & 0b100) != 0;
        this.channel2LeftEnable = (value & 0b10) != 0;
        this.channel1LeftEnable = (value & 0b1) != 0;
    }

    get nr52() {
        return (this.soundEnable << 7) | (this.channel4Enable << 3) | (this.channel3Enable << 2) | (this.channel2Enable << 1) | this.channel1Enable;
    }

    set nr52(value) {
        this.soundEnable = (value & 0b10000000) != 0;
        if (!this.soundEnable) {
            this.cycles = 0;
            this.channel1Enable = false;
            this.channel2Enable = false;
            this.channel3Enable = false;
            this.channel4Enable = false;
        }
    }

    writeWave(address, value) {
        this.channel3WaveTable[address * 2] = (value & 0b11110000) >> 4;
        this.channel3WaveTable[address * 2 + 1] = value & 0b1111;
    }

    genLFSR() {
        const tmp = ((this.channel4LFSR & 0b10) >> 1) ^ (this.channel4LFSR & 0b1);
        this.channel4LFSR = (tmp << 14) | (this.channel4LFSR >> 1);
        if (this.channel4CounterStep) {
            this.channel4LFSR = (this.channel4LFSR & ~0b1000000) | (tmp << 6);
        }
    }

    updateLength() {
        if (this.channel1Enable && this.channel1LengthEnable) {
            this.channel1LengthCounter--;
            if (this.channel1LengthCounter == 0) {
                this.channel1Enable = false;
            }
        }
        if (this.channel2Enable && this.channel2LengthEnable) {
            this.channel2LengthCounter--;
            if (this.channel2LengthCounter == 0) {
                this.channel2Enable = false;
            }
        }
        if (this.channel3Enable && this.channel3LengthEnable) {
            this.channel3LengthCounter--;
            if (this.channel3LengthCounter == 0) {
                this.channel3Enable = false;
            }
        }
        if (this.channel4Enable && this.channel4LengthEnable) {
            this.channel4LengthCounter--;
            if (this.channel4LengthCounter == 0) {
                this.channel4Enable = false;
            }
        }
    }

    updateSweep() {
        if (this.channel1Enable && this.channel1SweepDuration != 0) {
            this.channel1SweepCounter--;
            if (this.channel1SweepCounter == 0) {
                this.channel1SweepCounter = this.channel1SweepDuration;
                const tmp = this.channel1SweepFrequency + (this.channel1SweepDown ? -1 : 1) * (this.channel1SweepFrequency >> this.channel1SweepShift);
                if (tmp > 2047) {
                    this.channel1Enable = false;
                } else if (tmp >= 0) {
                    this.channel1Frequency = this.channel1SweepFrequency = tmp;
                }
            }
        }
    }

    updateVolume() {
        if (this.channel1Enable && this.channel1EnvelopeDuration != 0) {
            this.channel1EnvelopeCounter--;
            if (this.channel1EnvelopeCounter == 0) {
                this.channel1EnvelopeCounter = this.channel1EnvelopeDuration;
                if (this.channel1VolumeUp && this.channel1Volume < 15) {
                    this.channel1Volume++;
                }
                if (!this.channel1VolumeUp && this.channel1Volume > 0) {
                    this.channel1Volume--;
                }
            }
        }
        if (this.channel2Enable && this.channel2EnvelopeDuration != 0) {
            this.channel2EnvelopeCounter--;
            if (this.channel2EnvelopeCounter == 0) {
                this.channel2EnvelopeCounter = this.channel2EnvelopeDuration;
                if (this.channel2VolumeUp && this.channel2Volume < 15) {
                    this.channel2Volume++;
                }
                if (!this.channel2VolumeUp && this.channel2Volume > 0) {
                    this.channel2Volume--;
                }
            }
        }
        if (this.channel4Enable && this.channel4EnvelopeDuration != 0) {
            this.channel4EnvelopeCounter--;
            if (this.channel4EnvelopeCounter == 0) {
                this.channel4EnvelopeCounter = this.channel4EnvelopeDuration;
                if (this.channel4VolumeUp && this.channel4Volume < 15) {
                    this.channel4Volume++;
                }
                if (!this.channel4VolumeUp && this.channel4Volume > 0) {
                    this.channel4Volume--;
                }
            }
        }
    }

    updateFrequency() {
        let left = 0;
        let right = 0;
        if (this.channel1Enable && this.channel1InitialVolume == 0b0000 && !this.channel1VolumeUp) {
            this.channel1Enable = false;
        }
        if (this.channel2Enable && this.channel2InitialVolume == 0b0000 && !this.channel2VolumeUp) {
            this.channel2Enable = false;
        }
        if (this.channel3Enable && !this.channel3Play) {
            this.channel4Enable = false;
        }
        if (this.channel4Enable && this.channel4InitialVolume == 0b0000 && !this.channel4VolumeUp) {
            this.channel4Enable = false;
        }
        if (this.channel1Enable) {
            this.channel1FrequencyCounter--;
            if (this.channel1FrequencyCounter == 0) {
                this.channel1FrequencyCounter = (2048 - this.channel1Frequency) * AUDIO_CYCLES_PER_PULSE;
                this.channel1Index = (this.channel1Index + 1) % 8;
            }
            if (this.channel1Volume != 0) {
                const signal = PULSE_TABLE[this.channel1Duty][this.channel1Index] * this.channel1Volume / 15 * 2 - 1;
                if (this.channel1LeftEnable) {
                    left += signal;
                }
                if (this.channel1RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel2Enable) {
            this.channel2FrequencyCounter--;
            if (this.channel2FrequencyCounter == 0) {
                this.channel2FrequencyCounter = (2048 - this.channel2Frequency) * AUDIO_CYCLES_PER_PULSE;
                this.channel2Index = (this.channel2Index + 1) % 8;
            }
            if (this.channel2Volume != 0) {
                const signal = PULSE_TABLE[this.channel2Duty][this.channel2Index] * this.channel2Volume / 15 * 2 - 1;
                if (this.channel2LeftEnable) {
                    left += signal;
                }
                if (this.channel2RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel3Enable) {
            this.channel3FrequencyCounter--;
            if (this.channel3FrequencyCounter == 0) {
                this.channel3FrequencyCounter = (2048 - this.channel3Frequency) * AUDIO_CYCLES_PER_WAVE;
                this.channel3Index = (this.channel3Index + 1) % 32;
            }
            if (this.channel3Volume != 0) {
                const signal = (this.channel3WaveTable[this.channel3Index] >> VOLUME_SHIFT[this.channel3Volume]) / 15 * 2 - 1;
                if (this.channel3LeftEnable) {
                    left += signal;
                }
                if (this.channel3RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel4Enable) {
            this.channel4FrequencyCounter--;
            if (this.channel4FrequencyCounter == 0) {
                this.channel4FrequencyCounter = DIVISION_RATIOS[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
                this.genLFSR();
            }
            if (this.channel4Volume != 0) {
                const signal = (~this.channel4LFSR & 0b1) * this.channel4Volume / 15 * 2 - 1;
                if (this.channel4LeftEnable) {
                    left += signal;
                }
                if (this.channel4RightEnable) {
                    right += signal;
                }
            }
        }
        left *= (this.leftVolume + 1) / 8;
        right *= (this.rightVolume + 1) / 8;

        const index = Math.floor(this.cycles / AUDIO_CYCLES_PER_SAMPLE) % AUDIO_BUFFER_SAMPLES;
        this.bufferLeft[index] += left / SOUND_CHANNEL_COUNT / AUDIO_CYCLES_PER_SAMPLE;
        this.bufferRight[index] += right / SOUND_CHANNEL_COUNT / AUDIO_CYCLES_PER_SAMPLE;
    }

    pushBuffer() {
        const now = audioCtx.currentTime;
        const nowPlusLatency = now + AUDIO_BUFFER_DURATION;
        this.nextPush = (this.nextPush || nowPlusLatency);
        if (this.nextPush >= now) {
            const bufferSource = audioCtx.createBufferSource();
            bufferSource.buffer = this.buffer;
            bufferSource.connect(audioCtx.destination);
            bufferSource.start(this.nextPush);
            this.nextPush += AUDIO_BUFFER_DURATION;

            this.buffer = audioCtx.createBuffer(2, AUDIO_BUFFER_SAMPLES, AUDIO_SAMPLE_FREQUENCY);
            this.bufferLeft = this.buffer.getChannelData(0);
            this.bufferRight = this.buffer.getChannelData(1);
        } else {
            this.nextPush = nowPlusLatency;
        }
    }

    cycle() {
        for (let i = 0; i < AUDIO_CYCLES; i++) {
            if (this.soundEnable) {
                if (this.channel1Trigger) {
                    this.channel1Trigger = false;
                    this.channel1Enable = true;
                    this.channel1LengthCounter = 64 - this.channel1Length;
                    this.channel1FrequencyCounter = (2048 - this.channel1Frequency) * AUDIO_CYCLES_PER_PULSE;
                    this.channel1SweepFrequency = this.channel1Frequency;
                    this.channel1SweepCounter = this.channel1SweepDuration;
                    this.channel1EnvelopeCounter = this.channel1EnvelopeDuration;
                    this.channel1Volume = this.channel1InitialVolume;
                    this.channel1Index = 0;
                }
                if (this.channel2Trigger) {
                    this.channel2Trigger = false;
                    this.channel2Enable = true;
                    this.channel2LengthCounter = 64 - this.channel2Length;
                    this.channel2FrequencyCounter = (2048 - this.channel2Frequency) * AUDIO_CYCLES_PER_PULSE;
                    this.channel2EnvelopeCounter = this.channel2EnvelopeDuration;
                    this.channel2Volume = this.channel2InitialVolume;
                    this.channel2Index = 0;
                }
                if (this.channel3Trigger) {
                    this.channel3Trigger = false;
                    this.channel3Enable = true;
                    this.channel3LengthCounter = 256 - this.channel3Length;
                    this.channel3FrequencyCounter = (2048 - this.channel3Frequency) * AUDIO_CYCLES_PER_WAVE;
                    this.channel3Index = 0;
                }
                if (this.channel4Trigger) {
                    this.channel4Trigger = false;
                    this.channel4Enable = true;
                    this.channel4LengthCounter = 64 - this.channel4Length;
                    this.channel4FrequencyCounter = DIVISION_RATIOS[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
                    this.channel4EnvelopeCounter = this.channel4EnvelopeDuration;
                    this.channel4Volume = this.channel4InitialVolume;
                    this.channel4LFSR = 0b111111111111111;
                }
                this.updateFrequency();
                this.cycles++;
                if (this.cycles % AUDIO_CYCLES_PER_BUFFER == 0) {
                    this.pushBuffer();
                }
                if (this.cycles % AUDIO_CYCLES_PER_AUDIO_FRAME == 0) {
                    this.frame++;
                    switch (this.frame % 8) {
                        case 2:
                        case 6:
                            this.updateSweep();
                        case 0:
                        case 4:
                            this.updateLength();
                            break;
                        case 7:
                            this.updateVolume();
                            break;
                    }
                }
            }
        }
    }
}

class Cartridge {
    constructor(gb) {
        this.gb = gb;

        this.cartridgeType = -1;
    }

    readROM(address) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                return this.ROM[address];
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        return this.ROM[address & 0x3fff];
                    case 0x4:
                    case 0x5:
                    case 0x6:
                    case 0x7:
                        return this.ROM[(this.romBankNumber << 14) | (address & 0x3fff)];
                }
            case 0x0f:
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                    case 0x2:
                    case 0x3:
                        return this.ROM[address & 0x3fff];
                    case 0x4:
                    case 0x5:
                    case 0x6:
                    case 0x7:
                        return this.ROM[(this.romBankNumber << 14) | (address & 0x3fff)];
                }
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    writeROM(address, value) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                break;
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                        this.ramEnable = (value & 0b1111) == 0b1010;
                        break;
                    case 0x2:
                    case 0x3:
                        this.romBankNumber &= ~0b11111;
                        if ((value & 0b11111) == 0) {
                            value |= 0b00001;
                        }
                        this.romBankNumber |= (value & 0b11111);
                        break;
                    case 0x4:
                    case 0x5:
                        if (this.ramBankMode) {
                            this.ramBankNumber = value & 0b11;
                        } else {
                            this.romBankNumber |= (value & 0b11) << 5;
                        }
                        break;
                    case 0x6:
                    case 0x7:
                        this.ramBankMode = (value & 0b1) == 0b1;
                        break;
                }
                break;
            case 0x0f:
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
                switch (address >> 12) {
                    case 0x0:
                    case 0x1:
                        this.ramEnable = (value & 0b1111) == 0b1010;
                        break;
                    case 0x2:
                    case 0x3:
                        this.romBankNumber &= ~0b1111111;
                        if ((value & 0b1111111) == 0) {
                            value |= 0b0000001;
                        }
                        this.romBankNumber |= (value & 0b1111111);
                        break;
                    case 0x4:
                    case 0x5:
                        switch (value) {
                            case 0x00:
                            case 0x01:
                            case 0x02:
                            case 0x03:
                            case 0x08:
                            case 0x09:
                            case 0x0a:
                            case 0x0b:
                            case 0x0c:
                                this.ramBankNumber = value;
                            default:
                                break;
                        }
                        break;
                    case 0x6:
                    case 0x7:
                        break;
                }
                break;
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    readRAM(address) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                return 0x00;
            case 0x01:
                break;
            case 0x02:
            case 0x03:
                return this.RAM[(this.ramBankNumber << 13) | address];
            case 0x11:
                break;
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
                switch (this.ramBankNumber) {
                    case 0x00:
                    case 0x01:
                    case 0x02:
                    case 0x03:
                        return this.RAM[(this.ramBankNumber << 13) | address];
                    case 0x08:
                    case 0x09:
                    case 0x0a:
                    case 0x0b:
                    case 0x0c:
                        return 0x00;
                    default:
                        return 0x00;
                }
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    writeRAM(address, value) {
        switch (this.cartridgeType) {
            case -1:
                throw 'no cartridge loaded';
            case 0x00:
                break;
            case 0x01:
                break;
            case 0x02:
            case 0x03:
                this.RAM[(this.ramBankNumber << 13) | address] = value;
                break;
            case 0x11:
                break;
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
                switch (this.ramBankNumber) {
                    case 0x00:
                    case 0x01:
                    case 0x02:
                    case 0x03:
                        this.RAM[(this.ramBankNumber << 13) | address] = value;
                        break;
                    case 0x08:
                    case 0x09:
                    case 0x0a:
                    case 0x0b:
                    case 0x0c:
                        break;
                    default:
                        break;
                }
                break;
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }
    }

    load(file) {
        this.title = new TextDecoder('ascii').decode(file.slice(0x134, 0x13f));
        this.cartridgeType = file[0x147];
        const romSize = 32768 << file[0x148];
        if (file.length != romSize) {
            throw 'wrong file size';
        }
        this.ROM = file;
        const ramSize = file[0x149];
        if (this.title in localStorage) {
            this.RAM = new Uint8Array(localStorage[this.title].split(',').map(parseFloat));
        } else {
            switch (ramSize) {
                case 0x00:
                    break;
                case 0x02:
                    this.RAM = new Uint8Array(0x2000);
                    break;
                case 0x03:
                    this.RAM = new Uint8Array(0x8000);
                    break;
                case 0x04:
                    this.RAM = new Uint8Array(0x20000);
                    break;
                default:
                    throw 'unknown RAM size: 0x' + ramSize.toString(16);
            }
        }
        this.ramEnable = false;
        this.romBankNumber = 0;
        this.ramBankNumber = 0;
        this.ramBankMode = false;
    }

    save() {
        if (this.RAM) {
            localStorage[this.title] = this.RAM;
        }
    }
}

class Joypad {
    constructor(gb) {
        this.gb = gb;

        this.selectButton = false;
        this.selectDirection = false;

        this.start = false;
        this.select = false;
        this.b = false;
        this.a = false;

        this.down = false;
        this.up = false;
        this.left = false;
        this.right = false;
    }

    get p1() {
        let _p1 = 0b111111;
        _p1 ^= this.selectButton << 5;
        _p1 ^= this.selectDirection << 4;
        if (this.selectButton) {
            _p1 ^= this.start << 3;
            _p1 ^= this.select << 2;
            _p1 ^= this.b << 1;
            _p1 ^= this.a;
        }
        if (this.selectDirection) {
            _p1 ^= this.down << 3;
            _p1 ^= this.up << 2;
            _p1 ^= this.left << 1;
            _p1 ^= this.right;
        }
        return _p1;
    }

    set p1(value) {
        this.selectButton = (value & 0b100000) == 0;
        this.selectDirection = (value & 0b10000) == 0;
    }
}

class Timer {
    constructor(gb) {
        this.gb = gb;

        this._div = 0;

        this.tima = 0;
        this.tma = 0;
        this.timerEnable = false;
        this.clockSelect = 0b00;

        this.overflowDelay = false;

        this.TAC_CYCLES = [0b0000001000000000, 0b0000000000001000, 0b0000000000100000, 0b0000000010000000];
    }

    get div() {
        return this._div >> 8;
    }

    set div(value) {
        this._div = 0;
    }

    get tac() {
        return (this.timerEnable << 2) | this.clockSelect;
    }

    set tac(value) {
        this.timerEnable = (value & 0b100) != 0;
        this.clockSelect = value & 0b11;
    }

    cycle() {
        this._div += 4;
        if (this.timerEnable) {
            const bit = this.TAC_CYCLES[this.clockSelect];
            if ((~this._div & (this._div - 1) & bit) != 0) {
                this.tima = (this.tima + 1) & 0xff;
                if (this.tima == 0) {
                    this.overflowDelay = true;
                } else if (this.overflowDelay) {
                    this.overflowDelay = false;
                    this.tima = this.tma;
                    this.gb.requestInterrupt(this.gb.TIMER);
                }
            }
        }
    }
}

class Display {
    constructor(gb) {
        this.HBLANK = 0b00;
        this.VBLANK = 0b01;
        this.SEARCH_OAM = 0b10;
        this.TRANSFER = 0b11;

        this.PALETTE = new Uint32Array(new Uint8Array([
            0xff, 0xef, 0xce, 0xff,
            0xde, 0x94, 0x4a, 0xff,
            0xad, 0x29, 0x21, 0xff,
            0x31, 0x19, 0x52, 0xff,
        ]).buffer);

        this.gb = gb;

        this.lcdOn = false;
        this.windowTilemap = false;
        this.windowOn = false;
        this.bgWindowTileMode = false;
        this.bgTilemap = false;
        this.objHeight = false;
        this.objOn = false;
        this.bgOn = false;

        this.lycMatchInt = false;
        this.mode10Int = false;
        this.mode01Int = false;
        this.mode00Int = false;
        this.lycMatch = false;
        this.mode = 0b00;

        this.scy = 0;
        this.scx = 0;

        this.ly = 0;

        this.lyc = 0;

        this._bgp = 0;
        this._obp0 = 0;
        this._obp1 = 0;

        this.bgPalette = [0b00, 0b00, 0b00, 0b00];
        this.objPalette = [[0b00, 0b00, 0b00, 0b00], [0b00, 0b00, 0b00, 0b00]];

        this.wy = 0;
        this.wx = 0;

        this.cycles = 0;
        this.windowLine = 0;

        this.VRAM = new Uint8Array(0x2000);
        this.OAM = new Uint8Array(0xA0);

        this.imageData = canvasCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
        this.pixels = new Uint32Array(this.imageData.data.buffer);
    }

    get lcdc() {
        return (this.lcdOn << 7) | (this.windowTilemap << 6) | (this.windowOn << 5) | (this.bgWindowTileMode << 4) | (this.bgTilemap << 3) | (this.objHeight << 2) | (this.objOn << 1) | this.bgOn;
    }

    set lcdc(value) {
        this.lcdOn = (value & 0b10000000) != 0;
        this.windowTilemap = (value & 0b01000000) != 0;
        this.windowOn = (value & 0b00100000) != 0;
        this.bgWindowTileMode = (value & 0b00010000) != 0;
        this.bgTilemap = (value & 0b00001000) != 0;
        this.objHeight = (value & 0b00000100) != 0;
        this.objOn = (value & 0b00000010) != 0;
        this.bgOn = (value & 0b00000001) != 0;
    }

    get stat() {
        return (this.lycMatchInt << 6) | (this.mode10Int << 5) | (this.mode01Int << 4) | (this.mode00Int << 3) | (this.lycMatch << 2) | this.mode;
    }

    set stat(value) {
        this.lycMatchInt = (value & 0b01000000) != 0;
        this.mode10Int = (value & 0b00100000) != 0;
        this.mode01Int = (value & 0b00010000) != 0;
        this.mode00Int = (value & 0b00001000) != 0;
    }

    set dma(value) {
        const h = value << 8;
        for (let l = 0; l < this.OAM.length; l++) {
            this.OAM[l] = this.gb.readAddress(h | l)
        }
        this.gb.cycles -= this.OAM.length;
    }

    get bgp() {
        return this._bgp;
    }

    set bgp(value) {
        this._bgp = value;
        this.bgPalette = [value & 0b11, (value >> 2) & 0b11, (value >> 4) & 0b11, (value >> 6) & 0b11];
    }

    get obp0() {
        return this._obp0;
    }

    set obp0(value) {
        this._obp0 = value;
        this.objPalette[0] = [value & 0b11, (value >> 2) & 0b11, (value >> 4) & 0b11, (value >> 6) & 0b11];
    }

    get obp1() {
        return this._obp1;
    }

    set obp1(value) {
        this._obp1 = value;
        this.objPalette[1] = [value & 0b11, (value >> 2) & 0b11, (value >> 4) & 0b11, (value >> 6) & 0b11];
    }

    writePixel(y, x, value) {
        this.pixels[(y + CANVAS_MARGIN) * CANVAS_WIDTH + (x + CANVAS_MARGIN)] = this.PALETTE[value];
    }

    renderLine() {
        const bg = new Uint8Array(DISPLAY_WIDTH);
        for (let x = 0; x < DISPLAY_WIDTH; x++) {
            if (this.bgOn) {
                if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                    const tilemapY = (this.windowLine >> 3) & 0b11111;
                    const tilemapX = ((x - (this.wx - 7)) >> 3) & 0b11111;
                    const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.VRAM[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = this.windowLine & 0b111;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x - (this.wx - 7)) & 0b111;
                    const palette = (((this.VRAM[tileAddress + 1] << tileX) & 0b10000000) >> 6) | (((this.VRAM[tileAddress] << tileX) & 0b10000000) >> 7);

                    bg[x] = palette;
                    this.writePixel(this.ly, x, this.bgPalette[palette]);
                } else {
                    const tilemapY = ((this.ly + this.scy) >> 3) & 0b11111;
                    const tilemapX = ((x + this.scx) >> 3) & 0b11111;
                    const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.VRAM[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = (this.ly + this.scy) & 0b111;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x + this.scx) & 0b111;
                    const palette = (((this.VRAM[tileAddress | 0b1] << tileX) & 0b10000000) >> 6) | (((this.VRAM[tileAddress] << tileX) & 0b10000000) >> 7);

                    bg[x] = palette;
                    this.writePixel(this.ly, x, this.bgPalette[palette]);
                }
            } else {
                this.writePixel(this.ly, x, 0b00);
            }
        }

        if (this.objOn) {
            const objs = [];
            for (let obj = 0; obj < 40 && objs.length < 10; obj++) {
                const objY = this.OAM[obj << 2];
                if (this.ly + (this.objHeight ? 0 : 8) < objY && this.ly + 16 >= objY) {
                    objs.push(obj);
                }
            }
            objs.sort((a, b) => {
                const objXA = this.OAM[(a << 2) | 0b01];
                const objXB = this.OAM[(b << 2) | 0b01];
                if (objXA != objXB) {
                    return objXB - objXA;
                }
                return b - a;
            });
            objs.forEach(obj => {
                const objAddress = obj << 2;
                const objY = this.OAM[objAddress | 0b00];
                const objX = this.OAM[objAddress | 0b01];
                const tile = this.OAM[objAddress | 0b10] & ~(this.objHeight ? 0b1 : 0b0);
                const attributes = this.OAM[objAddress | 0b11];
                const priority = (attributes & 0b10000000) != 0;
                const yFlip = (attributes & 0b1000000) != 0;
                const xFlip = (attributes & 0b100000) != 0;
                const paletteNumber = (attributes & 0b10000) >> 4;

                if (objX != 0 && objX < DISPLAY_WIDTH + 8) {
                    let tileY = this.ly - objY + 16;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const minX = (objX > 8) ? objX - 8 : 0;
                    const maxX = (objX < DISPLAY_WIDTH) ? objX : DISPLAY_WIDTH;
                    const beginX = xFlip ? maxX - 1 : minX;
                    const endX = xFlip ? minX - 1 : maxX;
                    const incX = xFlip ? -1 : 1;
                    for (let x = beginX, tileX = 0; x != endX; x += incX, tileX++) {
                        const palette = (((this.VRAM[tileAddress + 1] << tileX) & 0b10000000) >> 6) | (((this.VRAM[tileAddress] << tileX) & 0b10000000) >> 7);

                        if (!this.bgOn || (palette != 0b00 && (!priority || bg[x] == 0b00))) {
                            this.writePixel(this.ly, x, this.objPalette[paletteNumber][palette]);
                        }
                    }
                }
            });
        }
    }

    renderFrame() {
        canvasCtx.putImageData(this.imageData, 0, 0);
    }

    cycle() {
        this.lycMatch = this.ly == this.lyc;
        if (this.lycMatch && this.lycMatchInt && this.cycles == 0) {
            this.gb.requestInterrupt(this.gb.STAT);
        }

        if (this.lcdOn) {
            if (this.ly < DISPLAY_HEIGHT) {
                if (this.cycles == 0) {
                    if (this.mode10Int) {
                        this.gb.requestInterrupt(this.gb.STAT);
                    }
                    this.mode = this.SEARCH_OAM;
                }
                if (this.cycles == 80) {
                    this.mode = this.TRANSFER;
                }
                if (this.cycles == 248) {
                    if (this.cycles == 248 && this.mode00Int) {
                        this.gb.requestInterrupt(this.gb.STAT);
                    }
                    this.mode = this.HBLANK;
                    this.renderLine();
                }
            }
            if (this.ly == DISPLAY_HEIGHT && this.cycles == 0) {
                if (this.mode01Int) {
                    this.gb.requestInterrupt(this.gb.STAT);
                }
                this.gb.requestInterrupt(this.gb.VBLANK);
                this.mode = this.VBLANK;
                this.renderFrame();
            }

            this.cycles += 4;
            if (this.cycles == DISPLAY_CYCLES_PER_LINE) {
                this.cycles = 0;
                if (this.windowOn && this.ly >= this.wy && this.wx <= 166) {
                    this.windowLine++;
                }
                this.ly++;
                if (this.ly == LINES_PER_FRAME) {
                    this.ly = 0;
                    this.windowLine = 0;
                }
            }
        }
    }
}

class GameBoy {
    constructor() {
        this.INTERRUPT = 0b00011111;
        this.JOYPAD = 0b00010000;
        this.SERIAL = 0b00001000;
        this.TIMER = 0b00000100;
        this.STAT = 0b00000010;
        this.VBLANK = 0b00000001;

        this.display = new Display(this);
        this.timer = new Timer(this);
        this.joypad = new Joypad(this);
        this.cartridge = new Cartridge(this);
        this.sound = new Sound(this);

        this.a = 0;
        this.fz = false;
        this.fn = false;
        this.fh = false;
        this.fc = false;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;
        this.h = 0;
        this.l = 0;
        this._pc = 0;
        this._sp = 0;

        this.ime = false;

        this.halt = false;

        this._if = 0;
        this._ie = 0;

        this.bootDone = false;

        this.cycles = 0;

        this.BOOT = new Uint8Array([
            0x31, 0xfe, 0xff, 0xaf, 0x21, 0xff, 0x9f, 0x32, 0xcb, 0x7c, 0x20, 0xfb, 0x21, 0x26, 0xff, 0x0e,
            0x11, 0x3e, 0x80, 0x32, 0xe2, 0x0c, 0x3e, 0xf3, 0xe2, 0x32, 0x3e, 0x77, 0x77, 0x3e, 0xfc, 0xe0,
            0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1a, 0xcd, 0x95, 0x00, 0xcd, 0x96, 0x00, 0x13, 0x7b,
            0xfe, 0x34, 0x20, 0xf3, 0x11, 0xd8, 0x00, 0x06, 0x08, 0x1a, 0x13, 0x22, 0x23, 0x05, 0x20, 0xf9,
            0x3e, 0x19, 0xea, 0x10, 0x99, 0x21, 0x2f, 0x99, 0x0e, 0x0c, 0x3d, 0x28, 0x08, 0x32, 0x0d, 0x20,
            0xf9, 0x2e, 0x0f, 0x18, 0xf3, 0x67, 0x3e, 0x64, 0x57, 0xe0, 0x42, 0x3e, 0x91, 0xe0, 0x40, 0x04,
            0x1e, 0x02, 0x0e, 0x0c, 0xf0, 0x44, 0xfe, 0x90, 0x20, 0xfa, 0x0d, 0x20, 0xf7, 0x1d, 0x20, 0xf2,
            0x0e, 0x13, 0x24, 0x7c, 0x1e, 0x83, 0xfe, 0x62, 0x28, 0x06, 0x1e, 0xc1, 0xfe, 0x64, 0x20, 0x06,
            0x7b, 0xe2, 0x0c, 0x3e, 0x87, 0xe2, 0xf0, 0x42, 0x90, 0xe0, 0x42, 0x15, 0x20, 0xd2, 0x05, 0x20,
            0x4f, 0x16, 0x20, 0x18, 0xcb, 0x4f, 0x06, 0x04, 0xc5, 0xcb, 0x11, 0x17, 0xc1, 0xcb, 0x11, 0x17,
            0x05, 0x20, 0xf5, 0x22, 0x23, 0x22, 0x23, 0xc9, 0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
            0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d, 0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
            0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
            0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e, 0x3c, 0x42, 0xb9, 0xa5, 0xb9, 0xa5, 0x42, 0x3c,
            0x21, 0x04, 0x01, 0x11, 0xa8, 0x00, 0x1a, 0x13, 0xbe, 0x20, 0xfe, 0x23, 0x7d, 0xfe, 0x34, 0x20,
            0xf5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xfb, 0x86, 0x20, 0xfe, 0x3e, 0x01, 0xe0, 0x50,
        ]);
        this.WRAM = new Uint8Array(0x2000);
        this.HRAM = new Uint8Array(0x7f);
    }

    get f() {
        return (this.fz << 7) | (this.fn << 6) | (this.fh << 5) | (this.fc << 4);
    }

    set f(value) {
        this.fz = (value & 0b10000000) != 0;
        this.fn = (value & 0b01000000) != 0;
        this.fh = (value & 0b00100000) != 0;
        this.fc = (value & 0b00010000) != 0;
    }

    get bc() {
        return (this.b << 8) | this.c;
    }

    get de() {
        return (this.d << 8) | this.e;
    }

    get hl() {
        return (this.h << 8) | this.l;
    }

    get sp() {
        return this._sp;
    }

    get sph() {
        return this._sp >> 8;
    }

    get spl() {
        return this._sp & 0xff;
    }

    get pc() {
        return this._pc;
    }

    get pch() {
        return this._pc >> 8;
    }

    get pcl() {
        return this._pc & 0xff;
    }

    set bc(value) {
        this.b = (value >> 8) & 0xff;
        this.c = value & 0xff;
    }

    set de(value) {
        this.d = (value >> 8) & 0xff;
        this.e = value & 0xff;
    }

    set hl(value) {
        this.h = (value >> 8) & 0xff;
        this.l = value & 0xff;
    }

    set sp(value) {
        this._sp = value & 0xffff;
    }

    set pc(value) {
        this._pc = value & 0xffff;
    }

    get if() {
        return this._if;
    }

    set if(value) {
        this._if = value & this.INTERRUPT;
    }

    get ie() {
        return this._ie;
    }

    set ie(value) {
        this._ie = value & this.INTERRUPT;
    }

    requestInterrupt(interrupt) {
        this._if |= interrupt;
    }

    clearInterrupt(interrupt) {
        this._if &= ~interrupt;
    }

    callInterrupt(address) {
        this.writeAddress(--this.sp, this.pch);
        this.writeAddress(--this.sp, this.pcl);
        this.pc = address;
        this.cycles += 3;
    }

    readAddress(address) {
        this.cycles += 1;
        switch (address >> 12) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
            case 0x4:
            case 0x5:
            case 0x6:
            case 0x7:
                if (!this.bootDone && address < 0x100) {
                    return this.BOOT[address];
                } else {
                    return this.cartridge.readROM(address & 0x7fff);
                }
            case 0x8:
            case 0x9:
                return this.display.VRAM[address & 0x1fff];
            case 0xa:
            case 0xb:
                return this.cartridge.readRAM(address & 0x1fff);
            case 0xc:
            case 0xd:
                return this.WRAM[address & 0x1fff];
            case 0xe:
            case 0xf:
                if (address < 0xfe00) {
                    return this.WRAM[address & 0x1fff];
                } else if (address < 0xff00) {
                    return this.display.OAM[address & 0xff];
                } else if (address < 0xff80) {
                    switch (address & 0xff) {
                        case 0x00: return this.joypad.p1;
                        case 0x01: return 0x00;
                        case 0x02: return 0x00;
                        case 0x04: return this.timer.div;
                        case 0x05: return this.timer.tima;
                        case 0x06: return this.timer.tma;
                        case 0x07: return this.timer.tac;
                        case 0x0f: return this.if;
                        case 0x10: return this.sound.nr10;
                        case 0x11: return this.sound.nr11;
                        case 0x12: return this.sound.nr12;
                        case 0x13: return this.sound.nr13;
                        case 0x14: return this.sound.nr14;
                        case 0x16: return this.sound.nr21;
                        case 0x17: return this.sound.nr22;
                        case 0x18: return this.sound.nr23;
                        case 0x19: return this.sound.nr24;
                        case 0x1a: return this.sound.nr30;
                        case 0x1b: return this.sound.nr31;
                        case 0x1c: return this.sound.nr32;
                        case 0x1d: return this.sound.nr33;
                        case 0x1e: return this.sound.nr34;
                        case 0x20: return this.sound.nr41;
                        case 0x21: return this.sound.nr42;
                        case 0x22: return this.sound.nr43;
                        case 0x23: return this.sound.nr44;
                        case 0x24: return this.sound.nr50;
                        case 0x25: return this.sound.nr51;
                        case 0x26: return this.sound.nr52;
                        case 0x30:
                        case 0x31:
                        case 0x32:
                        case 0x33:
                        case 0x34:
                        case 0x35:
                        case 0x36:
                        case 0x37:
                        case 0x38:
                        case 0x39:
                        case 0x3a:
                        case 0x3b:
                        case 0x3c:
                        case 0x3d:
                        case 0x3e:
                        case 0x3f: return this.sound.readWave(address & 0xf);
                        case 0x40: return this.display.lcdc;
                        case 0x41: return this.display.stat;
                        case 0x42: return this.display.scy;
                        case 0x43: return this.display.scx;
                        case 0x44: return this.display.ly;
                        case 0x45: return this.display.lyc;
                        case 0x47: return this.display.bgp;
                        case 0x48: return this.display.obp0;
                        case 0x49: return this.display.obp1;
                        case 0x4a: return this.display.wy;
                        case 0x4b: return this.display.wx;
                        default: return 0x00;
                    }
                } else if (address < 0xffff) {
                    return this.HRAM[address & 0x7f];
                } else {
                    return this.ie;
                }
        }
    }

    writeAddress(address, value) {
        this.cycles += 1;
        switch (address >> 12) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
            case 0x4:
            case 0x5:
            case 0x6:
            case 0x7:
                this.cartridge.writeROM(address & 0x7fff, value); break;
            case 0x8:
            case 0x9:
                this.display.VRAM[address & 0x1fff] = value; break;
            case 0xa:
            case 0xb:
                this.cartridge.writeRAM(address & 0x1fff, value); break;
            case 0xc:
            case 0xd:
                this.WRAM[address & 0x1fff] = value; break;
            case 0xe:
            case 0xf:
                if (address < 0xfe00) {
                    this.WRAM[address & 0x1fff] = value;
                } else if (address < 0xff00) {
                    this.display.OAM[address & 0xff] = value;
                } else if (address < 0xff80) {
                    switch (address & 0xff) {
                        case 0x00: this.joypad.p1 = value; break;
                        case 0x01: break;
                        case 0x02: break;
                        case 0x04: this.timer.div = value; break;
                        case 0x05: this.timer.tima = value; break;
                        case 0x06: this.timer.tma = value; break;
                        case 0x07: this.timer.tac = value; break;
                        case 0x0f: this.if = value; break;
                        case 0x10: this.sound.nr10 = value; break;
                        case 0x11: this.sound.nr11 = value; break;
                        case 0x12: this.sound.nr12 = value; break;
                        case 0x13: this.sound.nr13 = value; break;
                        case 0x14: this.sound.nr14 = value; break;
                        case 0x16: this.sound.nr21 = value; break;
                        case 0x17: this.sound.nr22 = value; break;
                        case 0x18: this.sound.nr23 = value; break;
                        case 0x19: this.sound.nr24 = value; break;
                        case 0x1a: this.sound.nr30 = value; break;
                        case 0x1b: this.sound.nr31 = value; break;
                        case 0x1c: this.sound.nr32 = value; break;
                        case 0x1d: this.sound.nr33 = value; break;
                        case 0x1e: this.sound.nr34 = value; break;
                        case 0x20: this.sound.nr41 = value; break;
                        case 0x21: this.sound.nr42 = value; break;
                        case 0x22: this.sound.nr43 = value; break;
                        case 0x23: this.sound.nr44 = value; break;
                        case 0x24: this.sound.nr50 = value; break;
                        case 0x25: this.sound.nr51 = value; break;
                        case 0x26: this.sound.nr52 = value; break;
                        case 0x30:
                        case 0x31:
                        case 0x32:
                        case 0x33:
                        case 0x34:
                        case 0x35:
                        case 0x36:
                        case 0x37:
                        case 0x38:
                        case 0x39:
                        case 0x3a:
                        case 0x3b:
                        case 0x3c:
                        case 0x3d:
                        case 0x3e:
                        case 0x3f: this.sound.writeWave(address & 0xf, value); break;
                        case 0x40: this.display.lcdc = value; break;
                        case 0x41: this.display.stat = value; break;
                        case 0x42: this.display.scy = value; break;
                        case 0x43: this.display.scx = value; break;
                        case 0x45: this.display.lyc = value; break;
                        case 0x46: this.display.dma = value; break;
                        case 0x47: this.display.bgp = value; break;
                        case 0x48: this.display.obp0 = value; break;
                        case 0x49: this.display.obp1 = value; break;
                        case 0x4a: this.display.wy = value; break;
                        case 0x4b: this.display.wx = value; break;
                        case 0x50: this.bootDone = true; break;
                        default: break;
                    }
                } else if (address < 0xffff) {
                    this.HRAM[address & 0x7f] = value;
                } else {
                    this.ie = value;
                }
        }
    }

    readRegister(register) {
        switch (register) {
            case 0b000: return this.b;
            case 0b001: return this.c;
            case 0b010: return this.d;
            case 0b011: return this.e;
            case 0b100: return this.h;
            case 0b101: return this.l;
            case 0b110: return this.readAddress(this.hl);
            case 0b111: return this.a;
        }
    }

    writeRegister(register, value) {
        switch (register) {
            case 0b000: this.b = value; break;
            case 0b001: this.c = value; break;
            case 0b010: this.d = value; break;
            case 0b011: this.e = value; break;
            case 0b100: this.h = value; break;
            case 0b101: this.l = value; break;
            case 0b110: this.writeAddress(this.hl, value); break;
            case 0b111: this.a = value; break;
        }
    }

    readDoubleRegisterIndirect(register) {
        switch (register) {
            case 0b00: return this.readAddress(this.bc);
            case 0b01: return this.readAddress(this.de);
            case 0b10: return this.readAddress(this.hl++);
            case 0b11: return this.readAddress(this.hl--);
        }
    }

    writeDoubleRegisterIndirect(register, value) {
        switch (register) {
            case 0b00: this.writeAddress(this.bc, value); break;
            case 0b01: this.writeAddress(this.de, value); break;
            case 0b10: this.writeAddress(this.hl++, value); break;
            case 0b11: this.writeAddress(this.hl--, value); break;
        }
    }

    readDoubleRegister(register) {
        switch (register) {
            case 0b00: return this.bc;
            case 0b01: return this.de;
            case 0b10: return this.hl;
            case 0b11: return this.sp;
        }
    }

    writeDoubleRegister(register, value) {
        switch (register) {
            case 0b00: this.bc = value; break;
            case 0b01: this.de = value; break;
            case 0b10: this.hl = value; break;
            case 0b11: this.sp = value; break;
        }
    }

    popDoubleRegister(register) {
        switch (register) {
            case 0b00: this.c = this.readAddress(this.sp++); this.b = this.readAddress(this.sp++); break;
            case 0b01: this.e = this.readAddress(this.sp++); this.d = this.readAddress(this.sp++); break;
            case 0b10: this.l = this.readAddress(this.sp++); this.h = this.readAddress(this.sp++); break;
            case 0b11: this.f = this.readAddress(this.sp++); this.a = this.readAddress(this.sp++); break;
        }
    }

    pushDoubleRegister(register) {
        switch (register) {
            case 0b00: this.writeAddress(--this.sp, this.b); this.writeAddress(--this.sp, this.c); break;
            case 0b01: this.writeAddress(--this.sp, this.d); this.writeAddress(--this.sp, this.e); break;
            case 0b10: this.writeAddress(--this.sp, this.h); this.writeAddress(--this.sp, this.l); break;
            case 0b11: this.writeAddress(--this.sp, this.a); this.writeAddress(--this.sp, this.f); break;
        }
    }

    readCondition(condition) {
        switch (condition) {
            case 0b00: return !this.fz;
            case 0b01: return this.fz;
            case 0b10: return !this.fc;
            case 0b11: return this.fc;
        }
    }

    cycle() {
        this.cycles = 0;

        if ((this.ime || this.halt) && (this.ie & this.if) != 0) {
            this.halt = false;
            if (this.ime) {
                this.ime = false;
                if ((this.ie & this.if & this.VBLANK) != 0) {
                    this.clearInterrupt(this.VBLANK);
                    this.callInterrupt(0x0040);
                } else if ((this.ie & this.if & this.STAT) != 0) {
                    this.clearInterrupt(this.STAT);
                    this.callInterrupt(0x0048);
                } else if ((this.ie & this.if & this.TIMER) != 0) {
                    this.clearInterrupt(this.TIMER);
                    this.callInterrupt(0x0050);
                } else if ((this.ie & this.if & this.SERIAL) != 0) {
                    this.clearInterrupt(this.SERIAL);
                    this.callInterrupt(0x0058);
                } else if ((this.ie & this.if & this.JOYPAD) != 0) {
                    this.clearInterrupt(this.JOYPAD);
                    this.callInterrupt(0x0060);
                }
            }
        }

        if (this.halt) {
            this.cycles += 1;
        } else {
            this.decode();
        }

        let displayCycles = this.cycles;
        while (displayCycles-- > 0) {
            this.display.cycle();
        }

        let timerCycles = this.cycles;
        while (timerCycles-- > 0) {
            this.timer.cycle();
        }

        let soundCycles = this.cycles;
        while (soundCycles-- > 0) {
            this.sound.cycle();
        }

        return this.cycles;
    }

    decode() {
        const instr = this.readAddress(this.pc++);
        const quad = instr >> 6;
        const ops = instr & 0b111111;
        const op1 = ops >> 3, op2 = ops & 0b111;
        if (quad === 0b00) {
            if (op2 == 0b110) {
                // LD r, n
                const imm = this.readAddress(this.pc++);
                this.writeRegister(op1, imm);
            } else if (op2 == 0b010) {
                if ((op1 & 0b1) == 0b1) {
                    // LD A, (rr)
                    this.a = this.readDoubleRegisterIndirect(op1 >> 1);
                } else {
                    // LD (rr), A
                    this.writeDoubleRegisterIndirect(op1 >> 1, this.a);
                }
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b001) {
                // LD dd, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeDoubleRegister(op1 >> 1, (imm2 << 8) | imm1);
            } else if (op1 == 0b001 && op2 == 0b000) {
                // LD (nn), SP
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                let address = (imm2 << 8) | imm1;
                this.writeAddress(address++, this.spl);
                this.writeAddress(address++, this.sph);
            } else if (op2 == 0b100) {
                // INC r
                const tmp = (this.readRegister(op1) + 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0;
                this.fn = false;
                this.fz = tmp == 0;
            } else if (op2 == 0b101) {
                // DEC r
                const tmp = (this.readRegister(op1) - 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0xf;
                this.fn = true;
                this.fz = tmp == 0;
            } else if ((op1 & 0b1) == 0b1 && op2 == 0b001) {
                // ADD HL, ss
                const ss = this.readDoubleRegister(op1 >> 1);
                this.fc = this.hl + ss > 0xffff;
                this.fh = (this.hl & 0xfff) + (ss & 0xfff) > 0xfff;
                this.fn = false;
                this.hl += ss;
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b011) {
                // INC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) + 1);
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b1 && op2 == 0b011) {
                // DEC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) - 1);
                this.cycles += 1;
            } else if (op1 == 0b000 && op2 == 0b111) {
                // RLCA
                const carry = this.a & 0b10000000;
                this.a = ((this.a << 1) | (carry >> 7)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b001 && op2 == 0b111) {
                // RRCA
                const carry = this.a & 0b1;
                this.a = ((carry << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b010 && op2 == 0b111) {
                // RLA
                const carry = this.a & 0b10000000;
                this.a = ((this.a << 1) | this.fc) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b011 && op2 == 0b111) {
                // RRA
                const carry = this.a & 0b1;
                this.a = ((this.fc << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 0b011 && op2 == 0b000) {
                // JR e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                this.pc += offset;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b100 && op2 == 0b000) {
                // JR cc, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                if (this.readCondition(op1 & 0b11)) {
                    this.pc += offset;
                    this.cycles += 1;
                }
            } else if (op1 == 0b100 && op2 == 0b111) {
                // DAA
                let tmp = this.a;
                if (!this.fn) {
                    if (this.fc || tmp > 0x99) {
                        tmp += 0x60;
                        this.fc = true;
                    }
                    if (this.fh || (tmp & 0xf) > 0x9) {
                        tmp += 0x06;
                    }
                } else {
                    if (this.fc) {
                        tmp -= 0x60;
                    }
                    if (this.fh) {
                        tmp -= 0x6;
                    }
                }
                this.fh = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b101 && op2 == 0b111) {
                // CPL
                this.a ^= 0xff;
                this.fh = true;
                this.fn = true;
            } else if (op1 == 0b000 && op2 == 0b000) {
                // NOP
            } else if (op1 == 0b110 && op2 == 0b111) {
                // SCF
                this.fc = true;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 0b111 && op2 == 0b111) {
                // CCF
                this.fc = !this.fc;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 0b010 && op2 == 0b000) {
                // STOP

            } else {
                throw 'unknown instruction: 0x' + instr.toString(16);
            }
        } else if (quad === 0b01) {
            if (op1 != 0b110 || op2 != 0b110) {
                // LD r, r'
                this.writeRegister(op1, this.readRegister(op2));
            } else {
                // HALT
                this.halt = true;
            }
        } else if (quad === 0b10) {
            const r = this.readRegister(op2);
            if (op1 == 0b000) {
                // ADD A, r
                const tmp = this.a + r;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b001) {
                // ADC A, r
                const carry = this.fc;
                const tmp = this.a + r + carry;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b010) {
                // SUB A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b011) {
                // SBC A, r
                const carry = this.fc
                const tmp = this.a - r - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b100) {
                // AND A, r
                const tmp = this.a & r;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b101) {
                // XOR A, r
                const tmp = this.a ^ r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b110) {
                // OR A, r
                const tmp = this.a | r;
                this.a |= r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b111) {
                // CP A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            }
        } else if (quad === 0b11) {
            if (op1 == 0b110 && op2 == 0b010) {
                // LD A, (C)
                this.a = this.readAddress(0xff00 | this.c);
            } else if (op1 == 0b100 && op2 == 0b010) {
                // LD (C), A
                this.writeAddress(0xff00 | this.c, this.a);
            } else if (op1 == 0b110 && op2 == 0b000) {
                // LD A, (n)
                const imm = this.readAddress(this.pc++);
                this.a = this.readAddress(0xff00 | imm);
            } else if (op1 == 0b100 && op2 == 0b000) {
                // LD (n), A
                const imm = this.readAddress(this.pc++);
                this.writeAddress(0xff00 | imm, this.a);
            } else if (op1 == 0b111 && op2 == 0b010) {
                // LD A, (nn)
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.a = this.readAddress((imm2 << 8) | imm1);
            } else if (op1 == 0b101 && op2 == 0b010) {
                // LD (nn), A
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress((imm2 << 8) | imm1, this.a);
            } else if (op1 == 0b111 && op2 == 0b001) {
                // LD SP, HL
                this.sp = this.hl;
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b101) {
                // PUSH qq
                this.pushDoubleRegister(op1 >> 1);
                this.cycles += 1;
            } else if ((op1 & 0b1) == 0b0 && op2 == 0b001) {
                // POP qq
                this.popDoubleRegister(op1 >> 1);
            } else if (op1 == 0b111 && op2 == 0b000) {
                // LDHL SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.hl = tmp;
                this.cycles += 1;
            } else if (op1 == 0b101 && op2 == 0b000) {
                // ADD SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.sp = tmp;
                this.cycles += 1;
                this.cycles += 1;
            } else if (op1 == 0b000 && op2 == 0b110) {
                // ADD A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a + imm
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b001 && op2 == 0b110) {
                // ADC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a + imm + carry
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b010 && op2 == 0b110) {
                // SUB A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b011 && op2 == 0b110) {
                // SBC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a - imm - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 0b100 && op2 == 0b110) {
                // AND A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a & imm;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b101 && op2 == 0b110) {
                // XOR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a ^ imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b110 && op2 == 0b110) {
                // OR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a | imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 0b111 && op2 == 0b110) {
                // CP A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            } else if (op1 == 0b001 && op2 == 0b011) {
                this.decode_cb();
            } else if (op1 == 0b000 && op2 == 0b011) {
                // JP nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.pc = (imm2 << 8) | imm1;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b000 && op2 == 0b010) {
                // JP cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0b11)) {
                    this.pc = (imm2 << 8) | imm1;
                    this.cycles += 1;
                }
            } else if (op1 == 0b101 && op2 == 0b001) {
                // JP HL
                this.pc = this.hl;
            } else if (op1 == 0b001 && op2 == 0b101) {
                // CALL nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = (imm2 << 8) | imm1;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b000 && op2 == 0b100) {
                // CALL cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0b11)) {
                    this.writeAddress(--this.sp, this.pch);
                    this.writeAddress(--this.sp, this.pcl);
                    this.pc = (imm2 << 8) | imm1;
                    this.cycles += 1;
                }
            } else if (op1 == 0b001 && op2 == 0b001) {
                // RET
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
                this.cycles += 1;
            } else if (op1 == 0b011 && op2 == 0b001) {
                // RETI
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
                this.ime = true;
                this.cycles += 1;
            } else if ((op1 & 0b100) == 0b000 && op2 == 0b000) {
                // RET cc
                if (this.readCondition(op1 & 0b11)) {
                    this.pc = this.readAddress(this.sp++);
                    this.pc |= this.readAddress(this.sp++) << 8;
                    this.cycles += 1;
                }
                this.cycles += 1;
            } else if (op2 == 0b111) {
                // RST t
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = op1 << 3;
                this.cycles += 1;
            } else if ((op1 & 0b110) == 0b110 && op2 == 0b011) {
                // DI/EI
                this.ime = (op1 & 0b1) != 0;
            } else {
                throw 'unknown instruction: 0x' + instr.toString(16);
            }
        }
    }

    decode_cb() {
        const instr = this.readAddress(this.pc++);
        const quad = instr >> 6;
        const ops = instr & 0b111111;
        const op1 = ops >> 3, op2 = ops & 0b111;
        if (quad == 0b00) {
            const r = this.readRegister(op2);
            if (op1 == 0b000) {
                // RLC r
                const carry = r & 0b10000000;
                const tmp = ((r << 1) | (carry >> 7)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b001) {
                // RRC r
                const carry = r & 0b1;
                const tmp = ((carry << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b010) {
                // RL r
                const carry = r & 0b10000000;
                const tmp = ((r << 1) | this.fc) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b011) {
                // RR r
                const carry = r & 0b1;
                const tmp = ((this.fc << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b100) {
                // SLA r
                const carry = r & 0b10000000;
                const tmp = (r << 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b101) {
                // SRA r
                const carry = r & 0b1;
                const tmp = ((r & 0b10000000) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b110) {
                // SWAP r
                const tmp = ((r << 4) | (r >> 4)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 0b111) {
                // SRL r
                const carry = r & 0b1;
                const tmp = (r >> 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            }
        } else if (quad == 0b01) {
            // BIT b, r
            this.fh = true;
            this.fn = false;
            this.fz = (this.readRegister(op2) & (1 << op1)) == 0;
        } else if (quad == 0b10) {
            // RES b, r
            this.writeRegister(op2, this.readRegister(op2) & ~(1 << op1))
        } else if (quad == 0b11) {
            // SET b, r
            this.writeRegister(op2, this.readRegister(op2) | (1 << op1))
        }
    }
}

let gb;
let cycles;
let next;
let paused = false;
let running = false;
let intervalId;

function update() {
    while (cycles < CPU_CYCLES_PER_FRAME) {
        cycles += gb.cycle();
    }
    cycles -= CPU_CYCLES_PER_FRAME;
    next += FRAME_DURATION * MILLISECONDS;
    intervalId = setTimeout(update, next - performance.now());
}

onbeforeunload = () => {
    if (running) {
        gb.cartridge.save();
    }
};

document.onvisibilitychange = () => {
    if (running) {
        if (document.hidden) {
            clearTimeout(intervalId);
            audioCtx.suspend();
            paused = true;
        } else {
            if (paused) {
                paused = false;
                audioCtx.resume();
                next = performance.now();
                update();
            }
        }
    }
}

document.onclick = () => {
    audioCtx.resume();
}

document.getElementById('rom').onchange = e => {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = e => {
        if (running) {
            clearTimeout(update);
            gb.cartridge.save();
        }
        gb = new GameBoy();
        try {
            gb.cartridge.load(new Uint8Array(e.target.result));

            running = true;
            next = performance.now();
            cycles = 0;
            update();
        } catch (error) {
            console.log(error);
        }
    };
};

document.onkeydown = e => {
    if (running) {
        switch (e.code) {
            case "Enter": gb.joypad.start = true; break;
            case "ShiftRight": gb.joypad.select = true; break;
            case "KeyZ": gb.joypad.b = true; break;
            case "KeyX": gb.joypad.a = true; break;
            case "ArrowDown": gb.joypad.down = true; break;
            case "ArrowUp": gb.joypad.up = true; break;
            case "ArrowLeft": gb.joypad.left = true; break;
            case "ArrowRight": gb.joypad.right = true; break;
        }
    }
}

document.onkeyup = e => {
    if (running) {
        switch (e.code) {
            case "Enter": gb.joypad.start = false; break;
            case "ShiftRight": gb.joypad.select = false; break;
            case "KeyZ": gb.joypad.b = false; break;
            case "KeyX": gb.joypad.a = false; break;
            case "ArrowDown": gb.joypad.down = false; break;
            case "ArrowUp": gb.joypad.up = false; break;
            case "ArrowLeft": gb.joypad.left = false; break;
            case "ArrowRight": gb.joypad.right = false; break;
        }
    }
}
