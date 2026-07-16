/* tslint:disable */
/* eslint-disable */

export function adjust_contrast(data: Uint8Array, contrast: number): string;

export function blur(data: Uint8Array, sigma: number): string;

export function brighten(data: Uint8Array, amount: number): string;

export function crop(data: Uint8Array, x: number, y: number, w: number, h: number): string;

export function edge_detect(data: Uint8Array): string;

export function emboss(data: Uint8Array): string;

export function encode_as(data: Uint8Array, format: number, quality: number): any;

export function flip_horizontal(data: Uint8Array): string;

export function flip_vertical(data: Uint8Array): string;

export function get_info(data: Uint8Array): any;

export function grayscale(data: Uint8Array): string;

/**
 * BLAKE3 哈希 — 比 SHA-256 快 10x，安全性相当
 */
export function hash_blake3(data: Uint8Array): string;

/**
 * MD5 哈希（128-bit）— 仅用于数据校验，不用于安全场景
 */
export function hash_md5(data: Uint8Array): string;

/**
 * SHA-256 哈希（256-bit）— 安全性好
 */
export function hash_sha256(data: Uint8Array): string;

/**
 * SHA-512 哈希（512-bit）— 最高安全性
 */
export function hash_sha512(data: Uint8Array): string;

export function huerotate(data: Uint8Array, deg: number): string;

export function invert(data: Uint8Array): string;

export function main(): void;

export function pixelate(data: Uint8Array, block_size: number): string;

/**
 * 生成二维码 SVG
 * text: 编码内容; size_px: 输出边长(px); dark_color / light_color: CSS 颜色值
 * 返回 SVG 字符串（可直接嵌入 HTML）
 */
export function qr_svg(text: string, size_px: number, dark_color: string, light_color: string): string;

export function resize(data: Uint8Array, width: number, height: number, filter: number): string;

export function rotate(data: Uint8Array, deg: number): string;

export function sepia(data: Uint8Array): string;

export function thumbnail(data: Uint8Array, max_side: number): string;

export function unsharpen(data: Uint8Array, sigma: number, threshold: number): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly adjust_contrast: (a: number, b: number, c: number) => [number, number, number, number];
    readonly blur: (a: number, b: number, c: number) => [number, number, number, number];
    readonly brighten: (a: number, b: number, c: number) => [number, number, number, number];
    readonly crop: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly edge_detect: (a: number, b: number) => [number, number, number, number];
    readonly emboss: (a: number, b: number) => [number, number, number, number];
    readonly encode_as: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly flip_horizontal: (a: number, b: number) => [number, number, number, number];
    readonly flip_vertical: (a: number, b: number) => [number, number, number, number];
    readonly get_info: (a: number, b: number) => [number, number, number];
    readonly grayscale: (a: number, b: number) => [number, number, number, number];
    readonly huerotate: (a: number, b: number, c: number) => [number, number, number, number];
    readonly invert: (a: number, b: number) => [number, number, number, number];
    readonly pixelate: (a: number, b: number, c: number) => [number, number, number, number];
    readonly resize: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly rotate: (a: number, b: number, c: number) => [number, number, number, number];
    readonly sepia: (a: number, b: number) => [number, number, number, number];
    readonly thumbnail: (a: number, b: number, c: number) => [number, number, number, number];
    readonly unsharpen: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly hash_blake3: (a: number, b: number) => [number, number];
    readonly hash_md5: (a: number, b: number) => [number, number];
    readonly hash_sha256: (a: number, b: number) => [number, number];
    readonly hash_sha512: (a: number, b: number) => [number, number];
    readonly main: () => void;
    readonly qr_svg: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
