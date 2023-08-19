const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running!!!!");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBServer();
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `
  SELECT * FROM user WHERE username='${username}';
  `;
  const dbUser = await db.get(userQuery);
  if (dbUser === undefined) {
    //create new user
    const newUser = `
    INSERT INTO user (username,name,password,gender,location)
    VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');
    `;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addNewUser = await db.run(newUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    //user already exists
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `
    SELECT * FROM user WHERE username='${username}';
    `;
  const getUserFromDb = await db.get(getUser);
  if (getUserFromDb === undefined) {
    //invalid user login
    response.status(400);
    response.send("Invalid user");
  } else {
    //check password
    //if password is incorrect incorrect password else successfull
    //login
    const isPasswordSame = await bcrypt.compare(
      password,
      getUserFromDb.password
    );
    if (isPasswordSame === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserRequested = `
    SELECT * FROM user WHERE username='${username}';
    `;
  const userPresent = await db.get(getUserRequested);
  if (userPresent === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      userPresent.password
    );
    if (isOldPasswordCorrect === true) {
      //check for new password and update
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        response.status(200);
        response.send("Password updated");
      }
    } else {
      //incorrect current password
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
