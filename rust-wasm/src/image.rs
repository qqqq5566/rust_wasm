use base64::Engine;
use image::{DynamicImage, ImageFormat, ImageReader};
use image::codecs::jpeg::JpegEncoder;
use image::imageops::{self, FilterType};
use std::io::Cursor;
use wasm_bindgen::prelude::*;

// --- 辅助函数 ---

fn decode_image(data: &[u8]) -> Result<DynamicImage, JsValue> {
    ImageReader::new(Cursor::new(data))
        .with_guessed_format()
        .map_err(|e| JsValue::from_str(&format!("无法识别图片格式: {e}")))?
        .decode()
        .map_err(|e| JsValue::from_str(&format!("图片解码失败: {e}")))
}

fn encode_to_base64(img: &DynamicImage) -> Result<String, JsValue> {
    let mut buf = Cursor::new(Vec::new());
    img.write_to(&mut buf, ImageFormat::Png)
        .map_err(|e| JsValue::from_str(&format!("编码失败: {e}")))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(buf.into_inner()))
}

fn encode_as_format(img: &DynamicImage, format: u8, quality: u8) -> Result<String, JsValue> {
    let mut buf = Vec::new();
    let (mime, data_url_prefix) = match format {
        0 => {
            img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
                .map_err(|e| JsValue::from_str(&format!("PNG 编码失败: {e}")))?;
            ("image/png", "data:image/png;base64,")
        }
        1 => {
            let q = if quality == 0 { 85 } else { quality };
            let mut encoder = JpegEncoder::new_with_quality(&mut buf, q);
            encoder.encode_image(img)
                .map_err(|e| JsValue::from_str(&format!("JPEG 编码失败: {e}")))?;
            ("image/jpeg", "data:image/jpeg;base64,")
        }
        _ => {
            img.write_to(&mut Cursor::new(&mut buf), ImageFormat::WebP)
                .map_err(|e| JsValue::from_str(&format!("WebP 编码失败: {e}")))?;
            ("image/webp", "data:image/webp;base64,")
        }
    };
    let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
    Ok(format!(r#"{{"mime":"{mime}","base64":"{b64}","dataUrl":"{data_url_prefix}{b64}"}}"#))
}

fn to_filter(n: u8) -> FilterType {
    match n {
        0 => FilterType::Nearest,
        1 => FilterType::Triangle,
        2 => FilterType::CatmullRom,
        3 => FilterType::Gaussian,
        _ => FilterType::Lanczos3,
    }
}

// ================================================================
//  图片信息
// ================================================================

#[wasm_bindgen]
pub fn get_info(data: &[u8]) -> Result<JsValue, JsValue> {
    let img = decode_image(data)?;
    let (w, h) = (img.width(), img.height());
    let color = img.color();
    let reader = ImageReader::new(Cursor::new(data))
        .with_guessed_format()
        .map_err(|e| JsValue::from_str(&format!("无法识别格式: {e}")))?;
    let format_name = match reader.format() {
        Some(ImageFormat::Png) => "PNG",
        Some(ImageFormat::Jpeg) => "JPEG",
        Some(ImageFormat::Gif) => "GIF",
        Some(ImageFormat::WebP) => "WebP",
        Some(ImageFormat::Bmp) => "BMP",
        _ => "未知",
    };
    let info = format!(
        r#"{{"width":{w},"height":{h},"format":"{format_name}","colorMode":"{color:?}","fileSize":{}}}"#,
        data.len()
    );
    Ok(JsValue::from_str(&info))
}

// ================================================================
//  🎨 滤镜
// ================================================================

#[wasm_bindgen]
pub fn grayscale(data: &[u8]) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.grayscale())
}

#[wasm_bindgen]
pub fn invert(data: &[u8]) -> Result<String, JsValue> {
    let mut img = decode_image(data)?;
    img.invert();
    encode_to_base64(&img)
}

#[wasm_bindgen]
pub fn sepia(data: &[u8]) -> Result<String, JsValue> {
    let img = decode_image(data)?;
    let rgba = img.to_rgba8();
    let (w, h) = rgba.dimensions();
    let mut out = image::RgbaImage::new(w, h);
    for (x, y, p) in rgba.enumerate_pixels() {
        let (r, g, b) = (p[0] as f32, p[1] as f32, p[2] as f32);
        out.put_pixel(x, y, image::Rgba([
            (r * 0.393 + g * 0.769 + b * 0.189).min(255.0) as u8,
            (r * 0.349 + g * 0.686 + b * 0.168).min(255.0) as u8,
            (r * 0.272 + g * 0.534 + b * 0.131).min(255.0) as u8,
            p[3],
        ]));
    }
    encode_to_base64(&DynamicImage::ImageRgba8(out))
}

#[wasm_bindgen]
pub fn huerotate(data: &[u8], deg: i32) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.huerotate(deg))
}

#[wasm_bindgen]
pub fn edge_detect(data: &[u8]) -> Result<String, JsValue> {
    let img = decode_image(data)?.grayscale();
    let sobel_x = [-1.0_f32, -2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0];
    let edges_x = img.filter3x3(&sobel_x);
    let sobel_y = [-1.0_f32, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0];
    let edges_y = DynamicImage::ImageLuma8(img.to_luma8()).filter3x3(&sobel_y);
    let ex = edges_x.to_luma8();
    let ey = edges_y.to_luma8();
    let (w, h) = ex.dimensions();
    let mut combined = image::GrayImage::new(w, h);
    for y in 0..h {
        for x in 0..w {
            let gx = ex.get_pixel(x, y).0[0] as f32;
            let gy = ey.get_pixel(x, y).0[0] as f32;
            let mag = (gx * gx + gy * gy).sqrt().min(255.0) as u8;
            combined.put_pixel(x, y, image::Luma([mag]));
        }
    }
    encode_to_base64(&DynamicImage::ImageLuma8(combined))
}

#[wasm_bindgen]
pub fn emboss(data: &[u8]) -> Result<String, JsValue> {
    let img = decode_image(data)?.grayscale();
    let kernel = [-2.0_f32, -1.0, 0.0, -1.0, 1.0, 1.0, 0.0, 1.0, 2.0];
    encode_to_base64(&img.filter3x3(&kernel))
}

#[wasm_bindgen]
pub fn unsharpen(data: &[u8], sigma: f32, threshold: i32) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.unsharpen(sigma, threshold))
}

#[wasm_bindgen]
pub fn blur(data: &[u8], sigma: f32) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.blur(sigma))
}

// ================================================================
//  ✂ 几何变换
// ================================================================

#[wasm_bindgen]
pub fn flip_horizontal(data: &[u8]) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.fliph())
}

#[wasm_bindgen]
pub fn flip_vertical(data: &[u8]) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.flipv())
}

#[wasm_bindgen]
pub fn rotate(data: &[u8], deg: u32) -> Result<String, JsValue> {
    let img = decode_image(data)?;
    let rotated = match deg { 90 => img.rotate90(), 180 => img.rotate180(), 270 => img.rotate270(), _ => img };
    encode_to_base64(&rotated)
}

#[wasm_bindgen]
pub fn resize(data: &[u8], width: u32, height: u32, filter: u8) -> Result<String, JsValue> {
    let img = decode_image(data)?;
    let (w, h) = match (width, height) {
        (0, 0) => (img.width(), img.height()),
        (0, h) => { let r = h as f64 / img.height() as f64; ((img.width() as f64 * r) as u32, h) }
        (w, 0) => { let r = w as f64 / img.width() as f64; (w, (img.height() as f64 * r) as u32) }
        (w, h) => (w, h),
    };
    encode_to_base64(&img.resize_exact(w, h, to_filter(filter)))
}

#[wasm_bindgen]
pub fn thumbnail(data: &[u8], max_side: u32) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.thumbnail(max_side, max_side))
}

#[wasm_bindgen]
pub fn crop(data: &[u8], x: u32, y: u32, mut w: u32, mut h: u32) -> Result<String, JsValue> {
    let img = decode_image(data)?;
    let (iw, ih) = (img.width(), img.height());
    let x = x.min(iw.saturating_sub(1));
    let y = y.min(ih.saturating_sub(1));
    w = w.min(iw - x).max(1);
    h = h.min(ih - y).max(1);
    encode_to_base64(&img.crop_imm(x, y, w, h))
}

#[wasm_bindgen]
pub fn pixelate(data: &[u8], block_size: u32) -> Result<String, JsValue> {
    let img = decode_image(data)?;
    let block = block_size.max(1);
    let (w, h) = (img.width(), img.height());
    let small = imageops::resize(&img, (w / block).max(1), (h / block).max(1), FilterType::Nearest);
    let result = imageops::resize(&small, w, h, FilterType::Nearest);
    encode_to_base64(&DynamicImage::ImageRgba8(result))
}

// ================================================================
//  📐 调整
// ================================================================

#[wasm_bindgen]
pub fn brighten(data: &[u8], amount: i32) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.brighten(amount))
}

#[wasm_bindgen]
pub fn adjust_contrast(data: &[u8], contrast: f32) -> Result<String, JsValue> {
    encode_to_base64(&decode_image(data)?.adjust_contrast(contrast))
}

// ================================================================
//  💾 导出
// ================================================================

#[wasm_bindgen]
pub fn encode_as(data: &[u8], format: u8, quality: u8) -> Result<JsValue, JsValue> {
    let img = decode_image(data)?;
    Ok(JsValue::from_str(&encode_as_format(&img, format, quality)?))
}
