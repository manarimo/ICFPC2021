import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  BonusType,
  BonusTypes,
  parseUserInput,
  Problem,
  rotate90,
  Submission,
  submissionToFigure,
} from "../utils";
import {
  Alert,
  Container,
  Spinner,
  Row,
  Col,
  Button,
  Form,
} from "react-bootstrap";
import { SvgViewer } from "./SvgViewer";
import { EditorState } from "./EditorState";
import { PoseInfoPanel } from "./PoseInfoPanel";
import { SinglePointSolverPanel } from "./SinglePointSolverPanel";
import { useProblemData, useSolutionData } from "../API";
import ToggleButton from "react-bootstrap/ToggleButton";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import {
  getAvailableBonuses,
  getPossibleBonusSourceProblemId,
} from "../bonusInfo";
import { pushStack, redo, undo, UndoStack } from "../UndoStack";

const useSubmissionAndStack = (initialSubmission: Submission) => {
  const [{ stack: undoStack, submission: userSubmission }, setState] =
    useState<{
      stack: UndoStack;
      submission: Submission;
    }>({
      submission: initialSubmission,
      stack: {
        referenceIndex: 0,
        internalStack: [initialSubmission],
      },
    });

  const setUserSubmission = (newSubmission: Submission) => {
    const newStack = pushStack(undoStack, newSubmission);
    setState({
      stack: newStack,
      submission: newSubmission,
    });
  };
  const redoState = () => {
    const { stack: newStack, submission: newSubmission } = redo(undoStack);
    setState({
      stack: newStack,
      submission: newSubmission,
    });
  };
  const undoState = () => {
    const { stack: newStack, submission: newSubmission } = undo(undoStack);
    setState({
      stack: newStack,
      submission: newSubmission,
    });
  };
  return [userSubmission, setUserSubmission, redoState, undoState] as [
    Submission,
    (s: Submission) => void,
    () => void,
    () => void
  ];
};

interface SvgEditorProps {
  problem: Problem;
  problemId: number;
}
const SvgEditor = (props: SvgEditorProps) => {
  const { problem } = props;

  const availableBonusSet = getAvailableBonuses(props.problemId);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const solution = useSolutionData(params.get("solution"));
  const [bonusMode, setBonusMode] = useState<BonusType | "NONE">("NONE");

  const [design, setDesign] = useState<"single" | "triple">("triple");
  const [editorState, setEditState] = useState<EditorState | null>(null);

  const [userSubmission, setUserSubmission, redoState, undoState] =
    useSubmissionAndStack({
      vertices: [...problem.figure.vertices],
    });

  const [text, setText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slideSize, setSlideSize] = useState<number>(1);
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [breakALeg, setBreakALeg] = useState<boolean>(false);
  const [breakALegSrc, setBreakALegSrc] = useState<number>(0);
  const [breakALegDst, setBreakALegDst] = useState<number>(0);
  const [zoom, setZoom] = useState(false);
  const [zoomSize, setZoomSize] = useState(2000);
  const [wallHack, setWallHack] = useState(false);
  const [superFlex, setSuperFlex] = useState(false);
  const [globalistEnabled, setGlobalistEnabled] = useState(false);

  useEffect(() => {
    if (solution.data) {
      setUserSubmission(solution.data);
    }
  }, [solution]);

  useEffect(() => {
    setText(JSON.stringify(userSubmission));
    if (userSubmission.bonuses && userSubmission.bonuses.length > 0) {
      if (userSubmission.bonuses[0].bonus === "BREAK_A_LEG") {
        setBreakALeg(true);
        setBreakALegSrc(userSubmission.bonuses[0].edge[0]);
        setBreakALegDst(userSubmission.bonuses[0].edge[1]);
      } else if (userSubmission.bonuses[0].bonus === "WALLHACK") {
        setWallHack(true);
      } else if (userSubmission.bonuses[0].bonus === "GLOBALIST") {
        setGlobalistEnabled(true);
      } else if (userSubmission.bonuses[0].bonus === "SUPERFLEX") {
        setSuperFlex(true);
      }
    }
  }, [userSubmission]);

  const onCopyOutput = async () => {
    setText(JSON.stringify(userSubmission));
    await navigator.clipboard.writeText(JSON.stringify(userSubmission));
  };

  const onLoadInput = () => {
    const parseResult = parseUserInput(text);
    if (parseResult.result === "failed") {
      setErrorMessage(parseResult.errorMessage);
    } else {
      setUserSubmission(parseResult.submission);
      setErrorMessage(null);
    }
  };
  const toggleAVertex = (idx: number) => {
    if (selectedVertices.includes(idx)) {
      setSelectedVertices(selectedVertices.filter((v) => v !== idx));
    } else {
      setSelectedVertices([...selectedVertices, idx]);
    }
  };

  const isAllSelected = () =>
    selectedVertices.length === userSubmission.vertices.length;

  const toggleAllVertices = () => {
    if (isAllSelected()) {
      setSelectedVertices([]);
    } else {
      setSelectedVertices(userSubmission.vertices.map((_p, idx) => idx));
    }
  };

  const slideSelectedVertices = (dir: string) => {
    const dx = dir === "L" ? -1 : dir === "R" ? 1 : 0;
    const dy = dir === "D" ? 1 : dir === "U" ? -1 : 0;

    const newVertices = userSubmission.vertices.map(([x, y], idx) => {
      if (selectedVertices.includes(idx)) {
        return [x + dx * slideSize, y + dy * slideSize] as [number, number];
      } else {
        return [x, y] as [number, number];
      }
    });
    setUserSubmission({
      ...userSubmission,
      vertices: newVertices,
    });
  };

  const findBreakingLeg = (src: number, dst: number) => {
    return problem.figure.edges.find(
      ([i, j]) =>
        Math.min(i, j) === Math.min(src, dst) &&
        Math.max(i, j) === Math.max(src, dst)
    );
  };

  const canBreakALeg = () => {
    return !!findBreakingLeg(breakALegSrc, breakALegDst);
  };

  const cancelBreakALeg = () => {
    setUserSubmission({
      ...userSubmission,
      bonuses: [],
      vertices: userSubmission.vertices.slice(0, -1),
    });
  };

  const executeBreakALeg = (src: number, dst: number) => {
    const [sx, sy] = userSubmission.vertices[src];
    const [tx, ty] = userSubmission.vertices[dst];
    const mx = Math.floor((sx + tx) / 2);
    const my = Math.floor((sy + ty) / 2);
    if (!findBreakingLeg(src, dst)) {
      return;
    }

    setUserSubmission({
      ...userSubmission,
      bonuses: [
        {
          bonus: "BREAK_A_LEG",
          edge: [src, dst],
          problem: getPossibleBonusSourceProblemId(
            props.problemId,
            "BREAK_A_LEG"
          ),
        },
      ],
      vertices: [...userSubmission.vertices, [mx, my]],
    });
  };

  const updateVertices = (vertices: [number, number][]) => {
    setUserSubmission({
      ...userSubmission,
      vertices,
    });
  };

  const updateBreakALeg = (value: boolean) => {
    if (breakALeg && !value) {
      cancelBreakALeg();
      setBreakALeg(false);
      return;
    }
    if (canBreakALeg()) {
      executeBreakALeg(breakALegSrc, breakALegDst);
      setBreakALeg(true);
    }
  };

  const updateBreakALegSrc = (val: number) => {
    if (breakALeg) {
      return;
    }
    setBreakALegSrc(val);
  };

  const updateBreakALegDst = (val: number) => {
    if (breakALeg) {
      return;
    }
    setBreakALegDst(val);
  };

  const cancelBonus = () => {
    setUserSubmission({
      ...userSubmission,
      bonuses: [],
    });
  };

  const applyBonus = (bonus: Exclude<BonusType, "BREAK_A_LEG">) => {
    setUserSubmission({
      ...userSubmission,
      bonuses: [
        {
          bonus,
          problem: getPossibleBonusSourceProblemId(props.problemId, bonus),
        },
      ],
    });
  };

  const userFigure = submissionToFigure(userSubmission, problem);
  return (
    <Container>
      <Row style={{ marginBottom: "8px" }}>
        <Col>
          <ButtonGroup toggle>
            <ToggleButton
              type="checkbox"
              variant="secondary"
              value="single"
              checked={design === "single"}
              onChange={() => setDesign("single")}
            >
              1カラム
            </ToggleButton>
            <ToggleButton
              type="checkbox"
              variant="secondary"
              value="triple"
              checked={design === "triple"}
              onChange={() => setDesign("triple")}
            >
              3カラム
            </ToggleButton>
          </ButtonGroup>
        </Col>
        <Col>
          <div style={{ display: "flex" }}>
            <div>
              <Form.Check
                type="checkbox"
                label="Zoom"
                checked={zoom}
                onChange={() => {
                  setZoom(!zoom);
                }}
              />
            </div>
            <div>
              <Form.Control
                type="number"
                min={0}
                value={zoomSize}
                onChange={(e) => setZoomSize(parseInt(e.target.value))}
              />
            </div>
          </div>
        </Col>
        <Col>
          <ButtonGroup toggle>
            <ToggleButton
              type="checkbox"
              variant={"secondary"}
              value="single"
              checked={bonusMode === "NONE"}
              onChange={() => setBonusMode("NONE")}
            >
              NONE
            </ToggleButton>
            {BonusTypes.map((mode) => (
              <ToggleButton
                key={mode}
                type="checkbox"
                variant={availableBonusSet.has(mode) ? "success" : "secondary"}
                value="single"
                checked={bonusMode === mode}
                onChange={() => setBonusMode(mode)}
              >
                {mode}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Col>
      </Row>
      <Row>
        <Col sm={design === "single" ? 12 : undefined}>
          <SvgViewer
            userFigure={userFigure}
            problem={problem}
            onEdit={(pointId) => {
              if (!editorState) {
                setEditState({ pointId });
              }
            }}
            onLatticeTouch={([x, y]) => {
              if (editorState) {
                const pointId = editorState.pointId;
                const [curX, curY] = userSubmission.vertices[pointId];
                if (curX !== x || curY !== y) {
                  const newVertices = [...userSubmission.vertices];
                  newVertices[pointId] = [x, y];
                  setUserSubmission({
                    ...userSubmission,
                    vertices: newVertices,
                  });
                }
              }
            }}
            onMouseUp={() => {
              if (editorState) {
                setEditState(null);
              }
            }}
            onRedo={redoState}
            onUndo={undoState}
            editorState={editorState}
            selectedVertices={selectedVertices}
            forcedWidth={zoom ? zoomSize : undefined}
            updateVertices={updateVertices}
            bonusMode={
              wallHack
                ? "WallHack"
                : bonusMode === "GLOBALIST"
                ? "Globalist"
                : undefined
            }
          />
        </Col>
        <Col>
          <Row>
            <Button onClick={onLoadInput}>Load</Button>
            <Button onClick={onCopyOutput} className="ml-3">
              Copy
            </Button>
          </Row>
          {errorMessage && (
            <Row>
              <Alert variant="danger">{errorMessage}</Alert>
            </Row>
          )}
          <Row>
            <Form.Control
              as="textarea"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Row>
          {bonusMode === "BREAK_A_LEG" && (
            <Row>
              <Col>
                <Form.Check
                  type="checkbox"
                  label="Break A Leg"
                  checked={breakALeg}
                  disabled={!canBreakALeg()}
                  onChange={() => {
                    updateBreakALeg(!breakALeg);
                  }}
                />
              </Col>
              <Col>
                <Form.Control
                  type="number"
                  min={0}
                  max={problem.figure.vertices.length - 1}
                  value={breakALegSrc}
                  onChange={(e) => updateBreakALegSrc(parseInt(e.target.value))}
                />
              </Col>
              <Col>
                <Form.Control
                  type="number"
                  min={0}
                  max={problem.figure.vertices.length - 1}
                  value={breakALegDst}
                  onChange={(e) => updateBreakALegDst(parseInt(e.target.value))}
                />
              </Col>
            </Row>
          )}
          {bonusMode === "WALLHACK" && (
            <Col>
              <Form.Check
                type="checkbox"
                label="WallHack"
                checked={wallHack}
                onChange={() => {
                  if (wallHack) {
                    cancelBonus();
                    setWallHack(false);
                  } else {
                    applyBonus("WALLHACK");
                    setWallHack(true);
                  }
                }}
              />
            </Col>
          )}
          {bonusMode === "SUPERFLEX" && (
            <Col>
              <Form.Check
                type="checkbox"
                label="SuperFlex"
                checked={superFlex}
                onChange={() => {
                  if (superFlex) {
                    cancelBonus();
                    setSuperFlex(false);
                  } else {
                    applyBonus("SUPERFLEX");
                    setSuperFlex(true);
                  }
                }}
              />
            </Col>
          )}
          {bonusMode === "GLOBALIST" && (
            <Col>
              <Form.Check
                type="checkbox"
                label="Globalist"
                checked={globalistEnabled}
                onChange={() => {
                  if (globalistEnabled) {
                    cancelBonus();
                    setGlobalistEnabled(false);
                  } else {
                    applyBonus("GLOBALIST");
                    setGlobalistEnabled(true);
                  }
                }}
              />
            </Col>
          )}
          <Row>
            <Col>
              <Row>
                <Button onClick={() => slideSelectedVertices("L")}>L</Button>
                <div>
                  <div>
                    <Button onClick={() => slideSelectedVertices("U")}>
                      U
                    </Button>
                  </div>
                  <div>
                    <Button onClick={() => slideSelectedVertices("D")}>
                      D
                    </Button>
                  </div>
                </div>
                <Button onClick={() => slideSelectedVertices("R")}>R</Button>
              </Row>
            </Col>
            <Col>
              <Row>
                <Form.Control
                  type="number"
                  value={slideSize}
                  onChange={(e) => setSlideSize(parseInt(e.target.value))}
                />
              </Row>
            </Col>
          </Row>
          <Row>
            <div>
              <Form.Check inline>
                <Form.Check.Input
                  type="checkbox"
                  onChange={() => toggleAllVertices()}
                  checked={isAllSelected()}
                />
                <Form.Check.Label onChange={() => toggleAllVertices()}>
                  All
                </Form.Check.Label>
              </Form.Check>
              <Form>
                {userSubmission.vertices.map((_p, idx) => (
                  <Form.Check inline key={idx}>
                    <Form.Check.Input
                      type="checkbox"
                      onChange={() => toggleAVertex(idx)}
                      checked={selectedVertices.includes(idx)}
                    />
                    <Form.Check.Label onClick={() => toggleAVertex(idx)}>
                      {idx}
                    </Form.Check.Label>
                  </Form.Check>
                ))}
              </Form>
            </div>
          </Row>
          <Row>
            <Col>
              <SinglePointSolverPanel
                problem={problem}
                userFigure={userFigure}
                selectedVertices={selectedVertices}
                onSolve={(newVertices) => {
                  setUserSubmission({
                    ...userSubmission,
                    vertices: [...newVertices],
                  });
                }}
              />
            </Col>
            <Col>
              <Button
                onClick={() => {
                  const rotatedVertices = rotate90(userFigure.vertices);
                  setUserSubmission({
                    ...userSubmission,
                    vertices: [...rotatedVertices],
                  });
                }}
              >
                R90
              </Button>
            </Col>
          </Row>
        </Col>
        <Col className="ml-3">
          <Row>
            <PoseInfoPanel
              isWallHacking={wallHack}
              userFigure={userFigure}
              problem={problem}
              usingGlobalist={bonusMode === "GLOBALIST"}
            />
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export const ProblemPage = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const problem = useProblemData(problemId);

  if (problem.error) {
    console.error(problem.error);
    return <Alert variant="danger">{problem.error}</Alert>;
  }

  if (!problem.data) {
    return (
      <Spinner animation="border" role="status">
        <span className="sr-only">Loading...</span>
      </Spinner>
    );
  }

  return (
    <Container>
      <SvgEditor problem={problem.data} problemId={parseInt(problemId)} />
    </Container>
  );
};
