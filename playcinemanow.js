Cinema = new Mongo.Collection("cinema");

if (Meteor.isServer) {
  SyncedCron.add({
    name: 'Get CinemaObject by cron',
    schedule: function(parser) {
      // ==== for debug ====
      return parser.text('every 3 seconds');
      // return parser.text('at 10:15 am');
    },
    job: function() {
      var cinemaCronJob = CinemaCronJob();
      return cinemaCronJob;
    }
  });
  SyncedCron.start();
}

if (Meteor.isClient) {
  // This code only runs on the client
  Template.cinema.helpers({
    cinema: function() {
      var cinema_lists = Cinema.find({}).fetch();

      var aud = document.getElementById("cinema");
      aud.onended = function() {
          alert("The audio has ended");
      };

      return cinema_lists[0].info.trailer_url;
    }
  });
}

function CinemaCronJob() {
  var getCinemaInfo = function () {
    // ここに情報持ってくる処理
    var cinemaObject = {
      "title": "xxx",
      "info": {
        "trailer_url": "http://xxx"
      }
    };
    return cinemaObject;
  };

  var insertMongo = function(cinemaInfo) {
    var now = new Date();
    var unixTime = Math.floor(now / 1000);
    Cinema.insert({
      "title": cinemaInfo["title"],
      "info": cinemaInfo["info"],
      "register_date":unixTime
    });
  };

  insertMongo(getCinemaInfo());
}

