import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { parseUserInput, Problem } from "../utils";
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

interface SvgEditorProps {
  problem: Problem;
}
const SvgEditor = (props: SvgEditorProps) => {
  const { problem } = props;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const solution = useSolutionData(params.get("solution"));

  const [editorState, setEditState] = useState<EditorState | null>(null);
  const [userPose, setUserPose] = useState([...problem.figure.vertices]);
  const [text, setText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slideSize, setSlideSize] = useState<number>(1);
  const [selectedVertices, setSelectedVertices] = useState<number[]>([]);

  const getOutput = () => {
    return JSON.stringify({
      vertices: userPose,
    });
  };
  useEffect(() => {
    if (solution.data) {
      setUserPose([...solution.data.vertices]);
    }
  }, [solution]);
  useEffect(() => {
    setText(
      JSON.stringify({
        vertices: userPose,
      })
    );
  }, [userPose]);

  const onCopyOutput = async () => {
    setText(getOutput());
    await navigator.clipboard.writeText(getOutput());
  };
  const onLoadInput = () => {
    const parseResult = parseUserInput(text, userPose.length);
    if (parseResult.result === "failed") {
      setErrorMessage(parseResult.errorMessage);
    } else {
      setUserPose(parseResult.polygon);
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

  const isAllSelected = () => selectedVertices.length === userPose.length;

  const toggleAllVertices = () => {
    if (isAllSelected()) {
      setSelectedVertices([]);
    } else {
      setSelectedVertices(userPose.map((_p, idx) => idx));
    }
  };

  const slideSelectedVertices = (dir: string) => {
    const dx = dir === "L" ? -1 : dir === "R" ? 1 : 0;
    const dy = dir === "D" ? 1 : dir === "U" ? -1 : 0;
    setUserPose(
      userPose.map(([x, y], idx) => {
        if (selectedVertices.includes(idx)) {
          return [x + dx * slideSize, y + dy * slideSize];
        } else {
          return [x, y];
        }
      })
    );
  };

  return (
    <Container>
      <Row>
        <Col>
          <SvgViewer
            userPose={userPose}
            problem={problem}
            onEdit={(pointId) => {
              if (!editorState) {
                setEditState({ pointId });
              }
            }}
            onLatticeTouch={([x, y]) => {
              if (editorState) {
                const pointId = editorState.pointId;
                const [curX, curY] = userPose[pointId];
                if (curX !== x || curY !== y) {
                  const newPose = [...userPose];
                  newPose[pointId] = [x, y];
                  setUserPose(newPose);
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
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Row>
          <Row>
            <PoseInfoPanel userPose={userPose} problem={problem} />
          </Row>
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
                  onClick={() => toggleAllVertices()}
                  checked={isAllSelected()}
                />
                <Form.Check.Label onClick={() => toggleAllVertices()}>
                  All
                </Form.Check.Label>
              </Form.Check>
              <Form>
                {userPose.map((_p, idx) => (
                  <Form.Check inline>
                    <Form.Check.Input
                      type="checkbox"
                      onClick={() => toggleAVertex(idx)}
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
              userPose={userPose}
              selectedVertices={selectedVertices}
              onSolve={([x, y]) => {
                const target = selectedVertices[0];
                const newPose = [...userPose];
                newPose[target] = [x, y];
                setUserPose(newPose);
              }}
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
      <SvgEditor problem={problem.data} />
    </Container>
  );
};
