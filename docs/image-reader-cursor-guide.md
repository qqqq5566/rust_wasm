# ImageReader 与 Cursor 使用详解

> 基于 `image` crate v0.25，结合本项目的 WASM 图片处理实战案例。

---

## 目录

1. [为什么需要 Cursor？](#1-为什么需要-cursor)
2. [Cursor 详解](#2-cursor-详解)
3. [ImageReader 详解](#3-imagereader-详解)
4. [完整调用链解析](#4-完整调用链解析)
5. [本项目实战案例](#5-本项目实战案例)
6. [常见问题](#6-常见问题)

---

## 1. 为什么需要 Cursor？

### 问题背景

`image` crate 的 `ImageReader` 需要实现 `Read + Seek` trait 的数据源才能工作。普通的 `&[u8]` 字节数组只实现了 `Read`，不实现 `Seek`（不能前后跳转读取）。

```rust
// ❌ 不能直接传 &[u8]
// ImageReader::new(data)  // data: &[u8] — 不满足 Seek 约束

// ✅ 用 Cursor 包装后满足 Read + Seek
ImageReader::new(Cursor::new(data))
```

### 为什么要 Seek？

图片解码器需要**随机访问**数据（跳转到文件头读取元数据、跳过不需要的区块、回溯解析等），而不是只能顺序读取：

```
解码 JPEG 的典型过程：
  [SOI 标记] → Seek(2) → [APP1 标记] → Seek(4) → [DQT 表]
→ Seek 回文件头 → [SOF 标记] → Seek 到像素数据 → ...
```

---

## 2. Cursor 详解

### 所属 crate

```rust
use std::io::Cursor;   // 标准库自带，无需额外依赖
```

### 本质

`Cursor<T>` 是一个**为内存数据添加位置指针**的包装器。`T` 通常是 `Vec<u8>` 或 `&[u8]`。

```
┌─────────────────────────────────┐
│  Cursor<&[u8]>                  │
│                                 │
│  inner: &[u8]  ← 底层字节数据    │
│  pos: usize    ← 当前读取位置    │
│                                 │
│  实现了: Read + Seek + BufRead  │
└─────────────────────────────────┘
```

### 构造方式

```rust
// 模式 1：从不可变引用（read-only，不转移所有权）
let data: &[u8] = &[0xFF, 0xD8, 0xFF, ...];
let cursor = Cursor::new(data);           // Cursor<&[u8]>

// 模式 2：从 Vec（读写，转移所有权）
let buffer: Vec<u8> = Vec::new();
let mut cursor = Cursor::new(buffer);      // Cursor<Vec<u8>>

// 模式 3：不同类型对照
Cursor::new(&[1, 2, 3]);   // Cursor<&[u8]>     — 只读
Cursor::new(vec![1,2,3]);  // Cursor<Vec<u8>>   — 可写
Cursor::new("hello");      // Cursor<&str>      — 也支持字符串
```

### 核心方法

| 方法 | 签名 | 说明 | 来源 trait |
|---|---|---|---|
| `new(inner: T)` | 构造 | 创建 Cursor | 自身 |
| `read(buf: &mut [u8])` | `-> io::Result<usize>` | 从当前位置读取 | `Read` |
| `seek(pos: SeekFrom)` | `-> io::Result<u64>` | 跳转到指定位置 | `Seek` |
| `position()` | `-> u64` | 获取当前读取位置 | `Seek` (自带) |
| `get_ref()` | `-> &T` | 获取内部数据的不可变引用 | 自带 |
| `into_inner()` | `-> T` | 取出内部数据，消费 Cursor | 自带（转移所有权） |
| `get_mut()` | `-> &mut T` | 获取内部数据的可变引用 | 自带 |

### 关键设计点

#### ① `Cursor<&[u8]>` vs `Cursor<Vec<u8>>`

```rust
// 只读场景：用 &[u8]，零拷贝，不转移所有权
let bytes: Vec<u8> = file_read();
let cursor = Cursor::new(bytes.as_slice());

// 写入场景：用 Vec<u8>，可以往里写数据
let mut buf = Cursor::new(Vec::new());
img.write_to(&mut buf, ImageFormat::Png);  // 写操作
let result: Vec<u8> = buf.into_inner();     // 取出写入的字节
```

#### ② `Read` trait 会自动推进 position

```rust
let mut c = Cursor::new(&[0x00, 0x01, 0x02, 0x03]);
assert_eq!(c.position(), 0);

let mut buf = [0u8; 2];
c.read(&mut buf).unwrap();
assert_eq!(buf, [0x00, 0x01]);
assert_eq!(c.position(), 2);  // 自动推进了 2 字节
```

#### ③ `Seek` 的跳转方式

```rust
use std::io::{Cursor, Seek, SeekFrom};

let mut c = Cursor::new(&[10, 20, 30, 40, 50]);

c.seek(SeekFrom::Start(2));  // 跳到开头往后 2 字节 → 位置 2
c.seek(SeekFrom::Current(1)); // 从当前位置往前 1 → 位置 3
c.seek(SeekFrom::End(-1));    // 从末尾往前 1 → 位置 4
```

---

## 3. ImageReader 详解

### 所属 crate

```rust
use image::ImageReader;    // image v0.25+
use image::ImageFormat;    // 格式枚举
```

### `ImageReader` 是什么

`ImageReader` 是 `image` v0.25 引入的**构建器（Builder）模式**解码入口，取代了旧版 `image::open()` 和 `image::load_from_memory()` 等自由函数。

```rust
// 旧版 API（v0.24，已不推荐）
let img = image::load_from_memory(data)?;

// 新版 API（v0.25+）— 更灵活
let img = ImageReader::new(Cursor::new(data))
    .with_guessed_format()?
    .decode()?;
```

### 构造 → 配置 → 解码 三步走

```
ImageReader::new(source)   →  Reader 实例
    │                          （还没有做任何解析）
    ├─ .with_guessed_format() → 自动检测格式
    │                          （读取文件头 magic bytes）
    ├─ .decode()              → 完整解码
    │                          （解析所有像素数据）
    └─ 结果: DynamicImage / ImageResult
```

### 全部方法一览

#### 构造

| 方法 | 签名 | 说明 |
|---|---|---|
| `new(source)` | `(impl BufRead + Seek + 'static) -> ImageReader<T>` | 从实现了 Read+Seek 的源构造 |

#### 配置（可选，返回 `Self` 支持链式调用）

| 方法 | 签名 | 说明 |
|---|---|---|
| `with_guessed_format()` | `-> ImageResult<Self>` | **自动检测**图片格式（读 magic bytes） |
| `guess_format()` | `-> ImageResult<ImageFormat>` | 检测格式但**不解码**，返回检测到的格式枚举 |
| `set_format(format)` | `-> Self` | **手动指定**格式，跳过自动检测 |
| `no_limits()` | `-> Self` | 移除安全限制（默认有内存/尺寸上限，防 DoS） |
| `decode_metadata()` | `-> ImageResult<ImageMetadata>` | 只读元数据（尺寸、ICC profile 等），不解码像素 |

#### 最终执行（消费 Reader）

| 方法 | 返回 | 说明 |
|---|---|---|
| `decode()` | `ImageResult<DynamicImage>` | 完整解码为 `DynamicImage` |
| `decode_with_metadata()` | `ImageResult<(DynamicImage, ImageMetadata)>` | 解码 + 元数据一起返回 |

#### 格式探测

| 方法 | 返回 | 说明 |
|---|---|---|
| `format()` | `Option<ImageFormat>` | 已设置的格式（手动或自动检测后），未检测返回 None |

### `ImageFormat` 枚举

```rust
pub enum ImageFormat {
    Png,      // image/png
    Jpeg,     // image/jpeg
    Gif,      // image/gif
    WebP,     // image/webp
    Pnm,      // PPM/PGM/PBM
    Tiff,     // image/tiff
    Tga,      // Truevision Targa
    Dds,      // DirectDraw Surface
    Bmp,      // Windows Bitmap
    Ico,      // Windows Icon
    Hdr,      // Radiance HDR
    OpenExr,  // OpenEXR
    Farbfeld, // farbfeld
    Avif,     // AVIF
    Qoi,      // Quite OK Image
    // ...
}
```

### `DynamicImage` 提供的方法（解码后操作）

解码得到的 `DynamicImage` 是各种颜色格式的枚举包装：

| 方法 | 返回 | 说明 |
|---|---|---|
| `width()` | `u32` | 像素宽度 |
| `height()` | `u32` | 像素高度 |
| `color()` | `ColorType` | 颜色模式（Rgb8, Rgba8, L8 等） |
| `grayscale()` | `DynamicImage` | 转为灰度图 |
| `brighten(value)` | `DynamicImage` | 调整亮度（可正可负） |
| `adjust_contrast(c)` | `DynamicImage` | 调整对比度 |
| `blur(sigma)` | `DynamicImage` | 高斯模糊 |
| `fliph()` | `DynamicImage` | 水平翻转 |
| `flipv()` | `DynamicImage` | 垂直翻转 |
| `rotate90()` | `DynamicImage` | 顺时针旋转 90° |
| `rotate180()` | `DynamicImage` | 旋转 180° |
| `rotate270()` | `DynamicImage` | 顺时针旋转 270° |
| `resize(w, h, filter)` | `DynamicImage` | 缩放到指定尺寸 |
| `resize_exact(w, h, filter)` | `DynamicImage` | 精确缩放（可能拉伸） |
| `crop(x, y, w, h)` | `DynamicImage` | 裁剪 |
| `thumbnail(w, h)` | `DynamicImage` | 缩略图（等比，可能略大于目标） |
| `thumbnail_exact(w, h)` | `DynamicImage` | 缩略图（等比裁剪到精确尺寸） |
| `write_to(w, fmt)` | `ImageResult<()>` | 编码写入到实现 `Write+Seek` 的目标 |
| `as_rgb8()` | `Option<&RgbImage>` | 获取 RGB8 像素 buffer 引用 |
| `as_rgba8()` | `Option<&RgbaImage>` | 获取 RGBA8 像素 buffer 引用 |
| `to_rgb8()` | `RgbImage` | 转换为 RGB8（必要时会转换颜色空间） |
| `to_rgba8()` | `RgbaImage` | 转换为 RGBA8 |
| `save(path)` | `ImageResult<()>` | 直接保存到文件 |
| `into_bytes()` | `Vec<u8>` | 转为原始字节（RGB8 格式下为像素字节） |

---

## 4. 完整调用链解析

### 解码：字节 → DynamicImage

```rust
fn decode_image(data: &[u8]) -> Result<DynamicImage, JsValue> {
    //  ①                    ②             ③             ④
    ImageReader::new(Cursor::new(data))
        .with_guessed_format()
        .map_err(|e| ...)?
        .decode()
        .map_err(|e| ...)
}
```

| 步骤 | 代码 | 发生了什么 |
|---|---|---|
| ① | `Cursor::new(data)` | 为 `&[u8]` 添加位置指针，获得 `Read + Seek` 能力 |
| ② | `ImageReader::new(...)` | 创建解码器构建器，尚未做任何 I/O |
| ③ | `.with_guessed_format()` | 读取文件头 magic bytes，识别是 PNG/JPEG/WebP... |
| ④ | `.decode()` | 完整解析图片 → 返回 `DynamicImage` |

### 编码：DynamicImage → base64

```rust
fn encode_to_base64(img: &DynamicImage) -> Result<String, JsValue> {
    //  ①                     ②                 ③             ④
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, ImageFormat::Png)?;
    Ok(base64::engine::general_purpose::STANDARD.encode(buf.into_inner()))
}
```

| 步骤 | 代码 | 发生了什么 |
|---|---|---|
| ① | `Cursor::new(Vec::new())` | 创建可写的空 buffer，Vec 实现 `Write + Seek` |
| ② | `img.write_to(&mut buf, Png)` | 将 `DynamicImage` 编码为 PNG 写入 buffer |
| ③ | `buf.into_inner()` | 取出 `Vec<u8>`（消费 Cursor） |
| ④ | `base64.encode(...)` | 将 PNG 字节编码为 base64 字符串 |

### `write_to` 为什么也需要 Seek？

编码 PNG 时，需要先写入数据块，最后回到文件头补充校验和。`Cursor<Vec<u8>>` 同时实现 `Write` 和 `Seek`，满足这个需求。

---

## 5. 本项目实战案例

### 案例 1：只读格式探测（不解码）

```rust
pub fn get_info(data: &[u8]) -> Result<JsValue, JsValue> {
    let img = decode_image(data)?;        // 完整解码（需读取像素）
    let (w, h) = (img.width(), img.height());

    // 另一个 reader 仅用于探测格式，不调用 .decode()
    let reader = ImageReader::new(Cursor::new(data))
        .with_guessed_format()?;
    let format_name = match reader.format() {
        Some(ImageFormat::Png)  => "PNG",
        Some(ImageFormat::Jpeg) => "JPEG",
        Some(ImageFormat::Gif)  => "GIF",
        // ...
        _ => "未知",
    };
    // ...
}
```

> **注意**：此处创建了两次 `ImageReader`——第一次完整解码（`decode_image`），第二次仅探测格式。可以优化为一次解码并直接从 `DynamicImage` 获取信息，但格式名需额外判断。

### 案例 2：灰度转换全流程

```rust
pub fn grayscale(data: &[u8]) -> Result<String, JsValue> {
    let img = decode_image(data)?;   // bytes → DynamicImage
    let gray = img.grayscale();      // 转为灰度
    encode_to_base64(&gray)          // DynamicImage → PNG base64
}

// 链式等效（更紧凑）：
// decode_image(data)?.grayscale() → encode_to_base64
```

### 案例 3：滑块实时调节亮度

```rust
pub fn brighten(data: &[u8], amount: i32) -> Result<String, JsValue> {
    decode_image(data)?
        .brighten(amount)   // amount = -100 到 +100
        → encode_to_base64
}
```

### 案例 4：旋转（仅直角）

```rust
pub fn rotate(data: &[u8], deg: u32) -> Result<String, JsValue> {
    let img = decode_image(data)?;
    let rotated = match deg {
        90  => img.rotate90(),   // 顺时针
        180 => img.rotate180(),
        270 => img.rotate270(),
        _   => img,              // 不支持的角度，返回原图
    };
    encode_to_base64(&rotated)
}
```

---

## 6. 常见问题

### Q1: 为什么 `ImageReader::new` 需要 `'static` 生命周期？

```rust
impl<R: BufRead + Seek + 'static> ImageReader<R> { ... }
```

`'static` 约束要求数据源必须在整个解码过程中有效。`Cursor<&[u8]>` 满足此约束只要内部的 `&[u8]` 引用在整个解码期间存活。在 WASM 场景中，JS 传入的 `Uint8Array` 由 wasm-bindgen 自动转换为 `&[u8]`，其生命周期覆盖整个函数调用——安全。

### Q2: `with_guessed_format()` vs `set_format()` 怎么选？

| 场景 | 方法 | 说明 |
|---|---|---|
| 用户上传任意图片 | `with_guessed_format()` | 自动检测，兼容性好 |
| 已知固定格式（如只处理 PNG） | `set_format(ImageFormat::Png)` | 跳过检测，更快 |
| 支持多种但想限制 | `with_guessed_format()?` + match | 检测后校验白名单 |

### Q3: Cursor 有内存开销吗？

没有额外数据拷贝。`Cursor` 只是一个结构体，包含一个引用（或所有权）加上一个 `u64` 的 position 字段，总共约 16 字节（8 字节指针 + 8 字节位置）。

```rust
// Cursor<&[u8]> 的内存布局示意
struct Cursor<&[u8]> {
    inner: &[u8],   // 8 字节：指向原始数据的胖指针（ptr + len = 16）
    pos: u64,       // 8 字节：当前读取位置
}
// 实际大小 ≈ 24 字节（在不同平台上略有差异）
```

### Q4: 大文件如何处理？

使用 `ImageReader` 的 `no_limits()` 可以解除默认安全限制：

```rust
ImageReader::new(Cursor::new(large_data))
    .no_limits()            // 移除内存/尺寸上限
    .with_guessed_format()?
    .decode()?
```

> ⚠️ 在浏览器 WASM 环境中慎用——恶意图片可能导致浏览器标签页 OOM 崩溃。

### Q5: Cursor 可以复用吗？

可以重置位置来复用：

```rust
let mut cursor = Cursor::new(data);
ImageReader::new(&mut cursor).with_guessed_format()?.decode()?;

// 重置位置，重新读取
cursor.seek(SeekFrom::Start(0));
ImageReader::new(&mut cursor).with_guessed_format()?;  // 再次使用
```

---

## 速查卡片

```
┌──────────────────────────────────────────────────┐
│  解码：bytes → DynamicImage                       │
│  ──────────────────────────────────────────────  │
│  ImageReader::new(Cursor::new(bytes))             │
│      .with_guessed_format()?                      │
│      .decode()?                                   │
│  → DynamicImage                                   │
├──────────────────────────────────────────────────┤
│  编码：DynamicImage → bytes (PNG)                 │
│  ──────────────────────────────────────────────  │
│  let mut buf = Cursor::new(Vec::new());           │
│  img.write_to(&mut buf, ImageFormat::Png)?;       │
│  let bytes = buf.into_inner();                    │
│  → Vec<u8>                                        │
├──────────────────────────────────────────────────┤
│  处理：DynamicImage → DynamicImage                │
│  ──────────────────────────────────────────────  │
│  img.grayscale()     → 灰度                       │
│  img.brighten(n)     → 亮度                       │
│  img.blur(sigma)     → 模糊                       │
│  img.fliph()         → 水平翻转                   │
│  img.flipv()         → 垂直翻转                   │
│  img.rotate90()      → 旋转                       │
│  img.resize(w,h,f)   → 缩放                       │
└──────────────────────────────────────────────────┘
```
