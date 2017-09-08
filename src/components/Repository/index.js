import React from 'react';
import Emoji from 'react-emoji-render';

import './style.css';

import star from './icons/star.svg';
import megaphone from './icons/megaphone.svg';

export default props => (
    <div className="col-xs-12 col-sm-4">
        <div className="repository">
            <a href={ props.html_url } className="repository__link">
                <div className="repository__body">
                    <p className="repository__title">/{ props.name }</p>
                    <p><Emoji text={props.description} /></p>
                </div>
                <div className="repository__icons">
                    <div className="repository__icons__icon">
                        <img src={ star } className="repository__icons__icon__image" alt="star" /> { props.stargazers_count }
                    </div>
                    <div className="repository__icons__icon">
                        <img src={ megaphone } className="repository__icons__icon__image" alt="issues" /> { props.open_issues_count }
                    </div>
                </div>
            </a>
        </div>
    </div>
);