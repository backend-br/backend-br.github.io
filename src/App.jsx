import React from 'react';

import Header from './components/Header';
import About from './components/About';
import Events from './components/Events';
import Repositories from './components/Repositories';
import Members from './components/Members';
import Footer from './components/Footer';

import './styles/bootstrap/bootstrap.css';
import './styles/custom.css';

export default () => (
  <div className="App">
    <Header />
    <About />
    <Events title="Meetups - Próximos" group="BackEndBr" eventStatus="upcoming" />
    <Events title="Meetups - Passados" group="BackEndBr" eventStatus="past" />
    <Repositories org="backend-br" />
    <Members org="backend-br" />
    <Footer />
  </div>
);
