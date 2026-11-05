import { hexToRgb, rgbToHex } from "../../colors";
import { get, set } from "../../save_version_management";
import { id, n, tn, tryRemove } from "../../shorthand_functions";

let liveWallpaperFrame: number | undefined;

export function stopLiveWallpaper() {
    if (liveWallpaperFrame) {
        cancelAnimationFrame(liveWallpaperFrame);
        liveWallpaperFrame = undefined;
    }
    tryRemove(id("mod-background-live"));
}

export function randomColor(offset = 0) {
    const seed = Math.random() * 100;
    return [
        Math.round((0.5 + 0.5 * Math.cos(seed + offset + 0)) * 255),
        Math.round((0.5 + 0.5 * Math.cos(seed + offset + 2)) * 255),
        Math.round((0.5 + 0.5 * Math.cos(seed + offset + 4)) * 255),
    ];
}

export function startLiveWallpaper(
    preview = false,
    col1?: any,
    col2?: any,
    col3?: any,
) {
    let gl: any;
    if (!preview) {
        stopLiveWallpaper();
        tn("body", 0).insertAdjacentHTML(
            "beforeend",
            '<canvas id="mod-background-live"></canvas>',
        );
    }
    const canvas = id(
        preview ? "mod-live-preview" : "mod-background-live",
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    gl = canvas.getContext("webgl");
    if (!gl) return;

    // Simple vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        void main() {
            gl_Position = aVertexPosition;
        }
    `;

    if (!preview) {
        if (
            n(get("livecolor1")) ||
            n(get("livecolor2")) ||
            n(get("livecolor3"))
        ) {
            set("livecolor1", rgbToHex(randomColor(0)));
            set("livecolor2", rgbToHex(randomColor(2)));
            set("livecolor3", rgbToHex(randomColor(4)));
        }
        col1 = hexToRgb(get("livecolor1"));
        col2 = hexToRgb(get("livecolor2"));
        col3 = hexToRgb(get("livecolor3"));
    }

    // Fragment shader with random color noise, colors are represented as RGB 0-1 vec3
    // We create a plasma/noise effect (see math stuff), and mix the colors with eachother at the end
    const fsSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float t = u_time * 0.5;

            vec3 col1 = vec3(${col1[0] / 255},${col1[1] / 255},${col1[2] / 255});
            vec3 col2 = vec3(${col2[0] / 255},${col2[1] / 255},${col2[2] / 255});
            vec3 col3 = vec3(${col3[0] / 255},${col3[1] / 255},${col3[2] / 255});

            float v = 0.0;
            vec2 c = uv * 2.0 - 1.0;
            v += sin((c.x+t));
            v += sin((c.y+t)/2.0);
            v += sin((c.x+c.y+t)/2.0);
            c += 1.0/2.0 * vec2(sin(t/3.0), cos(t/2.0));
            v += sin(sqrt(c.x*c.x+c.y*c.y+1.0)+t);
            v = v/2.0;

            vec3 color = mix(col1, col2, smoothstep(0.0, 1.0, sin(v * 3.0 + t)));
            color = mix(color, col3, smoothstep(0.0, 1.0, cos(v * 2.0 - t)));

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(
                shaderProgram,
                "aVertexPosition",
            ),
        },
        uniformLocations: {
            time: gl.getUniformLocation(shaderProgram, "u_time"),
            resolution: gl.getUniformLocation(shaderProgram, "u_resolution"),
        },
    };

    const buffers = initBuffers(gl);

    function render(now: number) {
        if (!gl || !canvas) return;
        now *= 0.001; // convert to seconds

        // Resize if needed
        if (
            canvas.width !== window.innerWidth ||
            canvas.height !== window.innerHeight
        ) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programInfo.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            2,
            gl.FLOAT,
            false,
            0,
            0,
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.uniform1f(programInfo.uniformLocations.time, now);
        gl.uniform2f(
            programInfo.uniformLocations.resolution,
            canvas.width,
            canvas.height,
        );

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        liveWallpaperFrame = requestAnimationFrame(render);
    }
    liveWallpaperFrame = requestAnimationFrame(render);
}

function initShaderProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string,
) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    if (!vertexShader || !fragmentShader || !shaderProgram) {
        return null;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initBuffers(gl: WebGLRenderingContext) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return { position: positionBuffer };
}
