class RTC {
    constructor() {
        this.time = 0;

        this._latch = false;

        this.sec = 0;
        this.min = 0;
        this.hour = 0;
        this.day = 0;
        this.high = 0;

        this.secLatch = 0;
        this.minLatch = 0;
        this.hourLatch = 0;
        this.dayLatch = 0;
        this.highLatch = 0;
    }

    set latch(value) {
        const _latch = (value & 0x1) != 0;
        if (!this._latch && _latch) {
            this.secLatch = this.sec;
            this.minLatch = this.min;
            this.hourLatch = this.hour;
            this.dayLatch = this.day;
            this.highLatch = this.high;
        }
        this._latch = _latch;
    }

    get s() {
        return this.secLatch;
    }

    set s(value) {
        this.sec = value;
    }

    get m() {
        return this.minLatch;
    }

    set m(value) {
        this.min = value;
    }

    get h() {
        return this.hourLatch;
    }

    set h(value) {
        this.hour = value;
    }

    get dl() {
        return this.dayLatch;
    }

    set dl(value) {
        this.day = value;
    }

    get dh() {
        return 0x3e | this.highLatch;
    }

    set dh(value) {
        this.high = value;
    }

    updateTime() {
        if ((this.high & 0x40) == 0) {
            const cur = Math.floor(Date.now() / 1000);
            while (this.time + 60 * 60 * 24 < cur) {
                this.time += 60 * 60 * 24;
                this.day++;
                if (this.day == 256) {
                    this.day = 0;
                    if ((this.high & 0x1) != 0) {
                        this.high |= 0x80;
                    }
                    this.high ^= 0x1;
                }
            }
            while (this.time + 60 * 60 < cur) {
                this.time += 60 * 60;
                this.hour++;
                if (this.hour == 24) {
                    this.hour = 0;
                    this.day++;
                    if (this.day == 256) {
                        this.day = 0;
                        if ((this.high & 0x1) != 0) {
                            this.high |= 0x80;
                        }
                        this.high ^= 0x1;
                    }
                }
            }
            while (this.time + 60 < cur) {
                this.time += 60;
                this.min++;
                if (this.min == 60) {
                    this.min = 0;
                    this.hour++;
                    if (this.hour == 24) {
                        this.hour = 0;
                        this.day++;
                        if (this.day == 256) {
                            this.day = 0;
                            if ((this.high & 0x1) != 0) {
                                this.high |= 0x80;
                            }
                            this.high ^= 0x1;
                        }
                    }
                }
            }
            while (this.time < cur) {
                this.time++;
                this.sec++;
                if (this.sec == 60) {
                    this.sec = 0;
                    this.min++;
                    if (this.min == 60) {
                        this.min = 0;
                        this.hour++;
                        if (this.hour == 24) {
                            this.hour = 0;
                            this.day++;
                            if (this.day == 256) {
                                this.day = 0;
                                if ((this.high & 0x1) != 0) {
                                    this.high |= 0x80;
                                }
                                this.high ^= 0x1;
                            }
                        }
                    }
                }
            }
        }
    }
}
