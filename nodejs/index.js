/*
    [TR]
    Tokeni almak için https://topluyo.com adresine gidin
    Profil Simgenize Tıklayın > Ayarlar > Cihazlarım

    [EN]
    You Can Get Token go https://topluyo.com
    Click Your Profile Image > Settings > My Devices 
*/
const TOKEN = require("./.token.json")
const TopluyoBOT = require("./TopluyoBOT")
const bot = TopluyoBOT(TOKEN)

bot.on("*",function(event,data){
  if(event!="message"){
    console.log(event,data)
  }
})

bot.on("message",function(message){
  console.log(message)

  if(message.action=="post/add"){
    if(message.message=="!test"){
      bot.post("/!api/post/add",{
        channel_id : message.channel_id,
        text       : "Aktifim ⚡"
      }).then(e=>{ console.log("post gönderildi",e); })
    }else{
      bot.post("/!api/post/add",{
        channel_id : message.channel_id,
        text       : "sen bana ``" + message.message + "`` mı dedin?"
      })
    }
  }

  if(message.action=="group/join"){
    console.log(message.user_id, "sunucuya katıldı")
  }

  if(message.action=="group/leave"){
    console.log(message.user_id, "sunucudan ayrıldı")
  }
  
  if(message.action=="group/kick"){
    console.log(message.user_id, "sunucudan atıldı")
  }

  if(message.action=="message/send"){
    console.log(message.user_id, "dan mesaj geldi:", message.message)
  }
  
  if(message.action=="post/bumote"){
    console.log(message.post_id,"üzerinde bir bumote gönderildi", message.message)
  }
  
})