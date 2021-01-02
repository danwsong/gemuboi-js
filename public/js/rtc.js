class RTC {
    constructor(time) {
        this._time = time;
        this._latch = 0;
        this.halt = false;
        this.haltTime = 0;

        this._s = 0;
        this._m = 0;
        this._h = 0;
        this._dl = 0;
        this._dh = 0;
    }

    get time() {
        if (this.halt) {
            return this.haltTime;
        }
        return this._time;
    }

    get latch() {
        
    }

    set latch(value) {
        if (this._latch == 0 && value == 1) {
            this._s = Math.floor((Date.now() - this.time) / 1000) % 60;
            this._m = Math.floor((Date.now() - this.time) / 60000) % 60;
            this._h = Math.floor((Date.now() - this.time) / 3600000) % 24;
            const _d = Math.floor((Date.now() - this.time) / 86400000);
            const _dOverflow = Math.floor(_d / 512) != 0;
            this._dl = _d % 256;
            this._dh = (_dOverflow << 7) | (this.halt << 6) | (Math.floor(_d / 256) % 2);
        }
        this._latch = value;
    }

    get s() {
        return this._s;
    }

    set s(value) {
        const _s = Math.floor((Date.now() - this._time) / 1000) % 60;
        this._time += (value - _s) * 1000;
    }

    get m() {
        return this._m;
    }

    set m(value) {
        const _m = Math.floor((Date.now() - this._time) / 60000) % 60;
        this._time += (value - _m) * 60000;
    }

    get h() {
        return this._h;
    }

    set h(value) {
        const _h = Math.floor((Date.now() - this._time) / 3600000) % 24;
        this._time += (value - _h) * 3600000;
    }

    get dl() {
        return this._dl;
    }

    set dl(value) {
        const _dl = Math.floor((Date.now() - this._time) / 86400000) % 256;
        this._time += (value - _dl) * 86400000;
    }

    get dh() {
        return this._dh;
    }

    set dh(value) {
        const _dOverflow = Math.floor((Date.now() - this._time) / 44236800000);
        this._time += (((value & 0b10000000) != 0) - _dOverflow) * 44236800000;
        const _dh = Math.floor((Date.now() - this._time) / 22118400000) % 2;
        this._time += ((value & 0b1) - _dh) * 22118400000;
        const _halt = (value & 0b1000000) != 0;
        if (!this.halt && _halt) {
            this.haltTime = Date.now();
        } else if (this.halt && !_halt) {
            this._time += Date.now() - this.haltTime;
        }
        this.halt = _halt;
    }
}