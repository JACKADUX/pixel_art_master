import type { CanvasDisplayMode } from "@/domain/color/CanvasDisplayMode";
import { oklabLightnessFromRgb } from "@/domain/color/CanvasDisplayMode";
import {
  OKLAB_DISPLAY_FRAGMENT_SHADER,
  OKLAB_DISPLAY_VERTEX_SHADER,
} from "./oklabDisplay.glsl";

type TexImageSourceLike = HTMLImageElement | ImageData | HTMLCanvasElement | OffscreenCanvas;

export type { TexImageSourceLike };

const QUAD_POSITIONS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const QUAD_TEX_COORDS = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown";
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, OKLAB_DISPLAY_VERTEX_SHADER);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, OKLAB_DISPLAY_FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown";
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

function readSourceSize(source: TexImageSourceLike): { width: number; height: number } {
  if (source instanceof ImageData) {
    return { width: source.width, height: source.height };
  }
  return { width: source.width, height: source.height };
}

function renderWithCpuFallback(
  target: HTMLCanvasElement,
  source: TexImageSourceLike,
  width: number,
  height: number,
  mode: CanvasDisplayMode,
): void {
  const { width: srcW, height: srcH } = readSourceSize(source);
  const offscreen = document.createElement("canvas");
  offscreen.width = srcW;
  offscreen.height = srcH;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  if (source instanceof ImageData) {
    offCtx.putImageData(source, 0, 0);
  } else {
    offCtx.drawImage(source, 0, 0);
  }

  const imageData = offCtx.getImageData(0, 0, srcW, srcH);
  if (mode === "oklabLightness") {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const l = oklabLightnessFromRgb(data[i]!, data[i + 1]!, data[i + 2]!);
      const gray = Math.round(Math.min(1, Math.max(0, l)) * 255);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    offCtx.putImageData(imageData, 0, 0);
  }

  target.width = width;
  target.height = height;
  target.style.width = `${width}px`;
  target.style.height = `${height}px`;

  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(offscreen, 0, 0, width, height);
}

export class OklabDisplayGlRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private modeLocation: WebGLUniformLocation | null = null;
  private textureLocation: WebGLUniformLocation | null = null;
  private lastSource: TexImageSourceLike | null = null;
  private useCpuFallback = false;

  setSource(source: TexImageSourceLike): void {
    this.lastSource = source;
    if (this.useCpuFallback) return;

    const gl = this.ensureGl();
    if (!gl) {
      this.useCpuFallback = true;
      return;
    }

    const { width, height } = readSourceSize(source);

    if (!this.texture) {
      this.texture = gl.createTexture();
    }
    if (!this.texture) return;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    if (source instanceof ImageData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
  }

  render(
    target: HTMLCanvasElement,
    width: number,
    height: number,
    mode: CanvasDisplayMode,
    source?: TexImageSourceLike,
  ): void {
    if (source) {
      this.setSource(source);
    }

    const activeSource = this.lastSource;
    if (!activeSource) return;

    if (this.useCpuFallback || !this.gl || !this.texture) {
      renderWithCpuFallback(target, activeSource, width, height, mode);
      return;
    }

    const gl = this.gl;
    if (target.width !== width || target.height !== height) {
      target.width = width;
      target.height = height;
    }
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.textureLocation, 0);
    gl.uniform1i(this.modeLocation, mode === "oklabLightness" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    if (this.gl) {
      const gl = this.gl;
      if (this.texture) gl.deleteTexture(this.texture);
      if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
      if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.vao = null;
    this.positionBuffer = null;
    this.texCoordBuffer = null;
    this.modeLocation = null;
    this.textureLocation = null;
    this.lastSource = null;
    this.useCpuFallback = false;
  }

  private ensureGl(): WebGL2RenderingContext | null {
    if (this.gl) return this.gl;
    return null;
  }

  /** Bind WebGL to a canvas element. Call once when the image canvas is mounted. */
  initCanvas(canvas: HTMLCanvasElement): boolean {
    if (this.gl) return true;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.warn("OklabDisplayGlRenderer: WebGL2 unavailable, using CPU fallback");
      this.useCpuFallback = true;
      return false;
    }

    try {
      const program = createProgram(gl);
      const positionBuffer = gl.createBuffer();
      const texCoordBuffer = gl.createBuffer();
      const vao = gl.createVertexArray();
      if (!positionBuffer || !texCoordBuffer || !vao) {
        throw new Error("Failed to create GL buffers");
      }

      gl.bindVertexArray(vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, QUAD_POSITIONS, gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, QUAD_TEX_COORDS, gl.STATIC_DRAW);
      const texLoc = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(texLoc);
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindVertexArray(null);

      this.gl = gl;
      this.program = program;
      this.vao = vao;
      this.positionBuffer = positionBuffer;
      this.texCoordBuffer = texCoordBuffer;
      this.modeLocation = gl.getUniformLocation(program, "u_mode");
      this.textureLocation = gl.getUniformLocation(program, "u_texture");
      return true;
    } catch (err) {
      console.warn("OklabDisplayGlRenderer: init failed, using CPU fallback", err);
      this.useCpuFallback = true;
      return false;
    }
  }
}

export function blitWithDisplayMode(
  renderer: OklabDisplayGlRenderer,
  glCanvas: HTMLCanvasElement,
  source: TexImageSourceLike,
  displayWidth: number,
  displayHeight: number,
  mode: CanvasDisplayMode,
): void {
  if (mode !== "oklabLightness") return;
  renderer.initCanvas(glCanvas);
  renderer.setSource(source);
  renderer.render(glCanvas, displayWidth, displayHeight, mode);
}
