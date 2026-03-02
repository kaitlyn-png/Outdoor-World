class Camera {
    constructor() {
        this.fov = 60;
        this.eye = [0, 2, 8];
        this.at = [0, 2, 0];
        this.up = [0, 1, 0];
        
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        this.position = [0, 2, 8];
        this.front = [0, 0, -1];
        this.yaw = -90;
        this.pitch = -20;
        
        this.updateAtFromAngles();
    }

    moveForward() {
        let f = [
            this.front[0],
            0,
            this.front[2]
        ];
        f = this.normalize(f);
        
        let speed = 0.2;
        f = this.scale(f, speed);
        
        this.eye = this.add(this.eye, f);
        
        this.clampPosition();
        this.updateAtFromAngles();
    }

    moveBackward() {
        let b = [
            -this.front[0],
            0,
            -this.front[2]
        ];
        b = this.normalize(b);
        
        let speed = 0.2;
        b = this.scale(b, speed);
        
        this.eye = this.add(this.eye, b);
        
        this.clampPosition();
        this.updateAtFromAngles();
    }

    moveLeft() {
        let f = [
            this.front[0],
            0,
            this.front[2]
        ];
        f = this.normalize(f);
        
        let s = this.cross(this.up, f);
        s = this.normalize(s);
        
        let speed = 0.2;
        s = this.scale(s, speed);
        
        this.eye = this.add(this.eye, s);
        
        this.clampPosition();
        this.updateAtFromAngles();
    }

    moveRight() {
        let f = [
            this.front[0],
            0,
            this.front[2]
        ];
        f = this.normalize(f);
        
        let s = this.cross(f, this.up);
        s = this.normalize(s);
        
        let speed = 0.2;
        s = this.scale(s, speed);
        
        this.eye = this.add(this.eye, s);
        
        this.clampPosition();
        this.updateAtFromAngles();
    }

    moveUp() {
        let speed = 0.2;
        this.eye = this.add(this.eye, [0, speed, 0]);

        this.clampPosition();
        this.updateAtFromAngles();
    }

    moveDown() {
        let speed = 0.2;
        this.eye = this.add(this.eye, [0, -speed, 0]);

        this.clampPosition();
        this.updateAtFromAngles();
    }

    panLeft() {
        this.yaw -= 2;
        this.updateAtFromAngles();
    }

    panRight() {
        this.yaw += 2;
        this.updateAtFromAngles();
    }

    turnLeft() {
        this.panLeft();
    }

    turnRight() {
        this.panRight();
    }

    look(deltaX, deltaY) {
        var sensitivity = 0.1;
        if (deltaX !== 0) {
            this.yaw += deltaX * sensitivity;
        }
        if (deltaY !== 0) {
            this.pitch -= deltaY * sensitivity;
            this.pitch = Math.max(-89, Math.min(89, this.pitch));
        }

        this.updateAtFromAngles();
    }

    updateAtFromAngles() {
        var radYaw = this.yaw * Math.PI / 180;
        var radPitch = this.pitch * Math.PI / 180;

        var frontX = Math.cos(radYaw) * Math.cos(radPitch);
        var frontY = Math.sin(radPitch);
        var frontZ = Math.sin(radYaw) * Math.cos(radPitch);

        this.at = [
            this.eye[0] + frontX,
            this.eye[1] + frontY,
            this.eye[2] + frontZ
        ];

        this.updateMatrices();
    }

    updateMatrices() {
        this.position = this.eye.slice();
        this.front = [
            this.at[0] - this.eye[0],
            this.at[1] - this.eye[1],
            this.at[2] - this.eye[2]
        ];
        var len = Math.sqrt(this.front[0] * this.front[0] + this.front[1] * this.front[1] + this.front[2] * this.front[2]);
        if (len > 0) {
            this.front[0] /= len;
            this.front[1] /= len;
            this.front[2] /= len;
        }
        
        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(
            this.eye[0], this.eye[1], this.eye[2],
            this.at[0], this.at[1], this.at[2],
            this.up[0], this.up[1], this.up[2]
        );
        
        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(
            this.fov,
            canvas.width / canvas.height,
            0.1,
            100
        );
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    setBounds(minX, maxX, minY, maxY, minZ, maxZ) {
        this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
        this.clampPosition();
    }

    clampPosition() {
        if (!this.bounds) return;
        
        this.eye[0] = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.eye[0]));
        this.eye[1] = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.eye[1]));
        this.eye[2] = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.eye[2]));
    }

    add(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    scale(a, s) {
        return [a[0] * s, a[1] * s, a[2] * s];
    }

    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    normalize(a) {
        var len = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
        if (len === 0) return [0, 0, 0];
        return [a[0] / len, a[1] / len, a[2] / len];
    }
}