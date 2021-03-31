require('dotenv/config')
const express = require('express')
const twilio = require('twilio')
const VoiceResponse = twilio.twiml.VoiceResponse
const bodyParser = require('body-parser')
const accountSid = process.env.TWILIO_ACCOUNT_SID
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const destNumber = process.env.DEST_NUMBER
const client = twilio(accountSid, authToken)

const app = express()

app.use(bodyParser.urlencoded())

app.post('/start', (request, response) => {
  const twiml = new VoiceResponse()

  twiml.say({voice: 'alice'}, "Thank you for calling Josh!")

  const gather = twiml.gather({numDigits: 1, input: 'dtmf speech', hints: ['one', 'two', 'three'], finishOnKey: '', action: '/gather', method: 'POST'})

  twiml.pause()

  gather.say('If you are a telemarketer or selling a product, press 1. If you would like to schedule a call, press 2. If you have a scheduled call, or the matter is urgent, press 3.')

  response.type('text/xml')
  response.send(twiml.toString())
})

app.post('/gather', (request, response) => {
  const twiml = new VoiceResponse()

  if (request.body.Digits) {
    switch (request.body.Digits) {
      case '1':
        // TODO record message
        twiml.say('Please remove me from your list. Goodbye.')
        twiml.hangup()
        break

      case '2':
        const digits = request.body.From.replace('+', '').split('').join(' ')
        twiml.say(`We just sent a scheduling link to ${digits} via SMS. Please check your inbox.`)

        sendLink(request.body.From)

        twiml.pause()
        twiml.say('Goodbye.')
        twiml.hangup()

        break

      case '3':
        twiml.say('Please hold, while I direct your call.')
        twiml.dial(destNumber)
        break

      default:
        twiml.say("Sorry, I didn't understand that choise")
        twiml.redirect('/start')
        break
    }
  } else {
    twiml.redirect('/start')
  }

  // Render the response as XML in reply to the webhook request
  response.type('text/xml')
  response.send(twiml.toString())
})

// Create an HTTP server and listen for requests on port 3000
app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Now listening, be sure to restart when you make code changes!'
  )
})

function sendLink(to) {
  client.messages 
      .create({ 
         body: "Hi it's Josh! Use this link to schedule a call with me: http://savvycal.com/joshnuss/chat",  
         messagingServiceSid,
         to 
       }) 
      .then(message => console.log(`Sent SMS to ${to}: ${message.sid}`)) 
      .done()
}
