import React, { useState } from "react"
import axios from "axios"


const Employee = (props) => {

  const [edit, setEdit] = useState(false)

  const [editMember, setEditMember] = useState({
    firstname: props.member.firstname,
    lastname: props.member.lastname,
    email: props.member.email,
    isadmin: props.member.isadmin
  })

  // -- METHODS -- //

  // Delete Team Member
  const deleteTeamMember = team_member_id => {
    axios.delete(`/team-member/${team_member_id}`)
      .then(props.getTeamMembers)
      .catch(console.log)
  }
  // ----- -----

  // Edit Team Member
  const handleEditTeamMember = (event) => {
    setEdit(!edit)
  }

  const handleCancelEditTeamMember = (event) => {
    event.preventDefault()
    setEdit(!edit)
  }

  const editField = event => {
    setEditMember({
      ...editMember,
      [event.target.name]: event.target.value
    })
  }

  const handleEditTeamMemberCheckIsAdmin = () => {
    const checkIsAdmin = document.getElementById("editTeamMemberCheckIsAdmin")
    checkIsAdmin.value = checkIsAdmin.checked

    const value = () => {
      if (checkIsAdmin.value === "true") {
        return true
      } else {
        return false
      }
    }

    setEditMember({
      ...editMember,
      isadmin: value()
    })
  }

  const handleEditMemberFormSubmit = async (event, team_member_id) => {
    event.preventDefault()
    const { firstname, lastname, email, isadmin } = editMember

    await axios.put("/team-member", { team_member_id, firstname, lastname, email, isadmin })
      .then(() => { setEdit(!edit) })
      .then(() => {
        props.setTeamMembers([...props.teamMembers, {}])
      }).catch(console.log)
  }
  // ----- -----

  // -- JSX -- //
  return (
    !edit ?
      <div className="display-team-member" key={props.member.team_member_id}>
        <div className="name">
          <div>{props.member.firstname}</div>
          <div>{props.member.lastname}</div>
        </div>
        <div className="member-email">{props.member.email}</div>
        {props.member.isadmin ?
          <div className="tm-admin-true">Admin</div> :
          <div className="tm-admin-false">Not Admin</div>
        }
        <div className="tm-btns">
          <button className="tm-remove-btn" onClick={() => deleteTeamMember(props.member.team_member_id)}>Remove</button>
          <button className="tm-edit-btn" onClick={handleEditTeamMember}>Edit</button>
        </div>
      </div> :

      <div key={props.member.team_member_id}>
        <form className="edit-team-member" onSubmit={(event) => handleEditMemberFormSubmit(event, props.member.team_member_id)}>
          <label>
            First Name:
          <input
              value={editMember.firstname}
              type="text"
              name="firstname"
              onChange={editField}
            />
          </label>
          <label>
            Last Name:
          <input
              value={editMember.lastname}
              type="text"
              name="lastname"
              onChange={editField}
            />
          </label>
          <label>
            Email:
          <input
              value={editMember.email}
              type="text"
              name="email"
              onChange={editField}
            />
          </label>
          <label htmlFor="isadmin">
            Admin
          <input
              id="editTeamMemberCheckIsAdmin"
              type="checkbox"
              name="isadmin"
              onClick={handleEditTeamMemberCheckIsAdmin}
              checked={editMember.isadmin ? true : false}
              readOnly
            />
          </label>
          <div className="edit-team-member-btns">
            <button>Submit</button>
            <button onClick={handleCancelEditTeamMember}>Cancel</button>
          </div>
        </form>
      </div>
  )
}


export default Employee