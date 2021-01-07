class Timer {
    constructor(gb) {
        this.gb = gb;

        this._div = 0;
        this._tima = 0;
        this._tma = 0;
        this.timerEnable = false;
        this.clockSelect = 0;

        this.overflow = false;
    }

    get div() {
        return this._div >> 8;
    }

    set div(value) {
        if (this.tacBit) {
            this.timaIncrement();
        }
        this._div = 0;
    }

    get tima() {
        return this._tima;
    }

    set tima(value) {
        if (!this.overflow) {
            this._tima = value;
        }
    }

    get tma() {
        return this._tma;
    }

    set tma(value) {
        this._tma = value;
        if (this.overflow) {
            this._tima = this._tma;
        }
    }

    get tac() {
        return 0xf8 | (this.timerEnable << 2) | this.clockSelect;
    }

    set tac(value) {
        const oldBit = this.timerEnable && this.tacBit;
        this.timerEnable = (value & 0x4) != 0;
        this.clockSelect = value & 0x3;
        const newBit = this.timerEnable && this.tacBit;
        if (oldBit && !newBit) {
            this.timaIncrement();
        }
    }

    get tacBit() {
        return (this._div & Timer.tacBits[this.clockSelect]) != 0;
    }

    timaIncrement() {
        this._tima = (this._tima + 1) & 0xff;
        this.overflow = this._tima == 0;
    }

    cycle() {
        if (this.overflow) {
            this._div = (this._div + Timer.cyclesPerCPUCycle) & 0xffff;
            this.overflow = false;
            this._tima = this._tma;
            this.gb.requestInterrupt(GameBoy.timerInterrupt);
        } else if (this.timerEnable && this.tacBit) {
            this._div = (this._div + Timer.cyclesPerCPUCycle) & 0xffff;
            if (!this.tacBit) {
                this.timaIncrement();
            }
        } else {
            this._div = (this._div + Timer.cyclesPerCPUCycle) & 0xffff;
        }
    }
}
Timer.tacBits = [
    0x200, 0x8, 0x20, 0x80,
];
Timer.frequency = 4194304
Timer.cyclesPerCPUCycle = Timer.frequency / GameBoy.frequency;