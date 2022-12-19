async function login() {
  let username = document.getElementById("username");
  let password = document.getElementById("password");

  const cookie = getCookie("XSRF-TOKEN");
  console.log("XSRF", cookie);

  let fetchString = `secure-api/users/login`;
  const response = await fetch(fetchString, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "CSRF-Token": cookie,
    },
    body: JSON.stringify({
      username: username.value,
      password: password.value,
    }),
  });
  username.value = "";
  password.value = "";
  let result = await response.json();
  const userId = result.claims.user_id;
  if (userId) {
    $("#loginModal").modal("hide");
    setLogoutHtml(userId);
    window.location.replace("/");
  } else {
    $("#message").text("Something went wrong with sign in");
  }

  //redirect
}

function registerStart() {
  $("#repeatPasswordLabel").show();
  $("#repeatPassword").show();
  $("#register")
    .attr("onclick", "register()")
    .removeClass("btn-secondary")
    .addClass("btn-primary");
  $("#loginButton")
    .attr("onclick", "loginStart()")
    .addClass("btn-secondary")
    .removeClass("btn-primary");
  $(".modal-title").text("Register");
}

function loginStart() {
  $("#repeatPasswordLabel").hide();
  $("#repeatPassword").hide();
  $("#register")
    .attr("onclick", "registerStart()")
    .addClass("btn-secondary")
    .removeClass("btn-primary");
  $("#loginButton")
    .attr("onclick", "login()")
    .removeClass("btn-secondary")
    .addClass("btn-primary");
  $(".modal-title").text("Login");
}

async function register() {
  let username = document.getElementById("username");
  let password = document.getElementById("password");
  let repeatPassword = document.getElementById("repeatPassword");
  if (password.value !== repeatPassword.value) {
    $("#message").text("Passwords do not match. Try again");
    password.value = "";
    repeatPassword.value = "";
    return;
  } else if (
    !password.value.match(
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*?[\.,_"!@#$%^&*+`~'=?\|\]\[\(\)\-<>/]).{8,}$/
    )
  ) {
    $("#message").text(
      "Passwords must contain at least 8 characters (1 lowercase letter, 1 uppercase letter, number and a special character .,_\"!@#$%^&*+`~'=?|][()-<>/). Try again"
    );
    password.value = "";
    repeatPassword.value = "";
    return;
  } else if (!username.value.match(/^.{5,}$/)) {
    $("#message").text(
      "Username must contain at least 5 characters. Try again"
    );
    username.value = "";
    return;
  }
  let fetchString = `/secure-api/users/register`;
  const response = await fetch(fetchString, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.value,
      password: password.value,
    }),
  });
  const result = await response.json();
  console.log(result);
  $("#message").text(result.message);
  if (result?.accessToken && result?.claims) {
    window.location.replace("/");
  }
}

async function logout() {
  let fetchString = `/secure-api/users/logout`;
  let response = await fetch(fetchString, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  console.log(response);
  if (response.status === 200) {
    setLoginHtml();
  } else {
    console.log("Couldn't log out");
  }

  //redirect
  window.location.replace("/");
}

function setLoginHtml() {
  $("#nav-my-account").hide();
  $("#login-style")
    .text("Login")
    .attr({ "data-target": "#loginModal", "data-toggle": "modal" })
    .removeAttr("onClick");
}

function setLogoutHtml(id) {
  $("#my-account").attr("href", `/myAccount/${id}`);
  $("#nav-my-account").show();
  $("#login-style")
    .text("Logout")
    .removeAttr("data-target data-toggle")
    .attr("onClick", `logout(${id});`);
}

window.addEventListener("load", () => {
  checkCsrf();
  checkSession();
});

function getCookie(name) {
  let cookie = {};
  document.cookie.split(/\s*;\s*/).forEach(function (pair) {
    pair = pair.split(/\s*=\s*/);
    let key = decodeURIComponent(pair[0]);
    let value = decodeURIComponent(pair.splice(1).join("="));
    cookie[key.trim()] = value;
  });

  return cookie[name];
}

async function checkSession() {
  try {
    const cookie = getCookie("auth");
    let user;
    if (cookie) {
      user = JSON.parse(cookie);
    }
    console.log("AUTH", user);

    let userId;
    if (user?.accessToken && user?.claims) {
      userId = user.claims.user_id;
    } else {
      console.log("REFRESH");
      userId = await refreshToken();
    }

    if (userId) {
      setLogoutHtml(userId);
    } else {
      setLoginHtml();
    }
  } catch (err) {
    console.log(err);
  }
}

async function checkCsrf() {
  let fetchString = `/secure-api/csrf`;
  const response = await fetch(fetchString);
  const result = await response.json();
  console.log(result);

  let csrf = document.getElementsByName("_csrf")[0].value;
  console.log(csrf);
}

async function refreshToken() {
  let fetchString = `/secure-api/refresh`;
  const response = await fetch(fetchString);
  const result = await response.json();
  if (result.accessToken && result.claims) {
    console.log("ON REFRESH TOKEN", result);
    return result.claims.user_id;
  } else {
    console.log("Something went wrong");
  }
}
