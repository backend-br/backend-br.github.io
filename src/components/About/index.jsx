import React from 'react';

import './style.css';

import Button from '../Button';

import slackIcon from './icons/slack.svg';
import githubIcon from './icons/github.svg';

const slackInviteUrl = 'https://backend-br.slack.com/join/shared_invite/MjI2MTM2MjMwNjI4LTE1MDI2Nzg0NjYtNDFjNjc4MTg2Mg';
const githubProfileUrl = 'https://github.com/backend-br';

export default () => (
  <div className="container-fluid">
    <div className="row">
      <div className="about">
        <h1>Quem somos?</h1>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia labore in optio iste eius ut. Incidunt, tenetur. Perferendis ipsa, aliquam totam exercitationem commodi aperiam, quam nulla cum alias amet voluptates, ipsum deserunt quis vitae quos officiis qui! Nam reiciendis iste, nihil eveniet id omnis laudantium eligendi ipsa aut corporis possimus!</p>

        <div className="about__buttons">
          <Button icon={githubIcon} iconAlt="Logo do Github" link={githubProfileUrl} label="Github" />
          <Button icon={slackIcon} iconAlt="Logo do Slack" link={slackInviteUrl} label="Slack" />
        </div>
      </div>
      </div>
  </div>
);
