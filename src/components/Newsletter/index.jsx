import React from 'react';

import './style.css';

export default () => (
  <div className="container">
    <div className="newsletter">
      <h2 className="newsletter__title">Newsletter</h2>
      <p className="newsletter__description">
        Fique por dentro da comunidade BackEnd Brasil
         e receba novidades no seu e-mail.
      </p>
      <div className="newsletter__form row">
        <div className="col-xs-12 col-sm-9">
          <input type="text" className="newsletter__input" placeholder="Digite seu e-mail..." />
        </div>
        <div className="col-xs-12 col-sm-3">
          <button className="newsletter__button">Cadastrar e-mail</button>
        </div>
      </div>
    </div>
  </div>
);
