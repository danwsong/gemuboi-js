class GameBoy {
    constructor() {
        this.display = new Display(this);
        this.timer = new Timer(this);
        this.joypad = new Joypad(this);
        this.cartridge = new Cartridge(this);
        this.sound = new Sound(this);
        this.serial = new Serial(this);

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
        this._pc = 0x0100;
        this._sp = 0xfffe;

        this.ime = false;

        this.halt = false;

        this._if = 0;
        this._ie = 0;

        this.cycles = 0;

        this.wram = new Uint8Array(0x2000);
        this.hram = new Uint8Array(0x7f);
    }

    get f() {
        return (this.fz << 7) | (this.fn << 6) | (this.fh << 5) | (this.fc << 4);
    }

    set f(value) {
        this.fz = (value & 0x80) != 0;
        this.fn = (value & 0x40) != 0;
        this.fh = (value & 0x20) != 0;
        this.fc = (value & 0x10) != 0;
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
        this._if = value & GameBoy.interrupts;
    }

    get ie() {
        return this._ie;
    }

    set ie(value) {
        this._ie = value & GameBoy.interrupts;
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
    }

    readAddress(address) {
        switch (address >> 13) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
                return this.cartridge.readROM(address & 0x7fff);
            case 0x4:
                return this.display.vram[address & 0x1fff];
            case 0x5:
                return this.cartridge.readRAM(address & 0x1fff);
            case 0x6:
                return this.wram[address & 0x1fff];
            case 0x7:
                if (address <= 0xfdff) {
                    return this.wram[address & 0x1fff];
                } else if (address <= 0xfe9f) {
                    return this.display.oam[address & 0xff];
                } else if (address <= 0xfeff) {
                    return 0xff;
                } else if (address <= 0xff7f) {
                    if (address >= 0xff10 && address <= 0xff3f) {
                        return this.sound.readAddress(address & 0xff);
                    } else {
                        switch (address & 0xff) {
                            case 0x00: return this.joypad.p1;
                            case 0x01: return this.serial.sb;
                            case 0x02: return this.serial.sc;
                            case 0x04: return this.timer.div;
                            case 0x05: return this.timer.tima;
                            case 0x06: return this.timer.tma;
                            case 0x07: return this.timer.tac;
                            case 0x0f: return this.if;
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
                            default: return 0xff;
                        }
                    }
                } else if (address <= 0xfffe) {
                    return this.hram[address & 0x7f];
                } else {
                    return this.ie;
                }
        }
    }

    writeAddress(address, value) {
        switch (address >> 13) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
                this.cartridge.writeROM(address & 0x7fff, value); break;
            case 0x4:
                this.display.vram[address & 0x1fff] = value; break;
            case 0x5:
                this.cartridge.writeRAM(address & 0x1fff, value); break;
            case 0x6:
                this.wram[address & 0x1fff] = value; break;
            case 0x7:
                if (address <= 0xfdff) {
                    this.wram[address & 0x1fff] = value;
                } else if (address <= 0xfe9f) {
                    this.display.oam[address & 0xff] = value;
                } else if (address <= 0xfeff) {
                    
                } else if (address <= 0xff7f) {
                    if (address >= 0xff10 && address <= 0xff3f) {
                        this.sound.writeAddress(address & 0xff, value);
                    } else {
                        switch (address & 0xff) {
                            case 0x00: this.joypad.p1 = value; break;
                            case 0x01: this.serial.sb = value; break;
                            case 0x02: this.serial.sc = value; break;
                            case 0x04: this.timer.div = value; break;
                            case 0x05: this.timer.tima = value; break;
                            case 0x06: this.timer.tma = value; break;
                            case 0x07: this.timer.tac = value; break;
                            case 0x0f: this.if = value; break;
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
                            default: break;
                        }
                    }
                } else if (address <= 0xfffe) {
                    this.hram[address & 0x7f] = value;
                } else {
                    this.ie = value;
                }
                break;
        }
    }

    readRegister(register) {
        switch (register) {
            case 0: return this.b;
            case 1: return this.c;
            case 2: return this.d;
            case 3: return this.e;
            case 4: return this.h;
            case 5: return this.l;
            case 6: return this.readAddress(this.hl);
            case 7: return this.a;
        }
    }

    writeRegister(register, value) {
        switch (register) {
            case 0: this.b = value; break;
            case 1: this.c = value; break;
            case 2: this.d = value; break;
            case 3: this.e = value; break;
            case 4: this.h = value; break;
            case 5: this.l = value; break;
            case 6: this.writeAddress(this.hl, value); break;
            case 7: this.a = value; break;
        }
    }

    readDoubleRegisterIndirect(register) {
        switch (register) {
            case 0: return this.readAddress(this.bc);
            case 1: return this.readAddress(this.de);
            case 2: return this.readAddress(this.hl++);
            case 3: return this.readAddress(this.hl--);
        }
    }

    writeDoubleRegisterIndirect(register, value) {
        switch (register) {
            case 0: this.writeAddress(this.bc, value); break;
            case 1: this.writeAddress(this.de, value); break;
            case 2: this.writeAddress(this.hl++, value); break;
            case 3: this.writeAddress(this.hl--, value); break;
        }
    }

    readDoubleRegister(register) {
        switch (register) {
            case 0: return this.bc;
            case 1: return this.de;
            case 2: return this.hl;
            case 3: return this.sp;
        }
    }

    writeDoubleRegister(register, value) {
        switch (register) {
            case 0: this.bc = value; break;
            case 1: this.de = value; break;
            case 2: this.hl = value; break;
            case 3: this.sp = value; break;
        }
    }

    popDoubleRegister(register) {
        switch (register) {
            case 0: this.c = this.readAddress(this.sp++); this.b = this.readAddress(this.sp++); break;
            case 1: this.e = this.readAddress(this.sp++); this.d = this.readAddress(this.sp++); break;
            case 2: this.l = this.readAddress(this.sp++); this.h = this.readAddress(this.sp++); break;
            case 3: this.f = this.readAddress(this.sp++); this.a = this.readAddress(this.sp++); break;
        }
    }

    pushDoubleRegister(register) {
        switch (register) {
            case 0: this.writeAddress(--this.sp, this.b); this.writeAddress(--this.sp, this.c); break;
            case 1: this.writeAddress(--this.sp, this.d); this.writeAddress(--this.sp, this.e); break;
            case 2: this.writeAddress(--this.sp, this.h); this.writeAddress(--this.sp, this.l); break;
            case 3: this.writeAddress(--this.sp, this.a); this.writeAddress(--this.sp, this.f); break;
        }
    }

    readCondition(condition) {
        switch (condition) {
            case 0: return !this.fz;
            case 1: return this.fz;
            case 2: return !this.fc;
            case 3: return this.fc;
        }
    }

    cycle() {
        this.cycles = 0;

        if ((this.ime || this.halt) && (this.ie & this.if) != 0) {
            this.halt = false;
            if (this.ime) {
                this.ime = false;
                if ((this.ie & this.if & GameBoy.vblankInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.vblankInterrupt);
                    this.callInterrupt(0x0040);
                } else if ((this.ie & this.if & GameBoy.statInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.statInterrupt);
                    this.callInterrupt(0x0048);
                } else if ((this.ie & this.if & GameBoy.timerInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.timerInterrupt);
                    this.callInterrupt(0x0050);
                } else if ((this.ie & this.if & GameBoy.serialInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.serialInterrupt);
                    this.callInterrupt(0x0058);
                } else if ((this.ie & this.if & GameBoy.joypadInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.joypadInterrupt);
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

        let serialCycles = this.cycles;
        while (serialCycles-- > 0) {
            this.serial.cycle();
        }

        return this.cycles;
    }

    decode() {
        const instr = this.readAddress(this.pc++);
        this.cycles += GameBoy.instrCycles[instr];
        const quad = instr >> 6, op1 = (instr & 0x3f) >> 3, op2 = instr & 0x7;
        if (quad === 0) {
            if (op2 == 6) {
                // LD r, n
                const imm = this.readAddress(this.pc++);
                this.writeRegister(op1, imm);
            } else if (op2 == 2) {
                if ((op1 & 0x1) != 0) {
                    // LD A, (rr)
                    this.a = this.readDoubleRegisterIndirect(op1 >> 1);
                } else {
                    // LD (rr), A
                    this.writeDoubleRegisterIndirect(op1 >> 1, this.a);
                }
            } else if ((op1 & 0x1) == 0 && op2 == 1) {
                // LD dd, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeDoubleRegister(op1 >> 1, (imm2 << 8) | imm1);
            } else if (op1 == 1 && op2 == 0) {
                // LD (nn), SP
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                let address = (imm2 << 8) | imm1;
                this.writeAddress(address++, this.spl);
                this.writeAddress(address++, this.sph);
            } else if (op2 == 4) {
                // INC r
                const tmp = (this.readRegister(op1) + 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0;
                this.fn = false;
                this.fz = tmp == 0;
            } else if (op2 == 5) {
                // DEC r
                const tmp = (this.readRegister(op1) - 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0xf;
                this.fn = true;
                this.fz = tmp == 0;
            } else if ((op1 & 0x1) != 0 && op2 == 1) {
                // ADD HL, ss
                const ss = this.readDoubleRegister(op1 >> 1);
                this.fc = this.hl + ss > 0xffff;
                this.fh = (this.hl & 0xfff) + (ss & 0xfff) > 0xfff;
                this.fn = false;
                this.hl += ss;
            } else if ((op1 & 0x1) == 0 && op2 == 3) {
                // INC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) + 1);
            } else if ((op1 & 0x1) != 0 && op2 == 3) {
                // DEC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) - 1);
            } else if (op1 == 0 && op2 == 7) {
                // RLCA
                const carry = this.a & 0x80;
                this.a = ((this.a << 1) | (carry >> 7)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 1 && op2 == 7) {
                // RRCA
                const carry = this.a & 0x1;
                this.a = ((carry << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 2 && op2 == 7) {
                // RLA
                const carry = this.a & 0x80;
                this.a = ((this.a << 1) | this.fc) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 3 && op2 == 7) {
                // RRA
                const carry = this.a & 0x1;
                this.a = ((this.fc << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 3 && op2 == 0) {
                // JR e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                this.pc += offset;
            } else if ((op1 & 0x4) != 0 && op2 == 0) {
                // JR cc, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                if (this.readCondition(op1 & 0x3)) {
                    this.pc += offset;
                    this.cycles += 1;
                }
            } else if (op1 == 4 && op2 == 7) {
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
            } else if (op1 == 5 && op2 == 7) {
                // CPL
                this.a ^= 0xff;
                this.fh = true;
                this.fn = true;
            } else if (op1 == 0 && op2 == 0) {
                // NOP
            } else if (op1 == 6 && op2 == 7) {
                // SCF
                this.fc = true;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 7 && op2 == 7) {
                // CCF
                this.fc = !this.fc;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 2 && op2 == 0) {
                // STOP
                this.pc++;
            }
        } else if (quad === 1) {
            if (op1 != 6 || op2 != 6) {
                // LD r, r'
                this.writeRegister(op1, this.readRegister(op2));
            } else {
                // HALT
                this.halt = true;
            }
        } else if (quad === 2) {
            const r = this.readRegister(op2);
            if (op1 == 0) {
                // ADD A, r
                const tmp = this.a + r;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 1) {
                // ADC A, r
                const carry = this.fc;
                const tmp = this.a + r + carry;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 2) {
                // SUB A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 3) {
                // SBC A, r
                const carry = this.fc
                const tmp = this.a - r - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 4) {
                // AND A, r
                const tmp = this.a & r;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 5) {
                // XOR A, r
                const tmp = this.a ^ r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 6) {
                // OR A, r
                const tmp = this.a | r;
                this.a |= r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 7) {
                // CP A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            }
        } else if (quad === 3) {
            if (op1 == 6 && op2 == 2) {
                // LD A, (C)
                this.a = this.readAddress(0xff00 | this.c);
            } else if (op1 == 4 && op2 == 2) {
                // LD (C), A
                this.writeAddress(0xff00 | this.c, this.a);
            } else if (op1 == 6 && op2 == 0) {
                // LD A, (n)
                const imm = this.readAddress(this.pc++);
                this.a = this.readAddress(0xff00 | imm);
            } else if (op1 == 4 && op2 == 0) {
                // LD (n), A
                const imm = this.readAddress(this.pc++);
                this.writeAddress(0xff00 | imm, this.a);
            } else if (op1 == 7 && op2 == 2) {
                // LD A, (nn)
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.a = this.readAddress((imm2 << 8) | imm1);
            } else if (op1 == 5 && op2 == 2) {
                // LD (nn), A
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress((imm2 << 8) | imm1, this.a);
            } else if (op1 == 7 && op2 == 1) {
                // LD SP, HL
                this.sp = this.hl;
            } else if ((op1 & 0x1) == 0 && op2 == 5) {
                // PUSH qq
                this.pushDoubleRegister(op1 >> 1);
            } else if ((op1 & 0x1) == 0 && op2 == 1) {
                // POP qq
                this.popDoubleRegister(op1 >> 1);
            } else if (op1 == 7 && op2 == 0) {
                // LDHL SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.hl = tmp;
            } else if (op1 == 5 && op2 == 0) {
                // ADD SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.sp = tmp;
            } else if (op1 == 0 && op2 == 6) {
                // ADD A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a + imm
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 1 && op2 == 6) {
                // ADC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a + imm + carry
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 2 && op2 == 6) {
                // SUB A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 3 && op2 == 6) {
                // SBC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a - imm - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 4 && op2 == 6) {
                // AND A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a & imm;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 5 && op2 == 6) {
                // XOR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a ^ imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 6 && op2 == 6) {
                // OR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a | imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 7 && op2 == 6) {
                // CP A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            } else if (op1 == 1 && op2 == 3) {
                this.decode_cb();
            } else if (op1 == 0 && op2 == 3) {
                // JP nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.pc = (imm2 << 8) | imm1;
            } else if ((op1 & 0x4) == 0 && op2 == 2) {
                // JP cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0x3)) {
                    this.pc = (imm2 << 8) | imm1;
                    this.cycles += 1;
                }
            } else if (op1 == 5 && op2 == 1) {
                // JP HL
                this.pc = this.hl;
            } else if (op1 == 1 && op2 == 5) {
                // CALL nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = (imm2 << 8) | imm1;
            } else if ((op1 & 0x4) == 0 && op2 == 4) {
                // CALL cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0x3)) {
                    this.writeAddress(--this.sp, this.pch);
                    this.writeAddress(--this.sp, this.pcl);
                    this.pc = (imm2 << 8) | imm1;
                    this.cycles += 3;
                }
            } else if (op1 == 1 && op2 == 1) {
                // RET
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
            } else if (op1 == 3 && op2 == 1) {
                // RETI
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
                this.ime = true;
            } else if ((op1 & 0x4) == 0 && op2 == 0) {
                // RET cc
                if (this.readCondition(op1 & 0x3)) {
                    this.pc = this.readAddress(this.sp++);
                    this.pc |= this.readAddress(this.sp++) << 8;
                    this.cycles += 3;
                }
            } else if (op2 == 7) {
                // RST t
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = op1 << 3;
            } else if (op1 == 6 && op2 == 3) {
                // DI
                this.ime = false;
            } else if (op1 == 7 && op2 == 3) {
                // EI
                this.ime = true;
            } else {
                throw 'unknown instruction: 0x' + instr.toString(16);
            }
        }
    }

    decode_cb() {
        const instr = this.readAddress(this.pc++);
        this.cycles += GameBoy.cbInstrCycles[instr];
        const quad = instr >> 6, op1 = (instr & 0x3f) >> 3, op2 = instr & 0x7;
        if (quad == 0) {
            const r = this.readRegister(op2);
            if (op1 == 0) {
                // RLC r
                const carry = r & 0x80;
                const tmp = ((r << 1) | (carry >> 7)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 1) {
                // RRC r
                const carry = r & 0x1;
                const tmp = ((carry << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 2) {
                // RL r
                const carry = r & 0x80;
                const tmp = ((r << 1) | this.fc) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 3) {
                // RR r
                const carry = r & 0x1;
                const tmp = ((this.fc << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 4) {
                // SLA r
                const carry = r & 0x80;
                const tmp = (r << 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 5) {
                // SRA r
                const carry = r & 0x1;
                const tmp = ((r & 0x80) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 6) {
                // SWAP r
                const tmp = ((r << 4) | (r >> 4)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 7) {
                // SRL r
                const carry = r & 0x1;
                const tmp = (r >> 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            }
        } else if (quad == 1) {
            // BIT b, r
            this.fh = true;
            this.fn = false;
            this.fz = (this.readRegister(op2) & (1 << op1)) == 0;
        } else if (quad == 2) {
            // RES b, r
            this.writeRegister(op2, this.readRegister(op2) & ~(1 << op1))
        } else if (quad == 3) {
            // SET b, r
            this.writeRegister(op2, this.readRegister(op2) | (1 << op1))
        }
    }
}
GameBoy.frequency = 1048576;
GameBoy.instrCycles = [
    1, 3, 2, 2, 1, 1, 2, 1, 5, 2, 2, 2, 1, 1, 2, 1,
    0, 3, 2, 2, 1, 1, 2, 1, 3, 2, 2, 2, 1, 1, 2, 1,
    2, 3, 2, 2, 1, 1, 2, 1, 2, 2, 2, 2, 1, 1, 2, 1,
    2, 3, 2, 2, 3, 3, 3, 1, 2, 2, 2, 2, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    2, 2, 2, 2, 2, 2, 0, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    2, 3, 3, 4, 3, 4, 2, 4, 2, 4, 3, 0, 3, 6, 2, 4,
    2, 3, 3, 0, 3, 4, 2, 4, 2, 4, 3, 0, 3, 0, 2, 4,
    3, 3, 2, 0, 0, 4, 2, 4, 4, 1, 4, 0, 0, 0, 2, 4,
    3, 3, 2, 1, 0, 4, 2, 4, 3, 2, 4, 1, 0, 0, 2, 4,
];
GameBoy.cbInstrCycles = [
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
];
GameBoy.joypadInterrupt = 0x10;
GameBoy.serialInterrupt = 0x8;
GameBoy.timerInterrupt = 0x4;
GameBoy.statInterrupt = 0x2;
GameBoy.vblankInterrupt = 0x1;
GameBoy.interrupts = 0x1f;