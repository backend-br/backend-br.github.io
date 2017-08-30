import React, { Component } from 'react';
import Axios from 'axios';

import Repository from './Repository';

class Repositories extends Component {
    componentWillMount()
    {
        this.state = {
            repos: []
        };

        Axios.get(`https://api.github.com/orgs/${ this.props.org }/repos?per_page=100&page=1`).then(response => {
            this.setState({ repos: response.data });
        });
    }

    renderRepositories()
    {
        return this.state.repos.map( (repo) => <Repository key={ repo.id } {...repo} />);
    }

    render() {
        return(
            <div className="container repos">
                <div className="row text-center">
                    <h1>Repositórios</h1>
                </div>
        
                <div className="row repositories">
                    { this.renderRepositories() }
                </div>
            </div>
        );
    }
}

export default Repositories;
