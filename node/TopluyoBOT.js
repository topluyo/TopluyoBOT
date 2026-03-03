const WebSocket = require('ws');



class RouteClass {
  constructor({ apiEndpoint, authToken }) {
    this.API_END_POINT = apiEndpoint;
    this.authToken = authToken;

    this.order = [];
    this.lastSyncTime = + Date.now();
    this.rateLimitMs = 1000;

    setInterval(() => this.autoSync(), 200);
  }

  async sync() {
    if (this.order.length === 0) return;

    const order = this.order.splice(0);
    const body = order.map(e => ({
      api: e[0].api,
      data: e[0].data || {}
    }));

    try {
      const res = await fetch(this.API_END_POINT + "!apis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + this.authToken
        },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      const responseList = Object.values(json.data);

      let store = [];

      for (let i = 0; i < responseList.length; i++) {
        const d = responseList[i];
        store.push(d);

        const current = order[i];

        if (!current) continue;

        const resolver = current[1];
        const type = current[2];

        if (resolver) {
          if (type === "array") {
            resolver(store);
          } else {
            resolver(store[0]);
          }
          store = [];
        }
      }

    } catch (err) {
      console.error("SYNC ERROR:", err);
    }
  }

  autoSync() {
    if (this.order.length === 0) return;
    const now = Date.now();
    if (now - this.lastSyncTime > this.rateLimitMs) {
      this.lastSyncTime = now;
      this.sync();
    }
  }

  api(body) {
    if (Array.isArray(body)) {
      for (let i = 0; i < body.length - 1; i++) {
        this.order.push([body[i], null, "array"]);
      }

      return new Promise(res => {
        this.order.push([body[body.length - 1], res, "array"]);
      });

    } else {
      return new Promise(res => {
        this.order.push([body, res, "single"]);
      });
    }
  }
}






function TopluyoBOT(token){
  let base = {}

  const Route = new RouteClass({
    apiEndpoint: "https://topluyo.com/",
    authToken: token
  });

  base.post = function(api,data){
    return new Promise((res,req)=>{  
      Route.api({
        api: api,
        data: data
      }).then(r=>{
        res(r)
      });
    })
  }

  let _triggers = []
  base.on = function(event,callback){
    _triggers.push({event:event,callback:callback})
  }

  const emit = function(event,data){
    _triggers.map(e=>{
      if(e.event==event){
        e.callback.call(base,data)
      }
      if(e.event=="*"){
        e.callback.call(base,event,data)
      }
    })
  }

  let reconnect = true
  base.connect = function(){
    let ws = base.ws = new WebSocket('wss://topluyo.com/!bot');
    ws.on('open', () => {
      ws.send(token);
      setInterval(() => { if (ws.readyState === WebSocket.OPEN) { ws.ping(); } }, 30000);
      emit("open")
    });
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if(message=="AUTH_PROBLEM"){
        reconnect=false
        emit("auth_problem")
        return
      }
      if(message=="CONNECTED"){
        reconnect=true
        emit("connected")
        return
      }
      emit("message",message)
    });
    ws.on('close', () => {
      emit("close")
      if(reconnect) {
        setTimeout(e=>base.connect(),1000)
      }
    });
    ws.on('error', (err) => {
      emit("error",err)
    });
  }

  base.connect()

  return base
}


module.exports = TopluyoBOT
