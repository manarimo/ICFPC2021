import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Figure, Problem, useProblemData } from "../utils";
import { Alert, Container, Spinner, Row, Col, Button, Form } from "react-bootstrap";
import { SvgViewer } from "./SvgViewer";
import { EditorState } from "./EditorState";

interface SvgEditorProps {
  problem: Problem;
}
const SvgEditor = (props: SvgEditorProps) => {
  const { problem } = props;
  const [editorState, setEditState] = useState<EditorState | null>(null);
  const [userFigure, setUserFigure] = useState<Figure>({
    edges: [...problem.figure.edges],
    vertices: [...problem.figure.vertices],
  });
  const [output, setOutput] = useState<string>('');

  const getOutput = () => {
    return JSON.stringify({
      vertices: userFigure.vertices,
    });
  }
  const onOutput = () => {
    setOutput(getOutput());
  }
  const onCopyOutput = () => {
    setOutput(getOutput());
    navigator.clipboard.writeText(getOutput());
  }

  return (
    <Container>
      <Row>
        <Col>
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
                  const newFigure = { ...userFigure };
                  newFigure.vertices[pointId] = [x, y];
                  setUserFigure(newFigure);
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
            <Button onClick={onOutput}>Output</Button>
            <Button onClick={onCopyOutput} className="ml-3">Copy</Button>
            <Form.Control
              as="textarea"
              rows={10}
              value={output}
            />
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
