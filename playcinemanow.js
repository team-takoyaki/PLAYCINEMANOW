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
  Template.body.helpers({
    cinema_list: function () {
      return Cinema.find({});
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