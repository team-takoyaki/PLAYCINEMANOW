Cinema = new Mongo.Collection("cinema");

if (Meteor.isServer) {
  //ここにServer用
}

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    cinema_list: function () {
      return Cinema.find({});
    }
  });
}