class Sphere{
    constructor(){
        this.type = "sphere";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = -2;
        this.segments = 20;
        this.rings = 20;
    }

    static meshCache = {};

    static buildMeshData(rings, segments) {
        var positions = [];
        var normals = [];
        var uvs = [];

        for (var ring = 0; ring < rings; ring++) {
            var theta0 = (ring / rings) * Math.PI;
            var theta1 = ((ring + 1) / rings) * Math.PI;

            for (var segment = 0; segment < segments; segment++) {
                var phi0 = (segment / segments) * 2.0 * Math.PI;
                var phi1 = ((segment + 1) / segments) * 2.0 * Math.PI;

                var p1 = [Math.sin(theta0) * Math.cos(phi0), Math.cos(theta0), Math.sin(theta0) * Math.sin(phi0)];
                var p2 = [Math.sin(theta1) * Math.cos(phi0), Math.cos(theta1), Math.sin(theta1) * Math.sin(phi0)];
                var p3 = [Math.sin(theta0) * Math.cos(phi1), Math.cos(theta0), Math.sin(theta0) * Math.sin(phi1)];
                var p4 = [Math.sin(theta1) * Math.cos(phi1), Math.cos(theta1), Math.sin(theta1) * Math.sin(phi1)];

                var uv1 = [segment / segments, ring / rings];
                var uv2 = [segment / segments, (ring + 1) / rings];
                var uv3 = [(segment + 1) / segments, ring / rings];
                var uv4 = [(segment + 1) / segments, (ring + 1) / rings];

                positions.push(
                    p1[0], p1[1], p1[2],
                    p2[0], p2[1], p2[2],
                    p4[0], p4[1], p4[2],
                    p1[0], p1[1], p1[2],
                    p4[0], p4[1], p4[2],
                    p3[0], p3[1], p3[2]
                );

                normals.push(
                    p1[0], p1[1], p1[2],
                    p2[0], p2[1], p2[2],
                    p4[0], p4[1], p4[2],
                    p1[0], p1[1], p1[2],
                    p4[0], p4[1], p4[2],
                    p3[0], p3[1], p3[2]
                );

                uvs.push(
                    uv1[0], uv1[1],
                    uv2[0], uv2[1],
                    uv4[0], uv4[1],
                    uv1[0], uv1[1],
                    uv4[0], uv4[1],
                    uv3[0], uv3[1]
                );
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            vertexCount: positions.length / 3
        };
    }

    getMesh() {
        var key = this.rings + 'x' + this.segments;
        var cached = Sphere.meshCache[key];
        if (cached) {
            return cached;
        }

        var data = Sphere.buildMeshData(this.rings, this.segments);

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

        var normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);

        var uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data.uvs, gl.STATIC_DRAW);

        Sphere.meshCache[key] = {
            vertexCount: data.vertexCount,
            positionBuffer: positionBuffer,
            normalBuffer: normalBuffer,
            uvBuffer: uvBuffer
        };

        return Sphere.meshCache[key];
    }

    render(){
        var rgba = this.color;
        var mesh = this.getMesh();

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        this.normalMatrix.setInverseOf(this.matrix).transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
    }
}