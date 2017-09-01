import React from 'react';

import './style.css';

export default props => (
    <li className="member">
        <a className="member__link" href={ props.html_url }>
            <img src={ props.avatar_url } className="member__avatar" alt={ props.login } />
            <span className="member__login">@{ props.login }</span>
        </a>
    </li>
);
