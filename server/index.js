require('dotenv').config()
const express = require('express');
const massive = require('massive')
const session = require('express-session')
const CronJob = require('cron').CronJob;
const socket = require('socket.io')

const authCtrl = require('./controller/authCtrl')
const msgCtrl = require('./controller/messagesCtrl')
const roomCtrl = require('./controller/roomCtrl')
const tmCtrl = require('./controller/teamMemberCtrl')
const companyCtrl = require('./controller/companyCtrl')
const googleCtrl = require('./controller/googleCtrl')
const awsCtrl = require('./controller/awsCtrl')
const mailerCtrl = require('./controller/nodemailerCtrl')

const app = express()

const { SERVER_PORT, SESSION_SECRET, CONNECTION_STRING } = process.env

// middleware
app.use( express.static( `${__dirname}/../build` ) );
app.use(express.json())
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))


massive(CONNECTION_STRING).then(db => {
    app.set("db", db)
    console.log("database set!")
    console.log(db.listTables())
})

// sockets
const io = socket(app.listen(SERVER_PORT, () => { console.log(`listening on port ${SERVER_PORT}`) }))
io.on('connection', socket => {
    // console.log(`users are connected`)
    socket.on('socket room', data => {
        socket.join(data)
        // console.log('joined socket room', data)
        socket.to(data).emit('join socket room', data)
    })
    socket.on('leave socket room', data => {
        socket.leave(data)
        // console.log('leaving')
    })
    socket.on('socket room message', data => {
        io.in(data.company_id).emit('socket room message', data)
    })

})

const checkForReviews = async () => {
    console.log("cron job")
    const db = app.get('db')
    try {
        const storedReviews = await db.getGoogleReviewsByCompanyId({ company_id: 27 }).catch(console.log)
        const reviewsOnGoogle = await googleCtrl.getDetails('ChIJfYKWT1eXTYcR_a7a4hlR4fE')
        if (reviewsOnGoogle[0].time !== storedReviews[storedReviews.length-1].time_stamp) {
            console.log(storedReviews[storedReviews.length-1].time_stamp)
            //emit to socket
            const { text, author_name, author_url, language, profile_photo_url, rating, time } = reviewsOnGoogle[0]

            io.in(27).emit('socket room message', {
                messageInput: text,
                author_name,
                rating,
                company_id: 27,
                room: 28,
                team_member_id: null
            })
            await db.addReview({
                author_name, 
                author_url,
                lang: language, 
                profile_photo_url,
                rating,
                review: text,
                time_stamp: time,
                company_id: 27
            }).catch(console.log)

            await db.addMessage({
                message: text,
                author_name,
                rating,
                google_review: true,
                chat_room_id: 28,
                time_stamp: new Date(),
                team_member_id: null
            }).then(() => console.log('added message')).catch(console.log)
        }
    } catch (error) {
        console.log(error)
    }

}

const job = new CronJob('5 4 * * *', checkForReviews, null, true, 'America/Los_Angeles')
job.start()

// app.get('/auth', authCtrl.getCurrentUser)
app.post('/auth/login', authCtrl.login)
// app.post('/auth/register', authCtrl.register)
// app.post('/auth/login', authCtrl.login)
app.post('/auth/register-company', authCtrl.registerCompany)
app.post('/auth/register-user', authCtrl.registerUser)
app.get('/auth/logout', authCtrl.logout)
app.get('/auth/session', authCtrl.getSessionUser)

app.get('/messages/:room', msgCtrl.getMessagesByRoomId)
app.post('/messages', msgCtrl.addMessage)

app.get('/rooms/:co_id', roomCtrl.getAllRoomsByCompany)
app.post('/rooms', roomCtrl.addNewRoom)
app.put('/rooms/:room_id', roomCtrl.updateRoom)
app.delete('/rooms/:room_id', roomCtrl.deleteRoom)

app.get('/team-members/:co_id', tmCtrl.getMembersByCompany)
// app.get('/team-members/:room_id', tmCtrl.getMembersByRoom)
app.get('/team-member/:team_member_id', tmCtrl.getMember)
app.post('/team-member', tmCtrl.addMember)
app.put('/team-member', tmCtrl.updateMember)
app.delete('/team-member/:team_member_id', tmCtrl.deleteMember)

// app.get('/company', companyCtrl.getCompany)
// app.post('/company', companyCtrl.addCompany)
// app.put('/company', companyCtrl.updateCompany)
// app.delete('/company', companyCtrl.deleteCompany)
app.get('/company-ids', companyCtrl.getCompanies)

app.get('/places/search/:company', googleCtrl.searchPlaces)
app.get('/google-reviews/:company_id', googleCtrl.getGoogleReviews)

app.get('/api/sig', awsCtrl.getSig)

// onBoarding
app.get('/onboarding/:team_member_id', tmCtrl.onBoardingTeamMember)
app.put('/onboarding/:team_member_id', tmCtrl.onBoardingUpdatePassword)
app.post('/email-team-member', mailerCtrl.sendLoginRequest)

app.get('/unread-messages/:team_member_id', msgCtrl.getUnreadMessages)
app.post(`/unread-messages`, msgCtrl.addUnreadMessages)
app.delete(`/unread-messages/:team_member_id/:chat_room_id`, msgCtrl.removeUnreadMessages)
