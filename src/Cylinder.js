class Cylinder {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 24;
  }

  render() {
    gl.uniform4f(
      u_FragColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3]
    );

    gl.uniformMatrix4fv(
      u_ModelMatrix,
      false,
      this.matrix.elements
    );

    let step = (2 * Math.PI) / this.segments;

    for (let i = 0; i < this.segments; i++) {
      let a = i * step;
      let b = (i + 1) * step;

      let x1 = Math.cos(a) * 0.5;
      let z1 = Math.sin(a) * 0.5;
      let x2 = Math.cos(b) * 0.5;
      let z2 = Math.sin(b) * 0.5;

      // side faces
      drawTriangle3D([ x1, 0, z1, x2, 0, z2, x2, 1, z2]);

      drawTriangle3D([ x1, 0, z1, x2, 1, z2, x1, 1, z1 ]);

      // bottom cap
      drawTriangle3D([ 0, 0, 0, x2, 0, z2, x1, 0, z1 ]);

      // top cap
      drawTriangle3D([ 0, 1, 0, x1, 1, z1, x2, 1, z2 ]);
    }
  }
}