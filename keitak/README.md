ランダムサブセットサムジェネレーター

src/sticks2.tsがコード

実行は
`yarn tsc -w`
でJS生成
`node dist/sticks2.js`
で実行

X軸で、整数をEDGE_MINからEDGE_MAXまでランダムに生成。（最後のあまりはその範囲内とは限らない）
その整数を使って、＋ーのサブセットサム

Y軸は１。これによりX軸のサブセットサムのNを大きくする。

WIDTHがもとのFigureの幅。
今の所頂点数を正確に指定はできない。
