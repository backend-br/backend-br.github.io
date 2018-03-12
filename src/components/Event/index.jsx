import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import '../Repository/style.css';

const Event = props => (
  <div className="col-xs-12 col-sm-4">
    <div className="repository repository__meetup">
      <div className="repository__link">
        <div className="repository__body">
          <p className="repository__title">{props.name}</p>
          <p className="repository__city">{props.venue.city}</p>
          <div className="repository__description">
            <p>Endereço: <a href={`https://www.google.com/maps/?q=${props.venue.lat},${props.venue.lon}`}>{props.venue.address_1}</a></p>
            <p>Data e Horário: {moment(props.local_date).format('DD/MM/YYYY')} às {props.local_time}</p>
            <p>Participantes: {props.yes_rsvp_count}/{props.rsvp_limit}</p>
          </div>
        </div>
        <div className="repository__icons">
          <p><a href={props.link}>Link Evento</a></p>
        </div>
      </div>
    </div>
  </div>
);

Event.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  local_time: PropTypes.string.isRequired,
  local_date: PropTypes.string.isRequired,
  venue: PropTypes.object.isRequired,
  rsvp_limit: PropTypes.string.isRequired,
  yes_rsvp_count: PropTypes.string.isRequired,
};

export default Event;
