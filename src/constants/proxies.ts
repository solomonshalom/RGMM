interface CorsProxy {
  url: string;
  processResponse: (response: any) => any;
}

export const CORS_PROXIES: CorsProxy[] = [
  {
    url: 'https://api.allorigins.win/raw?url=',
    processResponse: (response) => response.data
  },
  {
    url: 'https://corsproxy.io/?',
    processResponse: (response) => response.data
  },
  {
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    processResponse: (response) => response.data
  }
];