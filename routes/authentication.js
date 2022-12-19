const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// let db = require("../database/connection").getConnection('guest');
const { getConnection, disconnect } = require("../database/connection")
var { randomBytes } = require("crypto");
let db = getConnection('guest');

router.get("/secure-api/csrf", (req, res) => {
  // console.log(req.csrfToken);
  if (req.session.csrf === undefined) {
    req.session.csrf = randomBytes(100).toString("base64");
  }
  res.json({ token: req.session.csrf });
});

router.get("/secure-api/refresh", (req, res) => {
  const { cookies } = req;

  if (!cookies?.session) return res.sendStatus(401);
  const refreshToken = cookies.session;

  try {
    const query = "SELECT * FROM user WHERE refresh_token = ?;";
    db.query(query, [refreshToken], (error, result, fields) => {
      if (result[0]) {
        jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
          (err, payload) => {
            if (err || result[0].user_id !== payload.user_id)
              return res.sendStatus(403);

            const roleQuery = "SELECT * from role WHERE role_id = ?";

            let user = {
              user_id: result[0].user_id,
              username: result[0].username,
            };

            db.query(
              roleQuery,
              [result[0].role_id],
              (error, result, fields) => {
                let role = {};

                if (result) {
                  role["role_id"] = result[0].role_id;
                  role["role"] = result[0].role;

                  if (role?.role_id !== undefined && role?.role) {
                    user = { ...user, ...role };
                  }

                  const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
                    expiresIn: "30s",
                  });

                  res.cookie(
                    "auth",
                    JSON.stringify({ accessToken, claims: user }),
                    {
                      maxAge: 1 * 60 * 1000,
                    }
                  );
                  res.status(202).json({ claims: user, accessToken });
                } else {
                  res.status(500).message("Internal server error");
                }
              }
            );
          }
        );
      } else {
        return res.sendStatus(403);
      }
    });
    // db.release();
  } catch (e) {
    return res.sendStatus(403);
  }
});

router.post("/secure-api/users/register", (req, res) => {
  const { username, password } = req.body;
  try {
    console.log(username, password);

    // checkusername(username);
    const saltRounds = 15;
    let query = null;
    bcrypt.hash(password, saltRounds, (error, hash) => {
      if (!error) {
        query = "SELECT * FROM user WHERE username=?;";
        db.query(query, [username], (error, result, fields) => {
          // console.log(result);
          if (result && result.length === 1) {
            res.status(409).send({
              message:
                "User with the same username already exists. Try to login.",
            });
          } else if (result.length == 0) {
            const accessToken = jwt.sign({ username }, process.env.JWT_SECRET, {
              expiresIn: "30s",
            });
            const refreshToken = jwt.sign(
              { username },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: "1d" }
            );

            query = "INSERT INTO user (username, password, role_id, refresh_token) VALUES (?, ?, ?, ?);";
            db.query(
              query,
              [username, hash, 1, refreshToken],
              (error, result, fields) => {
                // console.log('res', result);
                if (result.affectedRows === 1) {
                  console.log(result);

                  res.cookie("session", refreshToken, {
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                  });
                  res.cookie(
                    "auth",
                    JSON.stringify({
                      accessToken,
                      claims: {
                        username,
                        user_id: result.insertId,
                        role: "user",
                        role_id: 1, // always user
                      },
                    }),
                    {
                      maxAge: 1 * 60 * 1000,
                    }
                  );

                  res.status(202).json({
                    message: `User ${username} is registered & logged in!`,
                    claims: {
                      username,
                      user_id: result.insertId,
                      role: "user",
                      role_id: 1,
                    },
                    accessToken,
                  });
                } else {
                  console.log("error query insert user data:", error);
                  res.status(500).send({
                    message: error,
                  });
                }
              }
            );
          } else {
            console.log("error query username", error);
            res.status(500).send({
              message: error,
            });
          }
        });

        // db.release();
      } else {
        console.log("error bcrypt.hash:", error);
        res.status(500).send({
          message: error,
        });
      }
    });
  } catch (e) {
    console.log("internal error:", e.message);
    return res.status(422).send({
      message: e.message,
    });
  }
});

router.post("/secure-api/users/login", (req, res) => {
  const { username, password } = req.body;
  // checkEmail(email);
  if (!username || !password) {
    return res
      .status(422)
      .send({ message: "Must provide username and password" });
  }
  try {
    const query = "SELECT * FROM user WHERE username = ?;";
    db.query(query, [username], (error, result, fields) => {
      // console.log(result);
      if (result && result.length === 1) {
        // console.log(result);
        bcrypt.compare(password, result[0].password, (error, match) => {
          if (match) {
            let user = {
              user_id: result[0].user_id,
              username: result[0].username,
              role_id: result[0].role_id,
            };

            const roleQuery = "SELECT * from role WHERE role_id = ?";

            
            db.query(
              roleQuery,
              [result[0].role_id],
              (error, result, fields) => {
                let role = {};

                if (result) {
                  role["role_id"] = result[0].role_id;
                  role["role"] = result[0].role;

                  if (role?.role_id !== undefined && role?.role) {
                    user = { ...user, ...role };
                  }

                  const refreshToken = jwt.sign(
                    user,
                    process.env.REFRESH_TOKEN_SECRET,
                    {
                      expiresIn: "1d",
                    }
                  );

                  const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
                    expiresIn: "30s",
                  });

                  const refreshQuery = `UPDATE user SET refresh_token = ? WHERE user_id = ?;`;
                  db = getConnection('user');
                  db.query(
                    refreshQuery,
                    [refreshToken, user.user_id],
                    (error, result, fields) => {
                      if (result && result.affectedRows) {
                        res.cookie("session", refreshToken, {
                          httpOnly: true,
                          sameSite: "none",
                          secure: true,
                          maxAge: 24 * 60 * 60 * 1000, // 1 day
                        });
                        res.cookie(
                          "auth",
                          JSON.stringify({ accessToken, claims: user }),
                          {
                            maxAge: 1 * 60 * 1000,
                          }
                        );
                        res.status(202).json({ claims: user, accessToken });
                      } else {
                        res
                          .status(500)
                          .send({ message: "Something went wrong" });
                      }
                    }
                  );
                } else {
                  res.status(500).message("Internal server error");
                }
              }
            );
          } else {
            return res
              .status(401)
              .send({ message: "Invalid password or email" });
          }
        });
      } else {
        return res.status(401).send({ message: "Invalid password or email" });
      }
    });
    // db.release();
  } catch (e) {
    return res.status(401).send({ message: "Invalid password or username" });
  }
});

router.get("/secure-api/users/logout", (req, res) => {
  const { cookies } = req;
  console.log(cookies);
  if (!cookies?.session) return res.sendStatus(204);
  const refreshToken = cookies.session;

  res.clearCookie("auth");

  try {
    // check if refresh token is inside gb
    const query = "SELECT * FROM user WHERE refresh_token = ?";
    db.query(query, [refreshToken], (error, result, fields) => {
      console.log(result);
      if (!result[0]) {
        res.clearCookie("session", {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
        return res.sendStatus(204);
      }

      // delete refresh token from db
      const query = "UPDATE user SET refresh_token = ? WHERE user_id = ?";
      db.query(query, ["", result[0].user_id], (error, result, fields) => {
        if (result && result.affectedRows) {
          res.clearCookie("session", {
            httpOnly: true,
            sameSite: "none",
            secure: true,
          });
          res.sendStatus(200);
        }
      });
    });
    // db.release();
  } catch (e) {
    return res.sendStatus(403);
  }
});

// const checkEmail = (email) => {
//   const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
//   if (email.match(mailFormat)) {
//     return true;
//   }
//   throw new Error('Invalid format');
// };

const checkUsername = (username) => {
  const nameFormat = /^\s*([A-Za-z]{1,}([\.,] |[-']| ))+[A-Za-z]+\.?\s*$/; // english ones, for now

  if (username.match(nameFormat)) {
    if (username.length > 70) {
      throw new Error("Expected length exceeded");
    }
    return true;
  }
  throw new Error("Invalid format");
};

module.exports = {
  checkUsername,
  router,
};
