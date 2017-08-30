import React from 'react';

export default props => (
    <div className="container-fluid newsletter text-center">
        <h2>Newsletter</h2>

        <p>Fique por dentro da comunidade BackEnd Brasil e receba novidades no seu e-mail.</p>

        <div className="form-news">
            <input type="text" className="form-control" placeholder="Digite seu e-mail..." />
            <a href="#" className="btn btn-lg btn-info">Cadastrar E-mail</a>
        </div>
    </div>
);
