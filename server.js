var request = require('request')
var http = require('http')
var moment = require('moment')

var bbsUrl = 'http://www.bbs.ca.gov/app-reg/'
var message = "Currently fetching, please wait..."

var updating = false
function update (cb) {
  if (updating) return cb(null, message)
  updating = true
  request(bbsUrl, function (er, res, body) {
    if (er) {
      updating = false
      return cb(er)
    }
    try {
      var s = body.split(/Licensed Marriage and Family Therapist Examination Eligibility Applications<\/td>\s*<td headers="date">/)
      var date = s[1].split(/<\/td>/)[0].trim()
    } catch (er) {
      updating = false
      return cb(er)
    }

    var today = new Date()
    var lastSeen = new Date(date)
    var mnmSent = new Date('2014-08-14')

    var currentLag = today - lastSeen
    var humanLag = (currentLag/1000/60/60/24)
    humanLag = Math.round(humanLag * 100) / 100
    var mnmLag = mnmSent.getTime() + currentLag
    var expect = new Date(mnmLag)
    var until = expect - today
    var humanUntil = (until/1000/60/60/24)
    humanUntil = Math.round(humanUntil * 100) / 100
    message = "The current wait time is " +
              humanLag + " days.\n\n" +
              "Expect Marisa's application to be reviewed\n" +
              moment(expect).fromNow() + ",\n" +
              "on " + expect.toString() + "\n" +
              "(" + humanUntil + " days from now)\n"

    updating = false
    cb(er, message)
  })
}

http.createServer(function (req, res) {
  res.setHeader('content-type', 'text/plain')
  update(function (er, message) {
    if (er) {
      res.statusCode = 500
      res.end("An error happened!\n" +
              (er.stack || er.message || er) + "\n")
    } else {
      res.end(message)
    }
  })
}).listen(8080)
