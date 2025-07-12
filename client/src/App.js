import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Layout from "./components/Layout";
import Attendance from "./components/Attendance";
import ScoreInput from "./components/ScoreInput";
import ViewScores from "./components/ViewScores";
import WrongNote from "./components/WrongNote";

function App() {
    return (
        <Router>
            <Layout>
                <Switch>
                    <Route path="/attendance" component={Attendance} />
                    <Route path="/input" component={ScoreInput} />
                    <Route path="/view" component={ViewScores} />
                    <Route path="/wrongnote" component={WrongNote} />
                    <Route path="/" component={Attendance} />{" "}
                    {/* 기본 페이지 */}
                </Switch>
            </Layout>
        </Router>
    );
}

export default App;
