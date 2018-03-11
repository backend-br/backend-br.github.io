import React from 'react';
import Emoji from 'react-emoji-render';
import PropTypes from 'prop-types';

import './style.css';

import star from './icons/star.svg';
import megaphone from './icons/megaphone.svg';

const Repository = (props) => {
  let parseDescriptionWithEmojis;

  if (props.description) {
    parseDescriptionWithEmojis = <Emoji text={props.description} />;
  }

  return (
    <div className="col-xs-12 col-sm-4">
      <div className="repository">
        <a href={props.html_url} className="repository__link">
          <div className="repository__body">
            <p className="repository__title">/{props.name}</p>
            <p className="repository__description">
              {parseDescriptionWithEmojis}
            </p>
          </div>
          <div className="repository__icons">
            <div className="repository__icons__icon">
              <img src={star} className="repository__icons__icon__image" alt="star"/>
              {props.stargazers_count}
            </div>
            <div className="repository__icons__icon">
              <img src={megaphone} className="repository__icons__icon__image" alt="issues"/>
              {props.open_issues_count}
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

Repository.defaultProps = {
  description: '',
};

Repository.propTypes = {
  html_url: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  stargazers_count: PropTypes.number.isRequired,
  open_issues_count: PropTypes.number.isRequired,
};

export default Repository;
