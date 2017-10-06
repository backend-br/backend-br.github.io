import React from 'react';

import './style.css';

import Button from '../Button';

import icon from './icons/twitter.svg';

const twitterLink = 'https://twitter.com/BackendBrasil';

export default () => (
  <div className="twitter-button">
    <p className="twitter-button__description">
      Acompanhe todas as issues do
      <br />Backend Brasil no Twitter
    </p>
    <Button icon={icon} iconAlt="Logo do Twitter" link={twitterLink} label="@BackendBrasil" />
  </div>
);
