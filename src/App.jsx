import React from 'react';

import Header from './components/Header';
import Repositories from './components/Repositories';
import Members from './components/Members';
import Footer from './components/Footer';

import './styles/bootstrap/bootstrap.css';
import './styles/custom.css';

export default () => (
  <div className="App">
    <Header />
    <Repositories org="backend-br" />
    <Members org="backend-br" />
    <Footer />
  </div>
);
