use qrcode::QrCode;
use qrcode::render::svg;
use wasm_bindgen::prelude::*;

/// 生成二维码 SVG
/// text: 编码内容; size_px: 输出边长(px); dark_color / light_color: CSS 颜色值
/// 返回 SVG 字符串（可直接嵌入 HTML）
#[wasm_bindgen]
pub fn qr_svg(text: &str, size_px: u32, dark_color: &str, light_color: &str) -> Result<String, JsValue> {
    let code = QrCode::new(text.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("QR 生成失败: {e}")))?;
    let dark = if dark_color.is_empty() { "#000000" } else { dark_color };
    let light = if light_color.is_empty() { "#ffffff" } else { light_color };
    let svg_str = code.render()
        .min_dimensions(size_px, size_px)
        .max_dimensions(size_px, size_px)
        .dark_color(svg::Color(dark))
        .light_color(svg::Color(light))
        .build();
    Ok(svg_str)
}
