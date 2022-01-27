import React from 'react'
import './Menu.css'

const Menu = ({onPlay, score}) => {
	return (
		<div className="menu ">
			<ul >
				<li>score: {score}</li>
				<li>
					<button className="btn" onClick={onPlay}>play</button>
				</li>
			</ul>
		</div>
	)
}

export default Menu
