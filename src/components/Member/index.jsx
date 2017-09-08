import React from 'react';
import PropTypes from 'prop-types';

import './style.css';

const Member = props => (
  <li className="member">
    <a className="member__link" href={props.html_url}>
      <img src={props.avatar_url} className="member__avatar" alt={props.login} />
      <span className="member__login">@{ props.login }</span>
    </a>
  </li>
);

Member.propTypes = {
  html_url: PropTypes.string.isRequired,
  avatar_url: PropTypes.string.isRequired,
  login: PropTypes.string.isRequired,
};

export default Member;
