let vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

// UI CONTROLS
$('.grid').on('click', '.remove-user', (e) => $(e.currentTarget).parent().remove());

$('.search-btn').on('click', (e) => {
  let data = $('.search').val();
  let users = data.split(',').map(user => user.trim() );
  addUsers(users)
});

$('.clear-btn').on('click', (e) => $('.grid').empty())

//setups
getGlobalProps()
  // for testing only
  .then( addUsers(['utopian-io', 'busy.org', 'blocktrades', 'sambillingham']))
  // testing

function addUsers(users){
  getAccounts(users)
    .then(data => proccessData(data))
    .then(data => displayAccounts(data))
}

function displayAccounts(accounts){
  let $grid = $('.grid');

  accounts.forEach(user => {
    let template =
      `<div class="col-lg-3 col-md-4 col-sm-6">
      <a href="https://steemit.com/@${user.name}" class="user-link"><img src="${user.image}" class="rounded-circle" height="80px" width="80px"></a>
      <li><a href="https://steemit.com/@${user.name}" class="user-value user-name user-link">${user.name}</a> <span class="badge badge-secondary">${user.rep}</span></li>
      <li>EFFECTIVE SP: <span class="user-value">${ user.effectiveSp }</span></li>
      <li>STEAM POWER: <span class="user-value">${user.sp} <br>(+ ${user.delegatedSpIn} - ${user.delegatedSpOut})</span></li>

      <li>
        <div class="progress">
          <div class="progress-bar progress-bar-striped" role="progressbar" style="width: ${user.vp}%;" aria-valuenow="${user.vp}" aria-valuemin="0" aria-valuemax="100">Vote Power - ${user.vp}% </div>
          </div>
      </li>

      <li>STEEM BALANCE: <span class="user-value">${user.steem}</span></li>
      <li>SBD Balance: <span class="user-value">${user.sbd}</span></li>
      <li>POSTS: <span class="user-value">${user.numOfPosts}</span></li>

      <li>Followers: <span class="user-value">${user.followerCount}</span></li>
      <li>Following: <span class="user-value">${user.followingCount}</span></li>
      <li><span class="user-value">💵 $${user.usdValue}</span></li>

      <button type="button" class="btn btn-secondary btn-sm remove-user"> X Remove</button>
      </div>`;
      $grid.append(template);
  })

}

function getGlobalProps(){
  return steem.api.getDynamicGlobalProperties((err, result) => {
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundSteem = result.total_vesting_fund_steem;
  })
}


function getAccounts(accountNames){
    return steem.api.getAccounts(accountNames, (err, response) => response )
};

function proccessData(accounts){

  let accountsData = [];

  let processAllData = new Promise((resolve, reject) => {

  accounts.forEach( user => {
    // store meta Data
    let jsonData = user.json_metadata ? JSON.parse(user.json_metadata).profile : {}

    // steem power calc
    let vestingShares = user.vesting_shares;
    let delegatedVestingShares = user.delegated_vesting_shares;
    let receivedVestingShares = user.received_vesting_shares;
    let steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
    let delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
    let outgoingSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem) - delegatedSteemPower;

    // vote power calc
    let lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
    let votePower = user.voting_power += (10000 * lastVoteTime / 432000);
    votePower = Math.min(votePower / 100, 100).toFixed(2);

    accountsData.push({
      name: user.name,
      image: jsonData.profile_image ? 'https://steemitimages.com/2048x512/' + jsonData.profile_image : '',
      rep: steem.formatter.reputation(user.reputation),
      effectiveSp: parseInt(steemPower  + delegatedSteemPower - -outgoingSteemPower).toLocaleString(),
      sp: parseInt(steemPower).toLocaleString(),
      delegatedSpIn: parseInt(delegatedSteemPower).toLocaleString(),
      delegatedSpOut: parseInt(-outgoingSteemPower).toLocaleString(),
      vp: votePower,
      steem: user.balance.substring(0, user.balance.length - 5),
      sbd: user.sbd_balance.substring(0, user.sbd_balance.length - 3),
      numOfPosts: user.post_count,
      followerCount: '',
      followingCount: '',
      usdValue: ''
    });
  });

  let followerAndFollowingCount = accountsData.map( user => steem.api.getFollowCount(user.name))

  Promise.all(followerAndFollowingCount)
    .then(data => {
        for (let i = 0; i < data.length; i++) {
          accountsData[i].followerCount = data[i].follower_count
          accountsData[i].followingCount = data[i].following_count
        }
    })

  let usdValues = accounts.map( user => steem.formatter.estimateAccountValue(user) )

  Promise.all(usdValues)
    .then(data => {
        for (let i = 0; i < data.length; i++) {
          accountsData[i].usdValue = parseInt(data[i]).toLocaleString()
        }
        resolve(accountsData);
    })

  });

  return processAllData;
}
