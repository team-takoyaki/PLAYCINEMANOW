Cinema = new Mongo.Collection("cinema");

var client =  Meteor.npmRequire('cheerio-httpcli');
client.fetch('http://movies.yahoo.co.jp/trailer/intheater/',
  {},
  parseCinemaTitles
);

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
    // SyncedCron.start();
    
    videoSearch('ピクセル　プロモーション映像　劇場予告編1');
}

if (Meteor.isClient) {
    // This code only runs on the client
    Template.body.helpers({
        cinema_list: function () {
            return Cinema.find({});
        }
    });
}

function parseCinemaTitles(err, $, result) {
  var cinemaTitles = [];
  $('li.col a').each(function() {
    if ($(this).attr('title')) {
      cinemaTitles.push($(this).attr('title'));
    }
  });
  // console.log(cinemaTitles);
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
        // ここでデータベースに入れる
        console.log('url: ', info.url);
    });
}
