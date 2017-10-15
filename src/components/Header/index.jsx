import React from 'react';

import './style.css';

import Button from '../Button';

import twitterIcon from './icons/twitter.svg';

const twitterLink = 'https://twitter.com/BackendBrasil';

export default () => (
  <nav className="header">
    <div className="container">
      <div className="row">
        <div className="col-xs-12 col-sm-8">
          <div className="header__branding">
            <a href="https://github.com/backend-br" className="header__logo">BackEnd Brasil</a>
          </div>
        </div>
        <div className="col-xs-12 col-sm-4">
          <div className="header__twitter-button">
            <p className="header__twitter-button__description">
            Acompanhe todas as issues do
            <br />Backend Brasil no Twitter
            </p>
            <Button icon={twitterIcon} iconAlt="Logo do Twitter" link={twitterLink} label="@BackendBrasil" />
          </div>
        </div>
      </div>
    </div>
  </nav>
);
