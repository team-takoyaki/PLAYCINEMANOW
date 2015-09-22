Cinema = new Meteor.Collection("cinema");

if (Meteor.isClient) {
    // 初期設定値
    Session.setDefault('counter', 0);
    //counterはcinema.eventsでカウントアップ
    var cinemaLists = getCinemaLists();
    //動画全体の数を取得
    var movieCount = cinemaLists.length;

    Template.cinema.rendered = function() {
        var counter = Session.get('counter');
        var url = cinemaLists[counter].info.trailer_url;
        var video = document.querySelector('video');
        console.log('URL: ' + url);
        video.src = url;
        video.play();
    }

    Template.cinema.events({
        'ended video': function (event, template) {
            var counter = Session.get('counter');
            counter += 1;
            //もしも最後のものを再生した後なら最初から
            if (movieCount < counter) {
                counter = 0;
            }
            Session.set('counter', counter);
            var url = cinemaLists[counter].info.trailer_url;
            console.log('COUNT:' + counter + ', URL: ' + url);
            var video = template.find('video');
            video.src = url;
            video.play();
        }
    });
}

function getCinemaLists() {
    var cinemas = Cinema.find({}).fetch();
    console.log(cinemas.length);
    return cinemas;
}

//=============================

if (Meteor.isServer) {
    SyncedCron.add({
        name: 'CinemaInfo cron job',
        schedule: function(parser) {
            return parser.text('at 4:15 am');
        },
        job: function() {
            var cinemaCronJob = CinemaCronJob();
            Cinema.remove({});
            return cinemaCronJob;
        }
    });
    Meteor.startup(function () {
        SyncedCron.start();
        var findResult = Cinema.find().fetch();
        if (0 >= findResult.length) {
            CinemaCronJob();
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

function OperateMongo(info) {
    this.cinemaInfo = info;

    this.parseForMongo = function() {
        return {
            "title": this.cinemaInfo["title"],
            "info": {
                "trailer_url": this.cinemaInfo["url"],
                "description": this.cinemaInfo["description"]
            }
        };
    };

    this.insertMongo = function() {
        var now = new Date();
        var unixTime = Math.floor(now / 1000);
        var insertObject = this.parseForMongo();
        insertObject["register_date"] = unixTime;

        Cinema.insert(insertObject);
    };
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

function getYouTubeInfo(videoId, callback) {
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
        console.log(info.title);
        var Fiber = Meteor.npmRequire('fibers');
        Fiber(function() {
            var operateMongo = new OperateMongo(info);
            operateMongo.insertMongo();
        }).run();
    });
}
