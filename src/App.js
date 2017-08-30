import React, { Component } from 'react';
import './styles/custom.css';

import Navbar from './components/Navbar';
import Header from './components/Header';
import Repositories from './components/Repositories';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Navbar />
        <Header />
        <Repositories org="backend-br" />
        <Newsletter />
        <Footer />
      </div>
    );
  }
}

export default App;
