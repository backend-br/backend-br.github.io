import React from 'react';

export default props => (
    <nav className="navbar navbar-default">
        <div className="container-fluid">

            <div className="navbar-header">
                <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>

                <a className="navbar-brand" href="#">BackEnd Brasil</a>
            </div>
            
            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul className="nav navbar-nav navbar-right">
                    <li><a href="https://github.com/backend-br" target="_blank">Repositórios</a></li>
                    <li><a href="#">Sobre</a></li>
                    <li><a href="https://github.com/backend-br/vagas/issues" target="_blank">Vagas</a></li>
                    <li><a href="https://github.com/backend-br/forum" target="_blank">Forum</a></li>
                </ul>
            </div>
        </div>
    </nav>
);
