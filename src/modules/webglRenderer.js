/**
 * WebGL渲染模块
 * @module modules/webglRenderer
 */

/**
 * WebGL渲染器类 - 用于高性能3D渲染
 */
export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.buffers = {};
        this.initialized = false;
    }

    /**
     * 初始化WebGL
     * @returns {boolean} 是否初始化成功
     */
    init() {
        try {
            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            
            if (!this.gl) {
                console.warn('WebGL not supported, falling back to Canvas 2D');
                return false;
            }

            this.initShaders();
            this.initBuffers();
            this.initialized = true;
            
            return true;
        } catch (error) {
            console.error('WebGL initialization failed:', error);
            return false;
        }
    }

    /**
     * 初始化着色器
     */
    initShaders() {
        const gl = this.gl;

        // 顶点着色器
        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying lowp vec4 vColor;
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }
        `;

        // 片段着色器
        const fsSource = `
            varying lowp vec4 vColor;
            void main() {
                gl_FragColor = vColor;
            }
        `;

        const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Unable to initialize shader program:', gl.getProgramInfoLog(this.program));
            return;
        }

        // 获取属性和uniform位置
        this.programInfo = {
            program: this.program,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(this.program, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(this.program, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            },
        };
    }

    /**
     * 加载着色器
     * @param {number} type - 着色器类型
     * @param {string} source - 着色器源码
     * @returns {WebGLShader} 着色器对象
     */
    loadShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * 初始化缓冲区
     */
    initBuffers() {
        const gl = this.gl;

        // 位置缓冲区
        this.buffers.position = gl.createBuffer();
        
        // 颜色缓冲区
        this.buffers.color = gl.createBuffer();
    }

    /**
     * 清除画布
     * @param {number} r - 红色分量 (0-1)
     * @param {number} g - 绿色分量 (0-1)
     * @param {number} b - 蓝色分量 (0-1)
     * @param {number} a - 透明度 (0-1)
     */
    clear(r = 0.0, g = 0.0, b = 0.0, a = 1.0) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * 绘制3D曲线
     * @param {Array} points - 点数组 [{x, y, z}, ...]
     * @param {Array} color - 颜色 [r, g, b, a]
     * @param {Float32Array} projectionMatrix - 投影矩阵
     * @param {Float32Array} modelViewMatrix - 模型视图矩阵
     */
    drawCurve(points, color, projectionMatrix, modelViewMatrix) {
        if (!this.initialized || points.length < 2) return;

        const gl = this.gl;

        // 准备顶点数据
        const positions = new Float32Array(points.length * 3);
        const colors = new Float32Array(points.length * 4);

        for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;

            colors[i * 4] = color[0];
            colors[i * 4 + 1] = color[1];
            colors[i * 4 + 2] = color[2];
            colors[i * 4 + 3] = color[3];
        }

        // 绑定位置缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            3, gl.FLOAT, false, 0, 0
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        // 绑定颜色缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexColor,
            4, gl.FLOAT, false, 0, 0
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

        // 使用着色器程序
        gl.useProgram(this.programInfo.program);

        // 设置uniform
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );

        // 绘制线条
        gl.drawArrays(gl.LINE_STRIP, 0, points.length);
    }

    /**
     * 绘制3D曲面
     * @param {Array} vertices - 顶点数组
     * @param {Array} indices - 索引数组
     * @param {Array} color - 颜色 [r, g, b, a]
     * @param {Float32Array} projectionMatrix - 投影矩阵
     * @param {Float32Array} modelViewMatrix - 模型视图矩阵
     */
    drawSurface(vertices, indices, color, projectionMatrix, modelViewMatrix) {
        if (!this.initialized || vertices.length === 0) return;

        const gl = this.gl;

        // 准备顶点数据
        const positions = new Float32Array(vertices.length * 3);
        const colors = new Float32Array(vertices.length * 4);

        for (let i = 0; i < vertices.length; i++) {
            positions[i * 3] = vertices[i].x;
            positions[i * 3 + 1] = vertices[i].y;
            positions[i * 3 + 2] = vertices[i].z;

            colors[i * 4] = color[0];
            colors[i * 4 + 1] = color[1];
            colors[i * 4 + 2] = color[2];
            colors[i * 4 + 3] = color[3];
        }

        // 绑定位置缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            3, gl.FLOAT, false, 0, 0
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        // 绑定颜色缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexColor,
            4, gl.FLOAT, false, 0, 0
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

        // 创建索引缓冲区
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // 使用着色器程序
        gl.useProgram(this.programInfo.program);

        // 设置uniform
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );

        // 绘制三角形
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * 创建透视投影矩阵
     * @param {number} fov - 视场角（弧度）
     * @param {number} aspect - 宽高比
     * @param {number} near - 近裁剪面
     * @param {number} far - 远裁剪面
     * @returns {Float32Array} 投影矩阵
     */
    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
    }

    /**
     * 创建模型视图矩阵
     * @param {number} rotationX - X轴旋转
     * @param {number} rotationY - Y轴旋转
     * @param {number} scale - 缩放
     * @returns {Float32Array} 模型视图矩阵
     */
    createModelViewMatrix(rotationX, rotationY, scale = 1) {
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);

        // 组合旋转矩阵
        return new Float32Array([
            cosY * scale, 0, sinY * scale, 0,
            sinX * sinY * scale, cosX * scale, -sinX * cosY * scale, 0,
            -cosX * sinY * scale, sinX * scale, cosX * cosY * scale, 0,
            0, 0, 0, 1
        ]);
    }

    /**
     * 调整画布大小
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    resize(width, height) {
        if (!this.gl) return;

        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    /**
     * 销毁WebGL资源
     */
    destroy() {
        if (!this.gl) return;

        // 删除缓冲区
        Object.values(this.buffers).forEach(buffer => {
            if (buffer) this.gl.deleteBuffer(buffer);
        });

        // 删除着色器程序
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }

        this.initialized = false;
    }
}

export default WebGLRenderer;
