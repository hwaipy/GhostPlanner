class WhatsNextServer {
  server_url = 'http://localhost:8002/s/';

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
  
  async append(action: any) {
    const response = await fetch(this.server_url + 'AppendAction', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action)
    });
    console.log(response);
    
    if (response.ok) {
      // const content = await response.text();
      // const actions = JSON.parse(content);
      // return actions;
      console.log('ok!!!');
      
    } else {
      console.log('HTTP-Error in FETCH: ' + response.status);
    }
    console.log('try contact server');
    
  }
}

const wnserver = new WhatsNextServer();

export default wnserver;
