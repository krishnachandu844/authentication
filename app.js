const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");
const databasePath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started Running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbServer();

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `
  SELECT
     * 
    FROM
    user
    WHERE
        username='${username}';`;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    const createUserQuery = `
        INSERT INTO 
        user (username,name,password,gender,location)
        VALUES
        (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const dbResponse = await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `
    SELECT
     * 
    FROM
    user
    WHERE
        username='${username}';`;
  const dataBaseUser = await db.get(getUserQuery);
  if (dataBaseUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      dataBaseUser.password
    );
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getUserQuery = `
    SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(getUserQuery);

  if (dbResponse === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      const lengthOfNewPwd = newPassword.length;
      if (lengthOfNewPwd < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
          update user set password='${hashedPassword}'
          where username='${username}';`;
        await db.run(updateQuery);
      }
    } else {
      response.send("Invalid Password");
      response.status(400);
    }
  }
});
