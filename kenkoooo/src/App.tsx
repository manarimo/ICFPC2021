import React from "react";
import { Navbar } from "react-bootstrap";
import { HashRouter, Route } from "react-router-dom";
import Switch from "react-bootstrap/Switch";
import { ProblemPage } from "./pages/ProblemPage";
import { HomePage } from "./pages/HomePage";

const App = () => (
  <HashRouter>
    <Navbar bg="light" expand="lg">
      <Navbar.Brand href="/">ICFPC2021</Navbar.Brand>
    </Navbar>
    <Switch>
      <Route path="/problem/:problemId">
        <ProblemPage />
      </Route>
      <Route exact path="/">
        <HomePage />
      </Route>
    </Switch>
  </HashRouter>
);

export default App;
