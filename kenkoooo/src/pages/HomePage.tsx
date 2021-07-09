import { Button, Container, Form } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useState } from "react";

export const HomePage = () => {
  const history = useHistory();
  const problemList = [] as string[];
  for (let i = 1; i <= 59; i++) {
    problemList.push(i + "");
  }

  const [selection, setSelection] = useState(problemList[0]);

  return (
    <Container>
      <Form>
        <Form.Label>Problem:</Form.Label>
        <Form.Control
          as="select"
          onChange={(e) => setSelection(e.target.value)}
        >
          {problemList.map((problemId) => (
            <option key={problemId}>{problemId}</option>
          ))}
        </Form.Control>
        <Button
          onClick={() => {
            history.push({ pathname: `/problem/${selection}` });
          }}
        >
          Go
        </Button>
      </Form>
    </Container>
  );
};
