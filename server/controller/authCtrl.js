const bcrypt = require('bcryptjs');
const googleCtrl = require('./googleCtrl')

module.exports = {
	async registerCompany(req, res) {
		const db = req.app.get('db')

		const { company_name, address, google_places_id } = req.body.company

		try {

			//check if company is in db
			const companyExists = await db.getCompanyByPlaceId({ google_places_id })
			if (companyExists[0]) {
				return res.status(409).send('Company is already registered. Please sign in.')
			}
	
			const companyRegistered = await db.registerCompany({ company_name, address, google_places_id })
			const company = companyRegistered[0]
	
			//add default review chat room
			db.addCompanyChatRoom({
				title: 'Reviews',
				description: 'Monitor and discuss company reviews',
				companyId: company.company_id
			}).catch(console.log)
			//add company reviews to db
			const reviews = await googleCtrl.getDetails(company.google_places_id)
			reviews.forEach(review => {
				const {author_name, author_url, language, profile_photo_url, rating, text, time} = review
				db.addReview({
					author_name, 
					author_url, 
					lang: language, 
					profile_photo_url, 
					rating, 
					review: text, 
					time_stamp: time, 
					company_id: company.company_id
				}).catch(console.log)
			})
	
			//add to session
			req.session.company = company
	
			res.status(200).send(company)
		} catch(error) {
			console.log(error)
		}

	},
	login: async (req, res) => {
		console.log('login@authCtrl')
		const db = req.app.get(`db`)
		const { session } = req
		const { email: email } = req.body
		try {
			let emailExists = await db.UserLoginForm({ email })
			const user = emailExists[0]

			const authenticated = bcrypt.compareSync(req.body.password, user.hash)
			
			if (authenticated) {
				delete user.hash
				session.user = user

				res.status(200).send(session.user)
			} else {
				throw new Error(401)
			}
		} catch (error) {
			console.log(error)
			res.sendStatus(401)
		}
	},
	async registerUser(req, res) {
		const db = req.app.get('db')
		const { firstname, lastname, isadmin, img, email, password } = req.body.user
		const { company_id } = req.session.company

		const userExists = await db.getUserByEmail({ email })
		if (userExists[0]) {
			return res.status(409).send('You are already a user. Please sign in.')
		}

		const salt = bcrypt.genSaltSync(10)
		const hash = bcrypt.hashSync(password, salt)

		const memberAdded = await db.registerUser({ firstname, lastname, isadmin, img, company_id })

		const loginAdded = await db.addUserLogin({ email, hash, team_member_id: memberAdded[0].team_member_id })

		req.session.user = memberAdded[0]
		req.session.user.email = loginAdded[0].email
		res.status(200).send(req.session.user)
	},

	getSessionUser(req, res) {
		if (req.session.user) {
			return res.status(200).send({company: req.session.company, user: req.session.user})
		}
		res.send()
	},

	logout: (req, res) => {
        req.session.destroy()
        res.sendStatus(200)
    }

}
