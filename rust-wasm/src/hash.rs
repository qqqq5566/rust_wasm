use md5::Md5;
use sha2::{Sha256, Sha512, Digest};
use wasm_bindgen::prelude::*;

macro_rules! hash_fn {
    ($name:ident, $algo:ty, $desc:expr) => {
        #[doc = $desc]
        #[wasm_bindgen]
        pub fn $name(data: &[u8]) -> String {
            let mut hasher = <$algo>::new();
            hasher.update(data);
            format!("{:x}", hasher.finalize())
        }
    };
}

hash_fn!(hash_md5, Md5, "MD5 哈希（128-bit）— 仅用于数据校验，不用于安全场景");
hash_fn!(hash_sha256, Sha256, "SHA-256 哈希（256-bit）— 安全性好");
hash_fn!(hash_sha512, Sha512, "SHA-512 哈希（512-bit）— 最高安全性");

/// BLAKE3 哈希 — 比 SHA-256 快 10x，安全性相当
#[wasm_bindgen]
pub fn hash_blake3(data: &[u8]) -> String {
    blake3::hash(data).to_hex().to_string()
}
