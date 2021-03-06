import { BonusType } from "./utils";
// https://docs.google.com/spreadsheets/d/1mYvl8AJRo-4DsGNv92sHBL0_Eg_7AsbH4-A_C3ltNVU/edit#gid=0
const FROM_TO_BONUSTYPE: [number, number, BonusType][] = [
  [37, 1, "SUPERFLEX"],
  [79, 1, "GLOBALIST"],
  [97, 1, "WALLHACK"],
  [82, 2, "GLOBALIST"],
  [95, 2, "BREAK_A_LEG"],
  [96, 2, "WALLHACK"],
  [103, 3, "BREAK_A_LEG"],
  [59, 3, "BREAK_A_LEG"],
  [69, 3, "WALLHACK"],
  [34, 4, "BREAK_A_LEG"],
  [57, 4, "GLOBALIST"],
  [64, 4, "WALLHACK"],
  [32, 5, "BREAK_A_LEG"],
  [44, 5, "WALLHACK"],
  [67, 5, "GLOBALIST"],
  [20, 6, "WALLHACK"],
  [8, 6, "BREAK_A_LEG"],
  [90, 6, "WALLHACK"],
  [104, 7, "SUPERFLEX"],
  [55, 7, "GLOBALIST"],
  [92, 7, "GLOBALIST"],
  [16, 8, "BREAK_A_LEG"],
  [31, 8, "WALLHACK"],
  [77, 8, "SUPERFLEX"],
  [122, 9, "WALLHACK"],
  [29, 9, "GLOBALIST"],
  [50, 9, "GLOBALIST"],
  [107, 10, "WALLHACK"],
  [30, 10, "BREAK_A_LEG"],
  [5, 10, "WALLHACK"],
  [48, 11, "BREAK_A_LEG"],
  [56, 11, "SUPERFLEX"],
  [73, 11, "BREAK_A_LEG"],
  [34, 12, "GLOBALIST"],
  [54, 12, "SUPERFLEX"],
  [7, 12, "GLOBALIST"],
  [34, 13, "GLOBALIST"],
  [48, 13, "SUPERFLEX"],
  [80, 13, "GLOBALIST"],
  [35, 14, "WALLHACK"],
  [57, 14, "SUPERFLEX"],
  [9, 14, "BREAK_A_LEG"],
  [37, 15, "BREAK_A_LEG"],
  [58, 15, "WALLHACK"],
  [76, 15, "SUPERFLEX"],
  [25, 16, "WALLHACK"],
  [46, 16, "GLOBALIST"],
  [6, 16, "GLOBALIST"],
  [21, 17, "GLOBALIST"],
  [4, 17, "BREAK_A_LEG"],
  [40, 17, "SUPERFLEX"],
  [23, 18, "BREAK_A_LEG"],
  [63, 18, "GLOBALIST"],
  [89, 18, "GLOBALIST"],
  [115, 19, "GLOBALIST"],
  [26, 19, "BREAK_A_LEG"],
  [55, 19, "GLOBALIST"],
  [11, 20, "GLOBALIST"],
  [13, 20, "GLOBALIST"],
  [61, 20, "BREAK_A_LEG"],
  [121, 21, "GLOBALIST"],
  [51, 21, "SUPERFLEX"],
  [63, 21, "BREAK_A_LEG"],
  [62, 22, "GLOBALIST"],
  [62, 22, "WALLHACK"],
  [99, 22, "GLOBALIST"],
  [131, 23, "BREAK_A_LEG"],
  [27, 23, "BREAK_A_LEG"],
  [91, 23, "SUPERFLEX"],
  [123, 24, "GLOBALIST"],
  [54, 24, "GLOBALIST"],
  [78, 24, "SUPERFLEX"],
  [128, 25, "BREAK_A_LEG"],
  [45, 25, "GLOBALIST"],
  [99, 25, "GLOBALIST"],
  [111, 26, "GLOBALIST"],
  [6, 26, "SUPERFLEX"],
  [87, 26, "GLOBALIST"],
  [47, 27, "SUPERFLEX"],
  [81, 27, "BREAK_A_LEG"],
  [88, 27, "BREAK_A_LEG"],
  [103, 28, "WALLHACK"],
  [46, 28, "BREAK_A_LEG"],
  [69, 28, "WALLHACK"],
  [32, 29, "BREAK_A_LEG"],
  [39, 29, "BREAK_A_LEG"],
  [52, 29, "WALLHACK"],
  [12, 30, "SUPERFLEX"],
  [25, 30, "BREAK_A_LEG"],
  [92, 30, "SUPERFLEX"],
  [11, 31, "BREAK_A_LEG"],
  [46, 31, "WALLHACK"],
  [66, 31, "GLOBALIST"],
  [16, 32, "GLOBALIST"],
  [19, 32, "GLOBALIST"],
  [72, 32, "SUPERFLEX"],
  [102, 33, "WALLHACK"],
  [19, 33, "WALLHACK"],
  [57, 33, "GLOBALIST"],
  [30, 34, "GLOBALIST"],
  [66, 34, "GLOBALIST"],
  [98, 34, "WALLHACK"],
  [1, 35, "GLOBALIST"],
  [75, 35, "SUPERFLEX"],
  [78, 35, "BREAK_A_LEG"],
  [28, 36, "GLOBALIST"],
  [49, 36, "BREAK_A_LEG"],
  [96, 36, "SUPERFLEX"],
  [105, 37, "GLOBALIST"],
  [23, 37, "SUPERFLEX"],
  [39, 37, "GLOBALIST"],
  [1, 38, "BREAK_A_LEG"],
  [53, 38, "GLOBALIST"],
  [63, 38, "WALLHACK"],
  [2, 39, "BREAK_A_LEG"],
  [77, 39, "GLOBALIST"],
  [93, 39, "BREAK_A_LEG"],
  [101, 40, "WALLHACK"],
  [43, 40, "WALLHACK"],
  [72, 40, "GLOBALIST"],
  [15, 41, "GLOBALIST"],
  [60, 41, "GLOBALIST"],
  [73, 41, "GLOBALIST"],
  [119, 42, "GLOBALIST"],
  [65, 42, "BREAK_A_LEG"],
  [67, 42, "SUPERFLEX"],
  [109, 43, "SUPERFLEX"],
  [47, 43, "BREAK_A_LEG"],
  [81, 43, "WALLHACK"],
  [127, 44, "GLOBALIST"],
  [53, 44, "BREAK_A_LEG"],
  [83, 44, "GLOBALIST"],
  [40, 45, "GLOBALIST"],
  [67, 45, "GLOBALIST"],
  [95, 45, "SUPERFLEX"],
  [13, 46, "GLOBALIST"],
  [76, 46, "SUPERFLEX"],
  [84, 46, "BREAK_A_LEG"],
  [27, 47, "SUPERFLEX"],
  [35, 47, "GLOBALIST"],
  [55, 47, "WALLHACK"],
  [42, 48, "WALLHACK"],
  [45, 48, "SUPERFLEX"],
  [85, 48, "BREAK_A_LEG"],
  [11, 49, "GLOBALIST"],
  [20, 49, "GLOBALIST"],
  [65, 49, "WALLHACK"],
  [1, 50, "WALLHACK"],
  [56, 50, "GLOBALIST"],
  [6, 50, "SUPERFLEX"],
  [106, 51, "SUPERFLEX"],
  [75, 51, "BREAK_A_LEG"],
  [86, 51, "BREAK_A_LEG"],
  [125, 52, "WALLHACK"],
  [45, 52, "WALLHACK"],
  [84, 52, "GLOBALIST"],
  [14, 53, "GLOBALIST"],
  [33, 53, "BREAK_A_LEG"],
  [90, 53, "GLOBALIST"],
  [41, 54, "GLOBALIST"],
  [70, 54, "WALLHACK"],
  [91, 54, "SUPERFLEX"],
  [52, 55, "GLOBALIST"],
  [59, 55, "SUPERFLEX"],
  [86, 55, "SUPERFLEX"],
  [124, 56, "WALLHACK"],
  [74, 56, "SUPERFLEX"],
  [78, 56, "BREAK_A_LEG"],
  [117, 57, "GLOBALIST"],
  [14, 57, "BREAK_A_LEG"],
  [85, 57, "SUPERFLEX"],
  [104, 58, "BREAK_A_LEG"],
  [29, 58, "GLOBALIST"],
  [47, 58, "SUPERFLEX"],
  [100, 59, "SUPERFLEX"],
  [3, 59, "WALLHACK"],
  [88, 59, "GLOBALIST"],
  [3, 60, "GLOBALIST"],
  [59, 60, "WALLHACK"],
  [9, 60, "SUPERFLEX"],
  [126, 61, "BREAK_A_LEG"],
  [70, 61, "BREAK_A_LEG"],
  [97, 61, "WALLHACK"],
  [10, 62, "GLOBALIST"],
  [65, 62, "GLOBALIST"],
  [79, 62, "BREAK_A_LEG"],
  [120, 63, "WALLHACK"],
  [4, 63, "BREAK_A_LEG"],
  [83, 63, "SUPERFLEX"],
  [22, 64, "WALLHACK"],
  [76, 64, "BREAK_A_LEG"],
  [9, 64, "GLOBALIST"],
  [18, 65, "GLOBALIST"],
  [28, 65, "GLOBALIST"],
  [54, 65, "BREAK_A_LEG"],
  [102, 66, "WALLHACK"],
  [43, 66, "BREAK_A_LEG"],
  [49, 66, "WALLHACK"],
  [12, 67, "BREAK_A_LEG"],
  [17, 67, "BREAK_A_LEG"],
  [22, 67, "GLOBALIST"],
  [105, 68, "SUPERFLEX"],
  [17, 68, "SUPERFLEX"],
  [58, 68, "GLOBALIST"],
  [12, 69, "WALLHACK"],
  [68, 69, "BREAK_A_LEG"],
  [81, 69, "SUPERFLEX"],
  [130, 70, "BREAK_A_LEG"],
  [50, 70, "GLOBALIST"],
  [69, 70, "GLOBALIST"],
  [19, 71, "SUPERFLEX"],
  [33, 71, "BREAK_A_LEG"],
  [51, 71, "BREAK_A_LEG"],
  [18, 72, "GLOBALIST"],
  [32, 72, "BREAK_A_LEG"],
  [51, 72, "GLOBALIST"],
  [21, 73, "BREAK_A_LEG"],
  [24, 73, "BREAK_A_LEG"],
  [44, 73, "WALLHACK"],
  [16, 74, "BREAK_A_LEG"],
  [22, 74, "GLOBALIST"],
  [62, 74, "SUPERFLEX"],
  [31, 75, "GLOBALIST"],
  [36, 75, "GLOBALIST"],
  [82, 75, "SUPERFLEX"],
  [10, 76, "GLOBALIST"],
  [38, 76, "GLOBALIST"],
  [48, 76, "SUPERFLEX"],
  [112, 77, "GLOBALIST"],
  [26, 77, "SUPERFLEX"],
  [74, 77, "BREAK_A_LEG"],
  [15, 78, "SUPERFLEX"],
  [26, 78, "WALLHACK"],
  [5, 78, "BREAK_A_LEG"],
  [42, 79, "BREAK_A_LEG"],
  [60, 79, "GLOBALIST"],
  [8, 79, "WALLHACK"],
  [24, 80, "WALLHACK"],
  [28, 80, "SUPERFLEX"],
  [60, 80, "GLOBALIST"],
  [2, 81, "BREAK_A_LEG"],
  [3, 81, "GLOBALIST"],
  [75, 81, "BREAK_A_LEG"],
  [25, 82, "GLOBALIST"],
  [36, 82, "BREAK_A_LEG"],
  [41, 82, "SUPERFLEX"],
  [64, 83, "WALLHACK"],
  [77, 83, "GLOBALIST"],
  [79, 83, "WALLHACK"],
  [101, 84, "BREAK_A_LEG"],
  [17, 84, "GLOBALIST"],
  [38, 84, "WALLHACK"],
  [10, 85, "SUPERFLEX"],
  [100, 85, "SUPERFLEX"],
  [64, 85, "GLOBALIST"],
  [114, 86, "BREAK_A_LEG"],
  [73, 86, "BREAK_A_LEG"],
  [93, 86, "GLOBALIST"],
  [2, 87, "GLOBALIST"],
  [71, 87, "BREAK_A_LEG"],
  [85, 87, "GLOBALIST"],
  [13, 88, "BREAK_A_LEG"],
  [43, 88, "BREAK_A_LEG"],
  [44, 88, "BREAK_A_LEG"],
  [105, 89, "SUPERFLEX"],
  [116, 89, "BREAK_A_LEG"],
  [71, 89, "GLOBALIST"],
  [113, 90, "SUPERFLEX"],
  [56, 90, "WALLHACK"],
  [93, 90, "GLOBALIST"],
  [50, 91, "WALLHACK"],
  [94, 91, "WALLHACK"],
  [99, 91, "BREAK_A_LEG"],
  [102, 92, "GLOBALIST"],
  [4, 92, "BREAK_A_LEG"],
  [41, 92, "WALLHACK"],
  [80, 93, "WALLHACK"],
  [91, 93, "GLOBALIST"],
  [98, 93, "WALLHACK"],
  [106, 94, "BREAK_A_LEG"],
  [15, 94, "GLOBALIST"],
  [86, 94, "SUPERFLEX"],
  [7, 95, "BREAK_A_LEG"],
  [89, 95, "SUPERFLEX"],
  [96, 95, "BREAK_A_LEG"],
  [100, 96, "WALLHACK"],
  [132, 96, "WALLHACK"],
  [36, 96, "BREAK_A_LEG"],
  [118, 97, "GLOBALIST"],
  [20, 97, "GLOBALIST"],
  [98, 97, "GLOBALIST"],
  [101, 98, "SUPERFLEX"],
  [129, 98, "WALLHACK"],
  [61, 98, "SUPERFLEX"],
  [68, 99, "SUPERFLEX"],
  [84, 99, "SUPERFLEX"],
  [92, 99, "BREAK_A_LEG"],
  [39, 100, "BREAK_A_LEG"],
  [87, 100, "BREAK_A_LEG"],
  [97, 100, "GLOBALIST"],
  [38, 101, "SUPERFLEX"],
  [83, 101, "SUPERFLEX"],
  [95, 101, "BREAK_A_LEG"],
  [110, 102, "SUPERFLEX"],
  [68, 102, "WALLHACK"],
  [94, 102, "BREAK_A_LEG"],
  [66, 103, "SUPERFLEX"],
  [70, 103, "WALLHACK"],
  [89, 103, "BREAK_A_LEG"],
  [103, 104, "GLOBALIST"],
  [106, 104, "BREAK_A_LEG"],
  [49, 104, "BREAK_A_LEG"],
  [104, 105, "SUPERFLEX"],
  [30, 105, "SUPERFLEX"],
  [8, 105, "BREAK_A_LEG"],
  [58, 106, "BREAK_A_LEG"],
  [87, 106, "SUPERFLEX"],
  [90, 106, "SUPERFLEX"],
  [112, 107, "SUPERFLEX"],
  [124, 107, "GLOBALIST"],
  [27, 107, "WALLHACK"],
  [109, 108, "BREAK_A_LEG"],
  [112, 108, "SUPERFLEX"],
  [82, 108, "BREAK_A_LEG"],
  [121, 109, "GLOBALIST"],
  [131, 109, "SUPERFLEX"],
  [40, 109, "WALLHACK"],
  [108, 110, "BREAK_A_LEG"],
  [129, 110, "SUPERFLEX"],
  [5, 110, "BREAK_A_LEG"],
  [117, 111, "WALLHACK"],
  [119, 111, "BREAK_A_LEG"],
  [21, 111, "BREAK_A_LEG"],
  [113, 112, "GLOBALIST"],
  [127, 112, "BREAK_A_LEG"],
  [80, 112, "SUPERFLEX"],
  [123, 113, "SUPERFLEX"],
  [127, 113, "SUPERFLEX"],
  [52, 113, "SUPERFLEX"],
  [122, 114, "BREAK_A_LEG"],
  [123, 114, "BREAK_A_LEG"],
  [29, 114, "BREAK_A_LEG"],
  [109, 115, "GLOBALIST"],
  [122, 115, "GLOBALIST"],
  [7, 115, "WALLHACK"],
  [114, 116, "WALLHACK"],
  [118, 116, "GLOBALIST"],
  [53, 116, "GLOBALIST"],
  [111, 117, "BREAK_A_LEG"],
  [116, 117, "SUPERFLEX"],
  [72, 117, "SUPERFLEX"],
  [117, 118, "WALLHACK"],
  [119, 118, "WALLHACK"],
  [14, 118, "GLOBALIST"],
  [128, 119, "GLOBALIST"],
  [130, 119, "BREAK_A_LEG"],
  [37, 119, "BREAK_A_LEG"],
  [116, 120, "GLOBALIST"],
  [124, 120, "BREAK_A_LEG"],
  [71, 120, "WALLHACK"],
  [108, 121, "WALLHACK"],
  [120, 121, "SUPERFLEX"],
  [74, 121, "WALLHACK"],
  [115, 122, "BREAK_A_LEG"],
  [126, 122, "WALLHACK"],
  [94, 122, "SUPERFLEX"],
  [113, 123, "SUPERFLEX"],
  [132, 123, "SUPERFLEX"],
  [88, 123, "BREAK_A_LEG"],
  [128, 124, "BREAK_A_LEG"],
  [131, 124, "SUPERFLEX"],
  [23, 124, "BREAK_A_LEG"],
  [107, 125, "SUPERFLEX"],
  [108, 125, "GLOBALIST"],
  [129, 125, "BREAK_A_LEG"],
  [111, 126, "WALLHACK"],
  [125, 126, "GLOBALIST"],
  [35, 126, "WALLHACK"],
  [121, 127, "SUPERFLEX"],
  [130, 127, "GLOBALIST"],
  [42, 127, "SUPERFLEX"],
  [110, 128, "WALLHACK"],
  [114, 128, "GLOBALIST"],
  [24, 128, "GLOBALIST"],
  [126, 129, "SUPERFLEX"],
  [132, 129, "WALLHACK"],
  [18, 129, "GLOBALIST"],
  [107, 130, "BREAK_A_LEG"],
  [125, 130, "GLOBALIST"],
  [31, 130, "SUPERFLEX"],
  [110, 131, "GLOBALIST"],
  [115, 131, "SUPERFLEX"],
  [33, 131, "GLOBALIST"],
  [118, 132, "BREAK_A_LEG"],
  [120, 132, "SUPERFLEX"],
  [61, 132, "GLOBALIST"],
];

// ????????????????????????????????????????????????????????????????????????????????????
// ???????????????????????????????????????????????????????????????????????????????????????????????????
export const getPossibleBonusSourceProblemId = (
  problemId: number,
  bonusType: BonusType
) => {
  const candidate = FROM_TO_BONUSTYPE.find(
    ([_from, to, bt]) => problemId === to && bt === bonusType
  );
  if (!candidate) {
    return -1;
  }
  return candidate[0];
};

export const getAvailableBonuses = (problemId: number) => {
  const candidates = FROM_TO_BONUSTYPE.filter(
    ([_from, to, _bt]) => problemId === to
  ).map(([_from, _to, bonusType]) => bonusType);
  return new Set(candidates);
};
