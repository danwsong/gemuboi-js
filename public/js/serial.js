class Serial {
    constructor(gb) {
        this.gb = gb;

        this._sb = 0;
        
        this.transferTrigger = false;
        this.transferRunning = false;
        this.useInternalClock = false;

        this.cycleCounter = 0;
        this.cycles = 0;
    }

    get sb() {
        return this._sb;
    }

    set sb(value) {
        this._sb = value;
    }

    get sc() {
        return (this.transferRunning << 7) | this.useInternalClock;
    }

    set sc(value) {
        this.transferTrigger = (value & 0b10000000) != 0;
        this.useInternalClock = (value & 0b1) != 0;
    }

    cycle() {
        if (this.transferTrigger) {
            this.transferTrigger = false;
            if (this.useInternalClock) {
                this.cycleCounter = Serial.cpuCyclesPerCycle;
            }
            this.cycles = 0;
            this.transferRunning = true;
        }
        if (this.transferRunning) {
            this.cycleCounter--;
            if (this.cycleCounter == 0) {
                if (this.useInternalClock) {
                    this.cycleCounter = Serial.cpuCyclesPerCycle;
                }
                this.sb = ((this.sb << 1) | 0b1) & 0xff;
                this.cycles++;
                if (this.cycles == 8) {
                    this.transferRunning = false;
                    this.gb.requestInterrupt(GameBoy.serialInterrupt);
                }
            }
        }
    }
}
Serial.frequency = 8192;
Serial.cpuCyclesPerCycle = GameBoy.frequency / Serial.frequency;