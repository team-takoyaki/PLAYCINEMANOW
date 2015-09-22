Cinema = new Mongo.Collection("cinema");

if (Meteor.isServer) {
    var client =  Meteor.npmRequire('cheerio-httpcli');
    client.fetch('http://movies.yahoo.co.jp/trailer/intheater/',
                 {},
                 parseCinemaTitles
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

    videoSearch('ピクセル　プロモーション映像　劇場予告編1');
}

if (Meteor.isClient) {
    Template.cinema.events({
        'ended video': function () {
            console.log("video ended");
        }
    });

    // This code only runs on the client
    Template.cinema.helpers({
        cinema: function() {
            var cinema_lists = getCinemaLists();
            var url = cinema_lists[0].info.trailer_url;
            console.log('url: ' + url);
            return url;
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
