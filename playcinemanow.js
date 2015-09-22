Cinema = new Mongo.Collection("cinema");

if (Meteor.isClient) {

    Template.cinema.events({
        'ended video': function () {
            //カウント
            Session.set('counter', Session.get('counter') + 1);
        }
    });

    // This code only runs on the client
    Template.cinema.helpers({
        cinema: function() {

            //初期設定値
            Session.setDefault('counter', 0);

            //counterはcinema.eventsでカウントアップ
            var cinema_lists = getCinemaLists();

            //動画全体の数を取得
            var movie_count = 0;
            for (var j in cinema_lists){
                movie_count++;
            }
            //再生する順番を取得
            var counter = Session.get('counter');

            //もしも最後のものを再生した後なら最初から
            if (movie_count < counter) {
                Session.set('counter', 0);
            }

            return cinema_lists[counter].info.trailer_url;
        }
    });
}

function getCinemaLists() {

    var cinemaLists = Cinema.find().fetch();
    // insert sample
    if (0 >= cinemaLists.length) {
        insertSampleCinemaLists();
        cinemaLists = Cinema.find().fetch();
    }
    console.log(cinemaLists);
    return cinemaLists;

}

function insertSampleCinemaLists() {
    for (var i = 0; i < 3; i++) {
        var array = [];
        var info = {'trailer_url': 'https://r16---sn-oguesnlk.googlevideo.com/videoplayback?ratebypass=yes&sver=3&signature=72CFA595700C120FD2E23D7097C1FC5DF2E2C7B4.0FA00C2B6049C1A4A2F0F3D1BDE7951926FF5569&ipbits=0&ip=111.107.156.181&key=cms1&upn=YckR4ZCGrOg&id=15ce1e673fd15d56&sparams=dur,expire,id,initcwndbps,ip,ipbits,itag,lmt,mime,mm,mn,ms,mv,nh,pl,ratebypass,requiressl,source,upn&lmt=1440661907969728&fexp=9405994%2C9408136%2C9408495%2C9408710%2C9408939%2C9409069%2C9409172%2C9410705%2C9415365%2C9415485%2C9416023%2C9416126%2C9416524%2C9416729%2C9416985%2C9417707%2C9418008%2C9418153%2C9418204%2C9418448%2C9419785%2C9420348%2C9420382%2C9420928%2C9421013%2C9421153%2C9421291&requiressl=yes&source=youtube&itag=22&pl=20&dur=106.881&mime=video%2Fmp4&expire=1442935371&redirect_counter=1&req_id=880712ebf299a3ee&cms_redirect=yes&mm=30&mn=sn-oguesnlk&ms=nxu&mt=1442913792&mv=m&nh=IgpwcjAyLm5ydDEwKgkxMjcuMC4wLjE', 'site_url': ''};
        var now = new Date();
        var unixTime = Math.floor(now / 1000);
        Cinema.insert({
            "title": 'ポプラの秋',
            "info": info,
            "register_date": unixTime
        });
    }
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

        Cinema.insert(insertObject);
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
            operateMongo(info);
        }).run();
    });
}
