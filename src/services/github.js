import Axios from 'axios';


const getGithub = async (org, endpoint) => {
  const env = process.env.NODE_ENV;
  const url = (env === 'development') ? `./sample_api/${endpoint}.json` : `https://api.github.com/orgs/${org}/${endpoint}?per_page=100&page=1`;
  const response = await Axios.get(url);

  return response.data;
};

export const getRepositories = org => getGithub(org, 'repos');
export const getMembers = org => getGithub(org, 'public_members');

export const filterRepositoriesByName = (a, b) => {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
};

export const filterRepositoriesByStars = (a, b) => b.stargazers_count - a.stargazers_count;
