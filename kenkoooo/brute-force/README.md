# 伯爵の bruteforce を Rust に移植したやつ

## 全部並列で計算する（おそらく終わらない）
```sh
cargo run --release --bin zenbu-heiretsu -- [問題保存先ディレクトリ] [出力保存先ディレクトリ]

# 例
cargo run --release --bin zenbu-heiretsu -- ../../problems ../../solutions/kenkoooo-bruteforce
```

## 既にある解答の指定した点を固定して計算するやつ

(coming soon)