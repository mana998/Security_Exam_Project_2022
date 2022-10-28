//save messages on page change
//classes only used here so not defined separately
class Message {
    constructor(from, sender, text) {
        this.from = from;
        this.sender = sender;
        this.text = text;
    }
}

class Chat {
    constructor(id, name, messages) {
        this.id = id;
        this.name = name;
        this.messages = messages || [];
    }
}

//setup socket
const socket = io();

//toggle chat list for online users
let toggle = true;

//limit number of open chats
const maxChats = 3;

//stores user id 
let myId;

//whether chat has already been rendered
let rendered = false;

//show or hide chat window
function toggleChat(id) {
    let className;
    let toggleChat;
    if (id) {
        className = `.specific-user-chat.${id}`;
        let userId = openChats.findIndex(element => {
                return Number(element.id) === Number(id);
        });
        let user = openChats[userId];
        user.toggle = !user.toggle;
        openChats[userId].toggle = user.toggle;
        toggleChat = user.toggle;
    } else {
        className = '.user-chat';
        toggle = !toggle;
        toggleChat = toggle;
    }
    if (toggleChat) {
        $(className).hide();
    } else {
        $(className).show();
    }
}

//opened single chat
let openChats = [];

//all selected chats by id
let chats = {}; 

//generate one user in chat list
function generateUser(user) {
    return(
        `<div class="user-chat" onClick="openChat({id:${user.id}, name:'${user.name}'})">
            <p class="user-name">${user.name}</p>
        </div>`
    );
}

//generate separate user chat
function generateUserChat(user, index) {
    return(
        `<div class="user-chat-item chat ${user.id}" style="right: calc(15em * (${index >= 0 ? index + 1 : openChats.length}))">
            <div class="control-bar-user ${user.id}" onclick="toggleChat(${user.id})">${user.name}
                <button class="close-chat" onClick="closeChat(${user.id})">X</button>
            </div>
            <div class="specific-user-chat ${user.id}"> 
                <div class="user-messages ${user.id}"></div>
                <input id="message${user.id}" class="chat-input" type="text">
                <button onClick="sendMessage(${user.id})" class="chat-send">SEND</button>
            </div>
        </div>`
    );
}

function sendMessage(id) {
    let message = document.getElementById(`message${id}`).value;
    if (message) {
        //empty the box
        document.getElementById(`message${id}`).value = '';

        //add your message to chat
        renderMessage(id, true, message);
        chats[id].messages.push(new Message(id, true, message));

        //send message
        socket.emit("client send message", {to: id, from: myId , message: message});
    }
};

socket.on("user list update", data => {
    renderChat();
})

function generateMessage(position, message) {
    return `<p class="user-message ${position} ${message.length <= 20 ? 'short' : 'long'}">${message}</p>`;
}

//generate message either by sender or recipient
function renderMessage(id, isSender, message) {
    let position = isSender ? "right" : "left";
    $(`.user-messages.${id}`).append(generateMessage(position, message));
}

function openChat(user) {
    if (!openChats.find(element => element.id === user.id) && openChats.length < maxChats) {
        openChats.push({id: user.id, name: user.name, toggle: false});
        $("body").append(generateUserChat(user));
        chats[user.id] = new Chat(user.id, user.name);
    }
}

async function renderChat() {
    let response = await getSession();
    if (response && response.length) {
        myId = response[0];
        chats = response[1] || {};
        openChats = response[2] || [];
    }
    if (myId) {
        if (!rendered) {
            //let server know that user is logged in
            //socket.emit("user connected", ({id: myId})); not used but might be added later
            rendered = true;

            //setup socket
            socket.on(`server send message ${myId}`, data => {
                chats[data.from].messages.push(new Message(data.from, false, data.message));

                //add message to chat
                renderMessage(data.from, false, data.message);
            });
        }

        //get only username and id except user with specified id
        let fetchString = `/api/users/active?id=${myId}`;
        const response = await fetch(fetchString);
        const result = await response.json();
        $(".chat-container-users .user-chat").remove();
        $(".chat-container-users .no-users").remove();
        if (result.users && result.users.length) {
            result.users.map(user => {
                $(".chat-container-users").append(generateUser(user));
            });
        } else {
            $(".chat-container-users").append(`<p class="no-users">No users found</p>`);
        }
    }
    if (openChats && openChats.length) {
        openChats.map((chat, index) => {
            $("body").append(generateUserChat(chat, index));
        })
    }
    if (chats) {
        for (let key in chats) {
            if (chats[key].messages && chats[key].messages.length) {
                chats[key].messages.map(message => {
                    renderMessage(message.from, message.sender, message.text);
                });
            }
        }
    }
}

async function getSession() {
    let fetchString = `/getsession`;
    const response = await fetch(fetchString);
    const result = await response.json();
    if (result.id) {
        return [result.id, result.chats, result.openChats];
    } else {
        console.log("Something went wrong");
    }
}

function closeChat(id) {
    $(`.user-chat-item.chat.${id}`).remove();

    //find index of element to remove
    let userId = openChats.findIndex(element => {
        return Number(element.id) === Number(id);
    });

    //remove from open chats;
    openChats.splice(userId, 1);
    delete chats[id];

    //move all the other elements
    if (userId < openChats.length) {
        for (let i = userId; i < openChats.length; i++) {

            //set new position of chat window
            let pos = i + 1;
            $(`.user-chat-item.chat.${openChats[i].id}`).css("right", `calc(15em * (${pos}))`);
        }
    }
}

window.addEventListener("load", () => {
    renderChat()
});

window.addEventListener("beforeunload", () => {
    saveChatSession();
});

async function saveChatSession() {
    const fetchString = `/setsession/chat`;
    const response = await fetch(fetchString, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({chats: chats, openChats: openChats})
    });
    const result = await response.json();
    if (result.message === "Session not set") {
        alert("Something went wrong with loading chats.");
    }
}

socket.on("date", (data) => {
    console.log(data.date);
})
