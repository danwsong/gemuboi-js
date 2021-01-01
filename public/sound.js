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

        this.buffer = Sound.ctx.createBuffer(2, Sound.bufferSamples, Sound.sampleFrequency);
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
                this.channel1FrequencyCounter = (2048 - this.channel1Frequency) * Sound.cyclesPerPulse;
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
            this.channel2FrequencyCounter--;
            if (this.channel2FrequencyCounter == 0) {
                this.channel2FrequencyCounter = (2048 - this.channel2Frequency) * Sound.cyclesPerPulse;
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
            this.channel3FrequencyCounter--;
            if (this.channel3FrequencyCounter == 0) {
                this.channel3FrequencyCounter = (2048 - this.channel3Frequency) * Sound.cyclesPerWave;
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
            this.channel4FrequencyCounter--;
            if (this.channel4FrequencyCounter == 0) {
                this.channel4FrequencyCounter = Sound.divisionRatios[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
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

        const index = Math.floor(this.cycles / Sound.cyclesPerSample) % Sound.bufferSamples;
        this.bufferLeft[index] += left / Sound.channelCount / Sound.cyclesPerSample;
        this.bufferRight[index] += right / Sound.channelCount / Sound.cyclesPerSample;
    }

    pushBuffer() {
        const now = Sound.ctx.currentTime;
        const nowPlusDelay = now + Sound.bufferDuration;
        this.nextPush = (this.nextPush || nowPlusDelay);
        if (this.nextPush >= now) {
            const bufferSource = Sound.ctx.createBufferSource();
            bufferSource.buffer = this.buffer;
            bufferSource.connect(Sound.ctx.destination);
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
        for (let i = 0; i < Sound.cyclesPerCPUCycle; i++) {
            if (this.soundEnable) {
                if (this.channel1Trigger) {
                    this.channel1Trigger = false;
                    this.channel1Enable = true;
                    this.channel1LengthCounter = 64 - this.channel1Length;
                    this.channel1FrequencyCounter = (2048 - this.channel1Frequency) * Sound.cyclesPerPulse;
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
                    this.channel2FrequencyCounter = (2048 - this.channel2Frequency) * Sound.cyclesPerPulse;
                    this.channel2EnvelopeCounter = this.channel2EnvelopeDuration;
                    this.channel2Volume = this.channel2InitialVolume;
                    this.channel2Index = 0;
                }
                if (this.channel3Trigger) {
                    this.channel3Trigger = false;
                    this.channel3Enable = true;
                    this.channel3LengthCounter = 256 - this.channel3Length;
                    this.channel3FrequencyCounter = (2048 - this.channel3Frequency) * Sound.cyclesPerWave;
                    this.channel3Index = 0;
                }
                if (this.channel4Trigger) {
                    this.channel4Trigger = false;
                    this.channel4Enable = true;
                    this.channel4LengthCounter = 64 - this.channel4Length;
                    this.channel4FrequencyCounter = Sound.divisionRatios[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
                    this.channel4EnvelopeCounter = this.channel4EnvelopeDuration;
                    this.channel4Volume = this.channel4InitialVolume;
                    this.channel4LFSR = 0b111111111111111;
                }
                this.updateFrequency();
                this.cycles++;
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
        }
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