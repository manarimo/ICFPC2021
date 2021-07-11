import { Submission } from "./utils";

export interface UndoStack {
  referenceIndex: number;
  internalStack: Submission[];
}

export const pushStack = (
  stack: UndoStack,
  submission: Submission
): UndoStack => {
  const copied: Submission = JSON.parse(JSON.stringify(submission));
  const newStack = [
    ...stack.internalStack.slice(0, stack.referenceIndex + 1),
    copied,
  ];
  return {
    referenceIndex: newStack.length - 1,
    internalStack: newStack,
  };
};

export const undo = (stack: UndoStack) => {
  const referenceIndex = Math.max(stack.referenceIndex - 1, 0);
  return {
    stack: {
      ...stack,
      referenceIndex,
    },
    submission: stack.internalStack[referenceIndex],
  };
};

export const redo = (stack: UndoStack) => {
  const referenceIndex = Math.min(
    stack.internalStack.length - 1,
    stack.referenceIndex + 1
  );
  return {
    stack: {
      ...stack,
      referenceIndex,
    },
    submission: stack.internalStack[referenceIndex],
  };
};
