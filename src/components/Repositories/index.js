import React, { Component } from 'react';

import Repository from '../Repository';

import { getRepositories } from '../../services/github';

import './style.css';

class Repositories extends Component 
{
    componentWillMount()
    {
        this.state = { repos: [] };
        
        getRepositories(this.props.org).then(response => this.setState({ repos: response.data }));
    }

    renderRepositories()
    {
        return this.state.repos.filter(repo => repo.name !== 'backend-br.github.io' ).map( repo => <Repository key={ repo.id } {...repo} />);
    }

    render() {
        return(
            <div className="container-fluid">
                <div className="row">
                    <div className="repositories">
                        <div className="container">
                            <h1 className="repositories__title">Repositórios</h1>
                            <ul className="repositories__list row">
                                { this.renderRepositories() }
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Repositories;
