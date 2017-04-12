## Services
### User
Login User: loginUser
`{email, pub_key, version, notification_token, signature}`

New User: newUser
`{email, pub_key, username, birthday, nsfw, version, notification_token, signature}`

Get User: getUser
`{u_id, version, notification_token, signature}`

User Search: userSearch
`{u_id, search, exclude, offset, signature}`

Update User: updateUser
`{u_id, useranme, email, distance, nsfw, notification, signature}`

New Password: newPassword
`{u_id, new_pub_key, new_signature, signature}`

Send Recovery Email: sendRecoveryEmail
`{email}`

### Moderator
My Admin Boards: myAdminBoards
`{u_id, offset, signature}`

Delete Boards: deleteBoards
`{u_id, b_id, signature}`

Get Admins: getAdmins
`{u_id, b_id, signature}`

Add Admins: addAdmins
`{u_id, b_id, u_ids, signature}`

Remove Admins: removeAdmins
`u_id, b_id, u_ids, signature}`

Get Black List: getBlackList
`{u_id, b_id, signature}`

Add Black List: addBlackList
`{u_id, b_id, u_ids, signature}`

Remove Black List: removeBlackList
`{u_id, b_id, u_ids, signature}`

Get Waiting Pictures: getWaitingPictures
`{u_id, b_id, offset, signature}`

Get Active Pictures: getActivePictures
`{u_id, b_id, offset, signature}`

Approve Pictures: approvePictures
`{u_id, b_id, p_id, signature}`

Reject Pictures: rejectPictures
`{u_id, b_id, p_id, signature`

### Boards
Boards: trendingBoards, popularBoards, newBoards, favoriteBoards
`{u_id, longitude, latitude, local_global, offset, signature}`

New Board: newBoard
`{u_id, b_name, logo, about, repeat_view, min_age, max_age, pic_expire,
longitude, latitude, view_range, post_range, email, nsfw, signature}`

Update Board: updateBoard
`{u_id, b_id, b_name, logo, about, repeat_view, min_age, max_age, gender,
pic_expire, longitude, latitude, view_range, post_range, email, nsfw, signature}`

Board Search: boardSearch
`{u_id, search, longitude, latitude, local_global, offset, signature}`

Board Add Favorite: addToFavorites
`{u_id, b_id, signature}`

Board Remove Favorite: removeFromFavorites
`{u_id, b_id, signature}`

Get Board: getBoard
`{u_id, b_id, signature}`

### Picture
Add Picture: addPicture
`{u_id, b_id, longitude, latitude, duration, pic_src, type, signature}`

Board Pictures: boardPictures
`{u_id, b_id, offset, signature}`

Viewed Pictures: viewedPictures
`{u_id, p_id, signature}`

Refresh Board: refreshBoard
`{u_id, b_id, signature}`

Report Picture: reportPicture
`{u_id, p_id, signature}`

### User Pictures
Boards Posted To: boardsPostedTo
`{u_id, offset, signature}`

My Board Pictures: myBoardPictures
`{u_id, b_id, offset, signature}`

Delete My Pictures: deleteMyPictures
`{u_id, p_id, signature}`
