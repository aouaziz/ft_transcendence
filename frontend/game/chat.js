import { navigateTo } from './index.js';

// State management
let currentFriend = null;
let chatSocket = null;
let currentUser = null;
const displayedMessages = new Set();
let blockedUsers = new Set();

// Utility functions
function getCookie(name) {
    const nameEQ = name + '=';
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

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const tokenPayload = JSON.parse(jsonPayload);
        return Date.now() >= tokenPayload.exp * 1000;
    } catch (e) {
        return true;
    }
}

export async function fetchUserData() {
    try {
        const token = getCookie('access_token');
        if (!token) {
            console.error('No token found in cookies');
            return null;
        }

        const response = await fetch('https://localhost:8443/api/auth/user/detail/', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Blocked users management
function loadBlockedUsers() {
    const storedBlockedUsers = localStorage.getItem('blockedUsers');
    if (storedBlockedUsers) {
        blockedUsers = new Set(JSON.parse(storedBlockedUsers));
    }
}


function saveBlockedUsers() {
    localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
}

function initializeBlockStatus() {
    if (!currentFriend) return;
    
    loadBlockedUsers();
    const blockButton = document.getElementById('block-button');
    if (!blockButton) return;
    
    if (blockedUsers.has(currentFriend)) {
        blockButton.textContent = 'Unblock';
    } else {
        blockButton.textContent = 'Block';
    }
}

function toggleBlock() {
    const blockButton = document.getElementById('block-button');
    const messageInputContainer = document.getElementById('message-input-container');
    const messageInput = document.getElementById('message-input'); 
    if (!blockButton || !currentFriend) return;

    if (blockedUsers.has(currentFriend)) {
        // Unblock
        blockButton.textContent = 'Block';
        blockedUsers.delete(currentFriend); 

        // Remove blocked messages from localStorage
        const blockedMessages = JSON.parse(localStorage.getItem('blockedMessages') || '[]');
        const updatedMessages = blockedMessages.filter(msg => msg.sender !== currentFriend);
        localStorage.setItem('blockedMessages', JSON.stringify(updatedMessages));

        // Enable the message input again
        if (messageInputContainer) {
            messageInputContainer.style.display = 'block'; // Show the message input container
        }
        if (messageInput) {
            messageInput.disabled = false; 
        }

    } else {
        // Block
        blockButton.textContent = 'Unblock';
        blockedUsers.add(currentFriend);  

        // Hide the message input when blocked
        if (messageInputContainer) {
            messageInputContainer.style.display = 'none'; 
        }
        if (messageInput) {
            messageInput.disabled = true; 
        }
    }

    saveBlockedUsers(); 
}


// Game functionality
async function gameApi(opponentUsername) {
    const token = getCookie('access_token');
    if (!token) {
        console.error('No token found in cookies');
        return null;
    }

    try {
        const response = await fetch('https://localhost:8443/game/matchmaking/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ opponent_username: opponentUsername }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, ${errorText}`);
        }

        const data = await response.json();
        return data.room_code || null;
    } catch (error) {
        console.error('Error creating game:', error);
        return null;
    }
}

// Chat message display
function displayMessage(messageData) {
    const chatMessages = document.getElementById('chat-messages');
    const { sender, message } = messageData;

    if (sender === currentUser || sender === currentFriend) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === currentUser ? 'sender-message' : 'receiver-message');
        messageElement.innerHTML = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// WebSocket handlers
function setupWebSocketHandlers(userData) {
    chatSocket.onopen = function() {
        chatSocket.send(JSON.stringify({
            type: 'user_data',
            username: userData.username,
            avatar: userData.avatar,
        }));
    };

    chatSocket.onmessage = function(event) {
        const messageData = JSON.parse(event.data);
        
        if (messageData.type === 'user_data') {
            console.log('User data received:', messageData);
            return;
        }

        if (blockedUsers.has(messageData.sender)) {
                    console.log(`Message from ${messageData.sender} blocked.`);

                    // Save this message to localStorage while the user is blocked
                    const blockedMessages = JSON.parse(localStorage.getItem('blockedMessages') || '[]');
                    blockedMessages.push(messageData);
                    localStorage.setItem('blockedMessages', JSON.stringify(blockedMessages));
                    return;  // Do not display the message if the sender is blocked
                }

        const messageKey = `${messageData.sender}-${messageData.recipient}-${messageData.message}`;
        if ((messageData.sender === currentUser && messageData.recipient === currentFriend) ||
            (messageData.sender === currentFriend && messageData.recipient === currentUser)) {
            if (!displayedMessages.has(messageKey)) {
                displayMessage(messageData);
                displayedMessages.add(messageKey);
            }
        }
    };

    chatSocket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Friend click handler setup
function setupFriendClickHandler(friendElement, userData, friend) {
    friendElement.addEventListener('click', async () => {
        const friendUsername = friend.username;
        if (currentFriend === friendUsername) return;
        
        currentFriend = friendUsername;
        initializeBlockStatus();

        // Update chat header
        const chatHeader = document.getElementById('chat-header');
        let chatHeaderImage = friend.avatar && typeof friend.avatar === 'string' && friend.avatar.startsWith("http")
            ? friend.avatar
            : '/assets/default_avatar.jpg';
            
        chatHeader.innerHTML = `
            <img src="${chatHeaderImage}" alt="${friendUsername}" class="chat-header-img">
            <span class="friend-username">${friendUsername}</span>
        `;
        
        document.getElementById('chat-box').style.display = 'block';

        // Update selected state
        document.querySelectorAll('.friend').forEach((f) => f.classList.remove('selected'));
        friendElement.classList.add('selected');

        // Setup WebSocket connection
        const roomName = encodeURIComponent([userData.id, friend.id].sort().join('_'));
        const websocketUrl = `wss://localhost:8443/ws/chat/${roomName}/`;

        if (chatSocket) {
            chatSocket.close();
        }
        
        chatSocket = new WebSocket(websocketUrl);
        setupWebSocketHandlers(userData);

        // Load previous messages
        await loadPreviousMessages(userData.username, friendUsername);
    });
}

// Load previous messages
async function loadPreviousMessages(currentUsername, friendUsername) {
    const token = getCookie('access_token');
    const chatMessages = document.getElementById('chat-messages');
    
    try {
        const response = await fetch(`https://localhost:8443/chat/api/messages/?sender=${currentUsername}&recipient=${friendUsername}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const messages = await response.json();
        chatMessages.innerHTML = '';
        displayedMessages.clear();

        // Load blocked messages from localStorage
        const blockedMessages = JSON.parse(localStorage.getItem('blockedMessages') || '[]');

        // Filter out blocked messages from the ones loaded from the API
        const filteredMessages = messages.filter(msg => {
            // Exclude the message if it exists in the blocked messages list
            return !blockedMessages.some(blockedMsg => blockedMsg.sender === msg.sender && blockedMsg.message === msg.message);
        });

        filteredMessages.forEach((msg) => {
            const messageKey = `${msg.sender}-${msg.recipient}-${msg.message}`;
            if (!displayedMessages.has(messageKey)) {
                displayMessage(msg);
                displayedMessages.add(messageKey);
            }
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}


// Setup message sending functionality
function setupMessageSending() {
    const sendMessageButton = document.getElementById('send-message');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!sendMessageButton || !messageInput) return;
    
    chatMessages.addEventListener('click', (event) => {
        if (event.target.classList.contains('game-invite-link')) {
          event.preventDefault(); // Prevent the default link behavior
          const href = event.target.getAttribute('href');
          navigateTo(href); // Navigate using your navigation function
        }
      });

    sendMessageButton.onclick = async function() {
        const message = messageInput.value.trim();
        if (!message || !currentFriend || !currentUser) return;

        const messageData = {
            sender: currentUser,
            recipient: currentFriend,
            message: message,
        };

        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            chatSocket.send(JSON.stringify(messageData));
        }

        messageInput.value = '';

        try {
            const token = getCookie('access_token');
            const response = await fetch('https://localhost:8443/chat/api/messages/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, ${errorText}`);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    };

    // Add enter key support
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessageButton.click();
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
        toast.remove();
    }, 3000); // Toast disappears after 3 seconds
}


// Initialize UI components
function initializeModal() {
    const profileModal = document.getElementById('profile-modal');
    const closeModalButton = document.querySelector('.close-button');
    const blockButton = document.getElementById('block-button');
    const inviteButton = document.getElementById('invite-button');

    if (blockButton) {
        blockButton.addEventListener('click', toggleBlock);
    }

    if (inviteButton) {
       inviteButton.addEventListener('click', async () => {
            if (!currentFriend || !currentUser) return;
    
            try {
                const roomCode = await gameApi(currentFriend);
                if (!roomCode) {
                    showToast('You are already in an unfinished game. Please complete the current game before starting a new one.');
                    return;
                }
                
                const gameInviteLink = `/OnlineGame?room_code=${encodeURIComponent(roomCode)}`; // Changed here
                const message = `Hey! Join my game using this link: <a href="${gameInviteLink}" class="game-invite-link">Play game</a>`; // Added class
    
                const messageData = {
                    sender: currentUser,
                    recipient: currentFriend,
                    message: message,
                };
    
                if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                    chatSocket.send(JSON.stringify(messageData));
                }
    
                // Save the invitation message
                const token = getCookie('access_token');
                const response = await fetch('https://localhost:8443/chat/api/messages/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(messageData),
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
            }
        });
    }

    if (closeModalButton && profileModal) {
        closeModalButton.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }
}

// Main initialization function
export async function loadChatPage() {
    const token = getCookie('access_token');
    if (!token || isTokenExpired(token)) {
        navigateTo('/Login');
        return;
    }

    // Initialize UI elements
    const friendList = document.getElementById('friend-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatHeader = document.getElementById('chat-header');
    
    if (!friendList || !chatHeader || !chatMessages) {
        console.error("Required elements not found on the page");
        return;
    }

    // Clear existing state
    chatMessages.innerHTML = '';
    displayedMessages.clear();
    currentFriend = null;

    try {
        // Fetch current user data first
        const userData = await fetchUserData();
        if (!userData || !userData.username) {
            throw new Error('Failed to fetch user data');
        }
        currentUser = userData.username;

        // Fetch and setup friends list
        const response = await fetch('https://localhost:8443/api/friends/list/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const friends = await response.json();
        
        // Clear and populate friend list
        friendList.innerHTML = '';
        if (friends.length > 0) {
            friends.forEach((friend) => {
                const friendLi = document.createElement('li');
                friendLi.classList.add('friend');
                friendLi.dataset.id = friend.id;

                const friendImage = friend.avatar && typeof friend.avatar === 'string' && friend.avatar.startsWith("http")
                    ? friend.avatar
                    : '/assets/default_avatar.jpg';

                friendLi.innerHTML = `
                    <img src="${friendImage}" alt="${friend.username}">
                    <div>
                        <div class="name">${friend.username}</div>
                    </div>
                `;

                setupFriendClickHandler(friendLi, userData, friend);
                friendList.appendChild(friendLi);
            });
        } else {
            friendList.innerHTML = '<li>No friends available</li>';
        }// Initialize UI components
        setupMessageSending();
        initializeModal();
        initializeBlockStatus();
        loadBlockedUsers();

        // Set up friend profile modal click handlers
        const friendListElement = document.getElementById('friend-list');
        if (friendListElement) {
            friendListElement.addEventListener('click', async (event) => {
                const target = event.target;
                if (target.tagName === 'IMG') {
                    const friendContainer = target.closest('.friend');
                    if (friendContainer) {
                        const friendUsername = friendContainer.querySelector('.name').textContent;
                        const friendId = friendContainer.dataset.id;

                        const profileModal = document.getElementById('profile-modal');
                        const modalProfilePic = document.getElementById('modal-profile-pic');
                        const modalFriendUsername = document.getElementById('modal-friend-username');
                        const modalOnlineStatus = document.getElementById('modal-online-status');

                        modalProfilePic.src = target.src;
                        modalFriendUsername.textContent = friendUsername;

                        try {
                            const friendResponse = await fetch(`https://localhost:8443/api/auth/user/${friendId}/`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                }
                            });

                            if (!friendResponse.ok) {
                                throw new Error(`Failed to fetch user data: ${friendResponse.status}`);
                            }

                            const friendData = await friendResponse.json();
                            modalOnlineStatus.textContent = friendData.online_status ? 'Online' : 'Offline';
                            modalOnlineStatus.className = friendData.online_status ? 'online' : 'offline';
                            
                            profileModal.style.display = 'flex';
                        } catch (error) {
                            console.error("Error fetching friend data for modal:", error);
                        }
                    }
                }
            });
        }

        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    const sendButton = document.getElementById('send-message');
                    if (sendButton) {
                        sendButton.click();
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error initializing chat page:', error);
        const friendList = document.getElementById('friend-list');
        if (friendList) {
            friendList.innerHTML = '<li class="error">Error loading friends list. Please try again later.</li>';
        }
    }
}

window.addEventListener('beforeunload', async () => {
    if (chatSocket) {
        chatSocket.close();
    }
    await handleBeforeUnload();
});

export {
    getCookie,
    isTokenExpired
};