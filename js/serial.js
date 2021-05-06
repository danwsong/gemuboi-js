class Serial {
    constructor(gb) {
        this.gb = gb;

        this._sb = 0;
        
        this.transferTrigger = false;
        this.transferRunning = false;
        this.useInternalClock = false;
        this.fastClock = false;

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
        return 0x7e | (this.transferRunning << 7) | this.useInternalClock;
    }

    set sc(value) {
        this.transferTrigger = (value & 0x80) != 0;
        if (this.gb.cgb) {
            this.fastClock = (value & 0x2) != 0;
        }
        this.useInternalClock = (value & 0x1) != 0;
    }

    cycle() {
        if (this.transferTrigger) {
            this.transferTrigger = false;
            if (this.useInternalClock) {
                this.cycleCounter = this.fastClock ? Serial.cpuCyclesPerFastCycle : Serial.cpuCyclesPerCycle;
            }
            this.cycles = 0;
            this.transferRunning = true;
        }
        if (this.transferRunning) {
            this.cycleCounter--;
            if (this.cycleCounter == 0) {
                if (this.useInternalClock) {
                    this.cycleCounter = this.fastClock ? Serial.cpuCyclesPerFastCycle : Serial.cpuCyclesPerCycle;
                }
                this._sb = ((this._sb << 1) | 1) & 0xff;
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
Serial.fastFrequency = 262144;
Serial.cpuCyclesPerFastCycle = GameBoy.frequency / Serial.frequency;
