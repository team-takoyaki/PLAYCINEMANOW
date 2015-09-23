Cinema = new Meteor.Collection("cinema");

if (Meteor.isClient) {
    var cinemaLists = [];

    Meteor.subscribe('onReady', function() {
        cinemaLists = getCinemaLists();
        // 初期設定値
        // counterはcinema.eventsでカウントアップ
        Session.set('counter', Math.floor(Math.random() * cinemaLists.length));
        play();
    });

    Template.cinema.events({
        'ended video': function (event, template) {
            var counter = Session.get('counter');
            counter += 1;
            Session.set('counter', counter);

            play();
        }
    });
}

function play() {
    var counter = Session.get('counter');
    if (!cinemaLists[counter]) {
        counter += 1;
        if (cinemaLists.length < counter) {
            counter = 0;
        }
        Session.set('counter', counter);
        play();
        return;
    }
    var url = cinemaLists[counter].info.trailer_url;
    var video = document.querySelector('video');
    video.src = url;
    video.play();
}

function getCinemaLists() {
    var cinemas = Cinema.find({}).fetch();
    return cinemas;
}

//=============================

if (Meteor.isServer) {
    SyncedCron.add({
        name: 'CinemaInfo cron job',
        schedule: function(parser) {
            return parser.text('every 15 minutes');
        },
        job: function() {
            var cinemaCronJob = CinemaCronJob();
            Cinema.remove({});
            return cinemaCronJob;
        }
    });
    Meteor.startup(function () {
        SyncedCron.start();
        
        // cron job at first
        CinemaCronJob();
    });

    Meteor.publish('onReady', function() {
        return Cinema.find({});
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
