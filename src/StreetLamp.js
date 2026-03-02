class StreetLamp {
  constructor() {
    this.matrix = new Matrix4();
    this.baseColor = [0.18, 0.18, 0.20, 1.0];
    this.poleColor = [0.12, 0.12, 0.14, 1.0];
    this.headColor = [0.20, 0.20, 0.22, 1.0];
    this.lightColor = [1.0, 0.95, 0.75, 1.0];
  }

  render() {
    var base = new Cube();
    base.textureNum = -2;
    base.color = this.baseColor;
    base.matrix = new Matrix4(this.matrix);
    base.matrix.translate(-0.45, 0.0, -0.45);
    base.matrix.scale(0.9, 0.22, 0.9);
    base.render();

    var pole = new Cube();
    pole.textureNum = -2;
    pole.color = this.poleColor;
    pole.matrix = new Matrix4(this.matrix);
    pole.matrix.translate(-0.09, 0.22, -0.09);
    pole.matrix.scale(0.18, 4.3, 0.18);
    pole.render();

    var arm = new Cube();
    arm.textureNum = -2;
    arm.color = this.poleColor;
    arm.matrix = new Matrix4(this.matrix);
    arm.matrix.translate(-0.09, 4.35, -0.09);
    arm.matrix.scale(1.15, 0.14, 0.18);
    arm.render();

    var head = new Cube();
    head.textureNum = -2;
    head.color = this.headColor;
    head.matrix = new Matrix4(this.matrix);
    head.matrix.translate(0.96, 3.86, -0.18);
    head.matrix.scale(0.36, 0.44, 0.36);
    head.render();

    var bulb = new Sphere();
    bulb.textureNum = -4;
    bulb.color = this.lightColor;
    bulb.matrix = new Matrix4(this.matrix);
    bulb.matrix.translate(1.14, 3.80, 0.0);
    bulb.matrix.scale(0.14, 0.14, 0.14);
    bulb.render();
  }
}
