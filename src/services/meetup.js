import Axios from 'axios';

const signedAuths = {
  events: {
    id: '228855032',
    key: '8d8788dad837c3c1c4cf9c113bb6b42b082db8e5',
  },
};

const getMeetup = async (group, endpoint) => {
  const env = process.env.NODE_ENV;
  const url = (env === 'development') ?
    `./sample_api/${endpoint}.json` :
    `https://api.meetup.com/${group}/${endpoint}?photo-host=public&sig_id=${signedAuths[endpoint].id}&status=past%2Cupcoming&sig=${signedAuths[endpoint].key}`;

  const response = await Axios.get(url);

  return response.data;
};

export const getEvents = org => getMeetup(org, 'events');
