import React from 'react';
import { Router, Route, Switch } from 'dva/router';
import Statistics from './routes/Statistics';

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/" exact component={Statistics} />
      </Switch>
    </Router>
  );
}

export default RouterConfig;
