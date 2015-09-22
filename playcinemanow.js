Cinema = new Mongo.Collection("cinema");


if (Meteor.isServer) {
  var cheerio =  Meteor.npmRequire('cheerio-httpcli');
  HTTP.get(
    'http://movies.yahoo.co.jp/trailer/intheater/',
    function(error, result){
      // var parser = new DOMParser();
      // var resultDom = parser.parseFromString(result, "text/html");
      console.log(result);
    }
  );
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
    // SyncedCron.start();
var videoSearch = function(keyword, count, callback) {
    var YouTube = Meteor.npmRequire('youtube-node');
    var youTube = new YouTube();
    youTube.setKey('AIzaSyCAkVyShgocmoAJYYbnSd1Xm-Jmce-aCs4');
    youTube.search(keyword, count, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            var count = result.items.length;
            if (0 >= count) {
                return;
            }
            var item = result.items[0];
            var videoId = item.id.videoId;
            console.log('VideoID: ' + videoId);
            if (callback != null) {
                callback();
            }
        }
    });
}
    videoSearch('abc', 1, null);
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

  // insertMongo(getCinemaInfo());
}
