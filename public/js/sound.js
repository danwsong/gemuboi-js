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

        this.clearState();

        this.soundEnable = false;

        this.gainNode = Sound.ctx.createGain();
        this.gainNode.gain.value = 0.25;
        this.gainNode.connect(Sound.ctx.destination);

        this.buffer = Sound.ctx.createBuffer(2, Sound.bufferSamples, Sound.sampleFrequency);
        this.bufferLeft = this.buffer.getChannelData(0);
        this.bufferRight = this.buffer.getChannelData(1);
    }

    get nr10() {
        return 0x80 | (this.channel1SweepDuration << 4) | (this.channel1SweepDown << 3) | this.channel1SweepShift;
    }

    set nr10(value) {
        this.channel1SweepDuration = (value & 0x70) >> 4;
        this.channel1SweepDown = (value & 0x8) != 0;
        this.channel1SweepShift = value & 0x7;
    }

    get nr11() {
        return 0x3f | (this.channel1Duty << 6);
    }

    set nr11(value) {
        this.channel1Duty = (value & 0xc0) >> 6;
        this.channel1LengthCounter = 64 - (value & 0x3f);
    }

    get nr12() {
        return (this.channel1InitialVolume << 4) | (this.channel1VolumeUp << 3) | this.channel1EnvelopeDuration;
    }

    set nr12(value) {
        this.channel1InitialVolume = (value & 0xf0) >> 4;
        this.channel1VolumeUp = (value & 0x8) != 0;
        this.channel1EnvelopeDuration = value & 0x7;
    }

    get nr13() {
        return 0xff;
    }

    set nr13(value) {
        this.channel1Frequency = (this.channel1Frequency & 0x700) | value;
    }

    get nr14() {
        return 0xbf | (this.channel1LengthEnable << 6);
    }

    set nr14(value) {
        this.channel1Trigger = (value & 0x80) != 0;
        this.channel1LengthEnable = (value & 0x40) != 0;
        this.channel1Frequency = ((value & 0x7) << 8) | (this.channel1Frequency & 0xff);
    }

    get nr21() {
        return 0x3f | (this.channel2Duty << 6);
    }

    set nr21(value) {
        this.channel2Duty = (value & 0xc0) >> 6;
        this.channel2LengthCounter = 64 - (value & 0x3f);
    }

    get nr22() {
        return (this.channel2InitialVolume << 4) | (this.channel2VolumeUp << 3) | this.channel2EnvelopeDuration;
    }

    set nr22(value) {
        this.channel2InitialVolume = (value & 0xf0) >> 4;
        this.channel2VolumeUp = (value & 0x8) != 0;
        this.channel2EnvelopeDuration = value & 0x7;
    }

    get nr23() {
        return 0xff;
    }

    set nr23(value) {
        this.channel2Frequency = (this.channel2Frequency & 0x700) | value;
    }

    get nr24() {
        return 0xbf | (this.channel2LengthEnable << 6);
    }

    set nr24(value) {
        this.channel2Trigger = (value & 0x80) != 0;
        this.channel2LengthEnable = (value & 0x40) != 0;
        this.channel2Frequency = ((value & 0x7) << 8) | (this.channel2Frequency & 0xff);
    }

    get nr30() {
        return 0x7f | (this.channel3Play << 7);
    }

    set nr30(value) {
        this.channel3Play = (value & 0x80) != 0;
    }

    get nr31() {
        return 0xff;
    }

    set nr31(value) {
        this.channel3LengthCounter = 256 - value;
    }

    get nr32() {
        return 0x9f | (this.channel3Volume << 5);
    }

    set nr32(value) {
        this.channel3Volume = (value & 0x60) >> 5;
    }

    get nr33() {
        return 0xff;
    }

    set nr33(value) {
        this.channel3Frequency = (this.channel3Frequency & 0x700) | value;
    }

    get nr34() {
        return 0xbf | (this.channel3LengthEnable << 6);
    }

    set nr34(value) {
        this.channel3Trigger = (value & 0x80) != 0;
        this.channel3LengthEnable = (value & 0x40) != 0;
        this.channel3Frequency = ((value & 0x7) << 8) | (this.channel3Frequency & 0xff);
    }

    get nr41() {
        return 0xff;
    }

    set nr41(value) {
        this.channel4LengthCounter = 64 - (value & 0x3f);
    }

    get nr42() {
        return (this.channel4InitialVolume << 4) | (this.channel4VolumeUp << 3) | this.channel4EnvelopeDuration;
    }

    set nr42(value) {
        this.channel4InitialVolume = (value & 0xf0) >> 4;
        this.channel4VolumeUp = (value & 0x8) != 0;
        this.channel4EnvelopeDuration = value & 0x7;
    }

    get nr43() {
        return (this.channel4ShiftClockFrequency << 4) | (this.channel4CounterStep << 3) | this.channel4DivisionRatio;
    }

    set nr43(value) {
        this.channel4ShiftClockFrequency = (value & 0xf0) >> 4;
        this.channel4CounterStep = (value & 0x8) != 0;
        this.channel4DivisionRatio = value & 0x7;
    }

    get nr44() {
        return 0xbf | (this.channel4LengthEnable << 6);
    }

    set nr44(value) {
        this.channel4Trigger = (value & 0x80) != 0;
        this.channel4LengthEnable = (value & 0x40) != 0;
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
        return 0x70 | (this.soundEnable << 7) | (this.channel4Enable << 3) | (this.channel3Enable << 2) | (this.channel2Enable << 1) | this.channel1Enable;
    }

    set nr52(value) {
        this.soundEnable = (value & 0b10000000) != 0;
        if (!this.soundEnable) {
            this.clearState();
        }
    }

    readAddress(address) {
        if (address <= 0x2f) {
            switch (address) {
                case 0x10: return this.nr10;
                case 0x11: return this.nr11;
                case 0x12: return this.nr12;
                case 0x13: return this.nr13;
                case 0x14: return this.nr14;
                case 0x16: return this.nr21;
                case 0x17: return this.nr22;
                case 0x18: return this.nr23;
                case 0x19: return this.nr24;
                case 0x1a: return this.nr30;
                case 0x1b: return this.nr31;
                case 0x1c: return this.nr32;
                case 0x1d: return this.nr33;
                case 0x1e: return this.nr34;
                case 0x20: return this.nr41;
                case 0x21: return this.nr42;
                case 0x22: return this.nr43;
                case 0x23: return this.nr44;
                case 0x24: return this.nr50;
                case 0x25: return this.nr51;
                case 0x26: return this.nr52;
                default: return 0xff;
            }
        } else {
            return this.readWave(address & 0xf);
        }
    }

    writeAddress(address, value) {
        if (this.soundEnable) {
            if (address <= 0x2f) {
                switch (address) {
                    case 0x10: this.nr10 = value; break;
                    case 0x11: this.nr11 = value; break;
                    case 0x12: this.nr12 = value; break;
                    case 0x13: this.nr13 = value; break;
                    case 0x14: this.nr14 = value; break;
                    case 0x16: this.nr21 = value; break;
                    case 0x17: this.nr22 = value; break;
                    case 0x18: this.nr23 = value; break;
                    case 0x19: this.nr24 = value; break;
                    case 0x1a: this.nr30 = value; break;
                    case 0x1b: this.nr31 = value; break;
                    case 0x1c: this.nr32 = value; break;
                    case 0x1d: this.nr33 = value; break;
                    case 0x1e: this.nr34 = value; break;
                    case 0x20: this.nr41 = value; break;
                    case 0x21: this.nr42 = value; break;
                    case 0x22: this.nr43 = value; break;
                    case 0x23: this.nr44 = value; break;
                    case 0x24: this.nr50 = value; break;
                    case 0x25: this.nr51 = value; break;
                    case 0x26: this.nr52 = value; break;
                    default: break;
                }
            } else {
                this.writeWave(address & 0xf, value);
            }
        } else if (address == 0x26) {
            this.nr52 = value;
        }
    }

    readWave(address) {
        return (this.channel3WaveTable[address * 2] << 4) | this.channel3WaveTable[address * 2 + 1];
    }

    writeWave(address, value) {
        this.channel3WaveTable[address * 2] = (value & 0xf0) >> 4;
        this.channel3WaveTable[address * 2 + 1] = value & 0xf;
    }

    clearState() {
        this.channel1Enable = false;
        this.channel2Enable = false;
        this.channel3Enable = false;
        this.channel4Enable = false;
        this.channel1SweepDuration = 0;
        this.channel1SweepDown = false;
        this.channel1SweepShift = 0;
        this.channel1SweepEnable = false;
        this.channel1Duty = 0;
        this.channel1InitialVolume = 0;
        this.channel1VolumeUp = false;
        this.channel1EnvelopeDuration = 0;
        this.channel1Frequency = 0;
        this.channel1Trigger = false;
        this.channel1LengthEnable = false;
        this.channel2Duty = 0;
        this.channel2InitialVolume = 0;
        this.channel2VolumeUp = false;
        this.channel2EnvelopeDuration = 0;
        this.channel2Frequency = 0;
        this.channel2Trigger = false;
        this.channel2LengthEnable = false;
        this.channel3Play = false;
        this.channel3Volume = 0;
        this.channel3Frequency = 0;
        this.channel3Trigger = false;
        this.channel3LengthEnable = false;
        this.channel4InitialVolume = 0;
        this.channel4VolumeUp = false;
        this.channel4EnvelopeDuration = 0;
        this.channel4ShiftClockFrequency = 0;
        this.channel4CounterStep = false;
        this.channel4DivisionRatio = 0;
        this.channel4Trigger = false;
        this.channel4LengthEnable = false;
        this.outputVinRight = false;
        this.rightVolume = 0;
        this.outputVinLeft = false;
        this.leftVolume = 0;
        this.channel1LeftEnable = false;
        this.channel2LeftEnable = false;
        this.channel3LeftEnable = false;
        this.channel4LeftEnable = false;
        this.channel1RightEnable = false;
        this.channel2RightEnable = false;
        this.channel3RightEnable = false;
        this.channel4RightEnable = false;
    }

    genLFSR() {
        const tmp = ((this.channel4LFSR & 0x2) >> 1) ^ (this.channel4LFSR & 0x1);
        this.channel4LFSR = (tmp << 14) | (this.channel4LFSR >> 1);
        if (this.channel4CounterStep) {
            this.channel4LFSR = (this.channel4LFSR & ~0x40) | (tmp << 6);
        }
    }

    updateLength() {
        if (this.channel1LengthEnable) {
            this.channel1LengthCounter--;
            if (this.channel1LengthCounter == 0) {
                this.channel1Enable = false;
            }
        }
        if (this.channel2LengthEnable) {
            this.channel2LengthCounter--;
            if (this.channel2LengthCounter == 0) {
                this.channel2Enable = false;
            }
        }
        if (this.channel3LengthEnable) {
            this.channel3LengthCounter--;
            if (this.channel3LengthCounter == 0) {
                this.channel3Enable = false;
            }
        }
        if (this.channel4LengthEnable) {
            this.channel4LengthCounter--;
            if (this.channel4LengthCounter == 0) {
                this.channel4Enable = false;
            }
        }
    }

    updateSweep() {
        this.channel1SweepCounter--;
        if (this.channel1SweepCounter <= 0) {
            this.channel1SweepCounter = this.channel1SweepDuration;
            if (this.channel1SweepDuration != 0 && this.channel1SweepEnable) {
                let tmp = this.channel1SweepFrequency + (this.channel1SweepDown ? -1 : 1) * (this.channel1SweepFrequency >> this.channel1SweepShift);
                if (tmp > 2047) {
                    this.channel1Enable = false;
                } else if (this.channel1SweepShift != 0) {
                    this.channel1Frequency = this.channel1SweepFrequency = tmp;
                    tmp = tmp + (this.channel1SweepDown ? -1 : 1) * (tmp >> this.channel1SweepShift);
                    if (tmp > 2047) {
                        this.channel1Enable = false;
                    }
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

    updateTrigger() {
        if (this.channel1Trigger) {
            this.channel1Trigger = false;
            this.channel1Enable = true;
            this.channel1FrequencyCounter = (2048 - this.channel1Frequency) * Sound.cyclesPerPulse;
            if (this.channel1LengthCounter == 0) {
                this.channel1LengthCounter = 64;
            }
            this.channel1SweepFrequency = this.channel1Frequency;
            this.channel1SweepCounter = this.channel1SweepDuration;
            this.channel1SweepEnable = this.channel1SweepDuration != 0 || this.channel1SweepShift != 0;
            this.channel1EnvelopeCounter = this.channel1EnvelopeDuration;
            this.channel1Volume = this.channel1InitialVolume;
            this.channel1Index = 0;
            if (this.channel1SweepShift > 0) {
                const tmp = this.channel1SweepFrequency + (this.channel1SweepDown ? -1 : 1) * (this.channel1SweepFrequency >> this.channel1SweepShift);
                if (tmp > 2047) {
                    this.channel1Enable = false;
                } else if (tmp >= 0) {
                    this.channel1Frequency = this.channel1SweepFrequency = tmp;
                }
            }
        }
        if (this.channel2Trigger) {
            this.channel2Trigger = false;
            this.channel2Enable = true;
            this.channel2FrequencyCounter = (2048 - this.channel2Frequency) * Sound.cyclesPerPulse;
            if (this.channel2LengthCounter == 0) {
                this.channel2LengthCounter = 64;
            }
            this.channel2EnvelopeCounter = this.channel2EnvelopeDuration;
            this.channel2Volume = this.channel2InitialVolume;
            this.channel2Index = 0;
        }
        if (this.channel3Trigger) {
            this.channel3Trigger = false;
            this.channel3Enable = true;
            this.channel3FrequencyCounter = (2048 - this.channel3Frequency) * Sound.cyclesPerWave;
            if (this.channel3LengthCounter == 0) {
                this.channel3LengthCounter = 256;
            }
            this.channel3Index = 0;
        }
        if (this.channel4Trigger) {
            this.channel4Trigger = false;
            this.channel4Enable = true;
            this.channel4FrequencyCounter = Sound.divisionRatios[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
            if (this.channel4LengthCounter == 0) {
                this.channel4LengthCounter = 64;
            }
            this.channel4EnvelopeCounter = this.channel4EnvelopeDuration;
            this.channel4Volume = this.channel4InitialVolume;
            this.channel4LFSR = 0x7fff;
        }
    }

    updateDAC() {
        if (this.channel1Enable && this.channel1InitialVolume == 0 && !this.channel1VolumeUp) {
            this.channel1Enable = false;
        }
        if (this.channel2Enable && this.channel2InitialVolume == 0 && !this.channel2VolumeUp) {
            this.channel2Enable = false;
        }
        if (this.channel3Enable && !this.channel3Play) {
            this.channel3Enable = false;
        }
        if (this.channel4Enable && this.channel4InitialVolume == 0 && !this.channel4VolumeUp) {
            this.channel4Enable = false;
        }
    }

    updateFrequency() {
        let left = 0;
        let right = 0;
        if (this.channel1Enable) {
            this.channel1FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel1FrequencyCounter <= 0) {
                this.channel1FrequencyCounter += (2048 - this.channel1Frequency) * Sound.cyclesPerPulse;
                this.channel1Index = (this.channel1Index + 1) % 8;
            }
            if (this.channel1Volume != 0) {
                const signal = Sound.pulseTable[this.channel1Duty][this.channel1Index] * this.channel1Volume / 15 * 2 - 1;
                if (this.channel1LeftEnable) {
                    left += signal;
                }
                if (this.channel1RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel2Enable) {
            this.channel2FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel2FrequencyCounter <= 0) {
                this.channel2FrequencyCounter += (2048 - this.channel2Frequency) * Sound.cyclesPerPulse;
                this.channel2Index = (this.channel2Index + 1) % 8;
            }
            if (this.channel2Volume != 0) {
                const signal = Sound.pulseTable[this.channel2Duty][this.channel2Index] * this.channel2Volume / 15 * 2 - 1;
                if (this.channel2LeftEnable) {
                    left += signal;
                }
                if (this.channel2RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel3Enable) {
            this.channel3FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel3FrequencyCounter <= 0) {
                this.channel3FrequencyCounter += (2048 - this.channel3Frequency) * Sound.cyclesPerWave;
                this.channel3Index = (this.channel3Index + 1) % 32;
            }
            if (this.channel3Volume != 0) {
                const signal = (this.channel3WaveTable[this.channel3Index] >> Sound.volumeShift[this.channel3Volume]) / 15 * 2 - 1;
                if (this.channel3LeftEnable) {
                    left += signal;
                }
                if (this.channel3RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel4Enable) {
            this.channel4FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel4FrequencyCounter <= 0) {
                this.channel4FrequencyCounter += Sound.divisionRatios[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
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

        this.bufferLeft[(this.cycles / Sound.cyclesPerSample) % Sound.bufferSamples] = left / Sound.channelCount;
        this.bufferRight[(this.cycles / Sound.cyclesPerSample) % Sound.bufferSamples] = right / Sound.channelCount;
    }

    pushBuffer() {
        const now = Sound.ctx.currentTime;
        const nowPlusDelay = now + Sound.latency;
        this.nextPush = this.nextPush || nowPlusDelay;
        if (this.nextPush >= now) {
            const bufferSource = Sound.ctx.createBufferSource();
            bufferSource.buffer = this.buffer;
            bufferSource.connect(this.gainNode);
            bufferSource.start(this.nextPush);
            this.nextPush += Sound.bufferDuration;

            this.buffer = Sound.ctx.createBuffer(2, Sound.bufferSamples, Sound.sampleFrequency);
            this.bufferLeft = this.buffer.getChannelData(0);
            this.bufferRight = this.buffer.getChannelData(1);
        } else {
            this.nextPush = nowPlusDelay;
        }
    }

    cycle() {
        if (this.soundEnable) {
            if (this.cycles % Sound.cyclesPerSample == 0) {
                this.updateTrigger();
                this.updateDAC();
                this.updateFrequency();
            }
            if (this.cycles % Sound.cyclesPerBuffer == 0) {
                this.pushBuffer();
            }
            if (this.cycles % Sound.cyclesPerFrame == 0) {
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
        this.cycles += Sound.cyclesPerCPUCycle;
    }
}
Sound.frequency = 4194304;
Sound.cyclesPerCPUCycle = Sound.frequency / GameBoy.frequency;
Sound.pulseFrequency = 1048576;
Sound.cyclesPerPulse = Sound.frequency / Sound.pulseFrequency;
Sound.waveFrequency = 2097152;
Sound.cyclesPerWave = Sound.frequency / Sound.waveFrequency;
Sound.bufferSamples = 4096;
Sound.sampleFrequency = 65536;
Sound.bufferDuration = Sound.bufferSamples / Sound.sampleFrequency;
Sound.latency = 0.125;
Sound.frameFrequency = 512;
Sound.cyclesPerFrame = Sound.frequency / Sound.frameFrequency;
Sound.cyclesPerSample = Sound.frequency / Sound.sampleFrequency;
Sound.cyclesPerBuffer = Sound.cyclesPerSample * Sound.bufferSamples;
Sound.channelCount = 4;
Sound.pulseTable = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
];
Sound.volumeShift = [
    4, 0, 1, 2,
];
Sound.divisionRatios = [
    2, 4, 8, 12, 16, 20, 24, 28,
].map((value => value * Sound.cyclesPerCPUCycle));
Sound.ctx = new (window.AudioContext || window.webkitAudioContext)();