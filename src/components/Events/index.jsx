import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Event from '../Event';

import { getEvents } from '../../services/meetup';

import '../Repositories/style.css';

class Events extends Component {
  constructor(props) {
    super(props);

    this.state = { events: [] };

    getEvents(this.props.group).then(response => this.setState({ events: response }));
  }

  renderEvents() {
    return this.state.events.map((event) => {
      if (event.status === this.props.eventStatus) {
        return <Event key={event.id} {...event} />;
      }

      return false;
    });
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="repositories">
            <div className="container">
              <div className="repositories__header">
                <h1 className="repositories__title">{this.props.title}</h1>
              </div>
              <ul className="repositories__list row">
                { this.renderEvents() }
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Events.propTypes = {
  title: PropTypes.string.isRequired,
  group: PropTypes.string.isRequired,
  eventStatus: PropTypes.string.isRequired,
};

export default Events;
