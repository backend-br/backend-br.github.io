import React, { Component } from 'react';

import Repository from '../Repository';

import { getRepositories, filterRepositoriesByName, filterRepositoriesByStars } from '../../services/github';

import './style.css';

class Repositories extends Component {
  componentWillMount() {
    this.state = { repos: [] };

    getRepositories(this.props.org).then(response => this.setState({ repos: response }));
  }

  renderRepositories() {
    return this.state.repos.map(repo => <Repository key={repo.id} {...repo} />);
  }

  orderRepositories(filter) {
    this.setState({ ...this.state, repos: this.state.repos.sort(filter) });
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
                  <li className="repositories__filter__item" onClick={() => this.orderRepositories(filterRepositoriesByName)}>Por Nome</li>
                  <li className="repositories__filter__item" onClick={() => this.orderRepositories(filterRepositoriesByStars)}>Por Popularidade</li>
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

export default Repositories;
