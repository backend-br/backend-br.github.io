import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Repository from '../Repository';

import { getRepositories, filterRepositoriesByName, filterRepositoriesByStars } from '../../services/github';

import './style.css';

class Repositories extends Component {
  constructor(props) {
    super(props);

    this.state = { repos: [] };

    getRepositories(this.props.org).then(response => this.setState({ repos: response }));
  }

  orderRepositories(filter) {
    this.setState({ ...this.state, repos: this.state.repos.sort(filter) });
  }

  renderRepositories() {
    return this.state.repos.map(repo => <Repository key={repo.id} {...repo} />);
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="repositories">
            <div className="container">
              <div className="repositories__header">
                <h1 className="repositories__title">Repositórios</h1>
                <ul className="repositories__filter">
                  <li className="repositories__filter__item">
                    <button onClick={() => this.orderRepositories(filterRepositoriesByName)}>
                      Por Nome
                    </button>
                  </li>
                  <li className="repositories__filter__item">
                    <button onClick={() => this.orderRepositories(filterRepositoriesByStars)}>
                      Por Popularidade
                    </button>
                  </li>
                </ul>
              </div>
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

Repositories.propTypes = {
  org: PropTypes.string.isRequired,
};

export default Repositories;
