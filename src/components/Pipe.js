import React from 'react';
import './Pipe.css';

 const Pipe = ({ x, pipeLowerShift, pipeUpperShift }) => {
	let pipingStyle = {
		transform: `translate(${-x}px, 0)`
	}
	let upperStyle = {
		transform: `translate(0, ${pipeUpperShift}px)`
	}
	let belowStyle = {
		transform: `translate(0, ${-pipeLowerShift}px)`
	}
    return (
    	<div className="piping" style={pipingStyle}> 
    		<div className="piping-upper" style={upperStyle} />
    		<div className="piping-below" style={belowStyle} />
    	</div>
    )
}

export default Pipe
