class Cartridge {
    constructor(gb) {
        this.gb = gb;
    }

    readROM(address) {
        switch (this.cartridgeType) {
            case 0x00:
            case 0x08:
            case 0x09:
                return this.rom[address];
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x05:
            case 0x06:
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
            case 0x19:
            case 0x1a:
            case 0x1b:
            case 0x1c:
            case 0x1d:
            case 0x1e:
                switch (address >> 14) {
                    case 0:
                        return this.rom[address & 0x3fff];
                    case 1:
                        return this.rom[(this.romBankNumber << 14) | (address & 0x3fff)];
                }
        }
    }

    writeROM(address, value) {
        switch (this.cartridgeType) {
            case 0x00:
            case 0x08:
            case 0x09:
                break;
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 13) {
                    case 0:
                        if (this.hasRAM) {
                            this.ramEnable = (value & 0xf) == 0xa;
                        }
                        break;
                    case 1:
                        this.romBankNumber &= ~0b11111;
                        if ((value & 0b11111) == 0) {
                            value |= 0b00001;
                        }
                        this.romBankNumber |= value & 0b11111;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 2:
                        if (this.ramBankMode) {
                            if (this.hasRAM) {
                                this.ramBankNumber = value & 0b11;
                                this.ramBankNumber %= (this.ram.length / 0x2000);
                            }
                            this.romBankNumber &= ~0b1100000;
                        } else {
                            this.romBankNumber &= ~0b1100000;
                            this.romBankNumber |= (value & 0b11) << 5;
                            this.romBankNumber %= (this.rom.length / 0x4000);
                            if (this.hasRAM) {
                                this.ramBankNumber = 0;
                            }
                        }
                        break;
                    case 3:
                        this.ramBankMode = (value & 0b1) == 0b1;
                        break;
                }
                break;
            case 0x05:
            case 0x06:
                switch ((address >> 8) & 0x41) {
                    case 0:
                        this.ramEnable = (value & 0xf) == 0xa;
                        break;
                    case 1:
                        if ((value & 0b1111) == 0) {
                            value |= 0b0001;
                        }
                        this.romBankNumber = value & 0b1111;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                }
                break;
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
                switch (address >> 13) {
                    case 0:
                        if (this.hasRAM) {
                            this.ramEnable = (value & 0xf) == 0xa;
                        }
                        break;
                    case 1:
                        if ((value & 0b1111111) == 0) {
                            value |= 0b0000001;
                        }
                        this.romBankNumber = value & 0b1111111;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 2:
                        switch (value) {
                            case 0x00:
                            case 0x01:
                            case 0x02:
                            case 0x03:
                                if (this.hasRAM) {
                                    this.ramBankNumber = value;
                                    this.ramBankNumber %= (this.ram.length / 0x2000);
                                }
                                break;
                            case 0x08:
                            case 0x09:
                            case 0x0a:
                            case 0x0b:
                            case 0x0c:
                                if (this.hasRTC) {
                                    this.ramBankNumber = value;
                                }
                                break;
                        }
                        break;
                    case 3:
                        if (this.hasRTC) {
                            this.rtc.latch = value;
                        }
                        break;
                }
                break;
            case 0x19:
            case 0x1a:
            case 0x1b:
            case 0x1c:
            case 0x1d:
            case 0x1e:
                switch (address >> 12) {
                    case 0:
                    case 1:
                        if (this.hasRAM) {
                            this.ramEnable = (value & 0xf) == 0xa;
                        }
                        break;
                    case 2:
                        this.romBankNumber &= ~0b11111111;
                        this.romBankNumber |= value;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 3:
                        this.romBankNumber &= ~0b100000000;
                        this.romBankNumber |= (value & 0b1) << 8;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 4:
                    case 5:
                        if (this.hasRAM) {
                            this.ramBankNumber = value & 0b1111;
                            this.ramBankNumber %= (this.ram.length / 0x2000);
                        }
                        break;
                }
                break;
        }
    }

    readRAM(address) {
        if (this.ramEnable) {
            switch (this.cartridgeType) {
                case 0x00:
                    break;
                case 0x08:
                case 0x09:
                    return this.ram[address];
                case 0x01:
                    break;
                case 0x02:
                case 0x03:
                    return this.ram[(this.ramBankNumber << 13) | address];
                case 0x05:
                case 0x06:
                    return 0xf0 | this.ram[address & 0x1ff];
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
                            return this.ram[(this.ramBankNumber << 13) | address];
                        case 0x08:
                            return this.rtc.s;
                        case 0x09:
                            return this.rtc.m;
                        case 0x0a:
                            return this.rtc.h;
                        case 0x0b:
                            return this.rtc.dl;
                        case 0x0c:
                            return this.rtc.dh;
                    }
                    break;
                case 0x19:
                case 0x1a:
                case 0x1b:
                case 0x1c:
                case 0x1d:
                case 0x1e:
                    return this.ram[(this.ramBankNumber << 13) | address];
            }
        }
        return 0xff;
    }

    writeRAM(address, value) {
        if (this.ramEnable) {
            switch (this.cartridgeType) {
                case 0x00:
                    break;
                case 0x08:
                case 0x09:
                    this.ram[address] = value;
                    break;
                case 0x01:
                    break;
                case 0x02:
                case 0x03:
                    this.ram[(this.ramBankNumber << 13) | address] = value;
                    break;
                case 0x05:
                case 0x06:
                    this.ram[address & 0x1ff] = value & 0xf;
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
                            this.ram[(this.ramBankNumber << 13) | address] = value;
                            break;
                        case 0x08:
                            this.rtc.s = value;
                            break;
                        case 0x09:
                            this.rtc.m = value;
                            break;
                        case 0x0a:
                            this.rtc.h = value;
                            break;
                        case 0x0b:
                            this.rtc.dl = value;
                            break;
                        case 0x0c:
                            this.rtc.dh = value;
                            break;
                    }
                    break;
                case 0x19:
                case 0x1a:
                case 0x1b:
                case 0x1c:
                case 0x1d:
                case 0x1e:
                    this.ram[(this.ramBankNumber << 13) | address] = value;
            }
        }
    }

    load(file) {
        this.title = new TextDecoder('ascii').decode(file.slice(0x134, 0x144));

        this.cartridgeType = file[0x147];
        switch (this.cartridgeType) {
            case 0x09:
                this.hasBattery = true;
            case 0x08:
                this.ramEnable = true;
                this.hasRAM = true;
            case 0x00:
                this.rom = file;
                break;
            case 0x03:
                this.hasBattery = true;
            case 0x02:
                this.ramEnable = false;
                this.ramBankMode = false;
                this.hasRAM = true;
            case 0x01:
                this.rom = file;
                this.romBankNumber = 1;
                break;
            case 0x06:
                this.hasBattery = true;
            case 0x05:
                this.rom = file;
                this.romBankNumber = 1;
                this.ram = new Uint8Array(0x200);
                this.ramEnable = false;
                this.hasRAM = true;
                break;
            case 0x10:
                this.hasRAM = true;
            case 0x0f:
                this.rom = file;
                this.romBankNumber = 1;
                this.ramEnable = false;
                this.hasBattery = true;
                this.hasRTC = true;
                break;
            case 0x13:
                this.hasBattery = true;
            case 0x12:
                this.ramEnable = false;
                this.hasRAM = true;
            case 0x11:
                this.rom = file;
                this.romBankNumber = 1;
                break;
            case 0x1e:
            case 0x1b:
                this.hasBattery = true;
            case 0x1d:
            case 0x1a:
                this.ramEnable = false;
                this.hasRAM = true;
            case 0x1c:
            case 0x19:
                this.rom = file;
                this.romBankNumber = 1;
                break;
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }

        const romSize = 32768 << file[0x148];
        if (file.length != romSize) {
            throw 'wrong file size';
        }

        const ramSize = file[0x149];
        if (this.hasRAM) {
            if (this.hasBattery && this.title in localStorage) {
                this.ram = new Uint8Array(localStorage[this.title].split(',').map(parseFloat));
            } else {
                switch (ramSize) {
                    case 0x00:
                        break;
                    case 0x02:
                        this.ram = new Uint8Array(0x2000);
                        break;
                    case 0x03:
                        this.ram = new Uint8Array(0x8000);
                        break;
                    case 0x04:
                        this.ram = new Uint8Array(0x20000);
                        break;
                    default:
                        throw 'unknown RAM size: 0x' + ramSize.toString(16);
                }
            }
        }
        if (this.hasRTC) {
            if (this.hasBattery && (this.title + 'TIME') in localStorage) {
                this.rtc = new RTC();
                Object.assign(this.rtc, JSON.parse(localStorage[this.title + 'TIME']));
            } else {
                this.rtc = new RTC();
            }
        }
    }

    save() {
        if (this.hasRAM && this.hasBattery) {
            localStorage[this.title] = this.ram;
        }
        if (this.hasRTC && this.hasBattery) {
            localStorage[this.title + 'TIME'] = JSON.stringify(this.rtc);
        }
    }
}