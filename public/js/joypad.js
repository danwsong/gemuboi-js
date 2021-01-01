class Joypad {
    constructor(gb) {
        this.gb = gb;

        this.selectButton = false;
        this.selectDirection = false;

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
        let _p1 = 0b111111;
        _p1 ^= this.selectButton << 5;
        _p1 ^= this.selectDirection << 4;
        if (this.selectButton) {
            _p1 ^= this.start << 3;
            _p1 ^= this.select << 2;
            _p1 ^= this.b << 1;
            _p1 ^= this.a;
        }
        if (this.selectDirection) {
            _p1 ^= this.down << 3;
            _p1 ^= this.up << 2;
            _p1 ^= this.left << 1;
            _p1 ^= this.right;
        }
        return _p1;
    }

    set p1(value) {
        this.selectButton = (value & 0b100000) == 0;
        this.selectDirection = (value & 0b10000) == 0;
    }
}