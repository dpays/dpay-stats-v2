// import * as util from './modules/util.js'
import * as ui from './modules/uiActions.js'
import * as dpayActions from './modules/dpayActions.js'

export let mixer;
const DPAY_SERVER = 'wss://dpayd.dpays.io'
// UI CONTROLS
ui.initUiActions();

// INIT!!

$(document).ready(() => {
  $('h1').fitText(1.5);

  mixer = mixitup('.grid',{
    selectors: {
       target: '.grid-item'
   },
   animation: {
       queue : true,
       duration: 0,
       queueLimit: 500
   }
  });
})

//setups
if ($('body').hasClass('user-compare')){
  NProgress.start();
  dpayActions.getGlobalProps(DPAY_SERVER)
    .then(dpayActions.checkForUsersAndSearch())
}

if ($('body').hasClass('follower-compare')){
  $('.username-btn').on('click', () => {
    let data = $('.search').val().trim();
    getFollowers(data)
  })

}

function getFollowers(username){
  NProgress.start();
  NProgress.configure({
    trickleSpeed: 50,
    minimum: 0.2 });

  dpay.api.getFollowers(username, '', 'blog', 1000, function(err, result) {
      let followers = result.map( (user) => user.follower )

      console.log(followers)
      dpayActions.getGlobalProps(DPAY_SERVER)
        .then( () => {
          NProgress.inc()
          dpayActions.addUsers(followers, true)
      })

  });
}
