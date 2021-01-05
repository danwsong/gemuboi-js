class Joypad {
    constructor(gb) {
        this.gb = gb;

        this.button = false;
        this.direction = false;

        this.start = false;
        this.select = false;
        this.b = false;
        this.a = false;

        this.down = false;
        this.up = false;
        this.left = false;
        this.right = false;
    }

    get p1() {
        let _p1 = (!this.button << 5) | (!this.direction << 4);
        if (this.button) {
            _p1 |= (this.start << 3) | (this.select << 2) | (this.b << 1) | this.a;
        }
        if (this.direction) {
            _p1 |= (this.down << 3) | (this.up << 2) | (this.left << 1) | this.right;
        }
        return 0xc0 | (_p1 ^ 0x3f);
    }

    set p1(value) {
        this.button = (value & 0x20) == 0;
        this.direction = (value & 0x10) == 0;
    }
}