import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { hasOwnProperty, Problem, useProblemData } from "../utils";
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

const parseUserInput = (
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

interface SvgEditorProps {
  problem: Problem;
}
const SvgEditor = (props: SvgEditorProps) => {
  const { problem } = props;
  const [editorState, setEditState] = useState<EditorState | null>(null);
  const [userPose, setUserPose] = useState([...problem.figure.vertices]);
  const [text, setText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getOutput = () => {
    return JSON.stringify({
      vertices: userPose,
    });
  };
  const onOutput = () => {
    setText(getOutput());
  };
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
          />
        </Col>
        <Col>
          <Row>
            <Button onClick={onLoadInput}>Load</Button>
            <Button onClick={onOutput} className="ml-3">
              Output
            </Button>
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
