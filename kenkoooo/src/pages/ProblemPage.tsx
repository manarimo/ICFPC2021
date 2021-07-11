import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Figure, parseUserInput, Problem } from "../utils";
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

const BonusModes = ["NONE", "BREAK_A_LEG", "GLOBALIST", "WALLHACK"] as const;
type BonusMode = typeof BonusModes[number];

interface SvgEditorProps {
  problem: Problem;
}
const SvgEditor = (props: SvgEditorProps) => {
  const { problem } = props;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const solution = useSolutionData(params.get("solution"));
  const [bonusMode, setBonusMode] = useState<BonusMode>("NONE");

  const [design, setDesign] = useState<"single" | "triple">("triple");
  const [editorState, setEditState] = useState<EditorState | null>(null);
  const [userFigure, setUserFigure] = useState<Figure>({
    vertices: [...problem.figure.vertices],
    edges: [...problem.figure.edges],
  });
  const [text, setText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slideSize, setSlideSize] = useState<number>(1);
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);
  const [breakALeg, setBreakALeg] = useState<boolean>(false);
  const [breakALegSrc, setBreakALegSrc] = useState<number>(0);
  const [breakALegDst, setBreakALegDst] = useState<number>(0);

  const getOutput = () => {
    return JSON.stringify({
      vertices: userFigure.vertices,
    });
  };
  useEffect(() => {
    if (solution.data) {
      setUserFigure({
        edges: [...userFigure.edges],
        vertices: [...solution.data.vertices],
      });
    }
  }, [solution, userFigure]);
  useEffect(() => {
    setText(
      JSON.stringify({
        vertices: userFigure.vertices,
      })
    );
  }, [userFigure]);

  const onCopyOutput = async () => {
    setText(getOutput());
    await navigator.clipboard.writeText(getOutput());
  };
  const onLoadInput = () => {
    const parseResult = parseUserInput(text, userFigure.vertices.length);
    if (parseResult.result === "failed") {
      setErrorMessage(parseResult.errorMessage);
    } else {
      setUserFigure({
        edges: [...userFigure.edges],
        vertices: parseResult.polygon,
      });
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
    selectedVertices.length === userFigure.vertices.length;

  const toggleAllVertices = () => {
    if (isAllSelected()) {
      setSelectedVertices([]);
    } else {
      setSelectedVertices(userFigure.vertices.map((_p, idx) => idx));
    }
  };

  const slideSelectedVertices = (dir: string) => {
    const dx = dir === "L" ? -1 : dir === "R" ? 1 : 0;
    const dy = dir === "D" ? 1 : dir === "U" ? -1 : 0;
    setUserFigure({
      edges: [...userFigure.edges],
      vertices: userFigure.vertices.map(([x, y], idx) => {
        if (selectedVertices.includes(idx)) {
          return [x + dx * slideSize, y + dy * slideSize];
        } else {
          return [x, y];
        }
      }),
    });
  };

  const canBreakALeg = () => {
    return !!problem.figure.edges.find(
      ([i, j]) =>
        Math.min(i, j) === Math.min(breakALegSrc, breakALegDst) &&
        Math.max(i, j) === Math.max(breakALegSrc, breakALegDst)
    );
  };

  const updateBreakALeg = (value: boolean) => {
    if (breakALeg && !value) {
      setBreakALeg(false);
      return;
    }
    if (canBreakALeg()) {
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

  const BreakALegPanel = () => (
    <Row>
      <Col>
        <Form.Check
          type="checkbox"
          label="Break A Leg"
          checked={breakALeg}
          disabled={!canBreakALeg()}
          onChange={(e) => updateBreakALeg(e.target.value === "true")}
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
  );
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
          <ButtonGroup toggle>
            {BonusModes.map((mode) => (
              <ToggleButton
                type="checkbox"
                variant="secondary"
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
                const [curX, curY] = userFigure.vertices[pointId];
                if (curX !== x || curY !== y) {
                  const newPose = [...userFigure.vertices];
                  newPose[pointId] = [x, y];
                  setUserFigure({
                    edges: [...userFigure.edges],
                    vertices: newPose,
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
          {bonusMode === "BREAK_A_LEG" && <BreakALegPanel />}
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
                {userFigure.vertices.map((_p, idx) => (
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
              onSolve={(newPose) => {
                setUserFigure({
                  vertices: [...newPose],
                  edges: [...userFigure.edges],
                });
              }}
            />
          </Row>
        </Col>
        <Col className="ml-3">
          <Row>
            <PoseInfoPanel userFigure={userFigure} problem={problem} />
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
      <SvgEditor problem={problem.data} />
    </Container>
  );
};
