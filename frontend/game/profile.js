import { navigateTo } from './index.js';

export async function checkUserCondition() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (username) {
        await fetchUserAvatar(username);
    } else {
        await fetchUserProfile();
    }
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
        const regex = new RegExp(`^${nameEQ}([^;]+)`);
        const match = cookie.match(regex);
        if (match) {
            return match[1];
        }
    }
    return null;
}


async function fetchUserAvatar(username) {
    const removeFriendButton = document.getElementById("removeFriend");
    const addFriendButton = document.getElementById("addFriend");
    const historyAndStatistic = document.getElementById('historyAndStatistic')
    const urlParams = new URLSearchParams(window.location.search);
    try {
        const token = getCookie('access_token');
        if (!token) {
            console.error('No token found in cookies');
            return;
        }

        const response = await fetch(`https://localhost:8443/api/friends/search/?query=${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const avatarNameElement = document.getElementById('avatar-name');
        const profileImgElement = document.getElementById('profileImg');
        if (response.ok) {
            const data = await response.json();
             // Search in both 'friends' and 'other_users' for a matching user.
             const matchedUsers = [...data.friends, ...data.other_users].filter(user => user.username === username);

            if (matchedUsers.length > 0) {
                const userData = matchedUsers[0];
                if (avatarNameElement) {
                    avatarNameElement.innerText = userData.username || 'Unknown';
                } else {
                    console.error('Element #avatar-name not found.');
                }
                
                 profileImgElement.src = userData.avatar;
                 const isFriend = data.friends.some(friend => friend.username === username); 
                 console.log("isFriend : ==> " + isFriend);
                 // Update the UI based on whether the user is a friend
                 if (isFriend) {
                     removeFriendButton.style.display = 'block';
                     addFriendButton.style.display = 'none';
                 } else {
                     addFriendButton.style.display = 'block';
                     removeFriendButton.style.display = 'none';
                 }

                console.log("User data fetched:", userData);
                await updateUserStatisticsAndHestory(username,token); 
            } else {
                avatarNameElement.innerText = 'Unknown';
                profileImgElement.src = '/assets/default_avatar.jpg'
                addFriendButton.style.display = 'none';
                console.error('No exact match found for the username.');
            }
        } else {
            console.error('Failed to fetch avatar, HTTP Status:', response.status);
            throw new Error('Failed to fetch avatar');
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
      if (addFriendButton && removeFriendButton) {
           // Capture username in a closure
        addFriendButton.addEventListener('click', async (e) => {
        
                try {
                   const username = urlParams.get('username');
                    const token = getCookie('access_token');
                    const response = await fetch('https://localhost:8443/api/friends/add/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ username: username })
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Error adding friend:', errorData);
                    } else {
                        console.log('Friend added successfully');
                        addFriendButton.style.display = 'none';
                        removeFriendButton.style.display = 'block';
                    }
                    // Update the UI instantly after becoming friends.
                    await fetchUserAvatar(username);
                } catch (error) {
                    console.error('Error adding friend:', error);
                }
            });
            removeFriendButton.addEventListener('click', async (e) => {
                try {
                    const username = urlParams.get('username');
                    const token = getCookie('access_token');
                    const response = await fetch('https://localhost:8443/api/friends/remove/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ username: username })
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Error removing friend:', errorData);
                    } else {
                        console.log('Friend removed successfully');
                        removeFriendButton.style.display = 'none';
                        addFriendButton.style.display = 'block';
                    }
                     // Update the UI instantly after removing friends.
                      await fetchUserAvatar(username);
                } catch (error) {
                    console.error('Error removing friend:', error);
                }
            });
    } else {
        console.error("element not found");
    }
}

// Function to fetch user profile
async function fetchUserProfile() {
    const removeFriendButton = document.getElementById("removeFriend");
    const addFriendButton = document.getElementById("addFriend");
    try {
        const token = getCookie('access_token');
          if (!token) {
            console.error('No token found in cookies');
            return;
        }
        const response = await fetch('https://localhost:8443/api/auth/user/detail/', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
             const avatarNameElement = document.getElementById('avatar-name');
             const profileImgElement = document.getElementById('profileImg');
             if(avatarNameElement){
               avatarNameElement.innerText = data.username;
            }else {
                 console.error("element #avatar-name not found");
            }
            // let avatarUrl = data.avatar;
            profileImgElement.src =  data.avatar;
            console.log("avatarUrl=====> : "+ data.avatar)
           if (removeFriendButton && addFriendButton ) {
               removeFriendButton.style.display = 'none';
               addFriendButton.style.display = 'none';
           }
              updateUserStatistics(data);
              updateMatchHistory(data.match_history);
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}


// Function to fetch user profile details, history and statistics
async function updateUserStatisticsAndHestory(username, token){
    try {
          if (!token) {
            console.error('No token found in cookies');
            return;
        }
        const response = await fetch(`https://localhost:8443/api/auth/user/detail/?username=${username}`,{
            method: 'GET',
             headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
         if (response.ok) {
            const data = await response.json();
             updateUserStatistics(data);
             updateMatchHistory(data.match_history);
         } else {
              throw new Error(`HTTP error! Status: ${response.status}`);
         }
    } catch (error) {
        console.error('Error fetching profile details:', error);
    }
}
// Function to update user statistics
function updateUserStatistics(userData) {
    const totalMatches = userData.total_matches ;
    const totalWins = userData.total_wins ;
    const totalLosses = userData.total_losses;
    const winRatePercentage = userData.win_rate;

    // Update statistics text content
    const matchesElement = document.getElementById('matches');
    const winsElement =  document.getElementById('wins');
    const lossesElement = document.getElementById('losses');
    const winrateElement = document.getElementById('winrate');
     if(matchesElement){
        matchesElement.textContent = totalMatches;
    } else {
        console.error("element #matches not found")
    }
     if(winsElement){
        winsElement.textContent = totalWins;
    } else {
        console.error("element #wins not found")
    }
      if(lossesElement){
       lossesElement.textContent = totalLosses;
    } else {
        console.error("element #losses not found")
    }
    if(winrateElement){
        winrateElement.textContent = `${Math.round(winRatePercentage)}%`;
    } else {
        console.error("element #winrate not found")
    }

    // Update circle animations
    updateCircleAnimation('matches-circle', totalMatches / 100 * 100);
    updateCircleAnimation('wins-circle', totalWins / totalMatches * 100);
    updateCircleAnimation('losses-circle', totalLosses / totalMatches * 100);
    updateCircleAnimation('winrate-circle', winRatePercentage);
}
// Function to animate progress circles
function updateCircleAnimation(circleId, progressPercentage) {
    const circle = document.getElementById(circleId);
    const maxDashOffset = 100;
    const offset = maxDashOffset - (progressPercentage > 100 ? 100 : progressPercentage);
   if(circle){
    circle.style.transition = 'stroke-dashoffset 1s ease-in forwards';
    circle.style.strokeDashoffset = offset;
    } else {
        console.error(`element #${circleId} not found`)
    }
}

function updateMatchHistory(matchHistory) {
    const matchBlocks = document.querySelector('.match-blocks');
    if (!matchBlocks) {
        console.error("Element .match-blocks not found");
        return;
    }
        // Clear existing match history
    matchBlocks.innerHTML = '';
    if (!matchHistory || matchHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('no-matches');
        emptyMessage.textContent = 'No matches played yet';
        matchBlocks.appendChild(emptyMessage);
        return;
    }
    
    matchHistory.forEach(match => {
    const matchBlock = document.createElement('article');
    matchBlock.classList.add('match-block');
    matchBlock.classList.add(match.result);

    const resultSpan = document.createElement('span');
        resultSpan.classList.add('result', match.result.charAt(0).toUpperCase() + match.result.slice(1));
        resultSpan.textContent = match.result.charAt(0).toUpperCase() + match.result.slice(1);
        matchBlock.appendChild(resultSpan);

    const playersDiv = document.createElement('div');
    playersDiv.classList.add('players');

    const player1Span = document.createElement('span');
    player1Span.classList.add('player', 'left');
    player1Span.textContent = match.player1;
    playersDiv.appendChild(player1Span);


    const scoreSpan = document.createElement('span');
    scoreSpan.classList.add('score');
        scoreSpan.textContent =  `${match.score1} - ${match.score2}`;
        playersDiv.appendChild(scoreSpan);

    const player2Span = document.createElement('span');
    player2Span.classList.add('player', 'right');
        player2Span.textContent = match.player2;
    playersDiv.appendChild(player2Span);

        matchBlock.appendChild(playersDiv);


    const time = document.createElement('time')
    time.classList.add("date");
        time.textContent = match.timestamp.substring(0,10) 
        matchBlock.appendChild(time);

    matchBlocks.appendChild(matchBlock);
    });
}