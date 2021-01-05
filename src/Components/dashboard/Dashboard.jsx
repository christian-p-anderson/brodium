import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import ChatWindow from './chatWindow/ChatWindow';
import AddChatRoom from './AddChatRoom/AddChatRoom';
import EditChatRoom from './EditChatRoom/EditChatRoom';
import { handleAddingChatRoom, getChatrooms, getUnreadMessages } from './../../jacksonLogic/Functions'
import {getCompany} from '../../ShawnsTests/utils';

const chatWindow = {
	display: 'flex',
	justifyContent: 'center',
	width: '100vw'
}

const flex = {
	display: 'flex',
	flexDirection: 'row'
}

function Dashboard(props) {

	const [company, setCompany] = useState([])
	let [displayChatRoom, setDisplayChatRoom] = useState(null)
	let [showAddRoom, setShowAddRoom] = useState(false)
	let [showEditField, setEditField] = useState(false)
	let [unreadMessage, setUnreadMessage] = useState([])
	const [newMessageTrigger, setNewMessageTrigger] = useState(false)

	useEffect(() => {
		const { company_id } = props
		if (company_id) {
			let co_id = company_id 
			getChatrooms(axios, co_id, setCompany)
		}
	}, [])
	useEffect(() => {
		const { company_id } = props
		if (company_id) {
			getCompanyById(company_id)
		}
		
	}, [props.company_id])

	const getCompanyById = async co_id => {
		const result = await getCompany(co_id)
		setCompany(result)
		setDisplayChatRoom(result[0].chat_room_id)
	}

	// UNREAD MESSAGES USEFFECT
	useEffect(() => {
		const { team_member_id } = props
		if (team_member_id) {
			getUnreadMessages(axios, team_member_id, setUnreadMessage)
		}
	}, [])

	useEffect(() => {
		const { team_member_id } = props
		if (team_member_id) {
			axios.get(`/unread-messages/${team_member_id}`).then(res => {
				setUnreadMessage(res.data)
			}).catch(err => console.log('didnt get unread messages', err))
		}
	}, [props.team_member_id, newMessageTrigger])
	// UNREAD MESSAGES USEEFFECT

	const handleDeleteChatRoom = (id) => {
		axios.delete(`/rooms/${id}`).then(res => {
			let co_id = props.company_id
			axios.get(`/rooms/${co_id}`).then(res => {
				setCompany(res.data)
			}).catch(console.log)
		}).catch(console.log)
	}

	const handleChatRoomClick = (id) => {
		const { team_member_id } = props

		setDisplayChatRoom(id)

		axios.delete(`/unread-messages/${team_member_id}/${id}`).then(res => {
			const { team_member_id } = props
			axios.get(`/unread-messages/${team_member_id}`).then(res => {
				setUnreadMessage(res.data)
			})
				.catch(err => console.log('didnt get unread messages', err))
		})
			.catch(err => console.log('frontend delete didnt work', err))
	}

	// const handleAddingChatRoom = () => {
	// 	setShowAddRoom(true)
	// 	// console.log(showAddRoom)
	// }

	const renderEverything = () => {
		let co_id = props.company_id
		axios.get(`/rooms/${co_id}`).then(res => {
			setCompany(res.data)
			setShowAddRoom(false)
		}).catch(console.log)
	}

	const chatRooms = company.map((el, i) => {
		return (
			<EditChatRoom
				key={el.chat_room_id}
				title={el.title}
				chat_room_id={el.chat_room_id}
				description={el.description}
				chatRoomClick={handleChatRoomClick}
				deleteChatRoom={handleDeleteChatRoom}
				showEditField={showEditField}
				setEditField={setEditField}
				setCompany={setCompany}
				unreadMessage={unreadMessage}
				newMessageTrigger={newMessageTrigger}
				displayChatRoom={displayChatRoom}
			/>
		)
	})
	return (
		<div style={flex} className="main_sideBar">
			<div className="sideBar">
				<div className="add-chatroom-container">
					<button className="add-chatroom-btn" onClick={() => handleAddingChatRoom(showAddRoom, setShowAddRoom)}> Add Chatroom </button>
				</div>
				<div> {chatRooms} </div>
			</div>
			<div style={chatWindow} >
				{displayChatRoom && (
					<ChatWindow
						displayChatRoom={displayChatRoom}
						chat_room_id={company.chat_room_id}
						newMessageTrigger={() => setNewMessageTrigger(state => !state)}
					/>)
				}
			</div>
			{showAddRoom && <AddChatRoom companyId={props.company_id} renderEverything={renderEverything} setShowAddRoom={setShowAddRoom} />}
		</div>
	)
}

const mapStateToProps = (reduxState) => {
	const { company_id, team_member_id } = reduxState
	return {
		company_id,
		team_member_id
	}
}



export default connect(mapStateToProps)(Dashboard)
