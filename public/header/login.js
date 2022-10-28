async function login() {
    let username = document.getElementById("username");
    let password = document.getElementById("password");
    let fetchString = `/api/users/login`;
    const response = await fetch(fetchString, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username.value, password: password.value})
    });
    username.value = "";
    password.vaule = "";
    let result = await response.json();
    if (result.id) {
        result = await setSession(result);
        if (result.id) {
            result = await updateLoginStatus(result.id);
            if (result.id) {
                await renderChat();
                await socket.emit("online users change");
                $('#loginModal').modal('hide');
                setLogoutHtml(result.id);

                //let server know that user is logged in
                socket.emit("user connected", ({id: result.id}));
            }
        }
    }
    $("#message").text(result.message);

    //redirect
    window.location.replace('/');
}

async function setSession(loginResult) {
    const fetchString = `/setsession/id`;
    const response = await fetch(fetchString, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: loginResult.id})
    });
    const result = await response.json();
    return result;
}

async function updateLoginStatus(id) {
    const fetchString = `/api/users/login`;
    const response = await fetch(fetchString, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: id})
    });
    const result = await response.json();
    return result;
}

function registerStart() {
    $("#repeatPasswordLabel").show();
    $("#repeatPassword").show();
    $("#register").attr("onclick","register()").removeClass("btn-secondary").addClass("btn-primary");
    $("#loginButton").attr("onclick", "loginStart()").addClass("btn-secondary").removeClass("btn-primary");
    $(".modal-title").text("Register");
}

function loginStart() {
    $("#repeatPasswordLabel").hide();
    $("#repeatPassword").hide();
    $("#register").attr("onclick","registerStart()").addClass("btn-secondary").removeClass("btn-primary");
    $("#loginButton").attr("onclick", "login()").removeClass("btn-secondary").addClass("btn-primary");
    $(".modal-title").text("Login");
}

async function register() {
    let username = document.getElementById("username");
    let password = document.getElementById("password");
    let repeatPassword = document.getElementById("repeatPassword");
    if (password.value !== repeatPassword.value) {
        $("#message").text("Passwords do not match. Try again");
        password.value = '';
        repeatPassword.value = '';
        return;
    } else if (!password.value.match(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*?[\.,_"!@#$%^&*+`~'=?\|\]\[\(\)\-<>/]).{8,}$/)) {
        $("#message").text("Passwords must contain at least 8 characters (1 lowercase letter, 1 uppercase letter, number and a special character .,_\"!@#$%^&*+`~'=?\|\]\[\(\)\-<>/). Try again");
        password.value = '';
        repeatPassword.value = '';
        return;
    }  else if (!username.value.match(/^.{5,}$/)) {
        $("#message").text("Username must contain at least 5 characters. Try again");
        username.value = '';
        return;
    }
    let fetchString = `/api/users/register`;
    const response = await fetch(fetchString, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username.value, password: password.value})
    });
    const result = await response.json();
    $("#message").text(result.message);
}

async function logout(id) {
    let fetchString = `/api/users/logout`;
    let response = await fetch(fetchString, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: id})
    });
    let result = await response.json();
    if (result.id) {
        let fetchString = `/destroysession`;
        let response = await fetch(fetchString, {
            method: 'DELETE'
        });
        let result = await response.json();
        if (result.message === "Session destroyed") {
            setLoginHtml();
        } else {
            alert (result.message);
        }
    } else {
        alert (result.message);
    }

    //redirect
    window.location.replace('/');
}

function setLoginHtml() {
    $('#nav-my-account').hide();
    $('#login-style').text("Login").attr({"data-target": "#loginModal", "data-toggle": "modal"}).removeAttr('onClick');
}

function setLogoutHtml(id) {
    $("#my-account").attr("href", `/myAccount/${id}`);
    $('#nav-my-account').show();
    $('#login-style').text("Logout").removeAttr('data-target data-toggle').attr('onClick', `logout(${id});`);
}

window.addEventListener("load", () => {
    checkSession();
});

async function checkSession() {
    const response = await getLoginSession();
    if (response) {
        setLogoutHtml(response);
    } else {
        setLoginHtml();
    }
}

async function getLoginSession() {
    let fetchString = `/getsession`;
    const response = await fetch(fetchString);
    const result = await response.json();
    if (result.id) {
        return result.id;
    } else {
        console.log("Something went wrong");
    }
}