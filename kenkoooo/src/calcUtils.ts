export const sqDistance = (p: [number, number], q: [number, number]) => {
  const dx = BigInt(p[0] - q[0]);
  const dy = BigInt(p[1] - q[1]);
  return dx * dx + dy * dy;
};

export const absoluteBigInt = (a: bigint) => {
  if (a > BigInt(0)) {
    return a;
  } else {
    return -a;
  }
};

export const calcDislike = (hole: [number, number][]) => {};
