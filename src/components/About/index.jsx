import React from 'react';

import './style.css';

import Button from '../Button';

import slackIcon from './icons/slack.svg';
import githubIcon from './icons/github.svg';

const slackInviteUrl = 'https://join.slack.com/t/backend-br/shared_invite/enQtMjQyOTM1MjQ5OTcyLTA1NTJiODM5YTA2YzYyZDUyMGRiNTc1NjAwODNhYTQ3OTlkYjE2ZDllMTc2MzlmNzFmOTI4Mzc2NWFhNzE2OTg';
const githubProfileUrl = 'https://github.com/backend-br';

export default () => (
  <div className="container">
    <div className="row">
      <div className="about">
        <p>
          A comunidade Back-End BR tem como objetivo unir desenvolvedore(a)s Back-End, <br />
          que tenham qualquer conhecimento, para discutir, trazer suas dúvidas
          e trocar conhecimento entre si.
        </p>

        <div className="about__buttons">
          <Button
            icon={githubIcon}
            iconAlt="Logo do Github"
            link={githubProfileUrl}
            label="Github"
          />
          <Button
            icon={slackIcon}
            iconAlt="Logo do Slack"
            link={slackInviteUrl}
            label="Slack"
          />
        </div>
      </div>
    </div>
  </div>
);
