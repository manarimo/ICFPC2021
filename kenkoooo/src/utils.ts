const BonusTypes = ["GLOBALIST", "BREAK_A_LEG", "WALLHACK"] as const;
export type BONUSTYPE = typeof BonusTypes[number];

export type Pair = [number, number];
export interface Bonus {
  bonus: BONUSTYPE;
  problem: number; //The ID of the problem in which this bonus can be used once it has been unlocked.
  position: Pair;
}

export interface Problem {
  hole: Pair[];
  epsilon: number;
  figure: Figure;
  bonuses: Bonus[];
}

export interface Figure {
  edges: Pair[];
  vertices: Pair[];
}

export interface Submission {
  vertices: Pair[];
  bonuses?: BonusSubmission[];
}

type BonusSubmission = BreakALegBonusSubmission | OtherBonusSubmission;

interface BreakALegBonusSubmission {
  bonus: "BREAK_A_LEG";
  edge: [number, number];

  // The ID of the problem in which this bonus has been unlocked
  // とりあえずフロントで読む分には無くてもええやろ
  problem?: number;
}

interface OtherBonusSubmission {
  bonus: "GLOBALIST" | "WALLHACK";

  // The ID of the problem in which this bonus has been unlocked
  // とりあえずフロントで読む分には無くてもええやろ
  problem?: number;
}

export const hasOwnProperty = <X extends {}, Y extends PropertyKey>(
  obj: X | null | undefined,
  prop: Y
): obj is X & Record<Y, unknown> => {
  return obj?.hasOwnProperty(prop) ?? false;
};

export const parseUserInput = (
  input: string
):
  | {
      result: "success";
      submission: Submission;
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

  const isBonus = (bonus: unknown): bonus is BonusSubmission => {
    if (typeof bonus !== "object" || !hasOwnProperty(bonus, "bonus")) {
      return false;
    }

    const bonusType = BonusTypes.find((t) => t === bonus.bonus);
    if (!bonusType) {
      return false;
    }

    if (bonusType === "BREAK_A_LEG") {
      return hasOwnProperty(bonus, "edge") && isPair(bonus.edge);
    } else {
      return true;
    }
  };

  const isArrayOf = <T>(
    array: unknown[],
    typeChek: (x: unknown) => x is T
  ): array is T[] => {
    return array.every((e) => typeChek(e));
  };

  try {
    const result: unknown = JSON.parse(input);
    if (
      !result ||
      typeof result !== "object" ||
      !hasOwnProperty(result, "vertices") ||
      typeof result.vertices !== "object" ||
      !Array.isArray(result.vertices) ||
      !isArrayOf<Pair>(result.vertices, isPair)
    ) {
      return {
        result: "failed",
        errorMessage: "`vertices` is not valid format",
      };
    }

    const vertices = result.vertices;
    if (!hasOwnProperty(result, "bonuses") || !Array.isArray(result.bonuses)) {
      return {
        result: "success",
        submission: { vertices },
      };
    }

    if (isArrayOf(result.bonuses, isBonus)) {
      return {
        result: "success",
        submission: { vertices, bonuses: result.bonuses },
      };
    } else {
      return {
        result: "failed",
        errorMessage: "invalid bonuses format",
      };
    }
  } catch (e) {
    console.error(e);
    return {
      result: "failed",
      errorMessage: "JSON parse error",
    };
  }
};

export const pairToPoint = (pair: [number, number]) => ({
  x: pair[0],
  y: pair[1],
});

export const submissionToFigure = (
  submission: Submission,
  problem: Problem
): Figure => {
  if (
    submission.bonuses &&
    submission.bonuses.length > 0 &&
    submission.bonuses[0].bonus === "BREAK_A_LEG"
  ) {
    const mid = problem.figure.vertices.length;
    const breakingLeg = submission.bonuses[0].edge;
    const nextEdges = problem.figure.edges.filter(
      (leg) =>
        Math.min(leg[0], leg[1]) !== Math.min(breakingLeg[0], breakingLeg[1]) ||
        Math.max(leg[0], leg[1]) !== Math.max(breakingLeg[0], breakingLeg[1])
    );
    nextEdges.push([breakingLeg[0], mid]);
    nextEdges.push([mid, breakingLeg[1]]);

    return {
      vertices: [...submission.vertices],
      edges: nextEdges,
    };
  } else {
    return {
      vertices: [...submission.vertices],
      edges: [...problem.figure.edges],
    };
  }
};
