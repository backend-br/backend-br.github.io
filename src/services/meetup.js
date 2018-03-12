import Axios from 'axios';

const getMeetup = async (group, endpoint) => {
  const env = process.env.NODE_ENV;
  const url = (env === 'development') ?
    `./sample_api/${endpoint}.json` :
    `https://meetup-api-proxy.herokuapp.com/${group}/${endpoint}?photo-host=public&page=20&status=upcoming,past`;

  const response = await Axios.get(url);

  return response.data;
};

export const getEvents = org => getMeetup(org, 'events');
