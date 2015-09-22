Cinema = new Mongo.Collection("cinema");

if (Meteor.isServer) {
  SyncedCron.add({
    name: 'CinemaInfo cron job',
    schedule: function(parser) {
      // ==== for debug ====
      return parser.text('every 10 seconds');
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
    var getCinemaInfo = function (err, $, res) {
      var cinemaTitles = [];
      $('li.col a').each(function() {
        if ($(this).attr('title')) {
          cinemaTitles.push($(this).attr('title'));
        }
      });

      for (var i = 0; i < cinemaTitles.length; i++) {
        videoSearch(cinemaTitles[i]);
      }
    };

    var client =  Meteor.npmRequire('cheerio-httpcli');
    client.fetch('http://movies.yahoo.co.jp/trailer/intheater/',
      {},
      getCinemaInfo
    );
}

function operateMongo(cinemaInfo) {

  var parseForMongo = function(info) {
    return {
      "title": info["title"],
      "info": {
        "trailer_url": info["url"],
        "description": info["description"]
      }
    };
  };

  var insertMongo = function(insertObject) {
    var now = new Date();
    var unixTime = Math.floor(now / 1000);
    insertObject["register_date"] = unixTime;
    // Cinema.insert(insertObject);
  };

  insertMongo(parseForMongo(cinemaInfo));
}

function videoSearch(keyword) {
    var YouTube = Meteor.npmRequire('youtube-node');
    var youTube = new YouTube();
    youTube.setKey('AIzaSyCAkVyShgocmoAJYYbnSd1Xm-Jmce-aCs4');
    youTube.search(keyword, 1, function(error, result) {
        if (error) {
            console.log(error);
            return;
        }
        var count = result.items.length;
        if (0 >= count) {
            return;
        }
        var item = result.items[0];
        var videoId = item.id.videoId;
        console.log('VideoID: ' + videoId);
        if (!videoId) {
          return;
        }
        getYouTubeInfo(videoId);
    });
}

function getYouTubeInfo(videoId) {
    var youTubeDownloader = Meteor.npmRequire('youtube-dl');
    var url = 'https://www.youtube.com/watch?v=' + videoId;
    var options = [];
    youTubeDownloader.getInfo(url, options, function(error, info) {
      if (error) {
        return;
      }
      if (!info) {
        return;
      }

      operateMongo(info);
    });
}
