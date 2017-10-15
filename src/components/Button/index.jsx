import React from 'react';
import PropTypes from 'prop-types';

import './style.css';

const Button = props => (
  <div className="button">
    <a href={props.link} className="button__link" target="_blank">
      <img src={props.icon} className="button__icon" alt={props.iconAlt} /> {props.label}
    </a>
  </div>
);

Button.propTypes = {
  link: PropTypes.string.isRequired,
  icon: PropTypes.string,
  iconAlt: PropTypes.string,
  label: PropTypes.string.isRequired,
};

Button.defaultProps = {
  icon: '',
  iconAlt: '',
};

export default Button;
