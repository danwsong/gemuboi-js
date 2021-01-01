class Timer {
    constructor(gb) {
        this.gb = gb;

        this._div = 0;

        this.tima = 0;
        this.tma = 0;
        this.timerEnable = false;
        this.clockSelect = 0b00;

        this.overflowDelay = false;
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
            const bit = Timer.tacCycles[this.clockSelect];
            if ((~this._div & (this._div - 1) & bit) != 0) {
                this.tima = (this.tima + 1) & 0xff;
                if (this.tima == 0) {
                    this.overflowDelay = true;
                } else if (this.overflowDelay) {
                    this.overflowDelay = false;
                    this.tima = this.tma;
                    this.gb.requestInterrupt(GameBoy.timerInterrupt);
                }
            }
        }
    }
}
Timer.tacCycles = [
    0b0000001000000000, 0b0000000000001000, 0b0000000000100000, 0b0000000010000000
];