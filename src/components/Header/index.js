import React from 'react';

import './style.css';

import SlackButton from '../SlackButton';

export default props => (
  <nav className="header">
    <div className="container">
      <div className="row">
        <div className="col-xs-12 col-sm-8">
          <div className="header__branding">
            <a href="https://github.com/backend-br" className="header__logo">BackEnd Brasil</a>
            <p className="header__description">A maior comunidade de BackEnd do Brasil</p>
          </div>
        </div>
        <div className="col-xs-12 col-sm-4">
          <div className="header__button">
            <SlackButton />
          </div>
        </div>
      </div>
    </div>
  </nav>
);
