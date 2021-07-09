import useSWR, { SWRConfiguration } from "swr";

const API_SERVER = process.env.REACT_APP_API_SERVER;

export const useSWRData = <T>(
  url: string,
  fetcher: (url: string) => Promise<T>,
  config: SWRConfiguration<T> = {}
) => {
  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenHidden: true,
    ...config,
  });
};

export const useProblemData = (problemId: string) => {
  const url = `${API_SERVER}/${problemId}.json`;
  const fetcher = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((problem) => problem as Problem);
  return useSWRData(url, fetcher);
};

export interface Problem {
  hole: [number, number][];
  epsilon: number;
  figure: Figure;
}

export interface Figure {
  edges: [number, number][];
  vertices: [number, number][];
}
export const hasOwnProperty = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> => {
  return obj.hasOwnProperty(prop);
};

export const parseUserInput = (
  input: string,
  polygonSize: number
):
  | {
      result: "success";
      polygon: [number, number][];
    }
  | { result: "failed"; errorMessage: string } => {
  const isPair = (pair: unknown): pair is [number, number] => {
    return (
      typeof pair === "object" &&
      Array.isArray(pair) &&
      pair.length === 2 &&
      typeof pair[0] === "number" &&
      typeof pair[1] === "number"
    );
  };
  const isPolygon = (pairs: unknown[]): pairs is [number, number][] => {
    return pairs.every((pair) => isPair(pair));
  };

  try {
    const result: unknown = JSON.parse(input);
    if (
      result &&
      typeof result === "object" &&
      "vertices" in result &&
      hasOwnProperty(result, "vertices") &&
      typeof result.vertices === "object" &&
      Array.isArray(result.vertices) &&
      isPolygon(result.vertices) &&
      result.vertices.length === polygonSize
    ) {
      return {
        result: "success",
        polygon: result.vertices,
      };
    }
    return {
      result: "failed",
      errorMessage: "input is not valid format",
    };
  } catch (e) {
    console.error(e);
    return {
      result: "failed",
      errorMessage: "parse error",
    };
  }
};
