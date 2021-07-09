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
