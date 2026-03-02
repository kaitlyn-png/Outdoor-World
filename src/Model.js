// Model.js referenced from the Lab Activity - OBJ Loaders code with some modifications to fit the needs of this assignment
class Model {
    constructor(gl, filePath) {
        this.gl = gl;
        this.filePath = filePath;
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.textureNum = -2;
        this.matrix = new Matrix4();
        this.isFullyLoaded = false;
        this.modelData = {
            vertices: new Float32Array([]),
            normals: new Float32Array([])
        };

        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        if (!this.vertexBuffer || !this.normalBuffer) {
            console.log("Failed to create buffers for", this.filePath);
            return;
        }

        this.getFileContent();
    }

    async parseModel(fileContent) {
        const lines = fileContent.split(/\r?\n/);
        const allVertices = [];
        const allNormals = [];

        const unpackedVerts = [];
        const unpackedNormals = [];

        function getVertexByIndex(vertexIndex) {
            const base = vertexIndex * 3;
            return [
                allVertices[base],
                allVertices[base + 1],
                allVertices[base + 2]
            ];
        }

        function getNormalByIndex(normalIndex) {
            const base = normalIndex * 3;
            return [
                allNormals[base],
                allNormals[base + 1],
                allNormals[base + 2]
            ];
        }

        function subtract(a, b) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        }

        function cross(a, b) {
            return [
                a[1] * b[2] - a[2] * b[1],
                a[2] * b[0] - a[0] * b[2],
                a[0] * b[1] - a[1] * b[0]
            ];
        }

        function normalize(v) {
            const mag = Math.hypot(v[0], v[1], v[2]);
            if (mag === 0) return [0, 1, 0];
            return [v[0] / mag, v[1] / mag, v[2] / mag];
        }

        function isValidNormal(v) {
            if (!v || v.length < 3) return false;
            if (!Number.isFinite(v[0]) || !Number.isFinite(v[1]) || !Number.isFinite(v[2])) return false;
            return Math.hypot(v[0], v[1], v[2]) > 1e-6;
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const tokens = line.split(/\s+/);

            if (tokens[0] === 'v') {
                allVertices.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
            } else if (tokens[0] === 'vn') {
                allNormals.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
            } else if (tokens[0] === 'f') {
                const faceTokens = tokens.slice(1).filter(Boolean);
                if (faceTokens.length < 3) continue;

                const parsedFace = faceTokens.map((faceToken) => {
                    const parts = faceToken.split('/');
                    const rawVertexIndex = parseInt(parts[0], 10);
                    const rawNormalIndex = parts.length >= 3 && parts[2] !== '' ? parseInt(parts[2], 10) : NaN;

                    const vertexIndex = rawVertexIndex < 0
                        ? (allVertices.length / 3) + rawVertexIndex
                        : rawVertexIndex - 1;
                    const normalIndex = Number.isNaN(rawNormalIndex)
                        ? null
                        : (rawNormalIndex < 0 ? (allNormals.length / 3) + rawNormalIndex : rawNormalIndex - 1);

                    return { vertexIndex, normalIndex };
                });

                for (let tri = 1; tri < parsedFace.length - 1; tri++) {
                    const triVerts = [parsedFace[0], parsedFace[tri], parsedFace[tri + 1]];

                    const p0 = getVertexByIndex(triVerts[0].vertexIndex);
                    const p1 = getVertexByIndex(triVerts[1].vertexIndex);
                    const p2 = getVertexByIndex(triVerts[2].vertexIndex);
                    const computedNormal = normalize(cross(subtract(p1, p0), subtract(p2, p0)));

                    for (const v of triVerts) {
                        const vertex = getVertexByIndex(v.vertexIndex);
                        if (vertex[0] === undefined || vertex[1] === undefined || vertex[2] === undefined) {
                            continue;
                        }

                        let normal;
                        if (v.normalIndex !== null && v.normalIndex >= 0) {
                            normal = getNormalByIndex(v.normalIndex);
                            if (!isValidNormal(normal)) {
                                normal = computedNormal;
                            }
                        } else {
                            normal = computedNormal;
                        }

                        unpackedVerts.push(vertex[0], vertex[1], vertex[2]);
                        unpackedNormals.push(normal[0], normal[1], normal[2]);
                    }
                }
            }
        }

        this.modelData = {
            vertices: new Float32Array(unpackedVerts),
            normals: new Float32Array(unpackedNormals)
        };
        this.isFullyLoaded = this.modelData.vertices.length > 0;
    }

    render(gl, programInfo) {
        if (!this.isFullyLoaded) return;

        if (programInfo.u_whichTexture) {
            gl.uniform1i(programInfo.u_whichTexture, this.textureNum);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(programInfo.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(programInfo.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.a_Normal);

        gl.uniformMatrix4fv(programInfo.u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4fv(programInfo.u_FragColor, this.color);

        let normalMatrix = new Matrix4().setInverseOf(this.matrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(programInfo.u_NormalMatrix, false, normalMatrix.elements);

        gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
    }

    async getFileContent() {
        try {
            const response = await fetch(this.filePath);
            if (!response.ok) {
                throw new Error(`Could not load file "${this.filePath}". Are you sure the file name/path are correct?`);
            }

            const fileContent = await response.text();
            await this.parseModel(fileContent);
        } catch (e) {
            console.error(`Something went wrong when loading ${this.filePath}. Error:`, e);
            this.isFullyLoaded = false;
        }
    }
}
