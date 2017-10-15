import React from 'react';

import './style.css';

import Button from '../Button';

import slackIcon from './icons/slack.svg';
import githubIcon from './icons/github.svg';

const slackInviteUrl = 'https://backend-br.slack.com/join/shared_invite/MjI2MTM2MjMwNjI4LTE1MDI2Nzg0NjYtNDFjNjc4MTg2Mg';
const githubProfileUrl = 'https://github.com/backend-br';

export default () => (
  <div className="container">
    <div className="row">
      <div className="about">
        <p>A comunidade Back-End BR tem como objetivo unir desenvolvedore(a)s Back-End, <br /> que tenham qualquer conhecimento, para discutir, trazer suas dúvidas e trocar conhecimento entre si.</p>
    
        <div className="about__buttons">
          <Button icon={githubIcon} iconAlt="Logo do Github" link={githubProfileUrl} label="Github" />
          <Button icon={slackIcon} iconAlt="Logo do Slack" link={slackInviteUrl} label="Slack" />
        </div>
      </div>
    </div>
  </div>
);
