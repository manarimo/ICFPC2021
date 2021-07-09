export const wasmTest = async (x: number) => {
  const module = await import("./wasm-rust/build");
  return module.test_fun(x);
};
