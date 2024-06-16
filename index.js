
const express = require('express');
const Sequelize = require('sequelize');

let DB_INFO = "postgres://messageapp:TheFirstTest@postgres:5432/messageapp";
let pg_option = {};

if (process.env.DATABASE_URL) {
  DB_INFO = process.env.DATABASE_URL;
  pg_option = { ssl: { rejectUnauthorized: false } };
}

const sequelize = new Sequelize(DB_INFO, {
  dialect: 'postgres',
  dialectOptions: pg_option,
});

const PORT = 8080;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use("/public", express.static(__dirname + "/public"));

const Messages = sequelize.define('messages', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  message: Sequelize.TEXT
},
  {
    // timestamps: false,      // disable the default timestamps
    freezeTableName: true   // stick to the table name we define
  }
);

sequelize.sync({ force: false, alter: true })
  .then(setupRoute)
  .catch((mes) => {
    console.log("db connection error");
  });

let lastMessage = "";

function setupRoute() {
  console.log("db connection succeeded");
  app.get('/', (req, res) => {
    res.render('top.ejs');
  });

  app.get('/add', (req, res) => {
    res.render('add.ejs', { lastMessage: lastMessage });
  });

  app.post('/add', (req, res) => {
    let newMessage = new Messages({
      message: req.body.text
    });
    newMessage.save()
      .then((mes) => {
        lastMessage = req.body.text;
        res.render('add.ejs', { lastMessage: lastMessage });
      })
      .catch((mes) => {
        res.send("error");
      });
  });

  app.get('/view', (req, res) => {
    Messages.findAll()
      .then((result) => {
        let allMessages = result.map((e) => {
          return e.message + " " + e.createdAt;
        });
        res.render('view.ejs', { messages: allMessages });
      });
  });
}

app.listen(process.env.PORT || PORT);
