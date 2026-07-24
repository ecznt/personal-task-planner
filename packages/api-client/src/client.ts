import { client } from './generated/client.gen';

client.setConfig({
  baseUrl: '',
  credentials: 'same-origin',
});

export { client as apiClient };
