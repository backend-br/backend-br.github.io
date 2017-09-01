import React, { Component } from 'react';

import Header from './components/Header';
import Repositories from './components/Repositories';
import Members from './components/Members';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';

import './styles/bootstrap/bootstrap.css';
import './styles/custom.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <Repositories org="backend-br" />
        <Newsletter />
        <Members org="backend-br" />
        <Footer />
      </div>
    );
  }
}

export default App;
