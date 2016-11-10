'use strict';
var express = require('express');
var router = express.Router();
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){

    client.query('SELECT tweets.id, userid, content, name, pictureurl FROM tweets INNER JOIN users ON (tweets.userid = users.id)', function(err, result) {
          if (err) return next(err);
          var tweets = result.rows;
          res.render('index', {
              title: 'Twitter.js',
              tweets: tweets,
              showForm: true
          });
      });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){

      client.query('SELECT tweets.id, userid, content, name, pictureurl FROM tweets INNER JOIN users ON (tweets.userid = users.id) WHERE name = $1', [req.params.username], function(err, result) {
          if (err) return next(err);
          var tweets = result.rows;
          res.render('index', {
            title: 'Twitter.js',
            tweets: tweets,
            showForm: true,
            username: req.params.username
          });
      })

    //var tweetsForName = tweetBank.find({ name: req.params.username });

  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){

      client.query('SELECT tweets.id, userid, content, name, pictureurl FROM tweets INNER JOIN users ON (tweets.userid = users.id) WHERE tweets.id = $1', [req.params.id], function(err, result) {
          if (err) return next(err);
          var tweets = result.rows;
          res.render('index', {
            title: 'Twitter.js',
            tweets: tweets,
            showForm: true
          });
      });

    // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){

      let userName;
      let name = req.body.name;
      let content = req.body.content;
      client.query('SELECT id FROM users WHERE name = $1', [name], function(err, result) {
          if (err) return next(err);


          if (result.rows.length === 0) {
              client.query('INSERT INTO users (name) VALUES ($1)', [name], function(err, result) {
                  if (err) return next(err);
                  client.query('SELECT id FROM users WHERE name = $1', [name], function(err, result) {
                      if (err) return next(err);
                      insertIntoTable(result.rows[0].id, content);
                    //   userName = result.rows[0].id;
                    //   client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userName, content], function(err, result) {
                    //       if (err) return next(err);
                    //       let newTweet = {
                    //            name: name,
                    //            content: content,
                    //            id: userName
                    //        };
                    //     io.sockets.emit('new_tweet', newTweet);
                    //     res.redirect('/');
                    //   });
                  });
              });

          } else {
              insertIntoTable(result.rows[0].id, content);
          }

          function insertIntoTable(userName, content) {
              client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [userName, content], function(err, result) {
                  if (err) return next(err);
                  client.query('SELECT id FROM tweets WHERE userid = $1 AND content = $2', [userName, content], function(err, result) {
                      if (err) return next(err);
                      let newTweet = {
                           name: name,
                           content: content,
                           id: result.rows[0].id
                       };
                    io.sockets.emit('new_tweet', newTweet);
                    res.redirect('/');
                  });

          });
        }

      });



      //client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [req.body.name, req.body.content], function(err, result) {
          //console.log(result);
      //})

  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
