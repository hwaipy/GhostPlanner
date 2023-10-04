class WhatsNextServer {
  server_url = 'http://localhost:8000/s/';

  test() {
    this.get_new_actions(15);
  }

  async get_new_actions(after: number) {
    const response = await fetch(this.server_url + 'GetActions?after=' + after, {
      method: 'GET',
    });
    if (response.ok) {
      const content = await response.text();
      const actions = JSON.parse(content);
      return actions;
    } else {
      console.log('HTTP-Error in FETCH: ' + response.status);
    }
  }
}

const wnserver = new WhatsNextServer();

export default wnserver;
