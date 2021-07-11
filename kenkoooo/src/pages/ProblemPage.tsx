import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  parseUserInput,
  Problem,
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

const BonusModes = ["NONE", "BREAK_A_LEG", "GLOBALIST", "WALLHACK"] as const;
type BonusMode = typeof BonusModes[number];

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
  const [bonusMode, setBonusMode] = useState<BonusMode>("NONE");

  const [design, setDesign] = useState<"single" | "triple">("triple");
  const [editorState, setEditState] = useState<EditorState | null>(null);

  const [userSubmission, setUserSubmission] = useState<Submission>({
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

  useEffect(() => {
    if (solution.data) {
      setUserSubmission(solution.data);
    }
  }, [solution, problem]);

  useEffect(() => {
    setText(JSON.stringify(userSubmission));
    if (
      userSubmission.bonuses &&
      userSubmission.bonuses.length > 0 &&
      userSubmission.bonuses[0].bonus === "BREAK_A_LEG"
    ) {
      setBreakALeg(true);
      setBreakALegSrc(userSubmission.bonuses[0].edge[0]);
      setBreakALegDst(userSubmission.bonuses[0].edge[1]);
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
                onChange={(e) => {
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
            {BonusModes.map((mode) => (
              <ToggleButton
                type="checkbox"
                variant="secondary"
                value="single"
                style={
                  mode !== "NONE" && availableBonusSet.has(mode)
                    ? {
                        backgroundColor: "green",
                      }
                    : {}
                }
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
            editorState={editorState}
            selectedVertices={selectedVertices}
            forcedWidth={zoom ? zoomSize : undefined}
            updateVertices={updateVertices}
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
                  onChange={(e) => {
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
          </Row>
        </Col>
        <Col className="ml-3">
          <Row>
            <PoseInfoPanel
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
