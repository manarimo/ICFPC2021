import useSWR, { SWRConfiguration } from "swr";
import { Problem, Submission } from "./utils";

const API_SERVER = process.env.REACT_APP_API_SERVER;
const useSWRData = <T>(
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

export const useSolutionData = (solutionId: string | null) => {
  const url = `${API_SERVER}/../solutions/${solutionId}`;
  const fetcher = (url: string) =>
    solutionId
      ? fetch(url)
          .then((response) => response.json())
          .then((problem) => problem as Submission)
      : Promise.resolve(null);
  return useSWRData(url, fetcher);
};
